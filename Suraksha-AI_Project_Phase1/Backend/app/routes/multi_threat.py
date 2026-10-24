import logging
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app.utils.helpers import json_response

logger = logging.getLogger('app')
multi_threat_bp = Blueprint('multi_threat', __name__)


def _extract_flat_string(data) -> list:
    """Recursively flatten dict/list values to a list of strings."""
    results = []
    if isinstance(data, dict):
        for v in data.values():
            results.extend(_extract_flat_string(v))
    elif isinstance(data, list):
        for item in data:
            results.extend(_extract_flat_string(item))
    elif data is not None:
        results.append(str(data))
    return results


@multi_threat_bp.route('/detection/multi-threat', methods=['POST'])
@jwt_required()
def detect_multi_threat():
    """
    POST /api/detection/multi-threat
    Scans an HTTP request payload for a broad set of web attack vectors
    beyond SQL Injection using the MultiThreatEngine rule system.

    Accepted JSON body keys (all optional):
        url, method, headers, cookies, parameters, body

    Returns:
        attack_category   – dominant matched attack class
        severity          – Info / Low / Medium / High / Critical
        risk_score        – 0-100 cumulative rule score
        blocked           – boolean
        matches           – list of matched rule details with source context
        categories_found  – dict of category -> accumulated weight
        explanation       – human-readable summary sentence
    """
    from ai.utils.multi_threat_engine import MultiThreatEngine

    body = request.get_json() or {}

    url         = body.get('URL', body.get('url', '')).strip()
    method      = body.get('Method', body.get('method', 'GET')).strip()
    headers     = body.get('Headers', body.get('headers', {}))
    cookies     = body.get('Cookies', body.get('cookies', {}))
    params      = body.get('Parameters', body.get('parameters', {}))
    req_body    = body.get('Body', body.get('body', {}))

    engine = MultiThreatEngine()

    try:
        verdict = engine.scan_request(
            url=url,
            headers=headers,
            cookies=cookies,
            params=params,
            body=req_body
        )

        # Build human-readable explanation
        primary = verdict.get('primary_category', 'Safe')
        score   = verdict.get('rule_score', 0.0)
        blocked = verdict.get('blocked', False)
        severity = verdict.get('severity', 'Info')
        num_matches = len(verdict.get('all_matches', []))

        if blocked:
            explanation = (
                f"Suraksha-AI Multi-Threat Engine flagged this request as a potential "
                f"'{primary}' attack. Risk score: {score:.1f}/100. "
                f"{num_matches} signature(s) matched across scanned input surfaces."
            )
        else:
            explanation = (
                f"No known multi-threat signatures detected in the scanned request. "
                f"Risk score: {score:.1f}/100. Input surfaces analyzed: "
                f"{verdict.get('total_targets_scanned', 0)}."
            )

        response_data = {
            # Title-case keys for UI consistency
            'Attack Category':   primary,
            'OWASP ID':          verdict.get('owasp_id', 'Clean'),
            'Severity':          severity,
            'Risk Score':        score,
            'Blocked':           blocked,
            'Matches':           verdict.get('all_matches', []),
            'Categories Found':  verdict.get('all_categories', {}),
            'Explanation':       explanation,
            'Total Scanned':     verdict.get('total_targets_scanned', 0),
            'Remediation':       verdict.get('remediation', ''),

            # Autonomous Agent Attribution
            'Defense Agent':     verdict.get('agent_name', 'Suraksha Autonomous Defense Agent'),
            'Defense Action':    verdict.get('defense_action', 'Continuous Perimeter Monitoring'),
            'Shield Type':       verdict.get('shield_type', 'Full-Stack WAF Matrix'),
            'defense_agent':     verdict.get('agent_name', 'Suraksha Autonomous Defense Agent'),
            'defense_action':    verdict.get('defense_action', 'Continuous Perimeter Monitoring'),
            'shield_type':       verdict.get('shield_type', 'Full-Stack WAF Matrix'),

            # snake_case aliases
            'attack_category':   primary,
            'owasp_id':          verdict.get('owasp_id', 'Clean'),
            'severity':          severity,
            'risk_score':        score,
            'blocked':           blocked,
            'matches':           verdict.get('all_matches', []),
            'categories_found':  verdict.get('all_categories', {}),
            'explanation':       explanation,
            'total_scanned':     verdict.get('total_targets_scanned', 0),
            'remediation':       verdict.get('remediation', ''),
        }

        logger.info(
            f"MultiThreat Scanner: url={url!r} blocked={blocked} "
            f"category={primary!r} score={score:.1f}"
        )

        return json_response(
            success=True,
            message="Multi-threat classification scan completed.",
            data=response_data,
            status_code=200
        )

    except Exception as exc:
        logger.exception(f"MultiThreat detection failed: {exc}")
        return json_response(
            success=False,
            message=f"Multi-threat scan failed: {str(exc)}",
            status_code=500
        )


@multi_threat_bp.route('/detection/multi-threat/categories', methods=['GET'])
@jwt_required()
def get_threat_categories():
    """
    GET /api/detection/multi-threat/categories
    Returns metadata about all supported attack categories (name, color, icon).
    """
    from ai.utils.multi_threat_engine import MultiThreatEngine
    categories = MultiThreatEngine.get_category_metadata()
    return json_response(
        success=True,
        message="Multi-threat attack category metadata retrieved.",
        data=categories,
        status_code=200
    )


@multi_threat_bp.route('/detection/multi-threat/scan-payload', methods=['POST'])
@jwt_required()
def scan_single_payload():
    """
    POST /api/detection/multi-threat/scan-payload
    Scans a single raw string payload against all multi-threat signatures.

    Accepted JSON body:
        payload (str) – the string to analyze

    Returns: same schema as /api/detection/multi-threat
    """
    from ai.utils.multi_threat_engine import MultiThreatEngine

    body    = request.get_json() or {}
    payload = body.get('payload', '').strip()

    if not payload:
        return json_response(
            success=False,
            message="A 'payload' string is required in the request body.",
            status_code=400
        )

    engine  = MultiThreatEngine()
    verdict = engine.evaluate(payload)

    primary  = verdict.get('primary_category', 'Safe')
    score    = verdict.get('rule_score', 0.0)
    blocked  = verdict.get('blocked', False)
    severity = verdict.get('severity', 'Info')
    num_m    = len(verdict.get('matches', []))

    if blocked:
        explanation = (
            f"Detected '{primary}' attack signature. "
            f"Risk: {score:.1f}/100 — {num_m} signature(s) matched."
        )
    else:
        explanation = f"No threat signatures matched. Risk score: {score:.1f}/100."

    response_data = {
        'Attack Category':  primary,
        'OWASP ID':         verdict.get('owasp_id', 'Clean'),
        'Severity':         severity,
        'Risk Score':       score,
        'Blocked':          blocked,
        'Matches':          verdict.get('matches', []),
        'Categories Found': verdict.get('categories_found', {}),
        'Explanation':      explanation,
        'Remediation':      verdict.get('remediation', ''),

        # Autonomous Agent Attribution
        'Defense Agent':    verdict.get('agent_name', 'Suraksha Autonomous Defense Agent'),
        'Defense Action':   verdict.get('defense_action', 'Continuous Perimeter Monitoring'),
        'Shield Type':      verdict.get('shield_type', 'Full-Stack WAF Matrix'),
        'defense_agent':    verdict.get('agent_name', 'Suraksha Autonomous Defense Agent'),
        'defense_action':   verdict.get('defense_action', 'Continuous Perimeter Monitoring'),
        'shield_type':      verdict.get('shield_type', 'Full-Stack WAF Matrix'),

        'attack_category':  primary,
        'owasp_id':         verdict.get('owasp_id', 'Clean'),
        'severity':         severity,
        'risk_score':       score,
        'blocked':          blocked,
        'matches':          verdict.get('matches', []),
        'categories_found': verdict.get('categories_found', {}),
        'explanation':      explanation,
        'remediation':      verdict.get('remediation', ''),
    }

    return json_response(
        success=True,
        message="Single-payload multi-threat scan completed.",
        data=response_data,
        status_code=200
    )
