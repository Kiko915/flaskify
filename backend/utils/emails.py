from flask import render_template
from flask_mail import Message
from __init__ import mail


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