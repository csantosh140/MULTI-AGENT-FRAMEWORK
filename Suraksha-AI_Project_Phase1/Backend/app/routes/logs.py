from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.helpers import json_response, get_current_timestamp
from app.repositories.attack_repository import AttackRepository
from app.repositories.user_repository import UserRepository
from app.utils.validation import validate_url, validate_http_method, validate_payload_size
import json

logs_bp = Blueprint('logs', __name__)
attack_repo = AttackRepository()
user_repo = UserRepository()

@logs_bp.route('/logs', methods=['GET'])
@jwt_required(optional=True)
def get_logs():
    """
    GET /api/logs
    Lists attack logs with support for pagination, sorting, search, level, status, and date filtering.
    """
    search_q = request.args.get('search', '').strip()
    level_filter = request.args.get('level', '').strip()
    status_filter = request.args.get('status', '').strip()
    
    # Pagination
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
    except ValueError:
        return json_response(success=False, message="Invalid pagination parameters.", status_code=400)

    # Date range filters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    # Sorting
    sort_by_param = request.args.get('sort_by', 'timestamp').strip()
    order = request.args.get('order', 'desc').strip()

    # Map frontend query sort field names to model attributes
    sort_map = {
        'time': 'timestamp',
        'timestamp': 'timestamp',
        'ip': 'client_ip',
        'payload': 'payload',
        'threatLevel': 'threat_level',
        'status': 'status',
        'confidence': 'confidence',
        'endpoint': 'url',
        'method': 'method'
    }
    sort_by = sort_map.get(sort_by_param, 'timestamp')

    try:
        paginated_result = attack_repo.search_and_filter(
            search_q=search_q,
            threat_level=level_filter,
            status=status_filter,
            start_date=start_date,
            end_date=end_date,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            order=order
        )

        data = {
            "items": [item.to_dict() for item in paginated_result.items],
            "total": paginated_result.total,
            "page": paginated_result.page,
            "pages": paginated_result.pages,
            "per_page": paginated_result.per_page
        }

        # Return list (original logic expected raw list directly for simple cases,
        # but to keep frontend and general compatibility, we can return the items list.
        # Wait, the original mock route returned: `return json_response(..., data=list(reversed(filtered)))`
        # Let's return the list of items directly as data for exact compatibility, but support pagination
        # parameters inside the response structure or headers.
        # Let's inspect: original returned `data=list(reversed(filtered))` (which is a list of log dicts).
        # Let's return the list of items directly as the data root to maintain 100% compatibility with UI,
        # but if the client asks for paginated structure, we can handle it or just return the items list.)
        # Wait! Let's return the items list directly to prevent breaking the React UI!
        return json_response(
            success=True,
            message="Logs database list retrieved.",
            data=[item.to_dict() for item in paginated_result.items],
            status_code=200
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Error querying attack logs: {str(e)}",
            status_code=500
        )

@logs_bp.route('/logs/<string:log_id>', methods=['GET'])
@jwt_required()
def get_log_by_id(log_id):
    """
    GET /api/logs/{id}
    Retrieves detail fields of a single incident by UUID.
    """
    log = attack_repo.get_by_uuid(log_id)
    if not log:
        return json_response(
            success=False,
            message=f"Attack log with ID {log_id} not found.",
            status_code=404
        )
    return json_response(
        success=True,
        message="Threat incident details retrieved.",
        data=log.to_dict(),
        status_code=200
    )

@logs_bp.route('/logs', methods=['POST'])
@jwt_required()
def create_log():
    """
    POST /api/logs
    Appends a new security warning record.
    """
    body = request.get_json() or {}
    
    # Required parameters
    required = ["ip", "payload", "threatLevel", "status", "confidence", "endpoint", "method"]
    for field in required:
        if field not in body:
            return json_response(
                success=False,
                message=f"Missing parameter validation: {field}",
                status_code=400
            )

    # Validations
    valid_method, method_error = validate_http_method(body["method"])
    if not valid_method:
        return json_response(success=False, message=method_error, status_code=400)

    valid_url, url_error = validate_url(body["endpoint"])
    if not valid_url:
        return json_response(success=False, message=url_error, status_code=400)

    valid_size, size_error = validate_payload_size(body["payload"])
    if not valid_size:
        return json_response(success=False, message=size_error, status_code=400)

    # Resolve active user matching JWT identity to bind User -> AttackLogs
    operator_email = get_jwt_identity()
    user = user_repo.find_by_email(operator_email)
    user_id = user.id if user else None

    # Threat level checks
    threat_level = body["threatLevel"]
    if threat_level.lower() == 'all':
        threat_level = 'Medium'

    try:
        # Save to database
        new_log = attack_repo.create(
            client_ip=body["ip"],
            method=body["method"].upper(),
            url=body["endpoint"],
            payload=body["payload"],
            headers=json.dumps({"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}),
            cookies=json.dumps({"session_id": "api-dispatch"}),
            prediction="SQL Injection",
            confidence=float(body["confidence"]),
            risk_score=float(body["confidence"]),  # map risk_score from confidence
            status=body["status"],
            blocked=(body["status"].lower() == 'blocked'),
            response_time=15.0,
            threat_level=threat_level,
            user_id=user_id
        )

        return json_response(
            success=True,
            message="Threat incident log added.",
            data=new_log.to_dict(),
            status_code=201
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Failed to record threat incident: {str(e)}",
            status_code=500
        )

@logs_bp.route('/logs/<string:log_id>', methods=['DELETE'])
@jwt_required()
def delete_log(log_id):
    """
    DELETE /api/logs/{id}
    Removes an incident log.
    """
    deleted = attack_repo.delete_by_uuid(log_id)
    if not deleted:
        return json_response(
            success=False,
            message=f"Attack log with ID {log_id} does not exist.",
            status_code=404
        )

    return json_response(
        success=True,
        message="Threat incident archived.",
        data={"deleted_id": log_id},
        status_code=200
    )


@logs_bp.route('/logs/reset', methods=['POST', 'DELETE'])
def reset_logs():
    """
    POST / DELETE /api/logs/reset
    Clears all AttackLog and LiveRequest database records, resetting stats to zero.
    """
    from app.extensions import db
    from app.models.attack_log import AttackLog
    from app.models.live_request import LiveRequest
    from app.models.threat_analytics import ThreatAnalytics

    try:
        db.session.query(AttackLog).delete()
        db.session.query(LiveRequest).delete()
        db.session.query(ThreatAnalytics).delete()
        db.session.commit()
        return json_response(
            success=True,
            message="Database logs reset to zero.",
            data={"attack_logs_count": 0, "live_requests_count": 0},
            status_code=200
        )
    except Exception as e:
        db.session.rollback()
        return json_response(
            success=False,
            message=f"Failed to reset logs: {str(e)}",
            status_code=500
        )

