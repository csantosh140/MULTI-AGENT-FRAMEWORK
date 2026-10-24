import os
import io
import csv
import logging
from flask import Blueprint, request
from app.utils.helpers import json_response
from app.ml.prediction.predict import MLPredictionEngine
from app.ml.training.train import run_training_pipeline

logger = logging.getLogger('app')
ml_bp = Blueprint('ml', __name__)

@ml_bp.route('/ml/predict', methods=['POST'])
def predict_payload():
    """
    POST /api/ml/predict
    Analyzes a single query payload for SQL Injection markers using the best-trained ML model.
    Request body:
        { "payload": "1' OR '1'='1" }
    """
    body = request.get_json() or {}
    payload = body.get('payload')
    
    if payload is None:
        return json_response(
            success=False,
            message="Required parameter missing: 'payload' must be provided.",
            status_code=400
        )
        
    engine = MLPredictionEngine()
    if not engine.model or not engine.vectorizer:
        return json_response(
            success=False,
            message="AI Engine model files are missing or corrupted. Please run retraining first.",
            status_code=500
        )
        
    try:
        verdict = engine.predict(payload)
        
        # Map values to the exact response keys requested:
        # prediction, confidence, risk_level, probability, processing_time
        response_data = {
            'prediction': verdict['prediction'],
            'confidence': verdict['confidence'],
            'risk_level': verdict['risk_level'],
            'probability': verdict['probability'],
            'processing_time': verdict['prediction_time']
        }
        
        return json_response(
            success=True,
            message="ML classification completed successfully.",
            data=response_data,
            status_code=200
        )
    except Exception as e:
        logger.exception(f"Inference execution failed: {str(e)}")
        return json_response(
            success=False,
            message=f"Inference execution failed: {str(e)}",
            status_code=500
        )

@ml_bp.route('/ml/batch', methods=['POST'])
def batch_predict():
    """
    POST /api/ml/batch
    Accepts a CSV upload, performs predictions on all rows, and returns a compiled predictions list.
    Form data:
        file: csv file with a 'payload' column
    """
    if 'file' not in request.files:
        return json_response(
            success=False,
            message="No file uploaded. Please upload a CSV file with the key 'file'.",
            status_code=400
        )
        
    file = request.files['file']
    if not file.filename.endswith('.csv'):
        return json_response(
            success=False,
            message="Invalid file format. Only CSV files are supported.",
            status_code=400
        )
        
    engine = MLPredictionEngine()
    if not engine.model or not engine.vectorizer:
        return json_response(
            success=False,
            message="AI Engine model files are missing. Retraining is required.",
            status_code=500
        )
        
    try:
        # Read the file in-memory
        stream = io.StringIO(file.stream.read().decode("utf8"), newline=None)
        reader = csv.reader(stream)
        
        headers = next(reader, None)
        if not headers:
            return json_response(
                success=False,
                message="Uploaded CSV file is empty.",
                status_code=400
            )
            
        # Determine payload column index
        payload_idx = -1
        # Look for 'payload' column (case-insensitive)
        for idx, h in enumerate(headers):
            if h.strip().lower() == 'payload':
                payload_idx = idx
                break
                
        # If no payload header is found, fall back to first column
        if payload_idx == -1:
            payload_idx = 0
            logger.warning("No 'payload' header found in CSV. Defaulting to first column.")
            
        results = []
        for row in reader:
            if not row or len(row) <= payload_idx:
                continue
            payload = row[payload_idx]
            verdict = engine.predict(payload)
            results.append({
                'payload': payload,
                'prediction': verdict['prediction'],
                'confidence': verdict['confidence'],
                'risk_level': verdict['risk_level'],
                'probability': verdict['probability']
            })
            
        return json_response(
            success=True,
            message=f"Batch prediction completed for {len(results)} rows.",
            data={'predictions': results},
            status_code=200
        )
    except Exception as e:
        logger.exception(f"Batch inference failed: {str(e)}")
        return json_response(
            success=False,
            message=f"Batch inference failed: {str(e)}",
            status_code=500
        )

@ml_bp.route('/ml/model', methods=['GET'])
def get_model_info():
    """
    GET /api/ml/model
    Returns metadata about the currently selected and active ML model.
    """
    engine = MLPredictionEngine()
    
    if not engine.initialized or not engine.model:
        return json_response(
            success=False,
            message="No active ML model has been loaded. Model files may be missing.",
            status_code=404
        )
        
    meta = engine.metadata or {}
    metrics = meta.get('metrics', {})
    
    # Return requested keys: Current Model, Version, Accuracy, Training Date, Dataset
    response_data = {
        'Current Model': meta.get('best_model', engine.model_used),
        'Version': meta.get('model_version', '1.0.0'),
        'Accuracy': metrics.get('accuracy', 0.0),
        'Training Date': meta.get('training_date', 'Unknown'),
        'Dataset': meta.get('dataset_name', 'Unknown')
    }
    
    # Also support standard camelCase/snake_case structure for programmatic clients
    response_data.update({
        'current_model': meta.get('best_model', engine.model_used),
        'version': meta.get('model_version', '1.0.0'),
        'accuracy': metrics.get('accuracy', 0.0),
        'training_date': meta.get('training_date', 'Unknown'),
        'dataset': meta.get('dataset_name', 'Unknown')
    })
    
    return json_response(
        success=True,
        message="Active model metadata retrieved successfully.",
        data=response_data,
        status_code=200
    )

@ml_bp.route('/ml/train', methods=['POST'])
def retrain_models():
    """
    POST /api/ml/train
    Triggers model retraining using the latest datasets.
    """
    logger.info("Manual retraining request received.")
    
    try:
        metadata = run_training_pipeline()
        
        # Force reload in memory
        engine = MLPredictionEngine()
        engine.reload()
        
        return json_response(
            success=True,
            message="Model retraining and selection completed successfully. Active model refreshed.",
            data={
                'best_model': metadata['best_model'],
                'metrics': metadata['metrics']
            },
            status_code=200
        )
    except Exception as e:
        logger.exception(f"Retraining pipeline execution failed: {str(e)}")
        return json_response(
            success=False,
            message=f"Retraining failed: {str(e)}",
            status_code=500
        )
