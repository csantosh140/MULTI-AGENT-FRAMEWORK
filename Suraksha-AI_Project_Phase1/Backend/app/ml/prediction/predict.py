import os
import time
import logging
import joblib
import json

from app.ml.utils.preprocessing import preprocess_payload

logger = logging.getLogger('app')

class MLPredictionEngine:
    """
    Singleton production inference engine.
    Loads models once during startup and caches them in memory.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(MLPredictionEngine, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self, models_dir=None):
        if self.initialized:
            return
            
        base_dir = os.path.dirname(os.path.dirname(__file__))
        if not models_dir:
            self.models_dir = os.path.join(base_dir, 'models')
        else:
            self.models_dir = models_dir
            
        self.vectorizer = None
        self.model = None
        self.metadata = None
        self.model_used = None
        
        self.load_models()
        self.initialized = True

    def load_models(self):
        """Loads TF-IDF vectorizer, the best classification model, and metadata from disk."""
        logger.info("Initializing ML Prediction Engine model load...")
        
        tfidf_path = os.path.join(self.models_dir, 'tfidf.pkl')
        if not os.path.exists(tfidf_path):
            tfidf_path = os.path.join(self.models_dir, 'tfidf_vectorizer.pkl')
            
        best_model_path = os.path.join(self.models_dir, 'best_model.pkl')
        metadata_path = os.path.join(self.models_dir, 'metadata.json')
        
        # Validate existence of files
        if not os.path.exists(tfidf_path):
            logger.warning("ML Prediction Engine: TF-IDF vectorizer pkl file missing.")
            return
            
        if not os.path.exists(best_model_path):
            logger.warning("ML Prediction Engine: best_model.pkl file missing.")
            return
            
        try:
            self.vectorizer = joblib.load(tfidf_path)
            self.model = joblib.load(best_model_path)
            
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                self.model_used = self.metadata.get('best_model', 'Unknown Class')
            else:
                self.model_used = type(self.model).__name__
                
            logger.info(f"ML Prediction Engine successfully initialized. Cached Model: {self.model_used}")
        except Exception as e:
            logger.error(f"ML Prediction Engine error loading model files: {str(e)}")
            # Keep them None so APIs can handle "Model Missing/Corrupted" gracefully
            self.vectorizer = None
            self.model = None
            self.metadata = None

    def reload(self):
        """Forces reload of models from files (e.g. after retraining)."""
        self.load_models()

    def predict(self, raw_payload):
        """
        Executes ML classification on a single incoming raw text payload.
        Returns:
            dict containing: prediction, confidence, probability, risk_level, model_used, prediction_time
        """
        start_time = time.time()
        
        if not self.model or not self.vectorizer:
            raise FileNotFoundError("AI Engine cannot execute prediction: Model files are not loaded or are corrupted.")
            
        # 1. Clean payload using preprocessing logic
        cleaned_payload = preprocess_payload(raw_payload)
        
        # 2. Extract features
        features = self.vectorizer.transform([cleaned_payload])
        
        # 3. Model inference
        prediction_class = int(self.model.predict(features)[0])
        probabilities = self.model.predict_proba(features)[0]
        
        # Extract probability of class 1 (SQL Injection)
        sqli_probability = float(probabilities[1])
        
        # Confidence is the probability of the predicted class (as a percentage)
        predicted_class_probability = probabilities[prediction_class]
        confidence = float(predicted_class_probability * 100.0)
        
        # Map probability * 100 to risk levels:
        # 0-25: SAFE, 26-50: LOW, 51-75: MEDIUM, 76-100: HIGH
        prob_percentage = sqli_probability * 100.0
        if prob_percentage <= 25.0:
            risk_level = "SAFE"
        elif prob_percentage <= 50.0:
            risk_level = "LOW"
        elif prob_percentage <= 75.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
            
        prediction_time = time.time() - start_time
        
        return {
            'prediction': prediction_class,
            'confidence': confidence,
            'probability': sqli_probability,
            'risk_level': risk_level,
            'model_used': self.model_used,
            'prediction_time': prediction_time
        }
