from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_cors import CORS
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy.orm import validates, relationship
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from enum import Enum
import secrets
import string
from sqlalchemy.dialects.postgresql import UUID
import json
from sqlalchemy import and_, Text
from sqlalchemy.dialects.postgresql import JSONB


db = SQLAlchemy()
mail = Mail()
migrate = Migrate()

class Role(str, Enum):
    ADMIN = "ADMIN"
    SELLER = "SELLER"
    BUYER = "BUYER"
    
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
    role = db.Column(db.Enum(Role), nullable=False)
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
    
    def has_role(self, role):
        """Check if user has a specific role"""
        if isinstance(role, str):
            return self.role == Role[role]
        return self.role == role

    def is_admin(self):
        """Check if user is an admin"""
        return self.role == Role.ADMIN

    def is_seller(self):
        """Check if user is a seller"""
        return self.role == Role.SELLER

    def is_buyer(self):
        """Check if user is a buyer"""
        return self.role == Role.BUYER


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
    type = db.Column(db.String(50), nullable=False)  # credit_card, paypal
    is_default = db.Column(db.Boolean, default=False)
    
    # For credit cards
    card_type = db.Column(db.String(50), nullable=True)  # visa, mastercard
    last_four = db.Column(db.String(4), nullable=True)
    expiry_month = db.Column(db.String(2), nullable=True)
    expiry_year = db.Column(db.String(4), nullable=True)
    card_holder_name = db.Column(db.String(100), nullable=True)
    
    # For PayPal
    paypal_email = db.Column(db.String(100), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('Users', backref=db.backref('payment_methods', lazy=True))

    def to_dict(self):
        payment_dict = {
            'payment_uuid': self.payment_uuid,
            'user_uuid': self.user_uuid,
            'type': self.type,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if self.type == 'credit_card':
            payment_dict.update({
                'card_type': self.card_type,
                'last_four': self.last_four,
                'expiry_month': self.expiry_month,
                'expiry_year': self.expiry_year,
                'card_holder_name': self.card_holder_name
            })
        elif self.type == 'paypal':
            payment_dict.update({
                'paypal_email': self.paypal_email
            })
            
        return payment_dict

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
    business_country = db.Column(db.String(50), nullable=True)
    business_region = db.Column(db.String(50), nullable=True)
    business_province = db.Column(db.String(50), nullable=True)
    business_city = db.Column(db.String(50), nullable=True)
    business_address = db.Column(db.String(200), nullable=True)
    tax_id = db.Column(db.String(50), nullable=False)
    tax_certificate_doc = db.Column(db.String(200), nullable=True)
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
    category_uuid = db.Column(db.String(36), db.ForeignKey('categories.category_uuid'), nullable=False)
    
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
    tags = db.Column(db.String(255), nullable=True)  # Comma-separated tags
    
    # Media
    main_image = db.Column(db.String(255), nullable=True)  # URL to main product image
    _additional_images = db.Column('additional_images', db.JSON, nullable=True)

    @property
    def additional_images(self):
        """Get the additional images list"""
        if self._additional_images is None:
            return []
        if isinstance(self._additional_images, list):
            return self._additional_images
        if isinstance(self._additional_images, str):
            try:
                return json.loads(self._additional_images)
            except json.JSONDecodeError:
                return []
        return []

    @additional_images.setter
    def additional_images(self, value):
        """Set the additional images list"""
        if value is None:
            self._additional_images = []
        elif isinstance(value, list):
            self._additional_images = value
        elif isinstance(value, str):
            try:
                self._additional_images = json.loads(value)
            except json.JSONDecodeError:
                self._additional_images = []
        else:
            self._additional_images = []
    
    # Product Specifications
    specifications = db.Column(db.JSON, nullable=True)
    
    # Shipping Information
    shipping_height = db.Column(db.Float, nullable=True)
    shipping_width = db.Column(db.Float, nullable=True)
    shipping_length = db.Column(db.Float, nullable=True)
    shipping_weight = db.Column(db.Float, nullable=True)
    shipping_provider_uuid = db.Column(db.String(36), db.ForeignKey('shipping_providers.provider_uuid'), nullable=True)
    shipping_rate_uuid = db.Column(db.String(36), db.ForeignKey('shipping_rates.rate_uuid'), nullable=True)
    shipping_fee = db.Column(db.Numeric(10, 2), nullable=True)
    
    # Product Status
    status = db.Column(db.String(20), default='active')  # active, archived
    visibility = db.Column(db.Boolean, default=True)  # Whether product is visible to customers
    featured = db.Column(db.Boolean, default=False)  # Whether product should be featured
    
    # SEO
    meta_title = db.Column(db.String(255), nullable=True)
    meta_description = db.Column(db.Text, nullable=True)
    
    # Dimensions
    weight = db.Column(db.Float, nullable=True)  # Weight in kg
    width = db.Column(db.Float, nullable=True)   # Dimensions in cm
    height = db.Column(db.Float, nullable=True)
    length = db.Column(db.Float, nullable=True)
    
    # Stats
    total_sales = db.Column(db.Integer, default=0)
    total_revenue = db.Column(db.Numeric(10, 2), default=0.00)
    view_count = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))
    
    # Verification codes
    archive_code = db.Column(db.String(10))
    unarchive_code = db.Column(db.String(10))
    code_generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Discount fields
    discount_name = db.Column(db.String(50))
    discount_percentage = db.Column(db.Float)
    discount_start_date = db.Column(db.DateTime(timezone=True))
    discount_end_date = db.Column(db.DateTime(timezone=True))

    # Relationships
    seller = db.relationship('SellerInfo', backref=db.backref('products', lazy=True))
    shop = db.relationship('Shop', backref=db.backref('products', lazy=True))
    category = db.relationship('Category', back_populates='products')
    variations = db.relationship('ProductVariation', backref='product', lazy=True, cascade='all, delete-orphan')
    
    # Shipping-related relationships
    shipping_provider = db.relationship(
        'ShippingProvider',
        backref=db.backref('provider_products', lazy=True),
        lazy='joined'
    )
    shipping_rate = db.relationship(
        'ShippingRate',
        backref=db.backref('rate_products', lazy=True),
        lazy='joined'
    )

    def __repr__(self):
        return f'<Product {self.name}>'

    @classmethod
    def get_shipping_details(cls, provider_name, rate_name):
        """Get shipping provider and rate UUIDs from names"""
        try:
            # First try to find provider by UUID
            provider = ShippingProvider.query.get(provider_name)
            
            # If not found by UUID, try to find by name
            if not provider:
                provider = ShippingProvider.query.filter(
                    ShippingProvider.name.ilike(f"%{provider_name}%")
                ).first()
            
            if provider:
                # First try to find rate by UUID
                rate = ShippingRate.query.get(rate_name)
                
                # If not found by UUID, try to find by name for this provider
                if not rate:
                    rate = ShippingRate.query.filter(
                        and_(
                            ShippingRate.provider_uuid == provider.provider_uuid,
                            ShippingRate.name.ilike(f"%{rate_name}%")
                        )
                    ).first()
                
                return provider.provider_uuid, rate.rate_uuid if rate else None
            return None, None
        except Exception as e:
            print(f"Error getting shipping details: {str(e)}")
            return None, None

    def calculate_shipping_fee(self):
        """Calculate shipping fee based on shipping rate and product weight"""
        try:
            if not self.shipping_rate or not self.shipping_weight:
                return None

            return self.shipping_rate.calculate_shipping_fee(self.shipping_weight)
        except Exception as e:
            print(f"Error calculating shipping fee: {str(e)}")
            return None

    @classmethod
    def create_from_bulk_data(cls, data, shop_uuid, seller_id):
        """Create a product from bulk upload data with shipping calculations"""
        try:
            # Get shipping provider and rate UUIDs from names
            provider_uuid, rate_uuid = cls.get_shipping_details(
                data.get('shipping_provider'),
                data.get('shipping_rate')
            )

            # Convert specifications from pipe-delimited string to JSON object
            specifications = None
            if data.get('specifications'):
                try:
                    # Split by pipe and convert to key-value pairs
                    spec_pairs = [pair.split(':') for pair in data['specifications'].split('|')]
                    specifications = {pair[0]: pair[1] for pair in spec_pairs if len(pair) == 2}
                except Exception as e:
                    print(f"Error parsing specifications: {str(e)}")
                    specifications = None

            # Create the product
            product = cls(
                product_uuid=str(uuid.uuid4()),
                shop_uuid=shop_uuid,
                seller_id=seller_id,
                name=data['name'],
                description=data['description'],
                price=float(data['price']),
                quantity=int(data.get('quantity', 0)),
                category_uuid=data['category_uuid'],
                sku=data.get('sku'),
                brand=data.get('brand'),
                tags=data.get('tags'),
                specifications=specifications,  # Use the converted specifications
                shipping_provider_uuid=provider_uuid,
                shipping_rate_uuid=rate_uuid,
                shipping_length=float(data.get('shipping_length', 0)),
                shipping_width=float(data.get('shipping_width', 0)),
                shipping_height=float(data.get('shipping_height', 0)),
                shipping_weight=float(data.get('shipping_weight', 0)),
                main_image=data.get('main_image'),
                additional_images=data.get('additional_images', '').split('|') if data.get('additional_images') else []
            )

            # Calculate shipping fee based on rate and weight
            if product.shipping_rate and product.shipping_weight:
                calculated_fee = product.calculate_shipping_fee()
                if calculated_fee is not None:
                    product.shipping_fee = calculated_fee

            return product
        except Exception as e:
            print(f"Error creating product from bulk data: {str(e)}")
            raise

    def to_dict(self):
        # Calculate shipping fee if not already set
        if self.shipping_fee is None and self.shipping_rate and self.shipping_weight:
            self.shipping_fee = self.calculate_shipping_fee()
            if self.shipping_fee is not None:
                db.session.add(self)
                db.session.commit()
        
        # Calculate total stock based on variations
        variation_stock = sum(
            sum(option.stock for option in variation.options)
            for variation in self.variations
        ) if self.variations else 0
        
        total_stock = variation_stock if variation_stock > 0 else self.quantity
        
        # Ensure specifications is a proper JSON object
        specs = self.specifications
        if isinstance(specs, str):
            try:
                # If it's a pipe-delimited string, convert it
                if '|' in specs:
                    spec_pairs = [pair.split(':') for pair in specs.split('|')]
                    specs = {pair[0]: pair[1] for pair in spec_pairs if len(pair) == 2}
                # If it's a JSON string, parse it
                else:
                    specs = json.loads(specs)
            except Exception as e:
                print(f"Error parsing specifications: {str(e)}")
                specs = {}
        
        # Add shop information
        shop = Shop.query.get(self.shop_uuid)
        product_dict = {
            'product_uuid': self.product_uuid,
            'shop_uuid': self.shop_uuid,
            'seller_id': self.seller_id,
            'category_uuid': self.category_uuid,
            'category_name': self.category.name if self.category else None,
            'name': self.name,
            'description': self.description,
            'price': float(self.price) if self.price else None,
            'compare_at_price': float(self.compare_at_price) if self.compare_at_price else None,
            'main_image': self.main_image,
            'additional_images': self.additional_images,
            'sku': self.sku,
            'barcode': self.barcode,
            'quantity': total_stock,
            'low_stock_alert': self.low_stock_alert,
            'brand': self.brand,
            'specifications': specs,
            'shipping_height': self.shipping_height,
            'shipping_width': self.shipping_width,
            'shipping_length': self.shipping_length,
            'shipping_weight': self.shipping_weight,
            'shipping_provider_uuid': self.shipping_provider_uuid,
            'shipping_rate_uuid': self.shipping_rate_uuid,
            'shipping_fee': self.shipping_fee,
            'status': self.status,
            'visibility': self.visibility,
            'featured': self.featured,
            'meta_title': self.meta_title,
            'meta_description': self.meta_description,
            'weight': self.weight,
            'width': self.width,
            'height': self.height,
            'length': self.length,
            'total_sales': self.total_sales,
            'total_revenue': float(self.total_revenue) if self.total_revenue else 0.00,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'variations': [variation.to_dict() for variation in self.variations] if self.variations else [],
            'discount_name': self.discount_name,
            'discount_percentage': self.discount_percentage,
            'discount_start_date': self.discount_start_date.isoformat() if self.discount_start_date else None,
            'discount_end_date': self.discount_end_date.isoformat() if self.discount_end_date else None,
            'shop': {
                'shop_uuid': shop.shop_uuid,
                'business_name': shop.business_name,
                'business_city': shop.business_city,
                'business_province': shop.business_province,
                'shop_logo': shop.shop_logo
            } if shop else None
        }

        # Add shipping provider details if available
        if self.shipping_provider:
            try:
                product_dict['shipping_provider_details'] = {
                    'provider_uuid': self.shipping_provider.provider_uuid,
                    'name': self.shipping_provider.name,
                    'description': self.shipping_provider.description,
                    'logo_url': self.shipping_provider.logo_url,
                    'is_active': self.shipping_provider.is_active,
                    'is_default': self.shipping_provider.is_default
                }
            except Exception as e:
                print(f"Error serializing shipping provider: {str(e)}")
                product_dict['shipping_provider_details'] = None

        # Add shipping rate details if available
        if self.shipping_rate:
            try:
                product_dict['shipping_rate_details'] = {
                    'rate_uuid': self.shipping_rate.rate_uuid,
                    'name': self.shipping_rate.name,
                    'description': self.shipping_rate.description,
                    'base_rate': float(self.shipping_rate.base_rate),
                    'weight_rate': float(self.shipping_rate.weight_rate),
                    'min_weight': float(self.shipping_rate.min_weight) if self.shipping_rate.min_weight else None,
                    'max_weight': float(self.shipping_rate.max_weight) if self.shipping_rate.max_weight else None,
                    'estimated_days': self.shipping_rate.estimated_days
                }
            except Exception as e:
                print(f"Error serializing shipping rate: {str(e)}")
                product_dict['shipping_rate_details'] = None
        
        return product_dict

    def get_category_path(self, category):
        """Get the category path"""
        path = [category.name]
        current = category
        while current.parent:
            current = current.parent
            path.insert(0, current.name)
        return ' > '.join(path)

    def generate_verification_codes(self):
        """Generate new verification codes for archive/unarchive actions"""
        def generate_code():
            # Generate a 6-character code with numbers and uppercase letters
            characters = string.ascii_uppercase + string.digits
            return ''.join(secrets.choice(characters) for _ in range(6))
        
        self.archive_code = generate_code()
        self.unarchive_code = generate_code()
        self.code_generated_at = datetime.utcnow()
        db.session.commit()

    def get_verification_codes(self):
        """Get current verification codes, regenerating if too old"""
        now = datetime.utcnow()
        # Regenerate codes if they're older than 1 hour or don't exist
        if (not self.code_generated_at or 
            not self.archive_code or 
            not self.unarchive_code or
            (now - self.code_generated_at).total_seconds() > 3600):
            self.generate_verification_codes()
        
        return {
            'archive_code': self.archive_code,
            'unarchive_code': self.unarchive_code,
            'expires_at': (self.code_generated_at + timedelta(hours=1)).isoformat() if self.code_generated_at else None
        }

class Cart(db.Model):
    __tablename__ = 'carts'
    
    cart_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user = db.relationship('Users', backref=db.backref('cart', uselist=False))

    def to_dict(self):
        return {
            'cart_uuid': self.cart_uuid,
            'user_uuid': self.user_uuid,
            'items': [item.to_dict() for item in self.items],
            'total_items': sum(item.quantity for item in self.items),
            'total_price': sum(item.unit_price * item.quantity for item in self.items),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class CartItem(db.Model):
    __tablename__ = 'cart_items'

    item_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    product_uuid = db.Column(db.String(36), db.ForeignKey('products.product_uuid'), nullable=False)
    variation_uuid = db.Column(db.String(36), db.ForeignKey('product_variations.variation_uuid'), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    selected_option = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('Users', backref=db.backref('cart_items', lazy=True))
    product = db.relationship('Product', backref=db.backref('cart_items', lazy=True))
    variation = db.relationship('ProductVariation', backref=db.backref('cart_items', lazy=True))

    def to_dict(self):
        item_dict = {
            'item_uuid': self.item_uuid,
            'user_id': self.user_id,
            'product_uuid': self.product_uuid,
            'variation_uuid': self.variation_uuid,
            'quantity': self.quantity,
            'selected_option': self.selected_option,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'product': {
                'product_uuid': self.product.product_uuid,
                'name': self.product.name,
                'main_image': self.product.main_image,
                'price': float(self.selected_option['price']) if self.selected_option and 'price' in self.selected_option else float(self.product.price) if self.product.price else None,
                'quantity': self.selected_option['stock'] if self.selected_option and 'stock' in self.selected_option else self.product.quantity,
                'sku': self.selected_option['sku'] if self.selected_option and 'sku' in self.selected_option else self.product.sku,
                'shipping_fee': float(self.product.shipping_fee) if self.product.shipping_fee else 0.00
            }
        }
        
        if self.variation and self.selected_option:
            item_dict['variation'] = {
                'variation_uuid': self.variation.variation_uuid,
                'name': self.selected_option['name'],
                'value': self.selected_option['value']
            }
            
        return item_dict

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

# Category Models
class Category(db.Model):
    __tablename__ = 'categories'
    
    category_uuid = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    parent_id = db.Column(db.String(50), db.ForeignKey('categories.category_uuid'))
    is_active = db.Column(db.Boolean, default=True)
    image_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Self-referential relationship for subcategories
    subcategories = db.relationship('Category', 
        backref=db.backref('parent', remote_side=[category_uuid]),
        lazy='dynamic'
    )
    # Relationship with products
    products = db.relationship('Product', back_populates='category', lazy=True)
    # Relationship with attributes
    attributes = db.relationship('CategoryAttribute', backref='category', lazy=True)

    def get_path(self):
        """Get the full category path from root to this category"""
        path = []
        current = self
        while current:
            path.insert(0, current.name)
            current = current.parent
        return ' > '.join(path)

    def __repr__(self):
        return f'<Category {self.name}>'

class CategoryAttribute(db.Model):
    __tablename__ = 'category_attributes'
    
    attribute_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_uuid = db.Column(db.String(36), db.ForeignKey('categories.category_uuid'), nullable=False)
    name = db.Column(db.String(50), nullable=False)  # e.g., "Size", "Color"
    type = db.Column(db.String(20), nullable=False)  # e.g., "select", "radio", "color"
    is_required = db.Column(db.Boolean, default=False)
    is_variant = db.Column(db.Boolean, default=True)  # Whether this attribute creates product variants
    options = db.Column(db.JSON, nullable=True)  # List of possible values
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<CategoryAttribute {self.name} for {self.category.name}>'

class ProductVariation(db.Model):
    __tablename__ = 'product_variations'
    
    variation_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_uuid = db.Column(db.String(36), db.ForeignKey('products.product_uuid'), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    compare_at_price = db.Column(db.Numeric(10, 2), nullable=True)  # Original price for showing discounts
    quantity = db.Column(db.Integer, nullable=False, default=0)
    has_individual_stock = db.Column(db.Boolean, default=True)
    
    # Relationships
    options = db.relationship('ProductVariationOption', backref='variation', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        # Get the first option's data since we're using it for the variation display
        first_option = self.options[0] if self.options else None
        
        return {
            'variation_uuid': str(self.variation_uuid),
            'product_uuid': str(self.product_uuid),
            'price': float(self.price),
            'compare_at_price': float(self.compare_at_price) if self.compare_at_price else None,
            'quantity': self.quantity,
            'has_individual_stock': self.has_individual_stock,
            'stock': first_option.stock if first_option else 0,
            'options': {
                'name': first_option.name if first_option else '',
                'value': first_option.value if first_option else '',
                'stock': first_option.stock if first_option else 0,
                'low_stock_alert': first_option.low_stock_alert if first_option else 5,
                'sku': first_option.sku if first_option else None
            } if first_option else None
        }

class ProductVariationOption(db.Model):
    __tablename__ = 'product_variation_options'
    
    option_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    variation_uuid = db.Column(db.String(36), db.ForeignKey('product_variations.variation_uuid'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    value = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=True)  # Option-specific price
    compare_at_price = db.Column(db.Numeric(10, 2), nullable=True)  # Original price for showing discounts
    stock = db.Column(db.Integer, nullable=False, default=0)
    low_stock_alert = db.Column(db.Integer, nullable=False, default=5)
    sku = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'option_uuid': str(self.option_uuid),
            'variation_uuid': str(self.variation_uuid),
            'name': self.name,
            'value': self.value,
            'price': float(self.price) if self.price is not None else None,
            'compare_at_price': float(self.compare_at_price) if self.compare_at_price else None,
            'stock': self.stock,
            'low_stock_alert': self.low_stock_alert,
            'sku': self.sku
        }

class ShippingProvider(db.Model):
    __tablename__ = 'shipping_providers'
    
    provider_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    logo_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    rates = db.relationship('ShippingRate', backref='provider', lazy=True, cascade='all, delete-orphan')
    # Note: products relationship is handled by backref in Product model

    def __repr__(self):
        return f'<ShippingProvider {self.name}>'

    def to_dict(self):
        return {
            'provider_uuid': self.provider_uuid,
            'name': self.name,
            'description': self.description,
            'logo_url': self.logo_url,
            'is_active': self.is_active,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ShippingRate(db.Model):
    __tablename__ = 'shipping_rates'
    
    rate_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_uuid = db.Column(db.String(36), db.ForeignKey('shipping_providers.provider_uuid'), nullable=False)
    name = db.Column(db.String(50), nullable=False)  # e.g., "Economy", "Express", "Premium"
    description = db.Column(db.Text, nullable=True)
    base_rate = db.Column(db.Numeric(10, 2), nullable=False)  # Base shipping fee
    weight_rate = db.Column(db.Numeric(10, 2), nullable=False)  # Additional fee per kg
    min_weight = db.Column(db.Float, nullable=False, default=0.0)  # Minimum weight in kg
    max_weight = db.Column(db.Float, nullable=True)  # Maximum weight in kg (null means no limit)
    estimated_days = db.Column(db.Integer, nullable=True)  # Estimated delivery days
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Note: products relationship is handled by backref in Product model

    def __repr__(self):
        return f'<ShippingRate {self.name} for {self.provider.name}>'

    def calculate_shipping_fee(self, weight):
        """Calculate shipping fee based on weight"""
        try:
            weight = float(weight)
            if weight < self.min_weight:
                return float(self.base_rate)
            if self.max_weight and weight > self.max_weight:
                return None  # Weight exceeds maximum limit
            
            # Calculate fee: base_rate + (weight * weight_rate)
            fee = float(self.base_rate) + (weight * float(self.weight_rate))
            return round(fee, 2)
        except (ValueError, TypeError) as e:
            print(f"Error calculating shipping fee: {str(e)}")
            return None

    def to_dict(self):
        """Convert shipping rate to dictionary format"""
        try:
            return {
                'rate_uuid': self.rate_uuid,
                'provider_uuid': self.provider_uuid,
                'name': self.name,
                'description': self.description,
                'base_rate': float(self.base_rate),
                'weight_rate': float(self.weight_rate),
                'min_weight': float(self.min_weight) if self.min_weight is not None else 0.0,
                'max_weight': float(self.max_weight) if self.max_weight is not None else None,
                'estimated_days': self.estimated_days,
                'is_active': self.is_active,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            }
        except Exception as e:
            print(f"Error serializing shipping rate: {str(e)}")
            return None

class Review(db.Model):
    __tablename__ = 'reviews'
    
    review_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_uuid = db.Column(db.String(36), db.ForeignKey('products.product_uuid'), nullable=False)
    user_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=False)
    images = db.Column(db.JSON, nullable=True)  # List of image URLs
    seller_reply = db.Column(db.Text, nullable=True)
    seller_reply_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref=db.backref('reviews', lazy=True))
    user = db.relationship('Users', backref=db.backref('reviews', lazy=True))
    
    def __repr__(self):
        return f'<Review {self.review_uuid}>'

    def to_dict(self):
        return {
            'review_uuid': self.review_uuid,
            'product_uuid': self.product_uuid,
            'user_uuid': self.user_uuid,
            'rating': self.rating,
            'comment': self.comment,
            'images': self.images,
            'seller_reply': self.seller_reply,
            'seller_reply_at': self.seller_reply_at.isoformat() if self.seller_reply_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user': {
                'user_uuid': self.user_uuid,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'profile_image_url': self.user.profile_image_url
            }
        }

class ChatRoom(db.Model):
    __tablename__ = 'chat_rooms'
    
    room_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user1_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    user2_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_message_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user1 = db.relationship('Users', foreign_keys=[user1_uuid], backref=db.backref('chat_rooms_as_user1', lazy=True))
    user2 = db.relationship('Users', foreign_keys=[user2_uuid], backref=db.backref('chat_rooms_as_user2', lazy=True))
    messages = db.relationship('ChatMessage', backref='room', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<ChatRoom {self.room_uuid}>'

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    
    message_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_uuid = db.Column(db.String(36), db.ForeignKey('chat_rooms.room_uuid'), nullable=False)
    sender_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    
    # Relationships
    sender = db.relationship('Users', backref=db.backref('sent_messages', lazy=True))
    
    def __repr__(self):
        return f'<ChatMessage {self.message_uuid}>'


class Wishlist(db.Model):
    __tablename__ = 'wishlists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    product_uuid = db.Column(db.String(36), db.ForeignKey('products.product_uuid'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Define indexes
    __table_args__ = (
        db.Index('idx_wishlist_user', 'user_uuid'),
        db.Index('idx_wishlist_product', 'product_uuid'),
        db.Index('idx_wishlist_user_product', 'user_uuid', 'product_uuid', unique=True),
    )

    # Relationships
    user = db.relationship('Users', backref=db.backref('wishlists', lazy=True))
    product = db.relationship('Product', backref=db.backref('wishlists', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_uuid': self.user_uuid,
            'product_uuid': self.product_uuid,
            'created_at': self.created_at.isoformat(),
            'product': self.product.to_dict() if self.product else None
        }

class Newsletter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<Newsletter {self.email}>'

class Contact(db.Model):
    __tablename__ = 'contacts'

    contact_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='unread')  # unread, read, replied
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'contact_uuid': self.contact_uuid,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Banner(db.Model):
    __tablename__ = 'banners'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(500), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # New fields for enhanced customization
    button_text = db.Column(db.String(50), default='Shop Now')
    button_link = db.Column(db.String(500), default='')
    secondary_button_text = db.Column(db.String(50), default='Learn More')
    secondary_button_link = db.Column(db.String(500), default='')
    overlay_opacity = db.Column(db.Integer, default=50)  # Stored as percentage (0-100)
    title_color = db.Column(db.String(7), default='#FFFFFF')  # Hex color
    description_color = db.Column(db.String(7), default='#E5E7EB')  # Hex color
    button_style = db.Column(db.String(20), default='primary')
    show_secondary_button = db.Column(db.Boolean, default=True)
    show_special_offer = db.Column(db.Boolean, default=True)
    special_offer_text = db.Column(db.String(50), default='Special Offer')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'button_text': self.button_text,
            'button_link': self.button_link,
            'secondary_button_text': self.secondary_button_text,
            'secondary_button_link': self.secondary_button_link,
            'overlay_opacity': self.overlay_opacity,
            'title_color': self.title_color,
            'description_color': self.description_color,
            'button_style': self.button_style,
            'show_secondary_button': self.show_secondary_button,
            'show_special_offer': self.show_special_offer,
            'special_offer_text': self.special_offer_text
        } 

class Order(db.Model):
    __tablename__ = 'orders'
    
    order_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_uuid = db.Column(db.String(36), db.ForeignKey('users.user_uuid'), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, paid, shipped, delivered, cancelled, cancellation_pending
    payment_method = db.Column(db.String(50), nullable=False)  # credit_card, paypal, cod
    payment_status = db.Column(db.String(50), nullable=False, default='pending')  # pending, completed, failed
    transaction_id = db.Column(db.String(100), nullable=True)
    
    # Shipping Information
    shipping_address = db.Column(db.JSON, nullable=False)
    shipping_method = db.Column(db.String(50), nullable=False)
    shipping_fee = db.Column(db.Numeric(10, 2), nullable=False)
    tracking_number = db.Column(db.String(100), nullable=True)
    
    # Order Totals
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    total = db.Column(db.Numeric(10, 2), nullable=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = db.Column(db.DateTime, nullable=True)
    shipped_at = db.Column(db.DateTime, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    
    # Cancellation Information
    cancellation_reason = db.Column(db.String(200), nullable=True)
    cancellation_requested_at = db.Column(db.DateTime, nullable=True)
    cancellation_approved_at = db.Column(db.DateTime, nullable=True)
    cancellation_rejected_at = db.Column(db.DateTime, nullable=True)
    cancellation_rejected_reason = db.Column(db.String(200), nullable=True)
    cancelled_by = db.Column(db.String(50), nullable=True)  # seller or customer
    
    # Relationships
    user = db.relationship('Users', backref=db.backref('orders', lazy=True))
    items = db.relationship('OrderItem', backref='order', lazy=True)

    def to_dict(self):
        return {
            'order_uuid': self.order_uuid,
            'user_uuid': self.user_uuid,
            'status': self.status,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'transaction_id': self.transaction_id,
            'shipping_address': self.shipping_address,
            'shipping_method': self.shipping_method,
            'shipping_fee': float(self.shipping_fee),
            'tracking_number': self.tracking_number,
            'subtotal': float(self.subtotal),
            'total': float(self.total),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'shipped_at': self.shipped_at.isoformat() if self.shipped_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancellation_reason': self.cancellation_reason,
            'cancellation_requested_at': self.cancellation_requested_at.isoformat() if self.cancellation_requested_at else None,
            'cancellation_approved_at': self.cancellation_approved_at.isoformat() if self.cancellation_approved_at else None,
            'cancellation_rejected_at': self.cancellation_rejected_at.isoformat() if self.cancellation_rejected_at else None,
            'cancellation_rejected_reason': self.cancellation_rejected_reason,
            'cancelled_by': self.cancelled_by,
            'items': [item.to_dict() for item in self.items]
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    item_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_uuid = db.Column(db.String(36), db.ForeignKey('orders.order_uuid'), nullable=False)
    product_uuid = db.Column(db.String(36), db.ForeignKey('products.product_uuid'), nullable=False)
    variation_uuid = db.Column(db.String(36), db.ForeignKey('product_variations.variation_uuid'), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    selected_option = db.Column(db.JSON, nullable=True)
    
    # Relationships
    product = db.relationship('Product', backref=db.backref('order_items', lazy=True))
    variation = db.relationship('ProductVariation', backref=db.backref('order_items', lazy=True))

    def to_dict(self):
        # Get variation details if they exist
        variation_details = None
        if self.variation_uuid and self.selected_option:
            variation_details = {
                'variation_uuid': self.variation_uuid,
                'name': self.selected_option.get('name'),
                'value': self.selected_option.get('value'),
                'sku': self.selected_option.get('sku')
            }

        return {
            'item_uuid': self.item_uuid,
            'order_uuid': self.order_uuid,
            'product_uuid': self.product_uuid,
            'variation_uuid': self.variation_uuid,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'subtotal': float(self.subtotal),
            'selected_option': self.selected_option,
            'variation': variation_details,
            'product': {
                'product_uuid': self.product.product_uuid,
                'name': self.product.name,
                'main_image': self.product.main_image,
                'sku': self.selected_option['sku'] if self.selected_option and 'sku' in self.selected_option else self.product.sku
            }
        }

class SellerTransaction(db.Model):
    __tablename__ = 'seller_transactions'
    
    transaction_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = db.Column(db.String(36), db.ForeignKey('seller_info.seller_id'), nullable=False)
    order_uuid = db.Column(db.String(36), db.ForeignKey('orders.order_uuid'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'order', 'withdrawal', 'refund'
    status = db.Column(db.String(20), nullable=False, default='pending')  # 'pending', 'completed', 'failed'
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    seller = db.relationship('SellerInfo', backref=db.backref('transactions', lazy=True))
    order = db.relationship('Order', backref=db.backref('seller_transactions', lazy=True))

    def to_dict(self):
        return {
            'transaction_uuid': self.transaction_uuid,
            'seller_id': self.seller_id,
            'order_uuid': self.order_uuid,
            'amount': float(self.amount),
            'type': self.type,
            'status': self.status,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class BankAccount(db.Model):
    __tablename__ = 'bank_accounts'
    
    account_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = db.Column(db.String(36), db.ForeignKey('seller_info.seller_id'), nullable=False)
    bank_name = db.Column(db.String(100), nullable=False)
    account_name = db.Column(db.String(100), nullable=False)
    account_number = db.Column(db.String(50), nullable=False)
    branch = db.Column(db.String(100), nullable=True)
    is_primary = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    seller = db.relationship('SellerInfo', backref=db.backref('bank_accounts', lazy=True))

    def to_dict(self):
        return {
            'account_uuid': self.account_uuid,
            'seller_id': self.seller_id,
            'bank_name': self.bank_name,
            'account_name': self.account_name,
            'account_number': self.account_number,
            'branch': self.branch,
            'is_primary': self.is_primary,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Withdrawal(db.Model):
    __tablename__ = 'withdrawals'
    
    withdrawal_uuid = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = db.Column(db.String(36), db.ForeignKey('seller_info.seller_id'), nullable=False)
    bank_account_uuid = db.Column(db.String(36), db.ForeignKey('bank_accounts.account_uuid'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # 'pending', 'processing', 'completed', 'failed'
    reference_number = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    processed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    seller = db.relationship('SellerInfo', backref=db.backref('withdrawals', lazy=True))
    bank_account = db.relationship('BankAccount', backref=db.backref('withdrawals', lazy=True))

    def to_dict(self):
        return {
            'withdrawal_uuid': self.withdrawal_uuid,
            'seller_id': self.seller_id,
            'bank_account_uuid': self.bank_account_uuid,
            'amount': float(self.amount),
            'status': self.status,
            'reference_number': self.reference_number,
            'notes': self.notes,
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'bank_account': self.bank_account.to_dict() if self.bank_account else None
        }