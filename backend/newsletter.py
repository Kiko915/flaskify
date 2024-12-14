from flask import Blueprint, request, jsonify
from models import db, Newsletter, Role
from flask_login import login_required, current_user
from flask_mail import Message
import re
from datetime import datetime

# Global mail instance
mail = None

def init_mail(mail_instance):
    global mail
    mail = mail_instance

# Create blueprint
newsletter = Blueprint('newsletter', __name__)

def get_newsletter_template(subject, content):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #062a51;
                color: white;
                padding: 20px;
                text-align: center;
            }}
            .header img {{
                max-width: 150px;
                margin-bottom: 10px;
            }}
            .content {{
                padding: 20px;
                background-color: #ffffff;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }}
            .button {{
                display: inline-block;
                padding: 10px 20px;
                background-color: #FFD700;
                color: #062a51;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 15px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://res.cloudinary.com/da3b5g9ad/image/upload/f_auto,q_auto/flaskify-primary_szhmav" alt="Flaskify Logo">
                <h1>{subject}</h1>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                <p>© 2024 Flaskify. All rights reserved.</p>
                <p>You received this email because you subscribed to our newsletter.</p>
                <p>To unsubscribe, <a href="https://your-domain.com/unsubscribe">click here</a></p>
            </div>
        </div>
    </body>
    </html>
    """

def get_welcome_template(email):
    return get_newsletter_template(
        "Welcome to Flaskify Newsletter!",
        f"""
        <p>Hi there!</p>
        <p>Welcome to the Flaskify newsletter! We're excited to have you join our community.</p>
        <p>You'll be the first to know about:</p>
        <ul>
            <li>New products and exclusive deals</li>
            <li>Shopping tips and trends</li>
            <li>Special promotions and discounts</li>
        </ul>
        <p>Stay tuned for our upcoming newsletters!</p>
        <a href="https://your-domain.com/shop" class="button">Start Shopping</a>
        """
    )

@newsletter.route('/api/newsletter/subscribe', methods=['POST'])
def subscribe():
    try:
        data = request.get_json()
        email = data.get('email')

        # Validate email
        if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({'message': 'Invalid email address'}), 400

        # Check if email already exists
        existing_subscriber = Newsletter.query.filter_by(email=email).first()
        if existing_subscriber:
            if not existing_subscriber.is_active:
                existing_subscriber.is_active = True
                db.session.commit()
                return jsonify({'message': 'Subscription reactivated successfully!'}), 200
            return jsonify({'message': 'Email already subscribed'}), 400

        # Create new subscriber
        new_subscriber = Newsletter(email=email)
        db.session.add(new_subscriber)
        db.session.commit()

        # Send welcome email
        msg = Message(
            "Welcome to Flaskify Newsletter!",
            sender=("Flaskify", "newsletter@flaskify.com"),
            recipients=[email]
        )
        msg.html = get_welcome_template(email)
        mail.send(msg)

        return jsonify({'message': 'Successfully subscribed to newsletter!'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'An error occurred while subscribing'}), 500

@newsletter.route('/api/admin/newsletter/subscribers', methods=['GET'])
@login_required
def get_subscribers():
    try:
        if not current_user.has_role(Role.ADMIN):
            return jsonify({'message': 'Unauthorized access'}), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        query = Newsletter.query.order_by(Newsletter.subscribed_at.desc())
        subscribers = query.paginate(page=page, per_page=per_page)

        return jsonify({
            'subscribers': [{
                'id': sub.id,
                'email': sub.email,
                'is_active': sub.is_active,
                'subscribed_at': sub.subscribed_at.isoformat()
            } for sub in subscribers.items],
            'total': subscribers.total,
            'pages': subscribers.pages,
            'current_page': subscribers.page
        }), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

@newsletter.route('/api/admin/newsletter/subscribers/<email>', methods=['DELETE'])
@login_required
def delete_subscriber(email):
    try:
        if not current_user.has_role(Role.ADMIN):
            return jsonify({'message': 'Unauthorized access'}), 403

        subscriber = Newsletter.query.filter_by(email=email).first()
        if not subscriber:
            return jsonify({'message': 'Subscriber not found'}), 404

        db.session.delete(subscriber)
        db.session.commit()

        return jsonify({'message': 'Subscriber removed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@newsletter.route('/api/admin/newsletter/send', methods=['POST'])
@login_required
def send_newsletter():
    try:
        if not current_user.has_role(Role.ADMIN):
            return jsonify({'message': 'Unauthorized access'}), 403

        data = request.get_json()
        subject = data.get('subject')
        message = data.get('message')

        if not subject or not message:
            return jsonify({'message': 'Subject and message are required'}), 400

        # Get all active subscribers
        active_subscribers = Newsletter.query.filter_by(is_active=True).all()
        if not active_subscribers:
            return jsonify({'message': 'No active subscribers found'}), 400

        # Send newsletter to all active subscribers
        with mail.connect() as conn:
            for subscriber in active_subscribers:
                msg = Message(
                    subject,
                    sender=("Flaskify", "newsletter@flaskify.com"),
                    recipients=[subscriber.email]
                )
                msg.html = get_newsletter_template(subject, message)
                conn.send(msg)

        return jsonify({
            'message': 'Newsletter sent successfully',
            'recipients_count': len(active_subscribers)
        }), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

@newsletter.route('/api/newsletter/unsubscribe/<email>', methods=['POST'])
def unsubscribe(email):
    try:
        subscriber = Newsletter.query.filter_by(email=email).first()
        if not subscriber:
            return jsonify({'message': 'Email not found'}), 404

        subscriber.is_active = False
        db.session.commit()

        return jsonify({'message': 'Successfully unsubscribed from newsletter'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500