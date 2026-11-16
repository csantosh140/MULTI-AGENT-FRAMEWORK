from flask import Blueprint, request, jsonify
from app import db
from app.models.account import Account, LedgerTransaction
from flask_jwt_extended import jwt_required, get_jwt_identity

account_bp = Blueprint('account', __name__)

@account_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_accounts():
    user_id = get_jwt_identity()
    accounts = Account.query.filter_by(user_id=user_id).all()
    return jsonify([acc.to_dict() for acc in accounts]), 200

@account_bp.route('/', methods=['POST'])
@jwt_required()
def create_account():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    account_number = data.get('accountNumber')
    account_name = data.get('accountName')
    account_type = data.get('accountType', 'Checking')
    balance = data.get('balance', 0.00)
    currency = data.get('currency', 'USD')

    if not account_number or not account_name:
        return jsonify({"message": "Account number and name are required"}), 400

    new_account = Account(
        user_id=user_id,
        account_number=account_number,
        account_name=account_name,
        account_type=account_type,
        balance=balance,
        currency=currency
    )

    db.session.add(new_account)
    db.session.commit()

    return jsonify({"message": "Account created successfully", "account": new_account.to_dict()}), 201

@account_bp.route('/ledger', methods=['GET'])
@jwt_required()
def get_ledger_transactions():
    transactions = LedgerTransaction.query.order_by(LedgerTransaction.timestamp.desc()).limit(50).all()
    return jsonify([tx.to_dict() for tx in transactions]), 200

@account_bp.route('/ledger', methods=['POST'])
@jwt_required()
def add_ledger_transaction():
    data = request.get_json() or {}

    source_account = data.get('sourceAccount')
    destination_entity = data.get('destinationEntity')
    volume_amount = data.get('volumeAmount')
    clearance_type = data.get('clearanceType', 'FEDWIRE INSTANT')
    execution_status = data.get('executionStatus', 'Completed')

    if not source_account or not destination_entity or volume_amount is None:
        return jsonify({"message": "Missing required transaction fields"}), 400

    new_tx = LedgerTransaction(
        source_account=source_account,
        destination_entity=destination_entity,
        volume_amount=volume_amount,
        clearance_type=clearance_type,
        execution_status=execution_status
    )

    db.session.add(new_tx)
    db.session.commit()

    return jsonify({"message": "Transaction recorded", "transaction": new_tx.to_dict()}), 201
