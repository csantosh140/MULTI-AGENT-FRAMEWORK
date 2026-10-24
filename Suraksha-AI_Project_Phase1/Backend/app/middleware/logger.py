import time
import logging
from flask import request, g

logger = logging.getLogger('app')

def setup_logger_middleware(app):
    """
    Middleware logger for Flask. Tracks and writes details of every incoming request 
    and outgoing response, including methods, URLs, client IPs, and duration offsets.
    """
    
    @app.before_request
    def record_start_time():
        g.start_time = time.perf_counter()

    @app.after_request
    def log_request_transaction(response):
        # Prevent middleware logs from logging static asset requests if any exist
        if request.path.startswith('/static'):
            return response
            
        duration = time.perf_counter() - getattr(g, 'start_time', time.perf_counter())
        duration_ms = int(duration * 1000)
        
        # Check proxies for IP address
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
        if client_ip and ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()

        logger.info(
            f"METHOD: {request.method} | "
            f"URL: {request.path} | "
            f"IP: {client_ip} | "
            f"STATUS: {response.status_code} | "
            f"DURATION: {duration_ms}ms"
        )
        return response
