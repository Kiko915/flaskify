from flask import render_template
from flask_mail import Message
from models import mail


def send_welcome_email(user_email, user_name):
    msg = Message('Welcome to Flaskify!',
                  sender='francismistica06@gmail.com',
                  recipients=[user_email])
    msg.html = render_template('welcome_email.html', user_name=user_name)
    mail.send(msg)


def send_otp_email(email, otp):
    msg = Message('Your OTP Code', sender='francismistica06@gmail.com', recipients=[email])
    msg.html = render_template('signup_otp.html', otp_code=otp)
    mail.send(msg)


def send_password_reset_email(email, reset_url):
    msg = Message('Password Reset Request', sender='francismistica06@gmail.com', recipients=[email])
    msg.html = render_template('reset-password.html', reset_password_url=reset_url, user_email=email)
    mail.send(msg)


def send_seller_approval_email(email, user_name):
    msg = Message('Your Seller Account is Approved!',
                  sender='francismistica06@gmail.com',
                  recipients=[email])
    msg.html = render_template('seller-approval-notification.html', user_name=user_name)
    mail.send(msg)


def send_seller_rejection_email(email, user_name, rejection_reason, admin_notes):
    msg = Message('Your Seller Account is Rejected', 
                  sender='francismistica06@gmail.com',
                    recipients=[email])
    msg.html = render_template('seller-rejection-notification.html', 
                             user_name=user_name,
                             rejection_reason=rejection_reason,
                             admin_notes=admin_notes)
    mail.send(msg)


def send_seller_suspension_email(email, user_name, remarks, violation_type):
    violation_types = {
        'counterfeit': 'Selling Counterfeit Products',
        'misrepresentation': 'Product Misrepresentation',
        'shipping': 'Shipping Violations',
        'customer_service': 'Poor Customer Service',
        'policy': 'Policy Violations',
        'fraud': 'Fraudulent Activity',
        'other': 'Other Violations'
    }
    
    formatted_violation = violation_types.get(violation_type, 'Policy Violation')
    
    msg = Message('Your Seller Account has been Suspended', 
                  sender='francismistica06@gmail.com',
                  recipients=[email])
    msg.html = render_template('seller-suspension-notification.html',
                             user_name=user_name,
                             violation_type=formatted_violation,
                             remarks=remarks)
    mail.send(msg)