import os
import time
import json
import logging
from datetime import datetime
import pandas as pd
import numpy as np
import joblib

# Sklearn & XGBoost model imports
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix
)

# Matplotlib for generating confusion matrix plot
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Core utilities
from ai.vectorizers.feature_extractor import SQLiHybridFeatureExtractor
from ai.predictors.lstm_fallback import LSTMCharacterClassifierFallback

logger = logging.getLogger('app')

def run_training_pipeline(
    raw_dataset_dir=None,
    models_dir=None,
    evaluation_dir=None,
    random_state=42,
    dataset_version="1.0.0",
    model_version="2.0.0"
):
    """
    Auto retraining training pipeline.
    Loads raw CSV datasets, fits feature extractor, trains Random Forest, 
    Gradient Boosting, XGBoost, and character-level LSTM fallback, 
    measures evaluation metrics, generates confusion matrix, and saves models.
    """
    start_time_overall = time.time()
    
    # Resolve paths relative to project layout
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not raw_dataset_dir:
        raw_dataset_dir = os.path.join(base_dir, 'datasets', 'raw')
    if not models_dir:
        models_dir = os.path.join(base_dir, 'models')
    if not evaluation_dir:
        evaluation_dir = os.path.join(base_dir, 'evaluation')
        
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(evaluation_dir, exist_ok=True)
    
    logger.info("Retraining Pipeline: Initializing Hybrid Detection Engine model fit...")
    
    # 1. Load raw dataset CSVs
    csv_files = [f for f in os.listdir(raw_dataset_dir) if f.endswith('.csv')]
    if not csv_files:
        raise FileNotFoundError(f"Retraining Pipeline: No CSV datasets found in raw directory: {raw_dataset_dir}")
        
    dfs = []
    for csv_file in csv_files:
        path = os.path.join(raw_dataset_dir, csv_file)
        try:
            df_t = pd.read_csv(path)
            dfs.append(df_t)
            logger.info(f"Retraining Pipeline: Loaded {len(df_t)} rows from {csv_file}")
        except Exception as e:
            logger.error(f"Retraining Pipeline error loading {csv_file}: {str(e)}")
            
    if not dfs:
        raise ValueError("Could not read any valid data from CSV sources.")
        
    combined_df = pd.concat(dfs, ignore_index=True)
    
    # Validate column structure
    if 'payload' not in combined_df.columns or 'label' not in combined_df.columns:
        raise ValueError("Retraining Pipeline: Dataset must contain 'payload' and 'label' columns.")
        
    # Drop rows with nulls
    combined_df = combined_df.dropna(subset=['payload', 'label'])
    combined_df['label'] = combined_df['label'].astype(int)
    # Remove duplicate payloads
    combined_df = combined_df.drop_duplicates(subset=['payload'])
    
    logger.info(f"Retraining Pipeline: Preprocessed dataset has {len(combined_df)} unique rows.")
    
    # Split training sets
    X = combined_df['payload'].values
    y = combined_df['label'].values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state, stratify=y
    )
    
    # Save validation splits for future verification
    os.makedirs(os.path.join(base_dir, 'datasets', 'validation'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'datasets', 'test'), exist_ok=True)
    pd.DataFrame({'payload': X_test, 'label': y_test}).to_csv(
        os.path.join(base_dir, 'datasets', 'test', 'test_split.csv'), index=False
    )
    
    # 2. Extract Features
    extractor = SQLiHybridFeatureExtractor()
    X_train_vec = extractor.fit_transform(X_train)
    X_test_vec = extractor.transform(X_test)
    extractor.save(models_dir)
    
    # 3. Model Training Definitions
    # 3a. Random Forest
    rf = RandomForestClassifier(n_estimators=100, random_state=random_state, n_jobs=-1)
    # 3b. Gradient Boosting
    gb = GradientBoostingClassifier(n_estimators=100, random_state=random_state)
    # 3c. XGBoost
    xgb = XGBClassifier(n_estimators=100, random_state=random_state, n_jobs=-1, eval_metric='logloss')
    # 3d. Character Level Neural Net (LSTM Fallback)
    lstm = LSTMCharacterClassifierFallback()
    
    # Fits
    logger.info("Retraining Pipeline: Training Random Forest model...")
    t_start = time.time()
    rf.fit(X_train_vec, y_train)
    rf_train_time = time.time() - t_start
    
    logger.info("Retraining Pipeline: Training Gradient Boosting model...")
    t_start = time.time()
    gb.fit(X_train_vec, y_train)
    gb_train_time = time.time() - t_start
    
    logger.info("Retraining Pipeline: Training XGBoost model...")
    t_start = time.time()
    xgb.fit(X_train_vec, y_train)
    xgb_train_time = time.time() - t_start
    
    logger.info("Retraining Pipeline: Training Character LSTM Fallback model...")
    t_start = time.time()
    lstm.fit(X_train, y_train)
    lstm_train_time = time.time() - t_start
    
    # Persist model weights
    joblib.dump(rf, os.path.join(models_dir, 'random_forest.pkl'))
    joblib.dump(gb, os.path.join(models_dir, 'gradient_boosting.pkl'))
    joblib.dump(xgb, os.path.join(models_dir, 'xgboost.pkl'))
    lstm.save(os.path.join(models_dir, 'lstm.keras'))
    
    # 4. Evaluation Metrics
    models = {
        'Random Forest': (rf, X_test_vec, rf_train_time),
        'Gradient Boosting': (gb, X_test_vec, gb_train_time),
        'XGBoost': (xgb, X_test_vec, xgb_train_time)
    }
    
    metrics_summary = {}
    
    # Calculate for ensemble component classifiers
    for name, (model, X_vec, t_time) in models.items():
        y_pred = model.predict(X_vec)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        try:
            roc_auc = roc_auc_score(y_test, model.predict_proba(X_vec)[:, 1])
        except Exception:
            roc_auc = 0.5
            
        metrics_summary[name] = {
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'roc_auc': float(roc_auc),
            'training_time': float(t_time)
        }
        
    # Calculate for character LSTM fallback model
    lstm_pred = lstm.predict(X_test)
    lstm_acc = accuracy_score(y_test, lstm_pred)
    lstm_prec = precision_score(y_test, lstm_pred, zero_division=0)
    lstm_rec = recall_score(y_test, lstm_pred, zero_division=0)
    lstm_f1 = f1_score(y_test, lstm_pred, zero_division=0)
    try:
        lstm_auc = roc_auc_score(y_test, lstm.predict_proba(X_test)[:, 1])
    except Exception:
        lstm_auc = 0.5
        
    metrics_summary['LSTM Character Fallback'] = {
        'accuracy': float(lstm_acc),
        'precision': float(lstm_prec),
        'recall': float(lstm_rec),
        'f1_score': float(lstm_f1),
        'roc_auc': float(lstm_auc),
        'training_time': float(lstm_train_time)
    }
    
    # Evaluate integrated ensemble (weighted predictions)
    # Weights match self.weights inside SQLiEnsemblePredictor
    weights = {'rf': 0.35, 'gb': 0.25, 'xgb': 0.25, 'lstm': 0.15}
    rf_p = rf.predict_proba(X_test_vec)[:, 1]
    gb_p = gb.predict_proba(X_test_vec)[:, 1]
    xgb_p = xgb.predict_proba(X_test_vec)[:, 1]
    lstm_p = lstm.predict_proba(X_test)[:, 1]
    
    ensemble_p = (
        rf_p * weights['rf'] +
        gb_p * weights['gb'] +
        xgb_p * weights['xgb'] +
        lstm_p * weights['lstm']
    )
    
    ensemble_pred = np.where(ensemble_p >= 0.5, 1, 0)
    
    ens_acc = accuracy_score(y_test, ensemble_pred)
    ens_prec = precision_score(y_test, ensemble_pred, zero_division=0)
    ens_rec = recall_score(y_test, ensemble_pred, zero_division=0)
    ens_f1 = f1_score(y_test, ensemble_pred, zero_division=0)
    try:
        ens_auc = roc_auc_score(y_test, ensemble_p)
    except Exception:
        ens_auc = 0.5
        
    metrics_summary['Ensemble Model'] = {
        'accuracy': float(ens_acc),
        'precision': float(ens_prec),
        'recall': float(ens_rec),
        'f1_score': float(ens_f1),
        'roc_auc': float(ens_auc),
        'training_time': float(rf_train_time + gb_train_time + xgb_train_time + lstm_train_time)
    }
    
    logger.info(f"Retraining Pipeline: Integrated Ensemble Metrics: Acc={ens_acc:.4f}, Prec={ens_prec:.4f}, Rec={ens_rec:.4f}, F1={ens_f1:.4f}")
    
    # 5. Generate Confusion Matrix Plot
    cm = confusion_matrix(y_test, ensemble_pred)
    plt.figure(figsize=(6, 5))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix - Hybrid SQLi Ensemble')
    plt.colorbar()
    tick_marks = np.arange(2)
    plt.xticks(tick_marks, ['Safe', 'SQL Injection'])
    plt.yticks(tick_marks, ['Safe', 'SQL Injection'])
    
    # Annotate counts inside squares
    thresh = cm.max() / 2.
    for i, j in np.ndindex(cm.shape):
        plt.text(j, i, format(cm[i, j], 'd'),
                 horizontalalignment="center",
                 color="white" if cm[i, j] > thresh else "black")
                 
    plt.ylabel('Actual Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(os.path.join(evaluation_dir, 'confusion_matrix.png'))
    plt.close()
    
    # Save model metadata.json
    metadata = {
        'training_date': datetime.utcnow().isoformat() + 'Z',
        'dataset_version': dataset_version,
        'model_version': model_version,
        'metrics_summary': metrics_summary,
        'selected_model': 'Hybrid Ensemble (RF + GB + XGB + LSTM-Fallback)'
    }
    
    meta_path = os.path.join(models_dir, 'metadata.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    logger.info(f"Retraining Pipeline: Retraining completed successfully in {time.time() - start_time_overall:.2f} seconds.")
    return metadata

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run_training_pipeline()
