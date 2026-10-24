from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.utils.helpers import json_response
from app.repositories.analytics_repository import AnalyticsRepository

analytics_bp = Blueprint('analytics', __name__)
analytics_repo = AnalyticsRepository()

@analytics_bp.route('/analytics', methods=['GET'])
@analytics_bp.route('/analytics/overview', methods=['GET']) # Support alias for frontend compatibility
@jwt_required(optional=True)
def get_analytics():
    """
    GET /api/analytics
    GET /api/analytics/overview
    Returns aggregated threat vector classifications and daily/weekly trend reports calculated from SQLite database.
    """
    try:
        analytics_data = analytics_repo.get_detailed_analytics()
        return json_response(
            success=True,
            message="Threat analytics overview compiled.",
            data=analytics_data,
            status_code=200
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Failed to compile analytics report: {str(e)}",
            status_code=500
        )
