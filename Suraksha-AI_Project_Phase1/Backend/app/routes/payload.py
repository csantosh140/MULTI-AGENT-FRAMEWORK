from datetime import datetime
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.services.payload_service import PayloadService
from app.utils.helpers import json_response
from app.repositories.payload_repository import PayloadRepository

payload_bp = Blueprint('payload', __name__)
payload_repo = PayloadRepository()

CATEGORY_MAP = {
    'basic': 'SQL Injection (Basic)',
    'advanced': 'SQL Injection (Advanced)',
    'xss': 'Cross-Site Scripting (XSS)',
    'command_injection': 'OS Command Injection',
    'xxe': 'XML / XXE Injection',
    'path_traversal': 'Path Traversal',
    'broken_access_control': 'Broken Access Control',
    'ssrf': 'Server-Side Request Forgery (SSRF)',
    'ldap': 'LDAP Injection',
    'header_injection': 'HTTP Header Injection',
    'template_injection': 'Template Injection (SSTI)',
    'open_redirect': 'Open Redirect',
    'random': 'Random Multi-Threat Mixed Stack'
}

@payload_bp.route('/payload/generate', methods=['POST'])
@jwt_required()
def generate_exploit_payload():
    """
    POST /api/payload/generate
    Generates an exploit payload across 11 OWASP attack classes, stores it in SQLite, and returns the details.
    """
    body = request.get_json() or {}
    
    payload_type = body.get('payload_type', 'basic').strip().lower()
    difficulty = body.get('difficulty', 'low').strip().lower()
    
    try:
        mutation_level = int(body.get('mutation_level', 0))
    except (ValueError, TypeError):
        return json_response(success=False, message="Invalid mutation level configuration.", status_code=400)

    category_name = CATEGORY_MAP.get(payload_type, payload_type.replace('_', ' ').title())

    try:
        compiled_payload = PayloadService.generate_payload(
            payload_type=payload_type,
            difficulty=difficulty,
            mutation_level=mutation_level
        )
        
        # Save to database
        new_payload = payload_repo.create(
            name=f"{category_name} Payload",
            payload=compiled_payload,
            difficulty=difficulty,
            category=category_name,
            mutation_level=mutation_level
        )
        
        data = {
            "id": new_payload.id,
            "payload": new_payload.payload,
            "type": payload_type,
            "category": category_name,
            "mutation_level": new_payload.mutation_level,
            "difficulty": new_payload.difficulty,
            "created_at": new_payload.created_at.isoformat() + 'Z' if new_payload.created_at else None
        }

        return json_response(
            success=True,
            message="Security audit payload compiled and stored successfully.",
            data=data,
            status_code=200
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Error compiling and saving payload: {str(e)}",
            status_code=500
        )

@payload_bp.route('/payload/history', methods=['GET'])
@jwt_required()
def get_payload_history():
    """
    GET /api/payload/history
    Returns the generation history log of vulnerability payloads from the database.
    """
    try:
        history = payload_repo.get_all()
        history.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
        
        return json_response(
            success=True,
            message="Vulnerability audit payloads history retrieved.",
            data=[p.to_dict() for p in history],
            status_code=200
        )
    except Exception as e:
        return json_response(
            success=False,
            message=f"Failed to retrieve payload history: {str(e)}",
            status_code=500
        )
