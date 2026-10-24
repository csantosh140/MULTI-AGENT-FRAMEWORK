import logging
from ai.predictors.ensemble import SQLiEnsemblePredictor
from ai.utils.rule_engine import SQLiRuleEngine
from ai.utils.multi_threat_engine import MultiThreatEngine

logger = logging.getLogger('app')

class DetectionService:
    """
    Unified multi-threat and SQLi detection pipeline service.
    Evaluates incoming HTTP requests across all vectors:
      - Broken Access Control
      - XML / XXE Injection
      - OS Command Injection
      - Cross-Site Scripting (XSS)
      - Path Traversal
      - Server-Side Request Forgery (SSRF)
      - LDAP Injection
      - HTTP Header Injection
      - Server-Side Template Injection (SSTI)
      - Open Redirect
      - SQL Injection (Hybrid ML + Rule Engine)
    """

    @staticmethod
    def analyze_request(url="", payload="", headers=None, cookies=None, params=None, body=None, method="GET"):
        """
        Evaluates incoming request details against both the MultiThreatEngine and SQLi engines.
        Returns a dictionary containing risk_score, confidence, prediction, threat_level, reason, matches, and blocked.
        """
        headers = headers or {}
        cookies = cookies or {}
        params = params or {}
        body_data = body if body is not None else payload

        multi_engine = MultiThreatEngine()
        multi_verdict = multi_engine.scan_request(
            url=url,
            headers=headers,
            cookies=cookies,
            params=params,
            body=body_data,
            method=method
        )

        def _extract_all_strings(val):
            res = []
            if isinstance(val, dict):
                for v in val.values():
                    res.extend(_extract_all_strings(v))
            elif isinstance(val, list):
                for item in val:
                    res.extend(_extract_all_strings(item))
            elif val is not None and not isinstance(val, bool):
                s = str(val).strip()
                if s:
                    res.append(s)
            return res

        # Evaluate target string with SQLi ensemble/rules
        extracted_strings = _extract_all_strings(body_data) + _extract_all_strings(payload) + _extract_all_strings(params)
        target_str = " ".join(extracted_strings) if extracted_strings else (url or "")

        sqli_blocked = False
        sqli_score = 0.0
        sqli_explanation = ""
        sqli_severity = "Low"
        sqli_type = "SQL Injection"
        sqli_matches = []

        try:
            predictor = SQLiEnsemblePredictor()
            if predictor.initialized and predictor.rf_model:
                sqli_res = predictor.predict(
                    payload=target_str,
                    url=url or "/",
                    headers=headers,
                    cookies=cookies
                )
                sqli_blocked = sqli_res.get('blocked', False)
                sqli_score = sqli_res.get('confidence', 0.0)
                sqli_explanation = sqli_res.get('explanation', '')
                sqli_severity = sqli_res.get('severity', 'Low')
                sqli_type = sqli_res.get('attack_type', 'SQL Injection')
            else:
                rule_engine = SQLiRuleEngine()
                sqli_eval = rule_engine.evaluate(target_str)
                sqli_score = sqli_eval.get('rule_score', 0.0)
                sqli_matches = sqli_eval.get('matches', [])
                sqli_blocked = sqli_score >= 50.0 or len(sqli_matches) > 0
                sqli_type = sqli_eval.get('inferred_type', 'SQL Injection')
                sqli_severity = "Critical" if sqli_score >= 85.0 else ("High" if sqli_score >= 65.0 else ("Medium" if sqli_blocked else "Low"))
                sqli_explanation = f"SQLi Rule Match: {', '.join(sqli_matches)}" if sqli_matches else "No SQLi signatures"
        except Exception as e:
            logger.warning(f"DetectionService: SQLi evaluation fallback triggered: {str(e)}")
            rule_engine = SQLiRuleEngine()
            sqli_eval = rule_engine.evaluate(target_str)
            sqli_score = sqli_eval.get('rule_score', 0.0)
            sqli_matches = sqli_eval.get('matches', [])
            sqli_blocked = sqli_score >= 50.0 or len(sqli_matches) > 0
            sqli_severity = "High" if sqli_blocked else "Low"
            sqli_explanation = f"SQLi Pattern Matched" if sqli_blocked else "Clean"

        # Compare verdicts and choose dominant threat
        multi_blocked = multi_verdict.get('blocked', False)
        multi_score = multi_verdict.get('rule_score', 0.0)
        multi_cat = multi_verdict.get('primary_category', 'Safe')
        multi_sev = multi_verdict.get('severity', 'Info')
        multi_matches = multi_verdict.get('all_matches', [])

        is_blocked = multi_blocked or sqli_blocked
        risk_score = max(multi_score, sqli_score)

        cat_meta = MultiThreatEngine.ATTACK_CATEGORIES.get(multi_cat, {})
        if multi_blocked and (multi_score >= sqli_score or multi_cat != "Safe"):
            dominant_category = multi_cat
            threat_level = multi_sev
            match_descs = [m.get('description', '') for m in multi_matches if m.get('description')]
            reason = f"Security Intercept [{dominant_category}]: {', '.join(match_descs[:3])}" if match_descs else f"Detected malicious {dominant_category} pattern."
            defense_agent = multi_verdict.get('agent_name', cat_meta.get('agent_name', 'Autonomous Threat Interceptor'))
            defense_action = multi_verdict.get('defense_action', cat_meta.get('defense_action', 'Real-Time WAF Block'))
            shield_type = multi_verdict.get('shield_type', cat_meta.get('shield_type', 'Protocol Perimeter Shield'))
        elif sqli_blocked:
            dominant_category = "SQL Injection" if sqli_type in ["SQL Injection", "Safe", ""] else sqli_type
            threat_level = sqli_severity
            reason = sqli_explanation or "SQL Injection attack signature detected."
            sqli_meta = MultiThreatEngine.ATTACK_CATEGORIES.get("SQL Injection", {})
            defense_agent = sqli_meta.get("agent_name", "SQLi Deep Sentinel Agent")
            defense_action = sqli_meta.get("defense_action", "AST Query Parameterization & Malicious Tautology Interdiction")
            shield_type = sqli_meta.get("shield_type", "Database Relational Query Interceptor")
        else:
            dominant_category = "Safe"
            threat_level = "Low" if risk_score < 20 else "Medium"
            reason = "No known attack signatures or anomalies detected."
            defense_agent = "Autonomous Multi-Threat Defense Grid"
            defense_action = "Continuous Inspection & Telemetry Analysis"
            shield_type = "Full-Stack Web Application Firewall"

        owasp_id = cat_meta.get("owasp_id", "A03:2021" if dominant_category == "SQL Injection" else "Clean")
        remediation = cat_meta.get("remediation", "Implement standard defense-in-depth security controls.")

        return {
            "risk_score": round(risk_score, 2),
            "confidence": round(max(risk_score, 90.0) if is_blocked else 95.0, 2),
            "prediction": dominant_category,
            "attack_type": dominant_category,
            "owasp_id": owasp_id,
            "owasp_category": dominant_category,
            "threat_level": threat_level,
            "reason": reason,
            "explanation": reason,
            "remediation": remediation,
            "blocked": is_blocked,
            "matches": multi_matches if multi_matches else sqli_matches,
            "categories_found": multi_verdict.get('all_categories', {}),
            "total_targets_scanned": multi_verdict.get('total_targets_scanned', 1),
            "defense_agent": defense_agent,
            "defense_action": defense_action,
            "shield_type": shield_type
        }
