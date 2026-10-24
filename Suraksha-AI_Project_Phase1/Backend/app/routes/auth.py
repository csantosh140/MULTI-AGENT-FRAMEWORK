from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.services.auth_service import AuthService
from app.utils.helpers import json_response

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Authenticates operator user and issues a secure JWT token.
    """
    body = request.get_json() or {}
    email = body.get('email')
    password = body.get('password')

    if not email or not password:
        return json_response(
            success=False,
            message="Both identifier email and access token password are required.",
            status_code=400
        )

    user = AuthService.authenticate_user(email, password)
    if not user:
        return json_response(
            success=False,
            message="Invalid credentials verified.",
            status_code=401
        )

    # Issue JWT token
    access_token = create_access_token(identity=user["email"])
    
    data = {
        "user": user,
        "token": access_token
    }

    return json_response(
        success=True,
        message="Verification granted. Session initialized.",
        data=data,
        status_code=200
    )

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    """
    POST /api/auth/register
    Registers a new operator profile inside the system database.
    """
    body = request.get_json() or {}
    name = body.get('name')
    email = body.get('email')
    password = body.get('password')

    if not name or not email or not password:
        return json_response(
            success=False,
            message="Required parameters missing: name, email, password.",
            status_code=400
        )

    user, error = AuthService.register_user(name, email, password)
    if error:
        return json_response(
            success=False,
            message=error,
            status_code=400
        )

    # Automatically log the user in on registration
    access_token = create_access_token(identity=user["email"])

    data = {
        "user": user,
        "token": access_token
    }

    return json_response(
        success=True,
        message="Profile created successfully.",
        data=data,
        status_code=201
    )

@auth_bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    POST /api/auth/logout
    Clears the operator session. On JWT it is resolved client-side by purging the token header,
    but here we log the action and return success.
    """
    operator_email = get_jwt_identity()
    return json_response(
        success=True,
        message=f"Operator session terminated: {operator_email}",
        status_code=200
    )

@auth_bp.route('/auth/profile', methods=['GET'])
@jwt_required()
def profile():
    """
    GET /api/auth/profile
    Retrieves current active operator user info based on verified JWT.
    """
    operator_email = get_jwt_identity()
    user = AuthService.get_user_profile(operator_email)
    
    if not user:
        return json_response(
            success=False,
            message="Operator profile not found.",
            status_code=404
        )

    return json_response(
        success=True,
        message="Operator profile details retrieved.",
        data=user,
        status_code=200
    )
