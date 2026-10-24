import os
import joblib
import logging
import numpy as np
from datetime import datetime

# Helper sub-modules
from ai.vectorizers.feature_extractor import SQLiHybridFeatureExtractor
from ai.predictors.lstm_fallback import LSTMCharacterClassifierFallback
from ai.utils.rule_engine import SQLiRuleEngine
from ai.utils.error_detector import SQLiErrorDetector
from ai.utils.time_detector import SQLiTimeDetector
from ai.utils.blind_detector import SQLiBlindDetector
from ai.utils.oob_detector import SQLiOOBDetector
from ai.utils.second_order import SQLiSecondOrderDetector

logger = logging.getLogger('app')

class SQLiEnsemblePredictor:
    """
    Combines Random Forest, Gradient Boosting, XGBoost, and LSTM predictions
    with regex signatures, database errors, and delay behavior logs to achieve
    hybrid SQLi detection.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(SQLiEnsemblePredictor, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self, models_dir=None):
        if self.initialized:
            return
            
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if not models_dir:
            self.models_dir = os.path.join(base_dir, 'models')
        else:
            self.models_dir = models_dir
            
        self.rf_model = None
        self.gb_model = None
        self.xgb_model = None
        self.lstm_model = None
        self.feature_extractor = None
        
        # Instantiate detectors
        self.rule_engine = SQLiRuleEngine()
        self.error_detector = SQLiErrorDetector()
        self.time_detector = SQLiTimeDetector()
        self.blind_detector = SQLiBlindDetector()
        self.oob_detector = SQLiOOBDetector()
        self.second_order = SQLiSecondOrderDetector()
        
        # Hardcoded ensemble voting weights (Sums to 1.0)
        self.weights = {
            'rf': 0.35,
            'gb': 0.25,
            'xgb': 0.25,
            'lstm': 0.15
        }
        
        self.load_models()
        self.initialized = True

    def load_models(self):
        """Loads serialized feature extractors and model weights from disk."""
        logger.info("Ensemble Engine: Loading model files...")
        
        rf_path = os.path.join(self.models_dir, 'random_forest.pkl')
        gb_path = os.path.join(self.models_dir, 'gradient_boosting.pkl')
        xgb_path = os.path.join(self.models_dir, 'xgboost.pkl')
        lstm_path = os.path.join(self.models_dir, 'lstm.keras')
        
        # Check files existence
        if not all(os.path.exists(p) for p in [rf_path, gb_path, xgb_path, lstm_path]):
            logger.warning("Ensemble Engine: Some model binary files are missing. Train the models first.")
            return

        try:
            self.rf_model = joblib.load(rf_path)
            self.gb_model = joblib.load(gb_path)
            self.xgb_model = joblib.load(xgb_path)
            self.lstm_model = LSTMCharacterClassifierFallback.load(lstm_path)
            
            self.feature_extractor = SQLiHybridFeatureExtractor()
            self.feature_extractor.load(self.models_dir)
            logger.info("Ensemble Engine: Model loading completed successfully.")
        except Exception as e:
            logger.error(f"Ensemble Engine load failed: {str(e)}")
            self.rf_model = None

    def reload(self):
        self.load_models()

    def predict(
        self,
        payload,
        method="GET",
        url="/",
        headers=None,
        cookies=None,
        response_time=None,
        http_response=None,
        session_id=None,
        user_id=None
    ):
        """
        Runs comprehensive hybrid inspection (ML Ensemble + Rule + Behavior).
        Returns classification details.
        """
        if not self.rf_model or not self.feature_extractor:
            raise FileNotFoundError("Hybrid Engine: Active model pkl binaries not found. Retraining required.")
            
        # 1. Rules Checking (Regex)
        normalized_payload = self.feature_extractor.normalizer.normalize(payload)
        rule_result = self.rule_engine.evaluate(normalized_payload)
        rule_score = rule_result['rule_score']
        inferred_category = rule_result['inferred_type']
        
        # 2. ML Ensemble Prediction
        # Extract features
        combined_features = self.feature_extractor.transform([payload])
        
        # Compute individual model probabilities
        rf_prob = float(self.rf_model.predict_proba(combined_features)[0][1])
        gb_prob = float(self.gb_model.predict_proba(combined_features)[0][1])
        xgb_prob = float(self.xgb_model.predict_proba(combined_features)[0][1])
        lstm_prob = float(self.lstm_model.predict_proba([payload])[0][1])
        
        # Weighted probability sum
        ml_prob = (
            rf_prob * self.weights['rf'] +
            gb_prob * self.weights['gb'] +
            xgb_prob * self.weights['xgb'] +
            lstm_prob * self.weights['lstm']
        )
        
        # Determine model agreement
        # Check predictions (threshold at 0.5)
        preds = [
            1 if rf_prob >= 0.5 else 0,
            1 if gb_prob >= 0.5 else 0,
            1 if xgb_prob >= 0.5 else 0,
            1 if lstm_prob >= 0.5 else 0
        ]
        
        final_ml_pred = 1 if ml_prob >= 0.5 else 0
        agreement_count = sum(1 for p in preds if p == final_ml_pred)
        model_agreement = float(agreement_count / len(preds) * 100.0)
        ml_score = ml_prob * 100.0
        
        # 3. Behavioral Analysis Checks
        # 3a. Time-Based
        time_result = self.time_detector.analyze_request(payload, response_time)
        time_score = time_result['time_behavior_score']
        
        # 3b. Error-Based
        error_result = self.error_detector.analyze_response(http_response)
        error_score = error_result['error_confidence']
        
        # 3c. Content-Based Blind (Simulate context if comparing, else default 0)
        blind_score = 0.0
        
        # 3d. Out-of-Band (OOB) Check
        oob_result = self.oob_detector.analyze_payload(normalized_payload)
        oob_score = oob_result['oob_score']
        
        # 3e. Second-Order Correlation Check
        second_order_score = 0.0
        if session_id:
            so_result = self.second_order.analyze_subsequent_request(session_id, url)
            if so_result['is_second_order_suspicious']:
                second_order_score = so_result['suspicion_score']
                
        # Register payload if it's a save action to track potential second-order attacks later
        is_write_method = method.upper() in ['POST', 'PUT', 'PATCH']
        if is_write_method and payload:
            self.second_order.register_saved_payload(session_id, user_id, payload)
            
        # Aggregate behavioral score
        behavior_score = max(time_score, error_score, blind_score, oob_score, second_order_score)
        
        # 4. Confidence and Decision Core
        # Overall confidence is a weighted maximum/average of Rule, ML, and Behavior scores
        # E.g. Overall = 0.5 * ML + 0.3 * Rule + 0.2 * Behavior
        overall_confidence = float(
            ml_score * 0.45 +
            rule_score * 0.35 +
            behavior_score * 0.20
        )
        
        # Block trigger (Blocked if confidence >= 50.0 or if critical rule/behavior triggers)
        is_blocked = overall_confidence >= 50.0 or rule_score >= 85.0 or behavior_score >= 80.0
        
        # 5. Attack Type Classification Mapping
        # Predict Safe, Inline SQLi, UNION SQLi, Error SQLi, Blind SQLi, Time-Based, Conditional, Stacked, Second-Order Suspicion, Out-of-Band Suspicion
        if not is_blocked and overall_confidence < 35.0:
            attack_type = "Safe"
            severity = "Info"
            explanation = "Request contains standard alphanumeric content. No anomalies detected."
        else:
            # Map category priority based on behavioral and rule flags
            if time_score >= 80.0 or inferred_category == "Time-Based":
                attack_type = "Time-Based"
                severity = "Critical"
                explanation = f"Time-Based SQL Injection detected. {time_result['explanation']}"
            elif error_score >= 90.0:
                attack_type = "Error SQLi"
                severity = "High"
                explanation = f"Error-Based SQL Injection signature detected. Leaked Database: {error_result['db_detected']}."
            elif oob_score >= 80.0:
                attack_type = "Out-of-Band Suspicion"
                severity = "Critical"
                explanation = f"Out-of-Band network egress attempt detected: {', '.join(oob_result['triggers'])}."
            elif second_order_score >= 50.0:
                attack_type = "Second-Order Suspicion"
                severity = "High"
                explanation = "Stateful correlation flags subsequent page access fetching previously stored payloads."
            elif inferred_category == "UNION SQLi":
                attack_type = "UNION SQLi"
                severity = "Critical"
                explanation = "UNION statement query injecting select blocks identified."
            elif inferred_category == "Stacked":
                attack_type = "Stacked"
                severity = "Critical"
                explanation = "Stacked query separators trying to execute multi-command DDL/DML statements."
            elif inferred_category == "Conditional":
                attack_type = "Conditional"
                severity = "Medium"
                explanation = "Boolean/Conditional validation sequences mapped (e.g. AND 1=1 or OR 1=1)."
            elif inferred_category == "Inline SQLi":
                attack_type = "Inline SQLi"
                severity = "Medium"
                explanation = "Inline comments or quote escape patterns matched."
            else:
                attack_type = "Blind SQLi"
                severity = "High"
                explanation = "Behavioral deviations indicate a potential blind/Boolean attack parameter."
                
        return {
            'attack_type': attack_type,
            'confidence': min(100.0, overall_confidence),
            'severity': severity,
            'explanation': explanation,
            'blocked': is_blocked,
            'scores': {
                'rule_score': rule_score,
                'ml_score': ml_score,
                'behavior_score': behavior_score,
                'model_agreement': model_agreement
            },
            'probabilities': {
                'random_forest': rf_prob,
                'gradient_boosting': gb_prob,
                'xgboost': xgb_prob,
                'lstm': lstm_prob
            }
        }
