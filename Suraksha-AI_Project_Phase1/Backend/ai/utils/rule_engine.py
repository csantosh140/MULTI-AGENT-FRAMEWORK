import re
import urllib.parse

class SQLiRuleEngine:
    """
    Signature-based regex checking engine for SQL Injection vectors.
    Evaluates inputs against a list of dangerous signatures and maps a risk score.
    """
    def __init__(self):
        # List of tuple rules: (regex_pattern, weight_score, description_tag, category)
        # Weights range from 5 to 95. Rule score caps at 100.
        self.rules = [
            # 1. UNION based checks
            (r'(?i)\bunion\b.*\bselect\b', 95, "UNION SELECT query sequence", "UNION SQLi"),
            (r'(?i)\bunion\s+all\b', 90, "UNION ALL construct", "UNION SQLi"),
            (r'(?i)union/\*\*/select', 95, "UNION Inline comment obfuscation", "UNION SQLi"),
            
            # 2. Schema extraction & system files
            (r'(?i)\binformation_schema\b', 85, "Accessing INFORMATION_SCHEMA metadata tables", "In-band SQLi"),
            (r'(?i)\bsqlite_master\b', 85, "Accessing sqlite_master metadata tables", "In-band SQLi"),
            (r'(?i)\bpg_catalog\b', 85, "Accessing PostgreSQL catalog metadata tables", "In-band SQLi"),
            (r'(?i)\bmysql\.user\b', 90, "Accessing MySQL user database schema", "In-band SQLi"),
            (r'(?i)\bsysprocesses\b', 85, "Accessing system processes information", "In-band SQLi"),
            
            # 3. Stacked queries / DDL / DML operations
            (r';\s*(drop|alter|create|delete|update|insert)\b', 95, "Stacked query database modification command", "Stacked"),
            (r'(?i)\bexec(ute)?\s*\(', 90, "SQL EXEC/EXECUTE command block execution", "Stacked"),
            (r'(?i)\bdrop\s+table\b', 95, "DROP TABLE statement", "Stacked"),
            (r'(?i)\btruncate\b', 90, "TRUNCATE statement", "Stacked"),
            
            # 4. Out-of-band triggers
            (r'(?i)\bload_file\s*\(', 95, "LOAD_FILE file system read trigger", "Out-of-Band Suspicion"),
            (r'(?i)\binto\s+outfile\b', 95, "INTO OUTFILE file write trigger", "Out-of-Band Suspicion"),
            (r'(?i)\binto\s+dumpfile\b', 95, "INTO DUMPFILE file write trigger", "Out-of-Band Suspicion"),
            (r'(?i)\bopenrowset\b', 90, "OPENROWSET remote server connection trigger", "Out-of-Band Suspicion"),
            (r'(?i)\bxp_cmdshell\b', 95, "xp_cmdshell command execution privilege", "Out-of-Band Suspicion"),
            (r'(?i)\bxp_dirtree\b', 90, "xp_dirtree network UNC directory crawl", "Out-of-Band Suspicion"),
            (r'(?i)\butl_http\b', 90, "Oracle UTL_HTTP outbound network package", "Out-of-Band Suspicion"),
            
            # 5. Time-based blind SQLi signatures
            (r'(?i)\bsleep\s*\(\s*\d+\s*\)', 95, "SLEEP function delay check", "Time-Based"),
            (r'(?i)\bpg_sleep\s*\(\s*\d+\s*\)', 95, "pg_sleep function delay check", "Time-Based"),
            (r'(?i)\bbenchmark\s*\(\s*\d+\s*,\s*\w+\s*\)', 90, "BENCHMARK resource exhaustion loop check", "Time-Based"),
            (r'(?i)\bwaitfor\s+delay\b', 95, "WAITFOR DELAY execution delay statement", "Time-Based"),
            
            # 6. Tautologies / Conditionals / Authentication Bypass
            (r'(?i)\bor\s+[\'"]?1[\'"]?\s*=\s*[\'"]?1[\'"]?', 95, "Classic Tautology OR 1=1 bypass", "Conditional"),
            (r'(?i)\band\s+[\'"]?1[\'"]?\s*=\s*[\'"]?1[\'"]?', 85, "Tautology validation AND 1=1 clause", "Conditional"),
            (r'(?i)\bor\s+\'?\d+\'?\s*=\s*\'?\d+\'?', 90, "Tautology bypass logic OR clause", "Conditional"),
            (r'(?i)\band\s+\'?\d+\'?\s*=\s*\'?\d+\'?', 75, "Tautology validation logic AND clause", "Conditional"),
            (r'(?i)\bor\s+[\'"][a-zA-Z0-9]+[\'"]\s*=\s*[\'"][a-zA-Z0-9]+[\'"]', 90, "Tautology bypass logic OR character clause", "Conditional"),
            (r'(?i)\b1\s*=\s*1\b', 85, "Tautology 1=1 condition", "Conditional"),
            (r'(?i)\bnull\s+is\s+null\b', 85, "Tautology NULL IS NULL check", "Conditional"),
            (r'(?i)\bexists\s*\(', 75, "EXISTS check query", "Conditional"),
            (r'(?i)\bcast\s*\(.*\s+as\b', 70, "CAST datatype converter check", "In-band SQLi"),
            (r'(?i)\bconvert\s*\(', 70, "CONVERT datatype converter check", "In-band SQLi"),
            
            # 7. Obfuscation & Encoded Payload Tricks
            (r'(?i)0x[0-9A-Fa-f]{4,}', 85, "Hex encoded string literal payload", "Obfuscation"),
            (r'(?i)char\([0-9,]+\)', 85, "CHAR() string construction sequence", "Obfuscation"),
            (r'(?i)base64_decode\(', 90, "Base64 decode function in query", "Obfuscation"),
            (r'(?i)unhex\(', 85, "UNHEX decode function in query", "Obfuscation"),
            
            # 8. Comment and structural tokens
            (r'--', 65, "SQL comment character '--'", "Inline SQLi"),
            (r'/\*.*\*/', 70, "SQL multiline comment block '/* ... */'", "Inline SQLi"),
            (r'#', 50, "SQL comment character '#'", "Inline SQLi"),
            (r';', 40, "Stacked statement separator ';'", "Stacked")
        ]

    def normalize(self, raw_input):
        """Decode URL entities, strip whitespace, and return normalized payload variations."""
        if not raw_input:
            return "", ""
        
        # Convert to string if dict or other structure passed
        if isinstance(raw_input, (dict, list)):
            raw_str = str(raw_input)
        else:
            raw_str = str(raw_input)
            
        # Decode URL encoding (e.g. %27 -> ', %20 -> space)
        decoded = urllib.parse.unquote(raw_str)
        decoded = decoded.replace("+", " ")
        
        # Standard normalized: lowercased with collapsed whitespace
        normalized = re.sub(r'\s+', ' ', decoded).strip().lower()
        
        # Compressed: whitespace removed completely (to detect SELECT/**/FROM or OR/**/1=1)
        compressed = re.sub(r'\s+', '', normalized)
        
        return normalized, compressed

    def evaluate(self, payload):
        """
        Scans normalized payload against SQLi signature expressions.
        Returns:
            dict containing:
                rule_score (float): Score capped at 100.0
                matches (list): List of matching rule tags
                inferred_type (str): Primary attack class if matched, otherwise "Safe"
        """
        if not payload:
            return {'rule_score': 0.0, 'matches': [], 'inferred_type': "Safe"}
            
        norm, comp = self.normalize(payload)
        if not norm and not comp:
            return {'rule_score': 0.0, 'matches': [], 'inferred_type': "Safe"}
            
        score = 0.0
        matches = []
        categories = {}
        
        for pattern, weight, desc, cat in self.rules:
            # Check against normalized string or compressed string
            if re.search(pattern, norm) or re.search(pattern, comp):
                score = score + weight * (1.0 - score / 100.0)
                matches.append(desc)
                categories[cat] = categories.get(cat, 0) + weight
                
        # Determine primary attack category (highest accumulated weight category)
        if categories:
            inferred_type = max(categories, key=categories.get)
        else:
            inferred_type = "Safe"
            
        final_score = min(100.0, float(score))
        return {
            'rule_score': round(final_score, 2),
            'matches': matches,
            'inferred_type': inferred_type
        }

