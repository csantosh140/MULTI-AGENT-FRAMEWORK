import os
import sys
from datetime import datetime, timedelta
import random
from werkzeug.security import generate_password_hash

# Ensure root directory is in sys.path to resolve app imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.settings import Settings
from app.models.payload import Payload
from app.models.attack_log import AttackLog
from app.models.live_request import LiveRequest
from app.models.threat_analytics import ThreatAnalytics

def seed_database():
    print("Initializing database seeder...")
    
    # 1. Create Default Admin User
    admin = User.query.filter_by(email="admin@suraksha.ai").first()
    if not admin:
        admin = User(
            name="Admin Director",
            email="admin@suraksha.ai",
            password_hash=generate_password_hash("password123"),
            role="Level-5 (Superuser)",
            is_active=True
        )
        db.session.add(admin)
        print("-> Default admin user created: admin@suraksha.ai / password123")
    else:
        print("-> Admin user already exists.")

    # 2. Create Default settings
    settings = Settings.query.first()
    if not settings:
        settings = Settings(
            theme="Midnight Theme",
            notification_enabled=True,
            dashboard_refresh=5,
            api_timeout=10,
            email_alerts=True,
            block_popups=True,
            ban_threshold=95,
            dvwa_url="http://localhost/dvwa",
            active_model="lstm",
            smtp_server="smtp.suraksha.ai"
        )
        db.session.add(settings)
        print("-> System settings initialized.")
    else:
        print("-> System settings already exist.")

    # 3. Create Standard Payloads
    basic_payloads = [
        ("Classic Tautology", "1' OR '1'='1", "low", "SQL Injection", 0),
        ("Standard Comment Termination", "admin' --", "low", "SQL Injection", 0),
        ("Alternate Tautology", "' OR 1=1 --", "low", "SQL Injection", 0),
        ("Limit Bypass", "1' OR 1=1 LIMIT 1#", "low", "SQL Injection", 0),
        ("Character Comparison Bypass", "' OR 'a'='a", "low", "SQL Injection", 0),
        ("Admin Login Tautology", "admin' OR 1=1#", "low", "SQL Injection", 0)
    ]

    advanced_payloads = [
        ("Union Authentication Bypass", "' UNION SELECT null, username, password FROM users --", "high", "SQL Injection", 0),
        ("Audits Table Drop Vector", "'; DROP TABLE audits; --", "critical", "SQL Injection", 0),
        ("Blind Time Delay Attempt", "1' AND sleep(5)#", "high", "SQL Injection", 0),
        ("System Commands Execution XP", "'; EXEC xp_cmdshell('dir');--", "critical", "SQL Injection", 0),
        ("Complex Schema Extraction Query", "1 AND (SELECT 2215 FROM(SELECT COUNT(*),CONCAT(0x7170,(SELECT (ELT(2215=2215,1))),0x7178,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a)--", "critical", "SQL Injection", 0),
        ("Union Version Query Check", "1' AND 1=2 UNION SELECT NULL, version() --", "high", "SQL Injection", 0)
    ]

    payload_records = []
    for name, p_str, difficulty, category, mutation_level in basic_payloads + advanced_payloads:
        existing = Payload.query.filter_by(payload=p_str).first()
        if not existing:
            p = Payload(
                name=name,
                payload=p_str,
                difficulty=difficulty,
                category=category,
                mutation_level=mutation_level
            )
            db.session.add(p)
            payload_records.append(p)
    print(f"-> Seeded {len(payload_records)} vulnerability payloads.")

    # Flush so database assigns payload IDs for references
    db.session.flush()

    # 4. Create Threat Analytics Distribution Base
    threats = [
        ("Union-Based SQLi", 22119, "Critical", 99.82),
        ("Tautology Login Bypass", 42102, "High", 95.84),
        ("Blind Time Delay Injection", 15890, "Medium", 96.50),
        ("Query Comments Bypass", 4120, "Low", 87.20)
    ]

    for attack_type, count, severity, avg_conf in threats:
        ta = ThreatAnalytics.query.filter_by(attack_type=attack_type).first()
        if not ta:
            ta = ThreatAnalytics(
                attack_type=attack_type,
                count=count,
                severity=severity,
                average_confidence=avg_conf
            )
            db.session.add(ta)
    print("-> Threat Analytics data seeded.")

    # 5. Create Historic Attack Logs
    log_templates = [
        ("198.51.100.42", "UNION SELECT username, password FROM users --", "Critical", "Blocked", 99.92, 98.9, "/api/users/login", "POST"),
        ("203.0.113.195", "1' OR '1'='1", "High", "Blocked", 98.45, 94.2, "/api/products/search", "GET"),
        ("185.220.101.5", "'; DROP TABLE audits; --", "Critical", "Blocked", 99.98, 99.9, "/api/admin/config", "POST"),
        ("45.138.89.22", "1 AND 1=2 UNION SELECT NULL, version()", "High", "Blocked", 97.80, 95.0, "/items/details", "GET")
    ]

    added_logs_count = 0
    now = datetime.utcnow()
    for ip, payload, level, status, conf, score, endpoint, method in log_templates:
        existing = AttackLog.query.filter_by(payload=payload).first()
        if not existing:
            # Match payload ID if available
            p_ref = Payload.query.filter_by(payload=payload).first()
            p_id = p_ref.id if p_ref else None

            log = AttackLog(
                timestamp=now - timedelta(minutes=random.randint(5, 120)),
                client_ip=ip,
                method=method,
                url=endpoint,
                payload=payload,
                headers='{"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}',
                cookies='{"session_id": "test_cookie_data"}',
                prediction="SQL Injection",
                confidence=conf,
                risk_score=score,
                status=status,
                blocked=(status.lower() == 'blocked'),
                response_time=random.uniform(5.0, 25.0),
                threat_level=level,
                payload_id=p_id
            )
            db.session.add(log)
            added_logs_count += 1
    print(f"-> Seeded {added_logs_count} sample attack logs.")

    # 6. Create Live Request Monitoring Items
    req_templates = [
        ("GET", "/api/v1/products?category=electronics", "category=electronics", "Allowed", 99.5),
        ("GET", "/api/v1/users/profile?id=42%20UNION%20SELECT%20null,password%20FROM%20users", "id=42 UNION SELECT null,password FROM users", "Blocked", 98.6),
        ("POST", "/api/v1/feedback", '{"name":"Alice","comment":"Great dashboard!"}', "Allowed", 99.0),
        ("GET", "/api/v1/search?term=%27%3B%20WAITFOR%20DELAY%20%270%3A0%3A5%27%20--", "term='; WAITFOR DELAY '0:0:5' --", "Blocked", 99.4)
    ]

    added_req_count = 0
    for method, url, payload, decision, conf in req_templates:
        existing = LiveRequest.query.filter_by(url=url, payload=payload).first()
        if not existing:
            lr = LiveRequest(
                timestamp=now - timedelta(seconds=random.randint(10, 300)),
                method=method,
                url=url,
                payload=payload,
                decision=decision,
                confidence=conf
            )
            db.session.add(lr)
            added_req_count += 1
    print(f"-> Seeded {added_req_count} sample live requests.")

    try:
        db.session.commit()
        print("Database seeding completed successfully.")
    except Exception as e:
        db.session.rollback()
        print(f"FAILED to seed database: {str(e)}")

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        seed_database()
