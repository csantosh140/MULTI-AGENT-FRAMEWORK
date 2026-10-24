import uuid
from datetime import datetime
from flask import jsonify

def generate_uuid():
    """Generates a standard random UUID string."""
    return str(uuid.uuid4())

def get_current_timestamp():
    """Returns the current UTC ISO 8601 timestamp string."""
    return datetime.utcnow().isoformat() + 'Z'

def json_response(success, message, data=None, status_code=200):
    """Formats a centralized JSON API response layout according to production guidelines."""
    response_body = {
        "success": success,
        "message": message,
        "data": data if data is not None else {},
        "timestamp": get_current_timestamp(),
        "status_code": status_code
    }
    return jsonify(response_body), status_code
