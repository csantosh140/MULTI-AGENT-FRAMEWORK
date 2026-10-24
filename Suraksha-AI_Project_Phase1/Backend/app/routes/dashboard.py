from flask import Blueprint
from flask_jwt_extended import jwt_required
from app.utils.helpers import json_response
from app.repositories.analytics_repository import AnalyticsRepository

dashboard_bp = Blueprint('dashboard', __name__)
analytics_repo = AnalyticsRepository()

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required(optional=True)
def get_stats():
    """
    GET /api/dashboard/stats
    Returns aggregated traffic logs telemetry indicators calculated from SQLite database.
    """
    try:
        stats_data = analytics_repo.get_dashboard_stats()
        return json_response(
            success=True,
            message="Dashboard stats retrieved.",
            data=stats_data,
            status_code=200
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Failed to compile dashboard statistics: {str(e)}",
            status_code=500
        )
