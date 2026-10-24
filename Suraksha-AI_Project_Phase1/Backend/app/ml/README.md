# Suraksha-AI ML SQL Injection Detection Engine

This module implements a production-ready Machine Learning detection engine for SQL Injection (SQLi) attacks. It consists of a preprocessing pipeline, character-level TF-IDF feature extraction, and three classifiers: Random Forest, Support Vector Machine (SVM), and a Logistic Regression baseline. The engine automatically selects the best performing model.

---

## 1. Folder Structure

```text
Backend/app/ml/
├── README.md               # This documentation
├── datasets/               # SQLi training and test payloads
│   ├── raw/                # Contains source CSV datasets (e.g. default_dataset.csv)
│   ├── processed/          # Contains cached processed data outputs
│   ├── train/              # Contains active train set split split CSVs
│   └── test/               # Contains active test set split split CSVs
├── evaluation/             # PNG charts (ROC curve, confusion matrix, PR curve, etc.)
│   ├── confusion_matrix.png
│   ├── roc_curve.png
│   ├── precision_recall_curve.png
│   └── feature_importance.png
├── lstm/                   # Future LSTM integration slots (Placeholder code structure)
│   ├── dataset_prep.py
│   ├── tokenizer.py
│   ├── padding.py
│   ├── model.py
│   ├── train.py
│   └── predict.py
├── models/                 # Serialized model joblib binaries
│   ├── tfidf.pkl           # TF-IDF vectorizer pkl
│   ├── random_forest.pkl
│   ├── logistic.pkl
│   ├── svm.pkl
│   ├── best_model.pkl      # Hard copy of selected best model
│   └── metadata.json       # Metrics, training date, version, dataset info
├── prediction/
│   └── predict.py          # Cached MLPredictionEngine singleton
├── training/
│   └── train.py            # Model training & comparison pipeline
└── utils/
    ├── features.py         # TF-IDF SQLi feature configuration
    ├── generate_default_dataset.py
    └── preprocessing.py    # URL/HTML/Regex data cleaning pipeline
```

---

## 2. Dataset Format

Datasets are expected in **CSV** format under `Backend/app/ml/datasets/raw/`. Multiple CSV datasets will automatically be concatenated during training.

### Expected Columns
*   `payload` (text): The raw parameter string or SQL query.
*   `label` (integer):
    *   `0` = Safe request parameter.
    *   `1` = SQL Injection exploit.

Example:
```csv
payload,label
hello world,0
"1' UNION SELECT null, username, password FROM users --",1
```

---

## 3. Training & Model Selection

To run model training manually:
```bash
python -m app.ml.training.train
```

### Process Lifecycle
1.  **Load Datasets**: Loads all CSV files from `datasets/raw/`.
2.  **Clean & Validate**: Normalizes the payloads using the preprocessing pipeline (URL decode, HTML decode, lowercase, whitespace consolidation, duplicate removal, invalid label filtering).
3.  **Feature Extraction**: Fits the TF-IDF Vectorizer to extract character-level ngrams (`1-3` char blocks). Saves to `tfidf.pkl`.
4.  **Train Models**: Fits the configured models (Random Forest, SVM, Logistic Regression).
5.  **Evaluate & Select**: Evaluates F1 Score, Accuracy, Precision, Recall, ROC AUC, Training time, and Prediction time on an 80/20 test split. Compares models, copies the highest F1-score winner to `best_model.pkl`, and writes performance metrics to `metadata.json`.
6.  **Plots**: Generates metrics charts in `evaluation/`.

---

## 4. Prediction & Risk Classification

The prediction engine is implemented as a singleton (`MLPredictionEngine` in `prediction/predict.py`). It caches the vectorizer and the best model in memory on Flask server startup to ensure sub-millisecond inference times without loading pkl files per request.

### Risk Mapping
Probability scores (from 0 to 100) are classified into the following severity buckets:
*   **0–25**: `SAFE`
*   **26–50**: `LOW`
*   **51–75**: `MEDIUM`
*   **76–100**: `HIGH`

---

## 5. REST APIs

All routes are registered under the `/api` blueprint:

### 1. Predict Single Payload
*   **Endpoint**: `POST /api/ml/predict`
*   **Request JSON**:
    ```json
    { "payload": "1' OR '1'='1" }
    ```
*   **Response JSON**:
    ```json
    {
      "success": true,
      "message": "ML classification completed successfully.",
      "data": {
        "prediction": 1,
        "confidence": 99.8,
        "risk_level": "HIGH",
        "probability": 0.998,
        "processing_time": 0.0012
      },
      "status_code": 200
    }
    ```

### 2. Batch Predict Uploaded CSV
*   **Endpoint**: `POST /api/ml/batch`
*   **Request Type**: Multipart Form-Data
*   **Param**: `file` (a CSV file with a `payload` column)
*   **Response JSON**:
    ```json
    {
      "success": true,
      "message": "Batch prediction completed for 2 rows.",
      "data": {
        "predictions": [
          {
            "payload": "hello world",
            "prediction": 0,
            "confidence": 100.0,
            "risk_level": "SAFE",
            "probability": 0.0
          },
          {
            "payload": "1' OR 1=1",
            "prediction": 1,
            "confidence": 100.0,
            "risk_level": "HIGH",
            "probability": 1.0
          }
        ]
      },
      "status_code": 200
    }
    ```

### 3. Model Information
*   **Endpoint**: `GET /api/ml/model`
*   **Response JSON**:
    ```json
    {
      "success": true,
      "message": "Active model metadata retrieved successfully.",
      "data": {
        "Current Model": "Random Forest",
        "Version": "1.0.0",
        "Accuracy": 1.0,
        "Training Date": "2026-08-02T06:06:12Z",
        "Dataset": "default_dataset.csv"
      },
      "status_code": 200
    }
    ```

### 4. Retraining Trigger
*   **Endpoint**: `POST /api/ml/train`
*   **Response JSON**:
    ```json
    {
      "success": true,
      "message": "Model retraining and selection completed successfully. Active model refreshed.",
      "data": {
        "best_model": "Random Forest",
        "metrics": {
          "accuracy": 1.0,
          "f1_score": 1.0,
          ...
        }
      },
      "status_code": 200
    }
    ```

---

## 6. Testing

To run the unit test suite:
```bash
python -m unittest tests/test_ml.py
```
