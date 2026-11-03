import unittest
from types import SimpleNamespace

from agents.plugins.crypto_failure_agent import CryptoFailureAgent
from app.services.crypto_failure_scanner import CryptoFailureScanner


class TestCryptoFailureScanner(unittest.TestCase):
    def scan(self, path, content):
        return CryptoFailureScanner.scan_files([{"path": path, "content": content}])

    def test_detects_weak_hash_and_cipher(self):
        result = self.scan(
            "auth.py",
            "digest = hashlib.md5(password.encode()).hexdigest()\n"
            "cipher = AES.new(key, AES.MODE_ECB)\n",
        )

        self.assertEqual(result["finding_count"], 2)
        self.assertEqual(
            {finding["rule_id"] for finding in result["findings"]},
            {"CRYPTO-001", "CRYPTO-002"},
        )
        self.assertTrue(all(finding["owasp_id"] == "A02:2021" for finding in result["findings"]))

    def test_detects_tls_secret_and_insecure_randomness(self):
        result = self.scan(
            "settings.py",
            "JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'local_signing_key_value_12345')\n"
            "token = random.randint(1000, 9999)\n"
            "requests.get(url, verify=False)\n",
        )

        self.assertEqual(
            {finding["rule_id"] for finding in result["findings"]},
            {"CRYPTO-003", "CRYPTO-004", "CRYPTO-005"},
        )
        self.assertNotIn("local_signing_key_value_12345", str(result))

    def test_ignores_safe_hash_non_security_use_and_dependencies(self):
        result = CryptoFailureScanner.scan_files(
            [
                {
                    "path": "src/cache.py",
                    "content": "digest = hashlib.md5(data, usedforsecurity=False).hexdigest()\n",
                },
                {
                    "path": "venv/Lib/site-packages/example.py",
                    "content": "digest = hashlib.md5(data).hexdigest()\n",
                },
                {
                    "path": "README.md",
                    "content": "digest = hashlib.md5(data).hexdigest()\n",
                },
            ]
        )

        self.assertEqual(result["scanned_files"], 1)
        self.assertEqual(result["finding_count"], 0)

    def test_reports_line_number_without_echoing_secret(self):
        result = self.scan(
            ".env",
            "APP_MODE=dev\nJWT_SECRET_KEY=secret-value-that-must-not-be-returned\n",
        )

        self.assertEqual(result["finding_count"], 1)
        self.assertEqual(result["findings"][0]["line"], 2)
        self.assertNotIn("secret-value-that-must-not-be-returned", str(result))

    def test_agent_detects_disabled_signature_and_weak_rsa_key(self):
        agent = CryptoFailureAgent()
        result = agent.execute(
            SimpleNamespace(
                payload={
                    "task": "scan_cryptographic_failures",
                    "files": [
                        {
                            "path": "auth.py",
                            "content": (
                                "jwt.decode(token, options={'verify_signature': False})\n"
                                "private_key = rsa.generate_private_key(key_size=1024)\n"
                            ),
                        }
                    ],
                }
            )
        )

        self.assertEqual(result["finding_count"], 2)
        self.assertEqual(
            {finding["rule_id"] for finding in result["findings"]},
            {"CRYPTO-007", "CRYPTO-008"},
        )


if __name__ == "__main__":
    unittest.main()
