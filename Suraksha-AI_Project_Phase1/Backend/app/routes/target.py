import json
import logging
import time
from datetime import datetime
from flask import Blueprint, request
from app.utils.helpers import json_response
from app.extensions import db
from app.models.attack_log import AttackLog
from app.models.live_request import LiveRequest
from app.services.detection_service import DetectionService

logger = logging.getLogger('app')
target_bp = Blueprint('target', __name__)

@target_bp.route('/target/telemetry', methods=['POST'])
def target_telemetry():
    """
    POST /api/target/telemetry
    Telemetry ingestion endpoint for external target applications (e.g. New1 login app, Node.js, Flask, PHP, etc.).
    Analyzes incoming payload against all OWASP Top 10 attack vectors, logs AttackLog and LiveRequest in suraksha.db,
    and returns an automated blocking or allowing decision with full telemetry context.
    """
    data = request.get_json() or {}
    source_app = data.get('source_app', 'Target Protected Website')
    url = data.get('url', '/api/login')
    method = data.get('method', 'POST')
    payload = data.get('payload', '')
    client_ip = data.get('client_ip') or request.remote_addr or '127.0.0.1'
    user_agent = data.get('user_agent') or request.headers.get('User-Agent', 'Mozilla/5.0')
    headers = data.get('headers', dict(request.headers))
    cookies = data.get('cookies', dict(request.cookies))

    if isinstance(payload, dict):
        payload_str = "&".join([f"{k}={v}" for k, v in payload.items()])
    else:
        payload_str = str(payload)

    def redact_sensitive(value):
        sensitive_terms = (
            "password", "passwd", "token", "secret",
            "authorization", "cookie", "api_key", "apikey"
        )

        if isinstance(value, dict):
            return {
                key: (
                    "[REDACTED]"
                    if any(term in str(key).lower() for term in sensitive_terms)
                    else redact_sensitive(item)
                )
                for key, item in value.items()
            }

        if isinstance(value, list):
            return [redact_sensitive(item) for item in value]

        return value

    safe_payload = redact_sensitive(payload)

    if isinstance(safe_payload, (dict, list)):
        logged_payload_str = json.dumps(safe_payload)
    else:
        logged_payload_str = str(safe_payload)

    analysis = DetectionService.analyze_request(
        url=url,
        payload=payload_str,
        headers=headers,
        cookies=cookies,
        body=payload if isinstance(payload, (dict, list)) else payload_str,
        method=method
    )

    is_blocked = analysis.get('blocked', False)
    risk_score = analysis.get('risk_score', 0.0)
    threat_level = analysis.get('threat_level', 'Low')
    reason = analysis.get('reason', 'Normal traffic.')
    prediction = analysis.get('prediction', 'Web Attack Vector')

    # Save to LiveRequest & AttackLog tables
    try:
        live_entry = LiveRequest(
            url=f"[{source_app}] {url}",
            method=method,
            payload=logged_payload_str[:500],
            decision='Blocked' if is_blocked else 'Allowed',
            confidence=risk_score
        )
        db.session.add(live_entry)

        if is_blocked:
            attack_entry = AttackLog(
                timestamp=datetime.utcnow(),
                client_ip=client_ip,
                url=f"[{source_app}] {url}",
                method=method,
                prediction=prediction,
                threat_level=threat_level,
                payload=logged_payload_str[:1000],
                status='Blocked',
                blocked=True,
                risk_score=risk_score,
                confidence=risk_score
            )
            db.session.add(attack_entry)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to persist telemetry event from {source_app} to database: {str(e)}")

    return json_response(
        success=not is_blocked,
        message="Telemetry evaluated by Suraksha-AI." if not is_blocked else f"Threat Intercepted: {prediction} blocked by Suraksha-AI.",
        data={
            "blocked": is_blocked,
            "verdict": "BLOCKED" if is_blocked else "ALLOWED",
            "status_code": 403 if is_blocked else 200,
            "attack_category": prediction,
            "owasp_id": analysis.get('owasp_id', 'Clean'),
            "risk_score": risk_score,
            "threat_level": threat_level,
            "reason": reason,
            "remediation": analysis.get('remediation', ''),
            "defense_agent": analysis.get('defense_agent', 'Suraksha Autonomous Defense Agent'),
            "shield_type": analysis.get('shield_type', 'Full-Stack WAF Matrix'),
            "source_app": source_app,
            "matches": analysis.get('matches', []),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        },
        status_code=403 if is_blocked else 200
    )


@target_bp.route('/target/login', methods=['POST'])
def target_login():
    """
    POST /api/target/login
    Simulates a target vulnerable authentication endpoint.
    Evaluates incoming credentials using DetectionService across all multi-threat vectors,
    logs attempt to suraksha.db, and blocks malicious requests.
    """
    data = request.get_json() or {}
    username = str(data.get('username', data.get('email', ''))).strip()
    password = str(data.get('password', '')).strip()
    client_ip = request.remote_addr or '127.0.0.1'
    
    combined_payload = f"username={username}&password={password}"
    
    analysis = DetectionService.analyze_request(
        url='/target/login',
        payload=combined_payload,
        headers=dict(request.headers),
        cookies=dict(request.cookies)
    )
    
    is_blocked = analysis.get('blocked', False)
    risk_score = analysis.get('risk_score', 0.0)
    severity = analysis.get('threat_level', 'Low')
    explanation = analysis.get('reason', 'No anomalies detected.')
    prediction = analysis.get('prediction', 'Web Attack Vector')
    
    try:
        live_entry = LiveRequest(
            url='/target/login',
            method='POST',
            payload=combined_payload,
            decision='Blocked' if is_blocked else 'Allowed',
            confidence=risk_score
        )
        db.session.add(live_entry)
        
        if is_blocked:
            attack_entry = AttackLog(
                timestamp=datetime.utcnow(),
                client_ip=client_ip,
                url='/target/login',
                method='POST',
                prediction=prediction,
                threat_level=severity,
                payload=combined_payload,
                status='Blocked',
                blocked=True,
                risk_score=risk_score,
                confidence=risk_score
            )
            db.session.add(attack_entry)
            
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to persist target login event to database: {str(e)}")

    if is_blocked:
        return json_response(
            success=False,
            message=f"Security Alert: {prediction} blocked by Suraksha-AI Web Application Firewall.",
            data={
                "verdict": "BLOCKED",
                "status_code": 403,
                "attack_category": prediction,
                "threat_level": severity,
                "confidence": risk_score,
                "explanation": explanation,
                "target_endpoint": "/api/target/login",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            },
            status_code=403
        )
        
    if username == "admin" and password == "admin123":
        auth_status = "Authentication Successful! Welcome, Administrator."
    else:
        auth_status = "Authentication Failed: Invalid username or password."
        
    return json_response(
        success=True,
        message="Request evaluated as Safe by Suraksha-AI.",
        data={
            "verdict": "ALLOWED",
            "status_code": 200,
            "threat_level": "Safe",
            "confidence": risk_score,
            "explanation": explanation,
            "auth_response": auth_status,
            "target_endpoint": "/api/target/login",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        },
        status_code=200
    )


@target_bp.route('/target/search', methods=['POST'])
def target_search():
    """
    POST /api/target/search
    Simulates a target vulnerable database search/query endpoint.
    """
    data = request.get_json() or {}
    query = str(data.get('query', '')).strip()
    category = str(data.get('category', 'all')).strip()
    client_ip = request.remote_addr or '127.0.0.1'
    
    combined_payload = f"query={query}&category={category}"
    
    analysis = DetectionService.analyze_request(
        url='/target/search',
        payload=combined_payload,
        headers=dict(request.headers),
        cookies=dict(request.cookies)
    )
    
    is_blocked = analysis.get('blocked', False)
    risk_score = analysis.get('risk_score', 0.0)
    severity = analysis.get('threat_level', 'Low')
    explanation = analysis.get('reason', 'No anomalies detected.')
    prediction = analysis.get('prediction', 'Web Attack Vector')
    
    try:
        live_entry = LiveRequest(
            url='/target/search',
            method='POST',
            payload=combined_payload,
            decision='Blocked' if is_blocked else 'Allowed',
            confidence=risk_score
        )
        db.session.add(live_entry)
        
        if is_blocked:
            attack_entry = AttackLog(
                timestamp=datetime.utcnow(),
                client_ip=client_ip,
                url='/target/search',
                method='POST',
                prediction=prediction,
                threat_level=severity,
                payload=combined_payload,
                status='Blocked',
                blocked=True,
                risk_score=risk_score,
                confidence=risk_score
            )
            db.session.add(attack_entry)
            
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to persist target search event to database: {str(e)}")

    if is_blocked:
        return json_response(
            success=False,
            message=f"Security Alert: {prediction} query blocked by Suraksha-AI Web Application Firewall.",
            data={
                "verdict": "BLOCKED",
                "status_code": 403,
                "attack_category": prediction,
                "threat_level": severity,
                "confidence": risk_score,
                "explanation": explanation,
                "target_endpoint": "/api/target/search",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            },
            status_code=403
        )
        
    mock_results = [
        {"id": 101, "name": f"Product Result for '{query}'", "category": category, "price": "$49.99", "status": "In Stock"},
        {"id": 102, "name": "Suraksha AI Shield v2.4", "category": "Security", "price": "$199.00", "status": "Active"}
    ]
        
    return json_response(
        success=True,
        message="Search request executed successfully.",
        data={
            "verdict": "ALLOWED",
            "status_code": 200,
            "threat_level": "Safe",
            "confidence": risk_score,
            "explanation": explanation,
            "results": mock_results,
            "target_endpoint": "/api/target/search",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        },
        status_code=200
    )
    def redact_sensitive(value):
        sensitive_terms = (
            "password", "passwd", "token", "secret",
            "authorization", "cookie", "api_key", "apikey"
        )

        if isinstance(value, dict):
            return {
                key: (
                    "[REDACTED]"
                    if any(term in str(key).lower() for term in sensitive_terms)
                    else redact_sensitive(item)
                )
                for key, item in value.items()
            }

        if isinstance(value, list):
            return [redact_sensitive(item) for item in value]

        return value

    safe_payload = redact_sensitive(payload)

    if isinstance(safe_payload, (dict, list)):
        logged_payload_str = json.dumps(safe_payload)
    else:
        logged_payload_str = str(safe_payload)