# Advanced Hybrid SQL Injection Detection Engine - Suraksha-AI

This module implements a state-of-the-art hybrid SQL Injection (SQLi) detection framework combining signature checks, machine learning ensembles, and real-time response delay/database error behavior analyzers.

---

## 1. Directory Structure

```text
Backend/ai/
├── datasets/               # SQLi raw, processed, and validation splits
│   └── raw/                # Bootstrapped dataset (dataset.csv)
├── preprocessing/          # URL/Hex/Base64/Unicode normalization
│   └── normalizer.py       # PayloadNormalizer and stats extractor
├── vectorizers/            # Dual TF-IDF n-grams feature builders
│   └── feature_extractor.py
├── predictors/             # Random Forest, Gradient Boosting, XGBoost, LSTM
│   ├── ensemble.py         # Weighted ensemble predictor
│   └── lstm_fallback.py    # character-level fallback classifier
├── training/               # Model fitting engine
│   └── train.py
├── models/                 # joblib serialized models and vectorizer state
│   ├── random_forest.pkl
│   ├── gradient_boosting.pkl
│   ├── xgboost.pkl
│   ├── lstm.keras
│   ├── tfidf_char.pkl
│   ├── tfidf_word.pkl
│   └── metadata.json
├── evaluation/             # Metrics reports and charts
│   └── confusion_matrix.png
└── utils/                  # Behavioral and rule triggers
    ├── rule_engine.py      # Regex signatures rules engine
    ├── error_detector.py   # Database error regex parser
    ├── blind_detector.py   # HTML/DOM/Length comparison detector
    ├── time_detector.py    # Latency correlation detector
    ├── oob_detector.py     # Out-of-band request commands scanner
    └── second_order.py     # Stateful session correlation store
```

---

## 2. Advanced Feature Engineering

We train the model using a combination of sparse textual matrices and tabular statistical properties:
1.  **Character N-grams**: TF-IDF fit on characters with n-gram sizes `(3, 5)` to extract sub-string SQL syntactic markers.
2.  **Word N-grams**: TF-IDF fit on words with n-gram sizes `(1, 3)` to detect command patterns.
3.  **Numerical Statistics**: Concatenated vectors representing:
    *   Payload raw length and normalized length.
    *   Shannon Entropy of characters.
    *   Special characters, digits, and whitespace frequencies.
    *   SQL comments (`--`, `#`, `/*`, `*/`), operators, and keywords frequencies.

---

## 3. Hybrid Ensemble Predictors

The engine loads and caches four models once at server startup to execute sub-millisecond voting classifications:
*   **Model 1 (Random Forest)**: Configured with 100 trees, high-speed parallel estimation.
*   **Model 2 (Gradient Boosting)**: Sequential boosting trees.
*   **Model 3 (XGBoost)**: Fast extreme gradient boosting model.
*   **Model 4 (LSTM Character Fallback)**: Multi-layer character tokenizer and neural classifier mimicking an LSTM recurrent net, avoiding wheel compilation issues in Windows environments running Python 3.14.

### Voting Weights
The final ML score is calculated by the weighted voting formula:
$$\text{ML Probability} = 0.35 \times P_{\text{RF}} + 0.25 \times P_{\text{GB}} + 0.25 \times P_{\text{XGB}} + 0.15 \times P_{\text{LSTM}}$$

---

## 4. Behavioral Analyzers

Beyond static machine learning, the engine inspects live contexts:
-   **Time-Based**: Correlates delay indicators (`SLEEP()`, `pg_sleep()`, `WAITFOR DELAY`, `BENCHMARK()`) with the server's actual `Response Time` to raise alarm severity.
-   **Error-Based**: Scans response HTML for SQLite, MySQL, Postgres, MSSQL, or Oracle exceptions to extract the leaked database type.
-   **Out-of-Band (OOB)**: Detects triggers attempting network lookup callbacks (`UTL_HTTP`, `xp_dirtree`, `OPENROWSET`, `LOAD_FILE`).
-   **Second-Order**: Stateful correlation session register to check if previous parameters are loaded on subsequent rendering views.

---

## 5. REST APIs

All routes are integrated in Flask under the `/api` prefix:

### 1. Hybrid Prediction
*   **Endpoint**: `POST /api/detection/predict`
*   **Request JSON**:
    ```json
    {
      "method": "POST",
      "url": "/login",
      "headers": { "User-Agent": "Mozilla" },
      "cookies": { "session_id": "abc_session_123" },
      "parameters": {},
      "body": { "username": "admin' AND SLEEP(5)--" },
      "response_time": 5.01,
      "http_response": "Internal Server Error"
    }
    ```
*   **Response JSON**:
    ```json
    {
      "success": true,
      "message": "Hybrid SQLi threat classification completed successfully.",
      "data": {
        "Attack Type": "Time-Based",
        "Confidence": 95.8,
        "Severity": "Critical",
        "Explanation": "Time-Based SQL Injection detected. SQL Injection signature 'sleep' verified by matching response delay of 5.01s.",
        "Blocked": true
      },
      "status_code": 200
    }
    ```

---

## 6. Retraining Pipeline

To retrain the complete AI detection engine (including dual vectorizers and all 4 classifiers) using updated raw data:
```bash
python -m ai.training.train
```
This updates the serialized models under `models/` and generates the performance chart `evaluation/confusion_matrix.png` and `metadata.json` updates automatically.
