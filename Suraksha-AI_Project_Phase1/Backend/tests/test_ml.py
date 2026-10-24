import os
import io
import json
import unittest
from app import create_app
from app.config.settings import Config
from app.ml.utils.preprocessing import preprocess_payload, validate_and_preprocess_df
from app.ml.prediction.predict import MLPredictionEngine

class TestMLConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SECRET_KEY = 'test_secret'
    JWT_SECRET_KEY = 'test_jwt_secret'

class MLTestCase(unittest.TestCase):
    def setUp(self):
        # Create Flask testing client
        self.app = create_app(TestMLConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()

    def test_preprocess_payload(self):
        """Tests that text cleansing operates correctly (lowercase, spaces, decoding, etc.)"""
        # Test lowercase
        self.assertEqual(preprocess_payload("SELECT * FROM Users"), "select * from users")
        # Test whitespace normalization
        self.assertEqual(preprocess_payload("select   *   from\nusers"), "select * from users")
        # Test URL decoding
        self.assertEqual(preprocess_payload("select%20*%20from%20users"), "select * from users")
        # Test HTML decoding
        self.assertEqual(preprocess_payload("select &lt;*&gt; from users"), "select <*> from users")
        # Test quote normalization
        self.assertEqual(preprocess_payload("select * from users where name=`john`"), "select * from users where name='john'")

    def test_prediction_engine(self):
        """Tests prediction class is running inference successfully and mapping risk levels."""
        engine = MLPredictionEngine()
        # Verify engine loaded models
        self.assertIsNotNone(engine.model, "ML model was not trained or loaded.")
        self.assertIsNotNone(engine.vectorizer, "TF-IDF Vectorizer was not loaded.")
        
        # Safe payload check
        result_safe = engine.predict("hello world")
        self.assertEqual(result_safe['prediction'], 0)
        self.assertEqual(result_safe['risk_level'], "SAFE")
        self.assertGreaterEqual(result_safe['confidence'], 50.0)
        self.assertLessEqual(result_safe['probability'], 0.25)
        
        # SQL Injection payload check
        result_sqli = engine.predict("1' OR '1'='1")
        self.assertEqual(result_sqli['prediction'], 1)
        self.assertIn(result_sqli['risk_level'], ["MEDIUM", "HIGH"])
        self.assertGreaterEqual(result_sqli['confidence'], 50.0)
        self.assertGreaterEqual(result_sqli['probability'], 0.50)

    def test_api_predict(self):
        """Tests POST /api/ml/predict endpoint."""
        response = self.client.post(
            '/api/ml/predict',
            json={'payload': "1' OR '1'='1"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        
        payload_data = data['data']
        self.assertIn('prediction', payload_data)
        self.assertIn('confidence', payload_data)
        self.assertIn('risk_level', payload_data)
        self.assertIn('probability', payload_data)
        self.assertIn('processing_time', payload_data)
        self.assertEqual(payload_data['prediction'], 1)

    def test_api_batch(self):
        """Tests POST /api/ml/batch CSV upload predictions endpoint."""
        # Create an in-memory CSV file
        csv_data = "payload,label\nhello world,0\n1' OR 1=1,1\n"
        response = self.client.post(
            '/api/ml/batch',
            data={
                'file': (io.BytesIO(csv_data.encode('utf-8')), 'test_batch.csv')
            },
            content_type='multipart/form-data'
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        
        predictions = data['data']['predictions']
        self.assertEqual(len(predictions), 2)
        self.assertEqual(predictions[0]['payload'], "hello world")
        self.assertEqual(predictions[0]['prediction'], 0)
        self.assertEqual(predictions[1]['payload'], "1' OR 1=1")
        self.assertEqual(predictions[1]['prediction'], 1)

    def test_api_model(self):
        """Tests GET /api/ml/model endpoint details."""
        response = self.client.get('/api/ml/model')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        
        info = data['data']
        self.assertIn('Current Model', info)
        self.assertIn('Version', info)
        self.assertIn('Accuracy', info)
        self.assertIn('Training Date', info)
        self.assertIn('Dataset', info)

    def test_api_train(self):
        """Tests POST /api/ml/train retraining trigger."""
        response = self.client.post('/api/ml/train')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])
        self.assertIn('best_model', data['data'])
        self.assertIn('metrics', data['data'])

if __name__ == '__main__':
    unittest.main()
