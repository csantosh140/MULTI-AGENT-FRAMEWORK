"""
Suraksha-AI — Broken Access Control Attack Simulation Script
============================================================
DISCLAIMER: This script is for EDUCATIONAL and AUTHORIZED TESTING ONLY.
Only use against systems you own or have explicit written permission to test.

This script simulates 6 common Broken Access Control attack techniques:
  1. IDOR (Insecure Direct Object Reference) — tampering user_id / account_id
  2. Admin privilege escalation — parameter injection (role=admin, is_admin=1)
  3. Admin endpoint probing — crawling hidden /admin/* and /api/internal/* paths
  4. JWT / Token tampering — altering auth headers (Bearer null, role=admin)
  5. URL override header bypass — X-Original-URL, X-Rewrite-URL manipulation
  6. HTTP Method override — TRACE / CONNECT / PUT bypass on restricted endpoints

All attacks are sent via Suraksha-AI telemetry endpoint (/api/target/telemetry)
so you can see the BLOCK / ALLOW decision in real-time from the detection engine.
"""

import time
import requests
import json
import random
import argparse

# ──────────────────────────────────────────────────────────
# CONFIGURE TARGETS
# ──────────────────────────────────────────────────────────
SURAKSHA_TELEMETRY = "http://localhost:5000/api/target/telemetry"
NEW1_TARGET        = "http://localhost:3000"   # Node.js target app

# ──────────────────────────────────────────────────────────
# ATTACK PAYLOADS — Broken Access Control
# ──────────────────────────────────────────────────────────

IDOR_PAYLOADS = [
    {"user_id": 1, "account_id": 1},
    {"user_id": 0, "account_id": "admin"},
    {"user_id": "null", "profile_id": "root"},
    {"org_id": "1 OR 1=1", "user_id": "admin"},
]

PRIVILEGE_ESCALATION_PAYLOADS = [
    "is_admin=true&role=admin&user_id=1",
    "role=superuser&privilege=root&isAdmin=1",
    "admin=1&group_id=admin&permission=write",
    "user_role=administrator&auth_level=99",
]

ADMIN_ENDPOINTS = [
    "/admin/dashboard",
    "/admin/users",
    "/api/v1/admin/export",
    "/api/internal/config",
    "/api/v2/system/settings",
    "/manage/grant/users",
    "/superuser/backup",
    "/internal/delete/logs",
    "/api/v1/priv/secrets",
]

JWT_TAMPERING_PAYLOADS = [
    {"Authorization": "Bearer null", "X-User-Role": "admin"},
    {"Authorization": "Bearer none", "X-Is-Admin": "true"},
    {"Authorization": "Bearer undefined", "X-Role": "superuser"},
    {"auth_token": "null", "session_id": "admin"},
]

URL_OVERRIDE_PAYLOADS = [
    {"X-Original-URL": "/admin/dashboard"},
    {"X-Rewrite-URL": "/api/internal/export"},
    {"X-Custom-URL": "/api/v1/admin/users"},
    {"X-Forwarded-Prefix": "/admin"},
]

HTTP_METHOD_OVERRIDE_PATHS = [
    ("/api/users/delete", "PUT"),
    ("/api/admin/config", "TRACE"),
    ("/api/v1/users", "CONNECT"),
    ("/api/priv/grant", "OPTIONS"),
]


def print_result(idx, total, technique, payload_str, response_data):
    blocked  = response_data.get("blocked", False)
    category = response_data.get("prediction", response_data.get("attack_type", "?"))
    score    = response_data.get("risk_score", 0.0)
    level    = response_data.get("threat_level", "-")

    status_tag = "[BLOCKED]" if blocked else "[ALLOWED]"
    print(f"\n[{idx:02d}/{total:02d}] --- {technique}")
    print(f"  Payload   : {payload_str[:70]}")
    print(f"  Verdict   : {status_tag}")
    print(f"  Category  : {category}")
    print(f"  Risk Score: {score}")
    print(f"  Threat    : {level}")
    print(f"  Reason    : {response_data.get('reason', response_data.get('explanation', '-'))[:100]}")


def send_telemetry(payload_str, url="/api/login", method="POST",
                   extra_headers=None, source="BAC-Test-Suite"):
    headers = extra_headers or {}
    body = {
        "source_app": source,
        "url": url,
        "method": method,
        "payload": payload_str,
        "client_ip": f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.1",
        "user_agent": "Mozilla/5.0 (AttackSimulator)",
        "headers": headers,
        "cookies": {}
    }
    try:
        r = requests.post(SURAKSHA_TELEMETRY, json=body, timeout=6)
        resp = r.json()
        # Telemetry endpoint wraps payload inside "data" key — unwrap it
        if isinstance(resp, dict) and "data" in resp:
            data = resp["data"]
            # Normalize key names so test script works regardless of backend field naming
            return {
                "blocked":      data.get("blocked", False),
                "risk_score":   data.get("risk_score", 0.0),
                "threat_level": data.get("threat_level", "-"),
                "prediction":   data.get("attack_category", data.get("prediction", "?")),
                "reason":       data.get("reason", data.get("explanation", "-")),
            }
        return resp
    except requests.exceptions.ConnectionError:
        return {"blocked": False, "reason": "Backend offline -- run Backend first",
                "risk_score": 0, "threat_level": "?", "prediction": "N/A"}
    except Exception as e:
        return {"blocked": False, "reason": str(e),
                "risk_score": 0, "threat_level": "?", "prediction": "N/A"}


def run_bac_attack_suite(delay=0.5):
    total_attacks = (
        len(IDOR_PAYLOADS) +
        len(PRIVILEGE_ESCALATION_PAYLOADS) +
        len(ADMIN_ENDPOINTS) +
        len(JWT_TAMPERING_PAYLOADS) +
        len(URL_OVERRIDE_PAYLOADS) +
        len(HTTP_METHOD_OVERRIDE_PATHS)
    )

    print("=" * 75)
    print("  SURAKSHA-AI  --  BROKEN ACCESS CONTROL ATTACK SIMULATION SUITE")
    print("=" * 75)
    print(f"  Target telemetry : {SURAKSHA_TELEMETRY}")
    print(f"  Total attack vectors : {total_attacks}")
    print(f"  Pacing delay     : {delay}s between requests")
    print("=" * 75)

    idx = 0
    blocked_count = 0

    # -- TECHNIQUE 1: IDOR -----------------------------------------------
    print("\n[TECHNIQUE 1] Insecure Direct Object Reference (IDOR)")
    print("  Tampering with user_id / account_id / profile_id parameters")
    for p in IDOR_PAYLOADS:
        idx += 1
        p_str = "&".join(f"{k}={v}" for k, v in p.items())
        res = send_telemetry(p_str, url="/api/profile/data", method="GET")
        print_result(idx, total_attacks, "IDOR Parameter Tampering", p_str, res)
        if res.get("blocked"):
            blocked_count += 1
        time.sleep(delay)

    # -- TECHNIQUE 2: PRIVILEGE ESCALATION --------------------------------
    print("\n[TECHNIQUE 2] Parameter-Based Privilege Escalation")
    print("  Injecting is_admin=true / role=admin in form parameters")
    for p_str in PRIVILEGE_ESCALATION_PAYLOADS:
        idx += 1
        res = send_telemetry(p_str, url="/api/update/profile", method="POST")
        print_result(idx, total_attacks, "Privilege Escalation via Params", p_str, res)
        if res.get("blocked"):
            blocked_count += 1
        time.sleep(delay)

    # -- TECHNIQUE 3: ADMIN ENDPOINT PROBING ------------------------------
    print("\n[TECHNIQUE 3] Forced Browsing -- Admin Endpoint Discovery")
    print("  Probing hidden /admin/* and /api/internal/* routes")
    for path in ADMIN_ENDPOINTS:
        idx += 1
        res = send_telemetry("", url=path, method="GET")
        print_result(idx, total_attacks, "Admin Endpoint Probe", path, res)
        if res.get("blocked"):
            blocked_count += 1
        time.sleep(delay)

    # -- TECHNIQUE 4: JWT/TOKEN TAMPERING ---------------------------------
    print("\n[TECHNIQUE 4] JWT / Authentication Token Tampering")
    print("  Setting auth tokens to null/none/admin and elevating role headers")
    for hdrs in JWT_TAMPERING_PAYLOADS:
        idx += 1
        p_str = " | ".join(f"{k}:{v}" for k, v in hdrs.items())
        res = send_telemetry("", url="/api/secure/dashboard", method="GET",
                             extra_headers=hdrs)
        print_result(idx, total_attacks, "JWT/Auth Token Manipulation", p_str, res)
        if res.get("blocked"):
            blocked_count += 1
        time.sleep(delay)

    # -- TECHNIQUE 5: URL OVERRIDE HEADERS --------------------------------
    print("\n[TECHNIQUE 5] URL Override Header Bypass (X-Original-URL)")
    print("  Using X-Original-URL / X-Rewrite-URL to bypass access controls")
    for hdrs in URL_OVERRIDE_PAYLOADS:
        idx += 1
        p_str = " | ".join(f"{k}: {v}" for k, v in hdrs.items())
        res = send_telemetry(p_str, url="/api/public/page", method="GET",
                             extra_headers=hdrs)
        print_result(idx, total_attacks, "URL Override Header", p_str, res)
        if res.get("blocked"):
            blocked_count += 1
        time.sleep(delay)

    # -- TECHNIQUE 6: HTTP METHOD OVERRIDE --------------------------------
    print("\n[TECHNIQUE 6] HTTP Method Override on Restricted Endpoints")
    print("  Sending TRACE/PUT/CONNECT on restricted API endpoints")
    for path, method in HTTP_METHOD_OVERRIDE_PATHS:
        idx += 1
        p_str = f"[{method}] {path}"
        res = send_telemetry("", url=path, method=method)
        print_result(idx, total_attacks, f"Method Override ({method})", p_str, res)
        if res.get("blocked"):
            blocked_count += 1
        time.sleep(delay)

    # -- SUMMARY ----------------------------------------------------------
    detection_rate = (blocked_count / total_attacks * 100) if total_attacks > 0 else 0
    print("\n" + "=" * 75)
    print(f"  ATTACK SUMMARY")
    print(f"  Total attacks             : {total_attacks}")
    print(f"  Blocked by Suraksha-AI    : {blocked_count}")
    print(f"  Allowed (not detected)    : {total_attacks - blocked_count}")
    print(f"  Detection Rate            : {detection_rate:.1f}%")
    print("=" * 75)

    if detection_rate >= 90:
        print("  [EXCELLENT] Suraksha-AI is blocking Broken Access Control attacks effectively!")
    elif detection_rate >= 70:
        print("  [GOOD] Most attacks blocked. Tune rules for edge cases.")
    else:
        print("  [NEEDS IMPROVEMENT] Review multi_threat_engine.py BAC rules.")
    print("=" * 75)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Suraksha-AI Broken Access Control Attack Simulator"
    )
    parser.add_argument(
        "--delay", type=float, default=0.5,
        help="Delay in seconds between attacks (default: 0.5)"
    )
    args = parser.parse_args()
    run_bac_attack_suite(delay=args.delay)
