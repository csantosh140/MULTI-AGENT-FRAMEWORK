# Suraksha-AI Backend Services

Agentic AI Powered Autonomous SQL Injection Detection and Prevention Framework.

This is a production-ready Flask REST API implementation built on Python 3.11 with central exception trapping, custom middleware logging, and JWT session handling.

---

## Folder Structure

```
backend/
├── app/
│   ├── __init__.py          # App Factory, registers CORS, JWT, error routes
│   ├── config/
│   │   └── settings.py      # Env configuration loader
│   ├── middleware/
│   │   └── logger.py        # HTTP request-level logging middleware
│   ├── routes/              # Blueprint APIs
│   │   ├── auth.py          # Operator logins & profile checks
│   │   ├── dashboard.py     # Aggregated security statistics counters
│   │   ├── logs.py          # Threat history CRUD list
│   │   ├── monitor.py       # Live and history packet intercept streams
│   │   ├── reports.py       # Daily/weekly/monthly audit summaries compile
│   │   ├── settings.py      # GET/PUT operational thresholds settings
│   │   ├── health.py        # Service health checks and uptime
│   │   ├── payload.py       # Mutated SQLi exploit string compiler
│   │   └── detection.py     # SQLi detection rules validator
│   ├── services/            # Core processing layers
│   │   ├── auth_service.py
│   │   ├── detection_service.py
│   │   └── payload_service.py
│   └── utils/
│       └── helpers.py       # Standard JSON response wrappers and datetime hooks
├── logs/
│   └── app.log              # Automatically appended HTTP request logging database
├── tests/
│   └── test_api.py          # Comprehensive API endpoint verification suite
├── .env                     # Session and port environment configurations
├── requirements.txt         # Dependency listings
├── run.py                   # App startup shell entry point
└── README.md                # Endpoint documentation
```

---

## Requirements & Setup

### 1. Requirements Installation
Ensure Python 3.11 is installed, then install packages:
```bash
pip install -r requirements.txt
```

### 2. Configure Settings
Add configurations to your local `.env` file (already created with sensible defaults):
```env
SECRET_KEY=suraksha_super_secret_session_key_98765
JWT_SECRET_KEY=suraksha_jwt_signing_token_key_abcdef
PORT=5000
DEBUG=True
DVWA_URL=http://localhost/dvwa
LOG_LEVEL=INFO
```

### 3. Run Automated Tests
Verify all API routes:
```bash
python -m unittest tests/test_api.py
```

### 4. Running the Dev Server
Launch the Flask development server:
```bash
python run.py
```
The server will bind to `http://localhost:5000`.

---

## API Documentation & Example Requests

Every API returns a standardized JSON response envelope:
```json
{
  "success": true,
  "message": "Information description text",
  "data": {},
  "timestamp": "2026-08-01T17:15:32Z",
  "status_code": 200
}
```

### 1. Health Status
- **Endpoint**: `GET /api/health`
- **Auth Required**: No
- **Curl Example**:
  ```bash
  curl -X GET http://localhost:5000/api/health
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "Suraksha-AI operations engine active.",
    "data": {
      "status": "Healthy",
      "uptime": "0d 0h 1m 15s",
      "version": "1.0.0-Beta"
    },
    "status_code": 200
  }
  ```

### 2. Operator Register
- **Endpoint**: `POST /api/auth/register`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Security Agent",
    "email": "agent@suraksha.ai",
    "password": "securepassword"
  }
  ```
- **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name": "Security Agent", "email": "agent@suraksha.ai", "password": "securepassword"}'
  ```

### 3. Operator Authentication (Login)
- **Endpoint**: `POST /api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "admin@suraksha.ai",
    "password": "password123"
  }
  ```
- **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@suraksha.ai", "password": "password123"}'
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "Verification granted. Session initialized.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "email": "admin@suraksha.ai",
        "name": "Admin Director"
      }
    },
    "status_code": 200
  }
  ```

### 4. Vulnerability Detection Scanner
- **Endpoint**: `POST /api/detection/check`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "url": "/search",
    "payload": "1' UNION SELECT null, username, password FROM users --"
  }
  ```
- **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/detection/check \
    -H "Authorization: Bearer <JWT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"url": "/search", "payload": "1\x27 UNION SELECT null, username, password FROM users --"}'
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "Request packets checks complete.",
    "data": {
      "confidence": 99.9,
      "prediction": "SQL Injection",
      "risk_score": 99.8,
      "threat_level": "Critical",
      "reason": "[Payload Parameter] Union-Based SQLi schema extraction vector detected."
    },
    "status_code": 200
  }
  ```

### 5. Payload Generator
- **Endpoint**: `POST /api/payload/generate`
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
    "payload_type": "basic",
    "mutation_level": 2
  }
  ```
- **Curl Example**:
  ```bash
  curl -X POST http://localhost:5000/api/payload/generate \
    -H "Authorization: Bearer <JWT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"payload_type": "basic", "mutation_level": 2}'
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "SQL exploit payload compiled successfully.",
    "data": {
      "payload": "1'/**/OR/**/'1'='1"
    },
    "status_code": 200
  }
  ```

### 6. Incident Logs CRUD
- **Endpoints**:
  - `GET /api/logs` - List all attack logs (supports `?search=IP&level=High`)
  - `GET /api/logs/{id}` - Inspect single log
  - `POST /api/logs` - Log a new threat
  - `DELETE /api/logs/{id}` - Delete log by ID
- **Auth Required**: Yes (Bearer Token)

---

## Database Architecture & Utilities

This application integrates a real **SQLite** database (`suraksha.db` in the project root) mapped using **SQLAlchemy ORM** and configured with **Flask-Migrate** for database schema version control.

### How the Database Works
- The database is bootstrapped automatically on first run. If `suraksha.db` does not exist, the app factory will create it and execute all schema migration updates.
- All mock endpoints are fully replaced with SQLAlchemy queries, repositories, and strict validators.
- Default settings and a default superuser account (`admin@suraksha.ai` / `password123`) are auto-seeded on boot.

### Migration Commands
The project is configured with `Flask-Migrate`. To manage database migrations, run the following commands in the backend directory:
- **Initialize Migrations Workspace**:
  ```bash
  python -m flask db init
  ```
- **Generate Migration Scripts**:
  ```bash
  python -m flask db migrate -m "description of changes"
  ```
- **Apply/Upgrade Migration Schema**:
  ```bash
  python -m flask db upgrade
  ```
- **Downgrade Migration Schema**:
  ```bash
  python -m flask db downgrade
  ```

### Database Seeder
To populate the database with sample attack logs, live requests templates, test payloads, threat analytics distributions, and default system settings:
```bash
python scripts/seed_db.py
```

### Database Reset
To drop all database tables, recreate the schema structure clean, and execute the seeder:
```bash
python scripts/reset_db.py
```

### Database Backup
To save a compressed timestamped copy of the current database:
```bash
python scripts/backup_db.py
```
All backup files are preserved inside the `backups/` directory.

### Database Restore
To restore the live database from a previous backup snapshot:
```bash
# Restore using the latest available backup copy
python scripts/restore_db.py

# Restore using a targeted backup file name
python scripts/restore_db.py suraksha_backup_YYYYMMDD_HHMMSS.db
```
