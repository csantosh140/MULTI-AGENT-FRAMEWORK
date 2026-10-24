"""
Suraksha-AI Universal Website Protection Middleware & SDK
==========================================================
Provides drop-in Web Application Firewall (WAF) protection for ANY website or API:
- Python Flask / Django / FastAPI apps
- Node.js / Express apps
- NGINX / Reverse Proxy inspection webhook

Features:
- Real-time pre-execution packet inspection against 11 OWASP attack classes:
    * Broken Access Control (IDOR, privilege tampering)
    * XML / XXE Injection (Entity expansion, system wrappers)
    * OS Command Injection (shell separators, subshells, reverse shells)
    * Cross-Site Scripting (XSS, DOM payloads, event handlers)
    * Path Traversal (../ climbing, sensitive OS files)
    * Server-Side Request Forgery (SSRF, metadata, private IPs)
    * LDAP Injection (filter bypasses, wildcard extraction)
    * HTTP Header Injection / CRLF (response splitting)
    * Server-Side Template Injection (SSTI, Jinja2/Twig/Python reflection)
    * Open Redirect (phishing redirects, protocol-relative URLs)
    * SQL Injection (Hybrid ML + Signature Engine)
"""

import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger("suraksha.waf")

class SurakshaShieldClient:
    """
    Client for connecting external websites to Suraksha-AI Telemetry & Protection Gateway.
    """
    def __init__(self, suraksha_host="http://127.0.0.1:5000", app_name="Protected Website"):
        self.suraksha_host = suraksha_host.rstrip('/')
        self.app_name = app_name

    def inspect_request(self, url="/", method="GET", headers=None, cookies=None, params=None, body=None, client_ip="127.0.0.1"):
        """
        Sends request context to Suraksha-AI for real-time inspection.
        Returns:
            dict: {"blocked": bool, "verdict": "BLOCKED"|"ALLOWED", "attack_category": str, "reason": str, "risk_score": float}
        """
        endpoint = f"{self.suraksha_host}/api/target/telemetry"
        payload_data = {
            "source_app": self.app_name,
            "url": url,
            "method": method,
            "payload": body or params or url,
            "headers": headers or {},
            "cookies": cookies or {},
            "client_ip": client_ip
        }

        try:
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(payload_data).encode('utf-8'),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                return data.get('data', {"blocked": False, "verdict": "ALLOWED"})
        except urllib.error.HTTPError as e:
            try:
                err_data = json.loads(e.read().decode('utf-8'))
                return err_data.get('data', {"blocked": True, "verdict": "BLOCKED", "reason": "Threat intercepted"})
            except Exception:
                return {"blocked": True, "verdict": "BLOCKED", "reason": f"HTTP {e.code} Security Violation"}
        except Exception as ex:
            logger.warning(f"Suraksha-AI inspection unreachable: {ex}. Failing open for availability.")
            return {"blocked": False, "verdict": "ALLOWED", "risk_score": 0.0}

def flask_suraksha_guard(app, suraksha_host="http://127.0.0.1:5000", app_name="Flask Protected App"):
    """
    Flask before_request hook to protect any Flask website automatically.
    
    Usage:
        from app.utils.waf_shield_middleware import flask_suraksha_guard
        flask_suraksha_guard(app, "http://127.0.0.1:5000", "My E-Commerce Site")
    """
    from flask import request, jsonify

    client = SurakshaShieldClient(suraksha_host, app_name)

    @app.before_request
    def suraksha_waf_inspector():
        # Exclude static assets
        if request.path.startswith('/static/') or request.path.endswith(('.css', '.js', '.png', '.jpg', '.svg', '.ico')):
            return None

        body = None
        if request.is_json:
            body = request.get_json(silent=True)
        elif request.form:
            body = dict(request.form)

        verdict = client.inspect_request(
            url=request.path,
            method=request.method,
            headers=dict(request.headers),
            cookies=dict(request.cookies),
            params=dict(request.args),
            body=body,
            client_ip=request.remote_addr or '127.0.0.1'
        )

        if verdict.get('blocked'):
            return jsonify({
                "success": False,
                "error": "Access Denied by Suraksha-AI Web Application Firewall",
                "attack_category": verdict.get('attack_category', 'Web Threat'),
                "threat_level": verdict.get('threat_level', 'High'),
                "reason": verdict.get('reason', 'Malicious payload pattern detected')
            }), 403

    return app
