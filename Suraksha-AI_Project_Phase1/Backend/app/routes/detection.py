from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.services.detection_service import DetectionService
from app.utils.helpers import json_response

detection_bp = Blueprint('detection', __name__)

@detection_bp.route('/detection/check', methods=['POST'])
@jwt_required()
def check_request_vulnerabilities():
    """
    POST /api/detection/check
    Checks HTTP request segments for SQL Injection patterns using mock rules engines.
    """
    body = request.get_json() or {}
    
    url = body.get('url', '').strip()
    payload = body.get('payload', '').strip()
    headers = body.get('headers', {})
    cookies = body.get('cookies', {})

    if not url and not payload:
        return json_response(
            success=False,
            message="Required parameters missing: url or payload must be populated for checking.",
            status_code=400
        )

    try:
        verdict = DetectionService.analyze_request(
            url=url,
            payload=payload,
            headers=headers,
            cookies=cookies
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Intrusion classification failed: {str(e)}",
            status_code=500
        )

    return json_response(
        success=True,
        message="Request packets checks complete.",
        data=verdict,
        status_code=200
    )
