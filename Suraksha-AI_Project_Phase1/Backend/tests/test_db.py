import unittest
import os
import shutil
from datetime import datetime
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.settings import Settings
from app.models.attack_log import AttackLog
from app.repositories.user_repository import UserRepository
from app.repositories.attack_repository import AttackRepository
from app.repositories.settings_repository import SettingsRepository
from app.utils.validation import (
    validate_email,
    validate_password,
    validate_payload_size,
    validate_url,
    validate_http_method
)
from scripts.backup_db import backup_database
from scripts.restore_db import restore_database

class SurakshaDbTestCase(unittest.TestCase):
    """Unit and integration test suite validating database schemas, repositories, and validations."""

    def setUp(self):
        # Configure app to run under a separate test database file
        from app.config.settings import Config
        class TestDbConfig(Config):
            TESTING = True
            DEBUG = False
            LOG_LEVEL = "ERROR"
            # Separate test database file
            test_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test_suraksha.db'))
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{test_db_path}"

        self.app = create_app(TestDbConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Build schema clean
        db.create_all()

    def tearDown(self):
        # Tear down database session and delete test file
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
        
        test_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test_suraksha.db'))
        if os.path.exists(test_db_path):
            try:
                os.remove(test_db_path)
            except PermissionError:
                pass

    def test_user_repository_crud(self):
        """Assert UserRepository create, read, update, delete operations."""
        repo = UserRepository()
        
        # 1. Create
        user = repo.create(
            name="Test User",
            email="test@suraksha.ai",
            password_hash="mock_hash_value",
            role="Operator"
        )
        self.assertIsNotNone(user.id)
        self.assertEqual(user.name, "Test User")
        
        # 2. Read by email
        fetched = repo.find_by_email("test@suraksha.ai")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.name, "Test User")

        # 3. Read by UUID
        uuid_fetched = repo.get_by_uuid(user.uuid)
        self.assertEqual(uuid_fetched.id, user.id)
        
        # 4. Update
        updated = repo.update_by_uuid(user.uuid, name="Updated User Name", role="Superuser")
        self.assertEqual(updated.name, "Updated User Name")
        self.assertEqual(updated.role, "Superuser")
        
        # 5. Search
        search_res = repo.search("Updated")
        self.assertEqual(search_res.total, 1)
        self.assertEqual(search_res.items[0].name, "Updated User Name")

        # 6. Delete
        repo.delete_by_uuid(user.uuid)
        self.assertNull = repo.find_by_email("test@suraksha.ai")

    def test_attack_repository_filters(self):
        """Assert AttackRepository filtering, search, and pagination."""
        repo = AttackRepository()
        
        # Add sample attack logs
        repo.create(
            client_ip="192.168.1.100",
            method="POST",
            url="/api/login",
            payload="UNION SELECT",
            prediction="SQL Injection",
            confidence=99.5,
            risk_score=99.5,
            status="Blocked",
            blocked=True,
            threat_level="Critical",
            response_time=12.5
        )
        repo.create(
            client_ip="10.0.0.5",
            method="GET",
            url="/api/items",
            payload="normal_query",
            prediction="Safe",
            confidence=98.0,
            risk_score=1.5,
            status="Allowed",
            blocked=False,
            threat_level="Low",
            response_time=5.0
        )

        # Filter by Blocked status
        res_blocked = repo.search_and_filter(status="Blocked")
        self.assertEqual(len(res_blocked.items), 1)
        self.assertEqual(res_blocked.items[0].client_ip, "192.168.1.100")

        # Filter by Threat level
        res_critical = repo.search_and_filter(threat_level="Critical")
        self.assertEqual(len(res_critical.items), 1)

        # Keyword search
        res_search = repo.search_and_filter(search_q="login")
        self.assertEqual(len(res_search.items), 1)

    def test_settings_repository_singleton(self):
        """Assert SettingsRepository maintains a single system config state."""
        repo = SettingsRepository()
        
        # Get settings (should create default record)
        settings = repo.get_settings()
        self.assertIsNotNone(settings)
        self.assertEqual(settings.theme, "Midnight Theme")

        # Update
        updated = repo.update_settings(theme="Terminal Light", emailAlerts=False)
        self.assertEqual(updated.theme, "Terminal Light")
        self.assertEqual(updated.email_alerts, False)

        # Retrieve again and check persistence
        fetched = repo.get_settings()
        self.assertEqual(fetched.theme, "Terminal Light")
        self.assertEqual(fetched.email_alerts, False)

    def test_validators(self):
        """Assert field validations constraints behave correctly."""
        # 1. Email validation
        self.assertTrue(validate_email("operator@suraksha.ai")[0])
        self.assertFalse(validate_email("operatorsuraksha.ai")[0])
        self.assertFalse(validate_email("operator@")[0])

        # 2. Password validation (min 8 chars, 1 letter, 1 number)
        self.assertTrue(validate_password("securePass1")[0])
        self.assertFalse(validate_password("weak")[0]) # length
        self.assertFalse(validate_password("lettersOnly")[0]) # no number
        self.assertFalse(validate_password("12345678")[0]) # no letter

        # 3. Payload size validation (max 64KB)
        self.assertTrue(validate_payload_size("SELECT * FROM users;")[0])
        large_payload = "A" * (65 * 1024) # 65 KB
        self.assertFalse(validate_payload_size(large_payload, max_kb=64)[0])

        # 4. URL Validation
        self.assertTrue(validate_url("/api/v1/auth")[0])
        self.assertTrue(validate_url("http://localhost:5000/api")[0])
        self.assertFalse(validate_url("not_a_valid_url_scheme://test")[0])

        # 5. HTTP Method Validation
        self.assertTrue(validate_http_method("GET")[0])
        self.assertTrue(validate_http_method("post")[0])
        self.assertFalse(validate_http_method("INVALID_METHOD")[0])

    def test_backup_restore_scripts(self):
        """Assert database backup and restoration routines succeed."""
        # Create a temporary source db file inside the workspace
        scripts_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(scripts_dir)
        
        temp_db = os.path.join(project_root, 'suraksha.db')
        temp_backup_dir = os.path.join(project_root, 'backups')
        
        # Backup currently created live db if exists
        live_db_existed = os.path.exists(temp_db)
        if not live_db_existed:
            # Touch temp database file to test backup
            with open(temp_db, 'w') as f:
                f.write("mock db contents")

        # Run backup
        backup_success = backup_database()
        self.assertTrue(backup_success)

        # Run restore
        restore_success = restore_database()
        self.assertTrue(restore_success)

        # Cleanup test generated files
        if not live_db_existed:
            if os.path.exists(temp_db):
                os.remove(temp_db)

        # Clean backup dir
        if os.path.exists(temp_backup_dir):
            for file in os.listdir(temp_backup_dir):
                if file.startswith("suraksha_backup_"):
                    try:
                        os.remove(os.path.join(temp_backup_dir, file))
                    except PermissionError:
                        pass

if __name__ == '__main__':
    unittest.main()
