from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.utils.helpers import json_response
from app.extensions import db
from app.models.live_request import LiveRequest
import random

monitor_bp = Blueprint('monitor', __name__)

TEMPLATES = [
    {"method": "GET", "url": "/api/v1/items?q=safe_query", "payload": "q=safe_query", "decision": "Allowed", "confidence": 99.6},
    {"method": "POST", "url": "/api/v1/auth/login", "payload": "{\"email\":\"test@domain.com\"}", "decision": "Allowed", "confidence": 98.8},
    {"method": "GET", "url": "/api/v1/profile?id=12%20UNION%20SELECT%20null,hash%20FROM%20cred", "payload": "id=12 UNION SELECT null,hash FROM cred", "decision": "Blocked", "confidence": 99.2},
    {"method": "GET", "url": "/api/v1/categories?filter=all", "payload": "filter=all", "decision": "Allowed", "confidence": 99.9},
    {"method": "POST", "url": "/api/v1/auth/register", "payload": "username=hacker' OR 1=1 --", "decision": "Blocked", "confidence": 94.8},
    {"method": "GET", "url": "/api/v1/products?id=1%20AND%201=1", "payload": "id=1 AND 1=1", "decision": "Logged", "confidence": 64.2}
]

@monitor_bp.route('/monitor/live', methods=['GET'])
@monitor_bp.route('/requests/live', methods=['GET']) # Support both for frontend service compatibility
@jwt_required()
def get_live():
    """
    GET /api/monitor/live
    Generates a live feed of incoming requests and persists it to the SQLite database.
    """
    selected = random.choice(TEMPLATES)
    
    try:
        live_req = LiveRequest(
            method=selected["method"],
            url=selected["url"],
            payload=selected["payload"],
            decision=selected["decision"],
            confidence=selected["confidence"]
        )
        db.session.add(live_req)
        db.session.commit()
        
        return json_response(
            success=True,
            message="Live monitored request intercept.",
            data=live_req.to_dict(),
            status_code=200
        )
    except Exception as e:
        db.session.rollback()
        return json_response(
            success=False,
            message=f"Failed to persist live request: {str(e)}",
            status_code=500
        )

@monitor_bp.route('/monitor/history', methods=['GET'])
@monitor_bp.route('/requests/history', methods=['GET']) # Support alias
@jwt_required()
def get_history():
    """
    GET /api/monitor/history
    Returns historical intercepted captures from the database (newest first).
    """
    try:
        # Fetch latest 50 live requests
        requests = LiveRequest.query.order_by(LiveRequest.timestamp.desc()).limit(50).all()
        return json_response(
            success=True,
            message="Request captures history logs retrieved.",
            data=[req.to_dict() for req in requests],
            status_code=200
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Failed to fetch request history: {str(e)}",
            status_code=500
        )
