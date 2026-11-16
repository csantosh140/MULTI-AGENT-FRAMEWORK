from app import db
import datetime
import uuid

class Account(db.Model):
    __tablename__ = 'accounts'

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)  # Associated with UserAuthService user id
    account_number = db.Column(db.String(30), unique=True, nullable=False)
    account_name = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)  # e.g., 'Checking', 'Escrow', 'Investment', 'Treasury'
    balance = db.Column(db.Numeric(15, 2), default=0.00, nullable=False)
    currency = db.Column(db.String(3), default='USD', nullable=False)
    status = db.Column(db.String(20), default='Active', nullable=False)  # Active, Frozen, Closed
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "accountId": self.account_id,
            "userId": self.user_id,
            "accountNumber": self.account_number,
            "accountName": self.account_name,
            "accountType": self.account_type,
            "balance": float(self.balance),
            "currency": self.currency,
            "status": self.status,
            "createdAt": self.created_at.isoformat()
        }


class LedgerTransaction(db.Model):
    __tablename__ = 'ledger_transactions'

    id = db.Column(db.Integer, primary_key=True)
    transfer_id = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True, nullable=False)
    source_account = db.Column(db.String(100), nullable=False)
    destination_entity = db.Column(db.String(100), nullable=False)
    volume_amount = db.Column(db.Numeric(15, 2), nullable=False)
    clearance_type = db.Column(db.String(50), nullable=False)  # Fedwire Instant, SWIFT International, ACH Clearance, etc.
    execution_status = db.Column(db.String(20), default='Completed', nullable=False) # Completed, Pending, Failed
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        time_diff = datetime.datetime.utcnow() - self.timestamp
        hours = int(time_diff.total_seconds() // 3600)
        time_str = f"{hours} hours ago" if hours > 0 else "Just now"

        return {
            "transferId": self.transfer_id,
            "sourceAccount": self.source_account,
            "destinationEntity": self.destination_entity,
            "volumeAmount": float(self.volume_amount),
            "clearanceType": self.clearance_type,
            "executionStatus": self.execution_status,
            "timestamp": time_str
        }
