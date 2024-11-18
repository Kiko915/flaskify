from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_cors import CORS
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import uuid
from sqlalchemy.orm import validates, relationship
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from enum import Enum


db = SQLAlchemy()
mail = Mail()
migrate = Migrate()

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
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        password = password.strip()
        return check_password_hash(self.password_hash, password)
    
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

    seller_id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    business_name = db.Column(db.String(100), nullable=False)
    business_owner = db.Column(db.String(100), nullable=False)
    business_type = db.Column(db.String(50), nullable=False)
    business_email = db.Column(db.String(120), nullable=False)
    business_phone = db.Column(db.String(20), nullable=False)
    business_country = db.Column(db.String(50), nullable=False)
    business_province = db.Column(db.String(50), nullable=False)
    business_city = db.Column(db.String(50), nullable=False)
    business_address = db.Column(db.String(200), nullable=False)
    tax_id = db.Column(db.String(50), nullable=False)
    tax_certificate_doc = db.Column(db.String(200), nullable=False)
    total_sales = db.Column(db.Float, default=0.0)
    status = db.Column(db.Enum('Pending', 'Approved', 'Rejected', 'Suspended', name='seller_status'), default='Pending')
    violation_type = db.Column(db.String(50), nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    approved_by = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=True)
    approval_date = db.Column(db.DateTime, nullable=True)
    submission_date = db.Column(db.DateTime, default=datetime.utcnow)
    last_modified = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('Users', foreign_keys=[user_id], backref=db.backref('seller_info', lazy=True))
    approving_admin = db.relationship('Users', foreign_keys=[approved_by])
    shops = db.relationship('Shop', back_populates='seller_info')

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
    
    # Shop Logo
    shop_logo = db.Column(db.String(255), nullable=True)
    
    # Shop Metrics
    total_products = db.Column(db.Integer, default=0)
    shop_sales = db.Column(db.Numeric(10, 2), default=0.00)
    
    # Timestamp fields
    date_created = db.Column(db.DateTime, default=datetime.now)
    last_updated = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Archival status
    is_archived = db.Column(db.Boolean, default=False)
    archived_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    seller_info = db.relationship('SellerInfo', back_populates='shops')

    def __repr__(self):
        return f'<Shop {self.business_name}>'
        
    def is_active(self):
        """
        Check if shop's seller is approved and shop is not archived
        
        :return: Boolean indicating if shop can operate
        """
        return self.seller_info.status == 'Approved' and not self.is_archived

class Product(db.Model):
    __tablename__ = 'products'
    
    # Primary Key
    product_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Foreign Keys
    shop_uuid = db.Column(db.String(36), db.ForeignKey('shops.shop_uuid'), nullable=False)
    seller_id = db.Column(db.String(36), db.ForeignKey('seller_info.seller_id'), nullable=False)
    
    # Basic Product Information
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    compare_at_price = db.Column(db.Numeric(10, 2), nullable=True)  # Original price for showing discounts
    
    # Inventory Information
    sku = db.Column(db.String(50), unique=True, nullable=True)
    barcode = db.Column(db.String(50), unique=True, nullable=True)
    quantity = db.Column(db.Integer, default=0)
    low_stock_alert = db.Column(db.Integer, default=5)
    
    # Product Details
    brand = db.Column(db.String(100), nullable=True)
    category = db.Column(db.String(100), nullable=False)
    subcategory = db.Column(db.String(100), nullable=True)
    tags = db.Column(db.String(255), nullable=True)  # Comma-separated tags
    
    # Media
    main_image = db.Column(db.String(255), nullable=True)  # URL to main product image
    additional_images = db.Column(db.JSON, nullable=True)  # List of additional image URLs
    
    # Product Status
    status = db.Column(db.Enum('draft', 'active', 'archived', name='product_status'), default='draft')
    visibility = db.Column(db.Boolean, default=True)  # Whether product is visible to customers
    featured = db.Column(db.Boolean, default=False)  # Whether product should be featured
    
    # SEO
    meta_title = db.Column(db.String(255), nullable=True)
    meta_description = db.Column(db.Text, nullable=True)
    
    # Shipping
    weight = db.Column(db.Float, nullable=True)  # Weight in kg
    width = db.Column(db.Float, nullable=True)   # Dimensions in cm
    height = db.Column(db.Float, nullable=True)
    length = db.Column(db.Float, nullable=True)
    
    # Stats
    total_sales = db.Column(db.Integer, default=0)
    total_revenue = db.Column(db.Numeric(10, 2), default=0.00)
    view_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shop = db.relationship('Shop', backref=db.backref('products', lazy=True))
    seller = db.relationship('SellerInfo', backref=db.backref('products', lazy=True))
    
    def __repr__(self):
        return f'<Product {self.name}>'
    
    def to_dict(self):
        """Convert product to dictionary representation"""
        return {
            'product_uuid': self.product_uuid,
            'shop_uuid': self.shop_uuid,
            'seller_id': self.seller_id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price),
            'compare_at_price': float(self.compare_at_price) if self.compare_at_price else None,
            'sku': self.sku,
            'barcode': self.barcode,
            'quantity': self.quantity,
            'low_stock_alert': self.low_stock_alert,
            'brand': self.brand,
            'category': self.category,
            'subcategory': self.subcategory,
            'tags': self.tags.split(',') if self.tags else [],
            'main_image': self.main_image,
            'additional_images': self.additional_images or [],
            'status': self.status,
            'visibility': self.visibility,
            'featured': self.featured,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'weight': self.weight,
            'dimensions': {
                'width': self.width,
                'height': self.height,
                'length': self.length
            } if all([self.width, self.height, self.length]) else None,
            'stats': {
                'total_sales': self.total_sales,
                'total_revenue': float(self.total_revenue),
                'view_count': self.view_count
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

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
