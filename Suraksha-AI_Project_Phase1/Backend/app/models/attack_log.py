import uuid
from datetime import datetime
from app.extensions import db

class AttackLog(db.Model):
    __tablename__ = 'attack_logs'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    client_ip = db.Column(db.String(45), nullable=False)
    method = db.Column(db.String(10), nullable=False)
    url = db.Column(db.Text, nullable=False)
    payload = db.Column(db.Text, nullable=True)
    headers = db.Column(db.Text, nullable=True)  # Store JSON serialized headers
    cookies = db.Column(db.Text, nullable=True)  # Store JSON serialized cookies
    prediction = db.Column(db.String(50), nullable=False, index=True)
    confidence = db.Column(db.Float, nullable=False)
    risk_score = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), nullable=False)  # e.g. Blocked, Logged, Allowed
    blocked = db.Column(db.Boolean, default=False, nullable=False, index=True)
    response_time = db.Column(db.Float, nullable=True)  # in milliseconds
    threat_level = db.Column(db.String(50), nullable=False, index=True)  # Low, Medium, High, Critical

    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    payload_id = db.Column(db.Integer, db.ForeignKey('payloads.id'), nullable=True)

    # Relationships
    user = db.relationship('User', back_populates='attack_logs')
    payload_rel = db.relationship('Payload', back_populates='attack_logs')

    def to_dict(self):
        return {
            "id": self.uuid,
            "time": self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else None,
            "ip": self.client_ip,
            "payload": self.payload or "",
            "threatLevel": self.threat_level,
            "status": self.status,
            "confidence": self.confidence,
            "endpoint": self.url,
            "method": self.method,
            "risk_score": self.risk_score,
            "response_time": self.response_time,
            "blocked": self.blocked
        }
