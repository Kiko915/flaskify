from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from models import db, SellerInfo, SellerTransaction, BankAccount, Withdrawal, Order
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import uuid

seller_finance = Blueprint('seller_finance', __name__)

@seller_finance.route('/api/seller/income', methods=['GET'])
@login_required
def get_seller_income():
    seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
    if not seller:
        return jsonify({'error': 'Seller not found'}), 404

    # Get income statistics
    total_income = db.session.query(func.sum(SellerTransaction.amount))\
        .filter(SellerTransaction.seller_id == seller.seller_id,
                SellerTransaction.type == 'order',
                SellerTransaction.status == 'completed')\
        .scalar() or 0

    # Get monthly income
    current_date = datetime.utcnow()
    start_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_income = db.session.query(func.sum(SellerTransaction.amount))\
        .filter(SellerTransaction.seller_id == seller.seller_id,
                SellerTransaction.type == 'order',
                SellerTransaction.status == 'completed',
                SellerTransaction.created_at >= start_of_month)\
        .scalar() or 0

    # Get recent transactions
    recent_transactions = SellerTransaction.query\
        .filter_by(seller_id=seller.seller_id)\
        .order_by(desc(SellerTransaction.created_at))\
        .limit(10)\
        .all()

    return jsonify({
        'total_income': float(total_income),
        'monthly_income': float(monthly_income),
        'recent_transactions': [tx.to_dict() for tx in recent_transactions]
    })

@seller_finance.route('/api/seller/balance', methods=['GET'])
@login_required
def get_seller_balance():
    seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
    if not seller:
        return jsonify({'error': 'Seller not found'}), 404

    # Calculate total income
    total_income = db.session.query(func.sum(SellerTransaction.amount))\
        .filter(SellerTransaction.seller_id == seller.seller_id,
                SellerTransaction.type == 'order',
                SellerTransaction.status == 'completed')\
        .scalar() or 0

    # Calculate total withdrawals
    total_withdrawals = db.session.query(func.sum(Withdrawal.amount))\
        .filter(Withdrawal.seller_id == seller.seller_id,
                Withdrawal.status == 'completed')\
        .scalar() or 0

    # Calculate available balance
    available_balance = float(total_income) - float(total_withdrawals)

    # Get pending withdrawals
    pending_withdrawals = Withdrawal.query\
        .filter_by(seller_id=seller.seller_id, status='pending')\
        .all()

    return jsonify({
        'available_balance': available_balance,
        'total_income': float(total_income),
        'total_withdrawals': float(total_withdrawals),
        'pending_withdrawals': [w.to_dict() for w in pending_withdrawals]
    })

@seller_finance.route('/api/seller/bank-accounts', methods=['GET'])
@login_required
def get_bank_accounts():
    seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
    if not seller:
        return jsonify({'error': 'Seller not found'}), 404

    bank_accounts = BankAccount.query.filter_by(seller_id=seller.seller_id).all()
    return jsonify([account.to_dict() for account in bank_accounts])

@seller_finance.route('/api/seller/bank-accounts', methods=['POST'])
@login_required
def add_bank_account():
    seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
    if not seller:
        return jsonify({'error': 'Seller not found'}), 404

    data = request.get_json()
    
    # Validate required fields
    required_fields = ['bank_name', 'account_name', 'account_number']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    # Create new bank account
    bank_account = BankAccount(
        account_uuid=str(uuid.uuid4()),
        seller_id=seller.seller_id,
        bank_name=data['bank_name'],
        account_name=data['account_name'],
        account_number=data['account_number'],
        branch=data.get('branch'),
        is_primary=not BankAccount.query.filter_by(seller_id=seller.seller_id).first()
    )

    db.session.add(bank_account)
    db.session.commit()

    return jsonify(bank_account.to_dict()), 201

@seller_finance.route('/api/seller/withdraw', methods=['POST'])
@login_required
def request_withdrawal():
    seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
    if not seller:
        return jsonify({'error': 'Seller not found'}), 404

    data = request.get_json()
    
    # Validate required fields
    if 'amount' not in data or 'bank_account_uuid' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Verify bank account belongs to seller
    bank_account = BankAccount.query.filter_by(
        account_uuid=data['bank_account_uuid'],
        seller_id=seller.seller_id
    ).first()
    if not bank_account:
        return jsonify({'error': 'Invalid bank account'}), 400

    # Check available balance
    total_income = db.session.query(func.sum(SellerTransaction.amount))\
        .filter(SellerTransaction.seller_id == seller.seller_id,
                SellerTransaction.type == 'order',
                SellerTransaction.status == 'completed')\
        .scalar() or 0

    total_withdrawals = db.session.query(func.sum(Withdrawal.amount))\
        .filter(Withdrawal.seller_id == seller.seller_id,
                Withdrawal.status.in_(['completed', 'pending', 'processing']))\
        .scalar() or 0

    available_balance = float(total_income) - float(total_withdrawals)
    withdrawal_amount = float(data['amount'])

    if withdrawal_amount > available_balance:
        return jsonify({'error': 'Insufficient balance'}), 400

    # Create withdrawal request
    withdrawal = Withdrawal(
        withdrawal_uuid=str(uuid.uuid4()),
        seller_id=seller.seller_id,
        bank_account_uuid=bank_account.account_uuid,
        amount=withdrawal_amount,
        notes=data.get('notes')
    )

    db.session.add(withdrawal)
    
    # Create transaction record
    transaction = SellerTransaction(
        transaction_uuid=str(uuid.uuid4()),
        seller_id=seller.seller_id,
        order_uuid=None,
        amount=-withdrawal_amount,
        type='withdrawal',
        status='pending',
        description=f'Withdrawal request to {bank_account.bank_name} - {bank_account.account_number}'
    )

    db.session.add(transaction)
    db.session.commit()

    return jsonify(withdrawal.to_dict()), 201

@seller_finance.route('/api/seller/bank-accounts/<account_uuid>', methods=['DELETE'])
@login_required
def delete_bank_account(account_uuid):
    seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
    if not seller:
        return jsonify({'error': 'Seller not found'}), 404

    bank_account = BankAccount.query.filter_by(
        account_uuid=account_uuid,
        seller_id=seller.seller_id
    ).first()
    if not bank_account:
        return jsonify({'error': 'Bank account not found'}), 404

    # Check if account has any pending withdrawals
    pending_withdrawals = Withdrawal.query.filter_by(
        bank_account_uuid=account_uuid,
        status='pending'
    ).first()
    if pending_withdrawals:
        return jsonify({'error': 'Cannot delete account with pending withdrawals'}), 400

    db.session.delete(bank_account)
    db.session.commit()

    return jsonify({'message': 'Bank account deleted successfully'})

@seller_finance.route('/api/seller/bank-accounts/<account_uuid>/set-primary', methods=['POST'])
@login_required
def set_primary_bank_account(account_uuid):
    seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
    if not seller:
        return jsonify({'error': 'Seller not found'}), 404

    # Update all accounts to not primary
    BankAccount.query.filter_by(seller_id=seller.seller_id).update({'is_primary': False})

    # Set selected account as primary
    bank_account = BankAccount.query.filter_by(
        account_uuid=account_uuid,
        seller_id=seller.seller_id
    ).first()
    if not bank_account:
        return jsonify({'error': 'Bank account not found'}), 404

    bank_account.is_primary = True
    db.session.commit()

    return jsonify(bank_account.to_dict()) 