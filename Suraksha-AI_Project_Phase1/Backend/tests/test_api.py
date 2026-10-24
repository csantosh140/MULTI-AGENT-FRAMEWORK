import unittest
import json
from app import create_app
from app.config.settings import Config

class SurakshaApiTestCase(unittest.TestCase):
    """Automated backend test suite validating blueprints, response schemas, and JWT rules."""

    def setUp(self):
        # Configure app to run under TEST configurations
        class TestConfig(Config):
            TESTING = True
            DEBUG = False
            LOG_LEVEL = "ERROR" # Silence logging in console during tests

        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def test_health_check(self):
        """Assert /api/health yields status 200 and maps standardized keys."""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        
        body = json.loads(response.data.decode('utf-8'))
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["status"], "Healthy")
        self.assertIn("version", body["data"])

    def test_auth_login_success(self):
        """Assert valid login returns token credentials."""
        credentials = {
            "email": "admin@suraksha.ai",
            "password": "password123"
        }
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(credentials),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        body = json.loads(response.data.decode('utf-8'))
        self.assertTrue(body["success"])
        self.assertIn("token", body["data"])
        self.assertEqual(body["data"]["user"]["email"], "admin@suraksha.ai")

    def test_auth_login_invalid(self):
        """Assert invalid passwords yield 401 Unauthorized status."""
        credentials = {
            "email": "admin@suraksha.ai",
            "password": "wrong_password_here"
        }
        response = self.client.post(
            '/api/auth/login',
            data=json.dumps(credentials),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)
        
        body = json.loads(response.data.decode('utf-8'))
        self.assertFalse(body["success"])

    def test_protected_route_without_jwt(self):
        """Assert accessing dashboard stats without JWT returns 401."""
        response = self.client.get('/api/dashboard/stats')
        self.assertEqual(response.status_code, 401)
        
        body = json.loads(response.data.decode('utf-8'))
        self.assertFalse(body["success"])
        self.assertIn("headers missing", body["message"].lower())

    def test_payload_generation(self):
        """Assert payload generation with mock JWT runs successfully."""
        # 1. Login to acquire active session token
        credentials = {"email": "admin@suraksha.ai", "password": "password123"}
        login_res = self.client.post('/api/auth/login', data=json.dumps(credentials), content_type='application/json')
        token = json.loads(login_res.data.decode('utf-8'))["data"]["token"]

        # 2. Query endpoint using JWT auth headers
        headers = {"Authorization": f"Bearer {token}"}
        req_body = {
            "payload_type": "basic",
            "mutation_level": 2
        }
        response = self.client.post(
            '/api/payload/generate',
            data=json.dumps(req_body),
            headers=headers,
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        body = json.loads(response.data.decode('utf-8'))
        self.assertTrue(body["success"])
        self.assertIn("payload", body["data"])

    def test_detection_check_injection(self):
        """Assert SQLi query detection maps threat score indicators."""
        credentials = {"email": "admin@suraksha.ai", "password": "password123"}
        login_res = self.client.post('/api/auth/login', data=json.dumps(credentials), content_type='application/json')
        token = json.loads(login_res.data.decode('utf-8'))["data"]["token"]

        headers = {"Authorization": f"Bearer {token}"}
        
        # SQL Injection attempt payload
        req_body = {
            "url": "/api/users",
            "payload": "1' UNION SELECT username, password FROM users --"
        }
        response = self.client.post(
            '/api/detection/check',
            data=json.dumps(req_body),
            headers=headers,
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        body = json.loads(response.data.decode('utf-8'))
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["prediction"], "SQL Injection")
        self.assertGreater(body["data"]["risk_score"], 50.0)

    def test_detection_check_safe(self):
        """Assert regular queries are flagged as Safe."""
        credentials = {"email": "admin@suraksha.ai", "password": "password123"}
        login_res = self.client.post('/api/auth/login', data=json.dumps(credentials), content_type='application/json')
        token = json.loads(login_res.data.decode('utf-8'))["data"]["token"]

        headers = {"Authorization": f"Bearer {token}"}
        
        req_body = {
            "url": "/api/users?id=12",
            "payload": "id=12"
        }
        response = self.client.post(
            '/api/detection/check',
            data=json.dumps(req_body),
            headers=headers,
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        body = json.loads(response.data.decode('utf-8'))
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["prediction"], "Safe")
        self.assertLess(body["data"]["risk_score"], 20.0)

if __name__ == '__main__':
    unittest.main()
