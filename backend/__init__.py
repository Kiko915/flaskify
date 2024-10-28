from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_cors import CORS
from flask_migrate import Migrate
from flask_login import LoginManager
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid
from flask_login import UserMixin


db = SQLAlchemy()
mail = Mail()

class Users(db.Model, UserMixin):
    __tablename__ = 'users'
    
    user_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = db.Column(db.String(255), nullable=False)
    last_name = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    gender = db.Column(db.String(10), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    province = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    complete_address = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('Buyer', 'Seller', 'Admin'), nullable=False)
    status = db.Column(db.String(50), default="active")
    date_joined = db.Column(db.DateTime, default=datetime.now)
    is_verified = db.Column(db.Boolean, default=False)
    date_of_birth = db.Column(db.Date, nullable=True)
    profile_image_url = db.Column(db.String(255), nullable=True)

    def get_id(self):
        return str(self.user_uuid)

    def set_password(self, password):
        password = password.strip()
        print(f"Password: {password}")  # Debug output
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        password = password.strip()
        print(f"password: {password}")  # Debug output
        result = check_password_hash(self.password_hash, password)
        print(f"Password check for {self.email}: {result}")  # Debug output
        return result

    def __repr__(self):
        return f'<User {self.first_name} {self.last_name}>'


class OTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)


class PhoneVerification(db.Model):
    __tablename__ = 'phone_verifications'

    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(15), unique=True, nullable=False)
    verification_code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    expires_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, phone_number, verification_code):
        self.phone_number = phone_number
        self.verification_code = verification_code
        self.expires_at = datetime.now() + timedelta(minutes=10)


def create_app():
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object('config.Config')
    
    # Initialize extensions
    db.init_app(app)
    mail.init_app(app)
    CORS(app, supports_credentials=True, origins=['http://localhost:5173'])
    migrate = Migrate(app, db)

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    @login_manager.user_loader
    def load_user(user_uuid):
        return Users.query.get(user_uuid)

    
    # Register blueprints
    from routes import main
    app.register_blueprint(main)

    from auth import auth
    app.register_blueprint(auth)

    from profile import profile_bp
    app.register_blueprint(profile_bp)

    return app

