import os
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://127.0.0.1:5001')
ACCOUNT_SERVICE_URL = os.getenv('ACCOUNT_SERVICE_URL', 'http://127.0.0.1:5002')
SURAKSHA_AI_URL = os.getenv('SURAKSHA_AI_URL', 'http://127.0.0.1:5000/api/detection/scan')

def inspect_with_suraksha(req):
    try:
        payload_data = {}
        if req.is_json:
            payload_data = req.get_json() or {}

        scan_payload = {
            "url": req.path,
            "method": req.method,
            "headers": dict(req.headers),
            "parameters": dict(req.args),
            "body": payload_data,
            "client_ip": req.remote_addr or '127.0.0.1'
        }

        res = requests.post(SURAKSHA_AI_URL, json=scan_payload, timeout=2.0)
        if res.status_code == 200:
            data = res.json()
            if data.get('blocked') or data.get('data', {}).get('blocked'):
                return True, data
    except Exception as e:
        app.logger.warning(f"[APIGateway] Suraksha AI inspection fallback: {str(e)}")

    return False, None

@app.before_request
def security_gateway_filter():
    if request.path in ['/health', '/favicon.ico']:
        return None

    is_blocked, threat_data = inspect_with_suraksha(request)
    if is_blocked:
        return jsonify({
            "success": False,
            "blocked": True,
            "message": "Security Intercept: Request blocked by Suraksha-AI Shield Grid",
            "shield": "SURAKSHA-AI SHIELD ACTIVE",
            "threatDetails": threat_data
        }), 403

def forward_request(target_url):
    url = f"{target_url}{request.full_path}"
    headers = {k: v for k, v in request.headers if k.lower() != 'host'}

    try:
        resp = requests.request(
            method=request.method,
            url=url,
            headers=headers,
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False,
            timeout=10.0
        )

        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
        headers = [(name, value) for (name, value) in resp.raw.headers.items()
                   if name.lower() not in excluded_headers]

        return Response(resp.content, resp.status_code, headers)
    except requests.exceptions.RequestException as e:
        return jsonify({"message": "Target Microservice Unavailable", "error": str(e)}), 503

@app.route('/api/auth/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_auth(path):
    return forward_request(AUTH_SERVICE_URL)

@app.route('/api/accounts/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_accounts(path):
    return forward_request(ACCOUNT_SERVICE_URL)

@app.route('/health')
def health():
    return {"status": "APIGateway and Suraksha AI Filter Online"}, 200

if __name__ == '__main__':
    app.run(debug=True, port=3000)
