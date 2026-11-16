import json
from app.extensions import db

class Settings(db.Model):
    __tablename__ = 'settings'

    id = db.Column(db.Integer, primary_key=True)
    theme = db.Column(db.String(50), default='Midnight Theme')
    notification_enabled = db.Column(db.Boolean, default=True)
    dashboard_refresh = db.Column(db.Integer, default=5)  # in seconds
    api_timeout = db.Column(db.Integer, default=10)  # in seconds

    # Compatibility properties for current React frontend and settings blueprint
    email_alerts = db.Column(db.Boolean, default=True)
    block_popups = db.Column(db.Boolean, default=True)
    ban_threshold = db.Column(db.Integer, default=95)
    dvwa_url = db.Column(db.String(255), default='http://localhost/dvwa')
    active_model = db.Column(db.String(50), default='lstm')
    smtp_server = db.Column(db.String(255), default='smtp.suraksha.ai')

    # New field for dynamic remediation rules
    dynamic_rules = db.Column(db.Text, default='[]') # Stored as JSON string

    def __init__(self, **kwargs):
        super(Settings, self).__init__(**kwargs)
        if 'dynamic_rules' not in kwargs:
            self.dynamic_rules = json.dumps([])

    @property
    def parsed_dynamic_rules(self):
        try:
            return json.loads(self.dynamic_rules) if self.dynamic_rules else []
        except Exception:
            return []

    @parsed_dynamic_rules.setter
    def parsed_dynamic_rules(self, value):
        self.dynamic_rules = json.dumps(value)

    def to_dict(self):
        return {
            "emailAlerts": self.email_alerts,
            "blockPopups": self.block_popups,
            "banThreshold": self.ban_threshold,
            "dvwaUrl": self.dvwa_url,
            "activeModel": self.active_model,
            "smtpServer": self.smtp_server,
            "theme": self.theme,
            "notificationEnabled": self.notification_enabled,
            "dashboardRefresh": self.dashboard_refresh,
            "apiTimeout": self.api_timeout,
            "dynamicRules": self.parsed_dynamic_rules
        }
