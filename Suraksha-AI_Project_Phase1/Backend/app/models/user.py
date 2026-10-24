import uuid
from datetime import datetime
from app.extensions import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='Operator')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    reports = db.relationship('Report', back_populates='user', cascade='all, delete-orphan')
    attack_logs = db.relationship('AttackLog', back_populates='user')

    def to_dict(self):
        return {
            "id": self.uuid, # Standardized key output for APIs
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() + 'Z' if self.created_at else None,
            "updated_at": self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            "last_login": self.last_login.isoformat() + 'Z' if self.last_login else None,
            "is_active": self.is_active
        }
