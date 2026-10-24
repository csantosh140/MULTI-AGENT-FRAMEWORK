import re

class SQLiOOBDetector:
    """
    Scans query strings for Out-of-Band (OOB) SQL Injection indicators.
    Detects functions triggering outbound network lookups (DNS, HTTP, SMTP).
    """
    def __init__(self):
        self.oob_signatures = [
            (r'(?i)\bxp_dirtree\b', "UNC path file directory network lookup (xp_dirtree)"),
            (r'(?i)\bload_file\s*\(', "Database file read network lookup (load_file)"),
            (r'(?i)\butl_http\b', "Oracle HTTP request package (UTL_HTTP)"),
            (r'(?i)\butl_smtp\b', "Oracle SMTP mail package (UTL_SMTP)"),
            (r'(?i)\bopenrowset\b', "MSSQL remote query connection (OPENROWSET)"),
            (r'(?i)\bdbms_ldap\b', "Oracle LDAP lookup directory query (DBMS_LDAP)"),
            (r'(?i)\bhttp_get\b', "PostgreSQL HTTP request extensions (http_get)")
        ]
        self.compiled = [(re.compile(pat), desc) for pat, desc in self.oob_signatures]

    def analyze_payload(self, payload):
        """
        Analyzes the payload for OOB indicators.
        Returns:
            dict containing:
                is_oob_likely (bool): True if matches found
                oob_score (float): Score (0.0 to 100.0)
                triggers (list): Matching triggers descriptions list
        """
        if not payload:
            return {'is_oob_likely': False, 'oob_score': 0.0, 'triggers': []}
            
        triggers = []
        score = 0.0
        
        for regex, desc in self.compiled:
            if regex.search(payload):
                triggers.append(desc)
                # Cap increments
                score = score + 85.0 * (1.0 - score / 100.0)
                
        is_oob = len(triggers) > 0
        
        return {
            'is_oob_likely': is_oob,
            'oob_score': min(100.0, float(score)),
            'triggers': triggers
        }
