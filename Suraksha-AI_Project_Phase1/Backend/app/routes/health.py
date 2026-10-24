import time
from datetime import datetime
from flask import Blueprint
from app.utils.helpers import json_response

health_bp = Blueprint('health', __name__)

# Start timestamp for tracking uptime
BOOT_TIME = time.time()

@health_bp.route('/health', methods=['GET'])
def check_health():
    """
    GET /api/health
    Return service health metrics.
    """
    uptime_seconds = int(time.time() - BOOT_TIME)
    
    # Standard format: Days, Hours, Minutes, Seconds
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    days, hours = divmod(hours, 24)
    
    uptime_str = f"{days}d {hours}h {minutes}m {seconds}s"

    data = {
        "status": "Healthy",
        "version": "1.0.0-Beta",
        "uptime": uptime_str,
        "uptime_seconds": uptime_seconds,
        "server_time": datetime.utcnow().isoformat() + 'Z'
    }

    return json_response(
        success=True,
        message="Suraksha-AI operations engine active.",
        data=data,
        status_code=200
    )
