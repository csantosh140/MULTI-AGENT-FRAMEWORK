import re
from urllib.parse import urlparse

# Regular expression to match standard email structures
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_email(email):
    """
    Validates email syntax.
    Returns (True, None) if valid, or (False, error_msg) if invalid.
    """
    if not email or not isinstance(email, str):
        return False, "Email address must be a valid non-empty string."
    if not EMAIL_REGEX.match(email.strip()):
        return False, "Provided email address has an invalid format."
    return True, None

def validate_password(password):
    """
    Validates password strength.
    Requires at least 8 characters, containing at least one letter and one number.
    Returns (True, None) if valid, or (False, error_msg) if invalid.
    """
    if not password or not isinstance(password, str):
        return False, "Password must be a valid non-empty string."
    if len(password) < 8:
        return False, "Password is too weak. Minimum length must be 8 characters."
    if not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
        return False, "Password must contain at least one letter and one digit."
    return True, None

def validate_payload_size(payload, max_kb=64):
    """
    Validates payload string sizes to protect database columns.
    Returns (True, None) if size is within limits, or (False, error_msg) if it exceeds.
    """
    if not payload:
        return True, None
    if not isinstance(payload, str):
        return False, "Payload must be a string."
    # Size in kilobytes
    payload_size_kb = len(payload.encode('utf-8')) / 1024.0
    if payload_size_kb > max_kb:
        return False, f"Payload size ({round(payload_size_kb, 2)} KB) exceeds the maximum limit of {max_kb} KB."
    return True, None

def validate_url(url):
    """
    Validates HTTP endpoints and request URLs.
    Checks syntax using parsing libraries.
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a valid non-empty string."
    
    # We want to support both absolute URLs and relative local API routes (e.g. /api/v1/users)
    if url.startswith('/'):
        # Relative endpoint URLs are valid
        return True, None
        
    try:
        parsed = urlparse(url)
        # Check scheme and netloc for absolute URLs
        if parsed.scheme not in ('http', 'https'):
            return False, "URL scheme must be HTTP or HTTPS."
        if not parsed.netloc:
            return False, "URL must contain a valid domain host or authority."
        return True, None
    except Exception:
        return False, "Malformed URL format detected."

def validate_http_method(method):
    """
    Validates HTTP methods.
    Accepts GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD.
    """
    VALID_METHODS = {'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'}
    if not method or not isinstance(method, str):
        return False, "HTTP method must be a valid string."
    if method.upper() not in VALID_METHODS:
        return False, f"Invalid HTTP method: {method}. Allowed methods: {', '.join(VALID_METHODS)}"
    return True, None
