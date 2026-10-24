import uuid
from datetime import datetime
from app.extensions import db

class Report(db.Model):
    __tablename__ = 'reports'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    report_name = db.Column(db.String(255), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)  # Daily, Weekly, Monthly
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(255), nullable=True)

    # Relationships
    user = db.relationship('User', back_populates='reports')

    def to_dict(self):
        return {
            "id": self.uuid,
            "name": self.report_name,
            "type": self.report_type,
            "date": self.created_at.strftime('%Y-%m-%d') if self.created_at else None,
            "size": "142 KB" if not self.file_path else "Compiled", # Simulated sizing or metadata
            "attacksCount": 0,  # Computed when generating report details
            "blockedCount": 0,
            "status": "Generated"
        }
