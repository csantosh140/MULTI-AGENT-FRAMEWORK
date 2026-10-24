import re
import urllib.parse
import html
import math
import base64
import logging

logger = logging.getLogger('app')

def calculate_entropy(text):
    """Calculates the Shannon Entropy of a string payload."""
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    # Frequency mapping
    freq = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    # Calculate Shannon Entropy formula
    for count in freq.values():
        p = count / length
        entropy -= p * math.log2(p)
    return entropy

class PayloadNormalizer:
    """
    Advanced SQL Injection payload normalizer and feature statistics extractor.
    Cleans, decodes, tokenizes, and calculates heuristic dimensions.
    """
    def __init__(self):
        # SQL signature detection helper patterns
        self.functions_pattern = re.compile(
            r'\b(sleep|benchmark|waitfor|load_file|database|user|version|substring|ascii|char|concat|cast|convert|extractvalue|updatexml|count|sum|min|max|encode|decode|hex|bin|ord|md5|sha1|sha2|pg_sleep)\b', 
            re.IGNORECASE
        )
        self.keywords_pattern = re.compile(
            r'\b(select|union|all|from|where|insert|update|delete|drop|alter|create|table|into|outfile|dumpfile|load|data|infile|information_schema|sqlite_master|pg_catalog|mysql|user|sysprocesses|exists|having|group|by|order|limit|offset|exec|execute|shutdown|xp_cmdshell|xp_dirtree|openrowset|utl_http|utl_smtp|dbms_pipe|or|and|like|not|in|as|join|on|union\s+all)\b',
            re.IGNORECASE
        )
        self.operators_pattern = re.compile(
            r'(=|!=|<>|<|>|<=|>=|\+|-|\*|/|%|\|\||&|\||\^|~|<<|>>|like|ilike|between|is|null|in|and|or|not)',
            re.IGNORECASE
        )
        self.comments_pattern = re.compile(r'(--|#|/\*|\*/)')
        self.special_chars_pattern = re.compile(r'([\'";\(\)\{\},\[\]\\\.`])')

    def normalize(self, payload):
        """
        Applies a multi-stage decoding and cleaning pipeline to the payload.
        Includes URL, Unicode, Hex, and Base64 decoding, followed by lowercase and space collapse.
        """
        if payload is None:
            return ""
        if not isinstance(payload, str):
            payload = str(payload)

        # 1. URL decoding (recursive check)
        cleaned = payload
        try:
            prev = ""
            while cleaned != prev:
                prev = cleaned
                cleaned = urllib.parse.unquote(cleaned)
        except Exception:
            pass

        # 2. Unicode decoding (\uXXXX / \xXX)
        try:
            cleaned = cleaned.encode().decode('unicode_escape')
        except Exception:
            pass

        # 3. HTML decoding
        try:
            cleaned = html.unescape(cleaned)
        except Exception:
            pass

        # 4. Hex decoding (detect patterns like 0xXXXX or \xXX and decode if printable)
        try:
            # Replace 0x prefixed hex structures
            hex_patterns = re.findall(r'\b0x([a-fA-F0-9]+)\b', cleaned)
            for hex_str in hex_patterns:
                try:
                    decoded_hex = bytes.fromhex(hex_str).decode('utf-8', errors='ignore')
                    if decoded_hex.isprintable():
                        cleaned = cleaned.replace(f"0x{hex_str}", decoded_hex)
                except Exception:
                    pass
        except Exception:
            pass

        # 5. Base64 decoding (detect potential base64 blocks and extract)
        # SQLi doesn't usually feature plain Base64 unless inside specific custom vectors
        try:
            # Find substrings of length 16+ that match B64 alphabet
            b64_candidates = re.findall(r'\b([a-zA-Z0-9+/]{16,}=*)\b', cleaned)
            for cand in b64_candidates:
                try:
                    # Check padding padding alignment
                    rem = len(cand) % 4
                    padded_cand = cand + ("=" * (4 - rem) if rem > 0 else "")
                    decoded_b64 = base64.b64decode(padded_cand).decode('utf-8', errors='ignore')
                    if decoded_b64.isprintable() and len(decoded_b64) > 4:
                        cleaned = cleaned.replace(cand, decoded_b64)
                except Exception:
                    pass
        except Exception:
            pass

        # 6. Lowercase
        cleaned = cleaned.lower()

        # 7. Convert duplicate whitespace sequences to a single space
        cleaned = re.sub(r'\s+', ' ', cleaned)

        # 8. Strip
        cleaned = cleaned.strip()

        return cleaned

    def tokenize_char(self, payload):
        """Tokenizes payload into individual character items list."""
        return list(payload)

    def tokenize_word(self, payload):
        """Tokenizes payload into alphanumeric and symbol words."""
        # Split on non-alphanumeric except specific SQL constructs
        return re.findall(r'\b\w+\b|[^\w\s]', payload)

    def extract_features(self, raw_payload):
        """
        Extracts structural and token statistics from raw payload.
        Returns:
            dict: Statistical feature variables.
        """
        normalized = self.normalize(raw_payload)
        
        # Dimensions
        length = len(raw_payload)
        norm_length = len(normalized)
        entropy = calculate_entropy(raw_payload)
        norm_entropy = calculate_entropy(normalized)
        
        # Counters
        digit_count = sum(1 for c in raw_payload if c.isdigit())
        special_char_count = len(self.special_chars_pattern.findall(raw_payload))
        
        # Keyword and signature frequencies
        sql_keywords = len(self.keywords_pattern.findall(normalized))
        sql_functions = len(self.functions_pattern.findall(normalized))
        sql_operators = len(self.operators_pattern.findall(normalized))
        sql_comments = len(self.comments_pattern.findall(normalized))
        
        # Boolean operator markers
        bool_ops = len(re.findall(r'\b(and|or|not|xor|&&|\|\|)\b', normalized))
        
        return {
            'length': length,
            'norm_length': norm_length,
            'entropy': entropy,
            'norm_entropy': norm_entropy,
            'digit_count': digit_count,
            'special_char_count': special_char_count,
            'sql_keywords': sql_keywords,
            'sql_functions': sql_functions,
            'sql_operators': sql_operators,
            'sql_comments': sql_comments,
            'boolean_operators': bool_ops,
            'normalized_payload': normalized
        }
