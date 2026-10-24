from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.utils.helpers import json_response
from app.repositories.settings_repository import SettingsRepository

settings_bp = Blueprint('settings', __name__)
settings_repo = SettingsRepository()

@settings_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    """
    GET /api/settings
    Retrieves current active configurations from database.
    """
    try:
        settings = settings_repo.get_settings()
        return json_response(
            success=True,
            message="System configurations loaded.",
            data=settings.to_dict(),
            status_code=200
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Failed to load settings: {str(e)}",
            status_code=500
        )

@settings_bp.route('/settings', methods=['PUT'])
@jwt_required()
def update_settings():
    """
    PUT /api/settings
    Updates settings record in SQLite database.
    """
    body = request.get_json() or {}
    try:
        updated_settings = settings_repo.update_settings(**body)
        return json_response(
            success=True,
            message="System configurations synchronized successfully.",
            data=updated_settings.to_dict(),
            status_code=200
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Failed to synchronize settings: {str(e)}",
            status_code=500
        )
