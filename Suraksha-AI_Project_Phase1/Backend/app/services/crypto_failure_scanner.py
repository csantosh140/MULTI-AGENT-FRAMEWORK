import re
from pathlib import PurePosixPath


_SUPPORTED_SUFFIXES = {
    ".cfg", ".conf", ".cs", ".env", ".go", ".ini", ".java", ".js", ".json",
    ".jsx", ".php", ".properties", ".py", ".rb", ".sh", ".tf", ".toml",
    ".ts", ".tsx", ".xml", ".yaml", ".yml",
}
_IGNORED_PARTS = {
    ".git", ".venv", "__pycache__", "build", "dist", "node_modules",
    "site-packages", "venv",
}
_SECRET_NAMES = (
    r"(?:SECRET(?:_KEY)?|JWT_SECRET_KEY|API_KEY|PRIVATE_KEY|"
    r"ENCRYPTION_KEY|SIGNING_KEY|TOKEN_SECRET)"
)
_PLACEHOLDER_VALUES = ("change_me", "changeme", "example", "placeholder", "replace_me", "your_")

_RULES = (
    {
        "id": "CRYPTO-001",
        "severity": "High",
        "cwe": "CWE-327",
        "title": "Weak cryptographic hash",
        "pattern": re.compile(
            r"\b(?:hashlib\.(?:md5|sha1)\s*\(|hashlib\.new\s*\(\s*['\"](?:md5|sha-?1)['\"]"
            r"|hashlib\.(?:md5|sha1)\b|createHash\s*\(\s*['\"](?:md5|sha1)['\"]"
            r"|createHmac\s*\(\s*['\"](?:md5|sha1)['\"]"
            r"|MessageDigest\.(?:get|getInstance)\s*\(\s*['\"]SHA-?1['\"])",
            re.IGNORECASE,
        ),
        "recommendation": "Use SHA-256 or stronger for integrity checks; use a password-hashing function such as Argon2id, scrypt, or bcrypt for passwords.",
    },
    {
        "id": "CRYPTO-002",
        "severity": "High",
        "cwe": "CWE-327",
        "title": "Weak cipher or ECB mode",
        "pattern": re.compile(
            r"\b(?:DES3?|TripleDES|ARC4|RC4|Blowfish|AES\.MODE_ECB|MODE_ECB)\b",
            re.IGNORECASE,
        ),
        "recommendation": "Replace legacy ciphers and ECB mode with an authenticated-encryption scheme such as AES-GCM or ChaCha20-Poly1305.",
    },
    {
        "id": "CRYPTO-003",
        "severity": "High",
        "cwe": "CWE-295",
        "title": "TLS certificate verification disabled",
        "pattern": re.compile(
            r"\bverify\s*=\s*False\b|\bCERT_NONE\b|\bcheck_hostname\s*=\s*False\b"
            r"|\brejectUnauthorized\s*:\s*false\b|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['\"]?0\b"
            r"|ssl\._create_unverified_context\s*\(",
            re.IGNORECASE,
        ),
        "recommendation": "Enable certificate and hostname verification; configure a trusted CA instead of bypassing TLS validation.",
    },
    {
        "id": "CRYPTO-004",
        "severity": "Medium",
        "cwe": "CWE-330",
        "title": "Non-cryptographic random generator used for security material",
        "pattern": re.compile(
            r"\brandom\.(?:random|randint|randrange|choice|choices|getrandbits)\s*\("
        ),
        "recommendation": "Use a cryptographically secure generator such as Python's secrets module or the platform crypto API.",
    },
    {
        "id": "CRYPTO-005",
        "severity": "High",
        "cwe": "CWE-321",
        "title": "Hard-coded cryptographic secret or key",
        "pattern": re.compile(
            rf"\b{_SECRET_NAMES}\b\s*(?:=|:)\s*(?:['\"][^'\"]{{8,}}['\"]"
            rf"|os\.(?:getenv|environ\.get)\s*\([^,\n]+,\s*['\"][^'\"]{{8,}}['\"]"
            rf"|[A-Za-z0-9_./+=-]{{16,}})",
            re.IGNORECASE,
        ),
        "recommendation": "Remove the literal or fallback secret, rotate any exposed key, and load secrets from a managed secret store or protected environment configuration.",
    },
    {
        "id": "CRYPTO-006",
        "severity": "High",
        "cwe": "CWE-326",
        "title": "Deprecated TLS or SSL protocol enabled",
        "pattern": re.compile(
            r"\b(?:PROTOCOL_TLSv1_1?|TLSv1_1?|SSLv[23])\b", re.IGNORECASE
        ),
        "recommendation": "Disable legacy protocols and require TLS 1.2 or newer.",
    },
    {
        "id": "CRYPTO-007",
        "severity": "Critical",
        "cwe": "CWE-347",
        "title": "Cryptographic signature verification disabled",
        "pattern": re.compile(
            r"\bverify_signature\s*[:=]\s*False\b"
            r"|\balgorithms?\s*[:=]\s*\[?\s*['\"]none['\"]",
            re.IGNORECASE,
        ),
        "recommendation": "Require signature verification and explicitly allow only strong, expected signing algorithms.",
    },
    {
        "id": "CRYPTO-008",
        "severity": "High",
        "cwe": "CWE-326",
        "title": "Weak RSA or Diffie-Hellman key size",
        "pattern": re.compile(
            r"\b(?:key_size|keySize|key_length|keyLength)\s*[:=]\s*(?:512|1024|1536)\b",
            re.IGNORECASE,
        ),
        "recommendation": "Use at least 2048-bit RSA or Diffie-Hellman keys, following current platform guidance.",
    },
)


def _is_scannable_path(path):
    normalized = path.replace("\\", "/")
    parts = PurePosixPath(normalized).parts
    if any(part.lower() in _IGNORED_PARTS for part in parts):
        return False
    filename = parts[-1].lower() if parts else ""
    return filename == ".env" or filename.startswith(".env.") or PurePosixPath(filename).suffix.lower() in _SUPPORTED_SUFFIXES


def _is_comment(line):
    stripped = line.lstrip()
    return stripped.startswith(("#", "//", "/*", "*", "<!--"))


def _is_placeholder(line):
    lowered = line.lower()
    return any(value in lowered for value in _PLACEHOLDER_VALUES)


class CryptoFailureScanner:
    """Finds common, statically identifiable OWASP A02 cryptographic failures."""

    @classmethod
    def scan_files(cls, files):
        findings = []
        scanned_files = 0

        for source_file in files:
            path = source_file["path"].replace("\\", "/")
            if not _is_scannable_path(path):
                continue
            scanned_files += 1
            lines = source_file["content"].splitlines()

            for index, line in enumerate(lines):
                if _is_comment(line):
                    continue
                context = "\n".join(lines[max(0, index - 1):index + 2])
                for rule in _RULES:
                    if not rule["pattern"].search(line):
                        continue
                    if rule["id"] == "CRYPTO-008" and not re.search(
                        r"\b(?:rsa|diffie.?hellman|dh|private.?key)\b",
                        context,
                        re.IGNORECASE,
                    ):
                        continue
                    if rule["id"] == "CRYPTO-004" and not re.search(
                        r"\b(?:token|secret|key|nonce|iv|salt|password|csrf|session|auth|otp)\b",
                        context,
                        re.IGNORECASE,
                    ):
                        continue
                    if rule["id"] == "CRYPTO-001" and "usedforsecurity=False" in line.replace(" ", ""):
                        continue
                    if rule["id"] == "CRYPTO-005" and _is_placeholder(line):
                        continue

                    findings.append(
                        {
                            "rule_id": rule["id"],
                            "severity": rule["severity"],
                            "cwe": rule["cwe"],
                            "owasp_id": "A02:2021",
                            "title": rule["title"],
                            "file": path,
                            "line": index + 1,
                            "recommendation": rule["recommendation"],
                        }
                    )

        counts = {
            severity: sum(finding["severity"] == severity for finding in findings)
            for severity in ("Critical", "High", "Medium", "Low")
        }
        return {
            "owasp_id": "A02:2021",
            "owasp_category": "Cryptographic Failures",
            "scanned_files": scanned_files,
            "finding_count": len(findings),
            "severity_counts": counts,
            "findings": findings,
        }
