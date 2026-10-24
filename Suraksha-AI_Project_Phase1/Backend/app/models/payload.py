from datetime import datetime
from app.extensions import db

class Payload(db.Model):
    __tablename__ = 'payloads'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    payload = db.Column(db.Text, nullable=False)
    difficulty = db.Column(db.String(50), nullable=False)  # low, medium, high, critical
    category = db.Column(db.String(100), nullable=False)  # e.g. SQL Injection
    mutation_level = db.Column(db.Integer, default=0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    attack_logs = db.relationship('AttackLog', back_populates='payload_rel')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "payload": self.payload,
            "difficulty": self.difficulty,
            "category": self.category,
            "mutation_level": self.mutation_level,
            "created_at": self.created_at.isoformat() + 'Z' if self.created_at else None
        }
