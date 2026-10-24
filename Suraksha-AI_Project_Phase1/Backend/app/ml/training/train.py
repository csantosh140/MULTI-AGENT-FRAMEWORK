import os
import time
import json
import logging
from datetime import datetime
import pandas as pd
import numpy as np
import joblib

# Sklearn libraries
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, roc_curve, precision_recall_curve
)

# Matplotlib for generating evaluation graphs
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server environments
import matplotlib.pyplot as plt

# Custom modules
from app.ml.utils.preprocessing import validate_and_preprocess_df
from app.ml.utils.features import SQLiFeatureExtractor

logger = logging.getLogger('app')

def run_training_pipeline(
    raw_dataset_dir=None,
    models_dir=None,
    evaluation_dir=None,
    rf_n_estimators=100,
    rf_max_depth=None,
    random_state=42,
    model_version="1.0.0"
):
    """
    Main training execution function.
    Trains Random Forest, Logistic Regression, and SVM.
    Selects the best performing model based on F1-Score, generates evaluation charts, and stores artifacts.
    """
    start_time_overall = time.time()
    
    # Resolve directories
    base_dir = os.path.dirname(os.path.dirname(__file__))
    if not raw_dataset_dir:
        raw_dataset_dir = os.path.join(base_dir, 'datasets', 'raw')
    if not models_dir:
        models_dir = os.path.join(base_dir, 'models')
    if not evaluation_dir:
        evaluation_dir = os.path.join(base_dir, 'evaluation')
        
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(evaluation_dir, exist_ok=True)
    
    logger.info("Initializing ML training pipeline...")
    
    # 1. Load Dataset
    csv_files = [f for f in os.listdir(raw_dataset_dir) if f.endswith('.csv')]
    if not csv_files:
        raise FileNotFoundError(f"No CSV datasets found in raw dataset directory: {raw_dataset_dir}")
        
    logger.info(f"Discovered {len(csv_files)} dataset file(s): {csv_files}")
    dfs = []
    for csv_file in csv_files:
        file_path = os.path.join(raw_dataset_dir, csv_file)
        try:
            df_temp = pd.read_csv(file_path)
            dfs.append(df_temp)
            logger.info(f"Loaded {len(df_temp)} rows from {csv_file}")
        except Exception as e:
            logger.error(f"Error loading {csv_file}: {str(e)}")
            
    if not dfs:
        raise ValueError("Could not load any data from CSV files.")
        
    combined_df = pd.concat(dfs, ignore_index=True)
    dataset_names = ", ".join(csv_files)
    
    # 2. Preprocess Dataset
    preprocessed_df = validate_and_preprocess_df(combined_df, is_training=True)
    if len(preprocessed_df) < 10:
        raise ValueError("Insufficient preprocessed dataset size. Minimum required is 10 rows.")
        
    # 3. Split Train/Test
    X = preprocessed_df['payload'].values
    y = preprocessed_df['label'].values.astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_state, stratify=y
    )
    
    # Save splits for tracking
    splits_dir = os.path.join(base_dir, 'datasets')
    os.makedirs(os.path.join(splits_dir, 'train'), exist_ok=True)
    os.makedirs(os.path.join(splits_dir, 'test'), exist_ok=True)
    pd.DataFrame({'payload': X_train, 'label': y_train}).to_csv(os.path.join(splits_dir, 'train', 'train.csv'), index=False)
    pd.DataFrame({'payload': X_test, 'label': y_test}).to_csv(os.path.join(splits_dir, 'test', 'test.csv'), index=False)
    
    # 4. Feature Extraction (TF-IDF Vectorizer)
    feature_extractor = SQLiFeatureExtractor(
        max_features=5000,
        ngram_range=(1, 3),
        min_df=2,
        max_df=0.95
    )
    X_train_vec = feature_extractor.fit_transform(X_train)
    X_test_vec = feature_extractor.transform(X_test)
    
    # Save fitted TF-IDF Vectorizer
    feature_extractor.save(models_dir)
    
    # Define models dictionary to hold instances and execution parameters
    models_config = {
        'Random Forest': {
            'model': RandomForestClassifier(
                n_estimators=rf_n_estimators,
                max_depth=rf_max_depth,
                random_state=random_state,
                n_jobs=-1
            ),
            'filename': 'random_forest.pkl'
        },
        'Logistic Regression': {
            'model': LogisticRegression(
                max_iter=1000,
                random_state=random_state
            ),
            'filename': 'logistic.pkl'
        },
        'Support Vector Machine': {
            'model': SVC(
                probability=True,
                random_state=random_state
            ),
            'filename': 'svm.pkl'
        }
    }
    
    trained_models = {}
    comparison_metrics = {}
    
    # 5. Train & Evaluate Models
    for name, config in models_config.items():
        logger.info(f"Starting training for model: {name}")
        model = config['model']
        
        # Track training time
        t_start = time.time()
        model.fit(X_train_vec, y_train)
        train_time = time.time() - t_start
        
        # Track prediction time on test set
        t_pred_start = time.time()
        y_pred = model.predict(X_test_vec)
        pred_time = time.time() - t_pred_start
        
        # Compute probabilities
        y_prob = model.predict_proba(X_test_vec)[:, 1]
        
        # Calculate standard metric parameters
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        try:
            roc_auc = roc_auc_score(y_test, y_prob)
        except ValueError:
            roc_auc = 0.5
            
        logger.info(f"Model {name} Evaluation: Acc={acc:.4f}, Prec={prec:.4f}, Rec={rec:.4f}, F1={f1:.4f}, ROC_AUC={roc_auc:.4f}")
        
        # Save trained instance to file
        model_path = os.path.join(models_dir, config['filename'])
        joblib.dump(model, model_path)
        
        trained_models[name] = model
        comparison_metrics[name] = {
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'roc_auc': float(roc_auc),
            'training_time': float(train_time),
            'prediction_time': float(pred_time),
            'filename': config['filename']
        }
        
    # 6. Automatic Best Model Selection (based on F1 Score, tie-break on accuracy)
    best_model_name = None
    best_f1 = -1.0
    for name, metrics in comparison_metrics.items():
        if metrics['f1_score'] > best_f1:
            best_f1 = metrics['f1_score']
            best_model_name = name
        elif metrics['f1_score'] == best_f1:
            # Tie break on accuracy
            if metrics['accuracy'] > comparison_metrics[best_model_name]['accuracy']:
                best_model_name = name
                
    logger.info(f"Selected Best Performing Model: {best_model_name} with F1-Score: {best_f1:.4f}")
    
    # Save the best model explicitly as best_model.pkl
    best_config = models_config[best_model_name]
    best_model_src = os.path.join(models_dir, best_config['filename'])
    best_model_dest = os.path.join(models_dir, 'best_model.pkl')
    
    # Load and save to ensure exact copy structure
    best_model_instance = joblib.load(best_model_src)
    joblib.dump(best_model_instance, best_model_dest)
    
    # 7. Generate Evaluation Graphs (Confusion Matrix, ROC, PR Curves, Feature Importance)
    # Using the best model's predictions
    best_model = trained_models[best_model_name]
    y_pred_best = best_model.predict(X_test_vec)
    y_prob_best = best_model.predict_proba(X_test_vec)[:, 1]
    
    # 7a. Confusion Matrix Plot
    cm = confusion_matrix(y_test, y_pred_best)
    plt.figure(figsize=(6, 5))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title(f'Confusion Matrix - {best_model_name}')
    plt.colorbar()
    tick_marks = np.arange(2)
    plt.xticks(tick_marks, ['Safe', 'SQL Injection'])
    plt.yticks(tick_marks, ['Safe', 'SQL Injection'])
    
    # Annotate values inside matrix squares
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
    
    # 7b. ROC Curve Plot (for all models for comparison)
    plt.figure(figsize=(8, 6))
    for name, model in trained_models.items():
        y_prob_m = model.predict_proba(X_test_vec)[:, 1]
        fpr, tpr, _ = roc_curve(y_test, y_prob_m)
        auc_val = comparison_metrics[name]['roc_auc']
        plt.plot(fpr, tpr, label=f'{name} (AUC = {auc_val:.3f})')
    plt.plot([0, 1], [0, 1], 'k--', label='Baseline Chance')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic (ROC) Curves')
    plt.legend(loc='lower right')
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.savefig(os.path.join(evaluation_dir, 'roc_curve.png'))
    plt.close()
    
    # 7c. Precision-Recall Curve Plot (for all models)
    plt.figure(figsize=(8, 6))
    for name, model in trained_models.items():
        y_prob_m = model.predict_proba(X_test_vec)[:, 1]
        precision_m, recall_m, _ = precision_recall_curve(y_test, y_prob_m)
        plt.plot(recall_m, precision_m, label=f'{name}')
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curves')
    plt.legend(loc='lower left')
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.savefig(os.path.join(evaluation_dir, 'precision_recall_curve.png'))
    plt.close()
    
    # 7d. Feature Importance Plot (for Random Forest)
    rf_model = trained_models['Random Forest']
    importances = rf_model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    # Fetch feature names from vectorizer
    feature_names = np.array(feature_extractor.vectorizer.get_feature_names_out())
    
    # Plot top 20 features
    top_k = min(20, len(feature_names))
    plt.figure(figsize=(10, 6))
    plt.title('Feature Importances (Top 20 Characters/NGrams) - Random Forest')
    plt.bar(range(top_k), importances[indices[:top_k]], color="r", align="center")
    plt.xticks(range(top_k), feature_names[indices[:top_k]], rotation=45, ha='right')
    plt.xlim([-1, top_k])
    plt.ylabel('Relative Importance Score')
    plt.tight_layout()
    plt.savefig(os.path.join(evaluation_dir, 'feature_importance.png'))
    plt.close()
    
    # 8. Save Metadata
    best_metrics = comparison_metrics[best_model_name]
    metadata = {
        'training_date': datetime.utcnow().isoformat() + 'Z',
        'dataset_name': dataset_names,
        'model_version': model_version,
        'best_model': best_model_name,
        'metrics': best_metrics,
        'comparison': comparison_metrics,
        'pipeline_configs': {
            'rf_n_estimators': rf_n_estimators,
            'rf_max_depth': rf_max_depth,
            'random_seed': random_state
        }
    }
    
    metadata_path = os.path.join(models_dir, 'metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    logger.info(f"Training completed successfully in {time.time() - start_time_overall:.2f} seconds.")
    logger.info(f"Model metadata persisted to {metadata_path}")
    
    return metadata

if __name__ == "__main__":
    # Setup simple console logging if run independently
    logging.basicConfig(level=logging.INFO)
    run_training_pipeline()
