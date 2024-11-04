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
from sqlalchemy.orm import validates, relationship
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from enum import Enum


db = SQLAlchemy()
mail = Mail()

class Role(str, Enum):
    ADMIN = "Admin"
    SELLER = "Seller"
    BUYER = "Buyer"
    
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
    reset_token = db.Column(db.String(100), unique=True)
    reset_token_expiry = db.Column(db.DateTime)

    def get_id(self):
        return str(self.user_uuid)

    def set_password(self, password):
        password = password.strip()
        print(f"Password: {password}")  # Debug output
        self.password_hash = generate_password_hash(password, method='pbkdf2')

    def check_password(self, password):
        password = password.strip()
        print(f"password: {password}")  # Debug output
        result = check_password_hash(self.password_hash, password)
        print(f"Password check for {self.email}: {result}")  # Debug output
        return result
    
    # New address-related methods
    def get_active_address(self):
        """Get the user's currently active address"""
        return Address.query.filter_by(user_uuid=self.user_uuid, is_active=True).first()
    
    def get_default_shipping_address(self):
        """Get the user's default shipping address"""
        return Address.query.filter_by(user_uuid=self.user_uuid, is_default_shipping=True).first()
    
    def get_default_billing_address(self):
        """Get the user's default billing address"""
        return Address.query.filter_by(user_uuid=self.user_uuid, is_default_billing=True).first()
    
    def set_active_address(self, address_uuid):
        """Set an address as active and deactivate others"""
        # Deactivate all addresses for this user
        Address.query.filter_by(user_uuid=self.user_uuid).update({Address.is_active: False})
        
        # Set the specified address as active
        address = Address.query.filter_by(
            user_uuid=self.user_uuid,
            address_uuid=address_uuid
        ).first()
        
        if address:
            address.is_active = True
            db.session.commit()
            return True
        return False

    def __repr__(self):
        return f'<User {self.first_name} {self.last_name}>'
    
    def is_admin(self):
        return self.role == Role.ADMIN and self.admin_info is not None


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

class Address(db.Model):
    __tablename__ = 'addresses'
    
    address_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    
    # Address details
    address_name = db.Column(db.String(100), nullable=False)
    recipient_name = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(100), nullable=False)
    province = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    complete_address = db.Column(db.String(255), nullable=False)
    additional_info = db.Column(db.String(255))
    
    # Status flags
    is_active = db.Column(db.Boolean, default=False)
    is_default_shipping = db.Column(db.Boolean, default=False)
    is_default_billing = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship
    user = db.relationship('Users', backref=db.backref('addresses', lazy=True))

    def soft_delete(self):
        """Soft delete the address"""
        if self.is_default_shipping or self.is_default_billing:
            # Find another active address to set as default
            alternative_address = Address.query.filter(
                Address.user_uuid == self.user_uuid,
                Address.address_uuid != self.address_uuid,
                Address.is_deleted == False
            ).first()
            
            if alternative_address:
                alternative_address.is_default_shipping = self.is_default_shipping
                alternative_address.is_default_billing = self.is_default_billing
            
        self.is_deleted = True
        self.deleted_at = datetime.now()
        self.is_active = False
        self.is_default_shipping = False
        self.is_default_billing = False
        
        db.session.commit()
        return True

    @validates('is_default_shipping', 'is_default_billing')
    def validate_default_status(self, key, value):
        """Ensure only one default address exists for shipping/billing"""
        if value:
            # Unset the default flag for all other addresses
            Address.query.filter(
                Address.user_uuid == self.user_uuid,
                Address.address_uuid != self.address_uuid
            ).update({key: False})
        return value

    def __repr__(self):
        return f'<Address {self.address_name} for {self.recipient_name}>'



class PaymentMethod(db.Model):
    __tablename__ = 'payment_methods'

    payment_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    payment_type = db.Column(db.String(50), nullable=False)  # 'card' or 'paypal'
    payment_details = db.Column(db.JSON, nullable=False)  # Stores card details or PayPal account info
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    user = db.relationship('Users', backref=db.backref('payment_methods', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.payment_uuid,
            'user_id': self.user_uuid,
            'payment_type': self.payment_type,
            'payment_details': self.payment_details,  # Display sensitive info carefully
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<PaymentMethod {self.id}>'
    
# Seller Model
class SellerInfo(db.Model):
    __tablename__ = 'seller_info'
    
    # Primary Key (now a unique identifier for the seller record)
    seller_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Key to Users table
    user_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), unique=True, nullable=False)
    
    # Seller Personal/Business Information
    tax_id = db.Column(db.String(100), nullable=True)
    business_type = db.Column(db.Enum('Individual', 'Registered Business'), nullable=False)
    business_owner = db.Column(db.String(255), nullable=False)
    business_email = db.Column(db.String(255), nullable=False)
    business_phone = db.Column(db.String(20), nullable=False)
    
    # Seller Status and Verification
    status = db.Column(db.Enum(
        'Pending',
        'Approved',
        'Rejected'
    ), default='Pending', nullable=False)
    
    # Admin-related fields
    admin_notes = db.Column(db.Text, nullable=True)
    approved_by = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=True)
    approval_date = db.Column(db.DateTime, nullable=True)
    
    # Document Verification
    tax_certificate_doc = db.Column(db.String(255), nullable=True)
    
    # Aggregated Metrics (can be calculated from shops)
    total_sales = db.Column(db.Numeric(10, 2), default=0.00)
    
    # Timestamp fields
    date_registered = db.Column(db.DateTime, default=datetime.now)
    last_updated = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user = db.relationship('Users', foreign_keys=[user_uuid], backref='seller_info')
    approving_admin = db.relationship('Users', foreign_keys=[approved_by])
    shops = db.relationship('Shop', back_populates='seller', lazy='dynamic')
    
    def __repr__(self):
        return f'<SellerInfo {self.user_uuid} - {self.status}>'
    
    def update_status(self, new_status, admin_user=None, notes=None):
        """
        Update seller status with optional admin notes and approving admin
        
        :param new_status: New status for the seller
        :param admin_user: Admin user approving/updating the status
        :param notes: Optional notes about the status change
        """
        self.status = new_status
        
        if admin_user:
            self.approved_by = admin_user.user_uuid
            self.approval_date = datetime.now()
        
        if notes:
            self.admin_notes = notes
        
        return self
    
    def is_approved(self):
        """
        Check if seller is approved
        
        :return: Boolean indicating approval status
        """
        return self.status == 'Approved'


class Shop(db.Model):
    __tablename__ = 'shops'
    
    # Primary Key
    shop_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Key to Seller
    seller_id = db.Column(db.String(36), db.ForeignKey('seller_info.seller_id'), nullable=False)
    
    # Shop Information
    business_name = db.Column(db.String(255), nullable=False)
    
    # Location Details
    business_country = db.Column(db.String(100), nullable=False)
    business_province = db.Column(db.String(100), nullable=False)
    business_city = db.Column(db.String(100), nullable=False)
    business_address = db.Column(db.String(255), nullable=False)
    
    # Shop-specific Documentation
    business_registration_doc = db.Column(db.String(255), nullable=True)
    
    # Shop Metrics
    total_products = db.Column(db.Integer, default=0)
    shop_sales = db.Column(db.Numeric(10, 2), default=0.00)
    
    # Timestamp fields
    date_created = db.Column(db.DateTime, default=datetime.now)
    last_updated = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    seller = db.relationship('SellerInfo', back_populates='shops')
    
    def __repr__(self):
        return f'<Shop {self.business_name}>'
    
    @property
    def is_active(self):
        """
        Check if shop's seller is approved
        
        :return: Boolean indicating if shop can operate
        """
        return self.seller.is_approved()


class AdminInfo(db.Model):
    __tablename__ = 'admin_info'

    # Foreign key linking to Users
    admin_id = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), primary_key=True)
    admin_email = db.Column(db.String(120), unique=True, nullable=False)
    admin_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), default="Admin", nullable=False)  # Admin-specific roles (e.g., super_admin)
    permissions = db.Column(db.Text, nullable=True)  # JSON or text for flexible permission settings
    created_at = db.Column(db.DateTime, default=datetime.now, nullable=False)
    last_login = db.Column(db.DateTime)

    # Relationship to Users model
    user = db.relationship('Users', backref=db.backref('admin_info', uselist=False))

    def __repr__(self):
        return f'<AdminInfo {self.admin_name}>'

# Create app instance
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

    from seller import seller
    app.register_blueprint(seller)

    return app

