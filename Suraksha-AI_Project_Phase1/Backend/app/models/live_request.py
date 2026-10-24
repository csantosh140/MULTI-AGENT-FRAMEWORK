import uuid
from datetime import datetime
from app.extensions import db

class LiveRequest(db.Model):
    __tablename__ = 'live_requests'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    method = db.Column(db.String(10), nullable=False)
    url = db.Column(db.Text, nullable=False)
    payload = db.Column(db.Text, nullable=True)
    decision = db.Column(db.String(50), nullable=False)  # Allowed, Blocked, Logged
    confidence = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.uuid,
            "timestamp": self.timestamp.isoformat() + 'Z' if self.timestamp else None,
            "method": self.method,
            "url": self.url,
            "payload": self.payload or "",
            "riskScore": round(100.0 - self.confidence, 2) if self.decision == "Allowed" else round(self.confidence, 2),
            "decision": self.decision
        }
