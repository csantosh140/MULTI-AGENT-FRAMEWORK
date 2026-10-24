from app.models.settings import Settings
from app.repositories.base_repository import BaseRepository
from app.extensions import db

class SettingsRepository(BaseRepository):
    def __init__(self):
        super().__init__(Settings)

    def get_settings(self):
        """Retrieves the system settings. Creates a default record if none exists."""
        settings = self.model.query.first()
        if not settings:
            settings = self.model()
            db.session.add(settings)
            db.session.commit()
        return settings

    def update_settings(self, **kwargs):
        """Updates the system settings record."""
        settings = self.get_settings()
        try:
            for key, value in kwargs.items():
                # Map camelCase from JSON payload to snake_case in SQLAlchemy
                mapped_key = key
                if key == 'emailAlerts': mapped_key = 'email_alerts'
                elif key == 'blockPopups': mapped_key = 'block_popups'
                elif key == 'banThreshold': mapped_key = 'ban_threshold'
                elif key == 'dvwaUrl': mapped_key = 'dvwa_url'
                elif key == 'activeModel': mapped_key = 'active_model'
                elif key == 'smtpServer': mapped_key = 'smtp_server'
                elif key == 'notificationEnabled': mapped_key = 'notification_enabled'
                elif key == 'dashboardRefresh': mapped_key = 'dashboard_refresh'
                elif key == 'apiTimeout': mapped_key = 'api_timeout'

                if hasattr(settings, mapped_key):
                    # Ensure correct typing
                    expected_type = type(getattr(settings, mapped_key))
                    if expected_type == bool:
                        setattr(settings, mapped_key, bool(value))
                    elif expected_type == int:
                        setattr(settings, mapped_key, int(value))
                    else:
                        setattr(settings, mapped_key, str(value))
            db.session.commit()
            return settings
        except Exception as e:
            db.session.rollback()
            raise e

    def search(self, query_string, page=1, per_page=10):
        """No search required for settings, return paginated settings."""
        query = self.model.query
        return self.paginate(query, page, per_page)
