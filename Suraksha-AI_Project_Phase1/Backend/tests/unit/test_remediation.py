import pytest
from app import create_app
from app.extensions import db
from app.models.settings import Settings
from ai.utils.multi_threat_engine import MultiThreatEngine
import json

@pytest.fixture
def app():
    app = create_app()
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

def test_dynamic_remediation_rule_loading(app):
    with app.app_context():
        # 1. Define a dynamic remediation rule
        new_rule = {
            "pattern": r"MALICIOUS_CUSTOM_PAYLOAD",
            "weight": 100,
            "desc": "Dynamic remediation for custom payload",
            "cat": "Injection",
            "sev": "Critical",
            "owasp_id": "A03:2021"
        }

        # 2. Add rule to Settings
        settings = Settings.query.first()
        if not settings:
            settings = Settings()
            db.session.add(settings)

        settings.parsed_dynamic_rules = [new_rule]
        db.session.commit()

        # 3. Initialize engine and verify rule is loaded
        engine = MultiThreatEngine()

        # 4. Test the rule
        payload = "This is a MALICIOUS_CUSTOM_PAYLOAD test"
        result = engine.evaluate(payload)

        assert result['blocked'] is True
        assert result['primary_category'] == 'Injection'
        assert any(m['description'] == "Dynamic remediation for custom payload" for m in result['matches'])
