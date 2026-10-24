import re

class SQLiErrorDetector:
    """
    Scans HTTP response content for database-specific error signatures.
    Determines if database details are leaked and calculates error confidence.
    """
    def __init__(self):
        # Database specific error pattern mappings
        self.signatures = {
            'MySQL': [
                r"you have an error in your sql syntax",
                r"warning: mysql_query\(\)",
                r"warning: mysql_fetch_array\(\)",
                r"mysql_num_rows\(\) expects parameter",
                r"com\.mysql\.jdbc\.exceptions\.jdbc4\.MySQLSyntaxErrorException",
                r"valid mysql result",
                r"mysql_connect\(\)"
            ],
            'PostgreSQL': [
                r"postgresql query failed",
                r"psqlexception",
                r"warning: pg_query\(\)",
                r"syntax error at or near",
                r"org\.postgresql\.util\.psqlexception",
                r"pg_exec\(\) \["
            ],
            'SQLite': [
                r"sqlite3\.operationalerror",
                r"sqlite3\.sqlexception",
                r"unrecognized token:",
                r"database is locked",
                r"no such table:",
                r"sqlite3_prepare_v2\(\) failed",
                r"near \".*\": syntax error"
            ],
            'Oracle': [
                r"ora-\d{5}",
                r"oracle error",
                r"oracle.jdbc.driver.OracleSQLException",
                r"warning: ociexecute\(\)",
                r"ora-00933: sql command not properly ended",
                r"ora-00921: unexpected end of sql command"
            ],
            'MSSQL': [
                r"unclosed quotation mark after the character string",
                r"driver\]\[sql server",
                r"ole db provider for sql server",
                r"microsoft ole db provider for sql server",
                r"sqlserverexception",
                r"dbo\.\w+ failed"
            ]
        }
        # Compile all patterns for performance
        self.compiled_signatures = {
            db: [re.compile(pat, re.IGNORECASE) for pat in patterns]
            for db, patterns in self.signatures.items()
        }

    def analyze_response(self, response_body):
        """
        Analyzes the HTTP response body string for database errors.
        Returns:
            dict containing:
                db_detected (str): "MySQL", "PostgreSQL", "SQLite", "Oracle", "MSSQL", or "None"
                error_confidence (float): Confidence score (0.0 to 100.0)
                matched_signature (str): First matched regex pattern or None
        """
        if not response_body or not isinstance(response_body, str):
            return {
                'db_detected': 'None',
                'error_confidence': 0.0,
                'matched_signature': None
            }
            
        for db, regexes in self.compiled_signatures.items():
            for regex in regexes:
                match = regex.search(response_body)
                if match:
                    # Database error explicitly verified
                    return {
                        'db_detected': db,
                        'error_confidence': 100.0,
                        'matched_signature': regex.pattern
                    }
                    
        return {
            'db_detected': 'None',
            'error_confidence': 0.0,
            'matched_signature': None
        }
