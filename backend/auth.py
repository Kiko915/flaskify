from flask import Blueprint, jsonify, request
from __init__ import db, mail, OTP, Users
from flask_mail import Message
import random
import string
from config import Config
from datetime import datetime, timedelta
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

auth = Blueprint('auth', __name__)


@auth.route('/send_otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Email is required'}), 400

    email = data['email']
    otp = ''.join(random.choices(string.digits, k=6))

    # Set OTP expiration (e.g., 5 minutes from now)
    expiration_time = datetime.now() + timedelta(minutes=5)
    
    otp_entry = OTP(email=email, otp=otp, expires_at=expiration_time)
    db.session.add(otp_entry)
    db.session.commit()

    try:
        msg = Message('Your OTP Code', sender='francismistica06@gmail.com', recipients=[email])
        msg.body = f'Your OTP code is {otp}. It will expire in 5 minutes.'
        mail.send(msg)
    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500

    return jsonify({'message': 'OTP sent'}), 200


@auth.route('/verify_otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')

    if not email or not otp:
        return jsonify({'message': 'Email and OTP are required'}), 400

    # Fetch the OTP entry and check expiration
    otp_entry = OTP.query.filter_by(email=email, otp=otp).first()
    if otp_entry:
        if otp_entry.expires_at < datetime.now():
            db.session.delete(otp_entry)
            db.session.commit()
            return jsonify({'success': False, 'message': 'OTP expired'}), 400
        
        db.session.delete(otp_entry)
        db.session.commit()
        return jsonify({'success': True, 'message': 'OTP verified'}), 200

    return jsonify({'success': False, 'message': 'Invalid OTP'}), 400


@auth.route('/signup', methods=['POST'])
def signup():
    data = request.json
    # Check if the user already exists by email or phone number
    existing_user = Users.query.filter(
        (Users.email == data.get('email')) | (Users.phone == data.get('phone'))
    ).first()
    
    if existing_user:
        return jsonify({'message': 'User with this email or phone number already exists!'}), 400
    
    # Create new user if no existing user is found
    new_user = Users(
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        username=data.get('username'),
        email=data.get('email'),
        phone=data.get('phone'),
        country=data.get('country'),
        province=data.get('province'),
        city=data.get('city'),
        role='Buyer',
        is_verified=True,
        password_hash=generate_password_hash(data.get('password'), method='pbkdf2')  # Set verification status
    )
    
    print(new_user.password_hash) # Hash the password
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully!'}), 201
    except Exception as e:
        db.session.rollback()  # Rollback in case of an error
        return jsonify({'message': str(e)}), 400


# Login
@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    print(f"Attempting to login user with email: {email}")

    user = Users.query.filter_by(email=email).first()
    
    if user:
        if check_password_hash(user.password_hash, password):
            login_user(user)  # Logs in the user
            return jsonify({'message': 'Login successful'}), 200
        else:
            return jsonify({'message': 'Invalid email or password'}), 401
    else:
        print("User not found")
        return jsonify({'message': 'Invalid email or password'}), 401


# Logout
@auth.route('/logout')
@login_required
def logout():
    logout_user()  # Logs out the user and clears session
    return jsonify({'message': 'Logged out successfully!'}), 200

# Reset password


# Protected route
@auth.route('/protected')
@login_required
def protected():
    return jsonify({'message': f'You are authorized to view this page {current_user.first_name}!'}), 200

# Current User Instance
@auth.route('/current_user', methods=['GET'])
@login_required
def get_current_user():
    user_data = {
        'user_uuid': current_user.user_uuid,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'username': current_user.username,
        'email': current_user.email,
        'gender': current_user.gender,
        'phone': current_user.phone,
        'country': current_user.country,
        'province': current_user.province,
        'city': current_user.city,
        'complete_address': current_user.complete_address,
        'role': current_user.role,
        'status': current_user.status,
        'date_joined': current_user.date_joined.isoformat(),
        'is_verified': current_user.is_verified,
        'date_of_birth': current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
        'profile_image_url': current_user.profile_image_url,
    }
    return jsonify(user_data), 200
