import pytest
from ai.utils.multi_threat_engine import MultiThreatEngine

@pytest.fixture
def engine():
    return MultiThreatEngine()

def test_sql_injection_detection(engine):
    # Test a classic SQL injection payload
    payload = "' OR '1'='1"
    result = engine.evaluate(payload)
    assert result['blocked'] is True
    assert result['primary_category'] == 'SQL Injection'

def test_xss_detection(engine):
    # Test a script injection payload
    payload = "<script>alert('XSS')</script>"
    result = engine.evaluate(payload)
    assert result['blocked'] is True
    assert 'Injection' in result['categories_found']

def test_safe_payload(engine):
    # Test a benign payload
    payload = "Hello, this is a normal message."
    result = engine.evaluate(payload)
    assert result['blocked'] is False
    assert result['primary_category'] == 'Safe'

def test_ssrf_detection(engine):
    # Test an SSRF attempt to cloud metadata
    payload = "http://169.254.169.254"
    result = engine.evaluate(payload)
    assert result['blocked'] is True
    assert result['primary_category'] == 'Server-Side Request Forgery (SSRF)'
