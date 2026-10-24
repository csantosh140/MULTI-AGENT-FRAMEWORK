from datetime import datetime
from app.extensions import db

class ThreatAnalytics(db.Model):
    __tablename__ = 'threat_analytics'

    id = db.Column(db.Integer, primary_key=True)
    attack_type = db.Column(db.String(100), nullable=False, unique=True)
    count = db.Column(db.Integer, default=0, nullable=False)
    last_seen = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    severity = db.Column(db.String(50), nullable=False, index=True)  # Low, Medium, High, Critical
    average_confidence = db.Column(db.Float, default=0.0, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "attack_type": self.attack_type,
            "count": self.count,
            "last_seen": self.last_seen.isoformat() + 'Z' if self.last_seen else None,
            "severity": self.severity,
            "average_confidence": self.average_confidence
        }
