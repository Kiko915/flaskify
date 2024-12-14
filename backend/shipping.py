from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, ShippingProvider, ShippingRate
from datetime import datetime
from decimal import Decimal
import os
from werkzeug.utils import secure_filename
from uuid import uuid4

shipping = Blueprint('shipping', __name__)

UPLOAD_FOLDER = 'static/uploads/shipping'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_logo(file):
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    filename = secure_filename(file.filename)
    ext = filename.rsplit('.', 1)[1].lower()
    new_filename = f"{uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, new_filename)
    file.save(file_path)
    return f"/static/uploads/shipping/{new_filename}"

# Shipping Provider Routes
@shipping.route('/admin/shipping-providers', methods=['GET', 'POST'])
@login_required
def manage_shipping_providers():
    if request.method == 'GET':
        providers = ShippingProvider.query.all()
        return jsonify([provider.to_dict() for provider in providers])
    
    elif request.method == 'POST':
        # Handle logo upload
        logo_url = None
        if 'logo' in request.files:
            file = request.files['logo']
            if file and allowed_file(file.filename):
                logo_url = save_logo(file)

        # Get other data from form
        data = request.form.to_dict()
        
        # Convert string values to boolean
        data['is_active'] = data.get('is_active', 'false').lower() == 'true'
        data['is_default'] = data.get('is_default', 'false').lower() == 'true'
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({'message': 'Provider name is required'}), 400
        
        # If this is marked as default, unset any existing default
        if data.get('is_default'):
            current_default = ShippingProvider.query.filter_by(is_default=True).first()
            if current_default:
                current_default.is_default = False
        
        provider = ShippingProvider(
            name=data['name'],
            description=data.get('description'),
            logo_url=logo_url,
            is_active=data.get('is_active', True),
            is_default=data.get('is_default', False)
        )
        
        db.session.add(provider)
        db.session.commit()
        
        return jsonify(provider.to_dict()), 201

@shipping.route('/admin/shipping-providers/<string:provider_uuid>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_shipping_provider(provider_uuid):
    provider = ShippingProvider.query.get_or_404(provider_uuid)
    
    if request.method == 'GET':
        return jsonify(provider.to_dict())
    
    elif request.method == 'PUT':
        # Handle logo upload
        if 'logo' in request.files:
            file = request.files['logo']
            if file and allowed_file(file.filename):
                # Delete old logo if exists
                if provider.logo_url:
                    old_logo_path = os.path.join('static', provider.logo_url.lstrip('/'))
                    if os.path.exists(old_logo_path):
                        os.remove(old_logo_path)
                
                provider.logo_url = save_logo(file)

        # Get other data from form
        data = request.form.to_dict()
        
        # Convert string values to boolean
        if 'is_active' in data:
            data['is_active'] = data['is_active'].lower() == 'true'
        if 'is_default' in data:
            data['is_default'] = data['is_default'].lower() == 'true'
        
        if 'name' in data:
            provider.name = data['name']
        if 'description' in data:
            provider.description = data['description']
        if 'is_active' in data:
            provider.is_active = data['is_active']
        if 'is_default' in data and data['is_default']:
            # Unset any existing default
            current_default = ShippingProvider.query.filter_by(is_default=True).first()
            if current_default and current_default.provider_uuid != provider_uuid:
                current_default.is_default = False
            provider.is_default = True
        
        db.session.commit()
        return jsonify(provider.to_dict())
    
    elif request.method == 'DELETE':
        if provider.is_default:
            return jsonify({'message': 'Cannot delete the default shipping provider'}), 400
        
        # Delete logo if exists
        if provider.logo_url:
            logo_path = os.path.join('static', provider.logo_url.lstrip('/'))
            if os.path.exists(logo_path):
                os.remove(logo_path)
        
        db.session.delete(provider)
        db.session.commit()
        return '', 204

# Shipping Rate Routes
@shipping.route('/admin/shipping-providers/<string:provider_uuid>/rates', methods=['GET', 'POST'])
@login_required
def manage_shipping_rates(provider_uuid):
    provider = ShippingProvider.query.get_or_404(provider_uuid)
    
    if request.method == 'GET':
        return jsonify([rate.to_dict() for rate in provider.rates])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'base_rate', 'weight_rate']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        rate = ShippingRate(
            provider_uuid=provider_uuid,
            name=data['name'],
            description=data.get('description'),
            base_rate=data['base_rate'],
            weight_rate=data['weight_rate'],
            min_weight=data.get('min_weight', 0.0),
            max_weight=data.get('max_weight'),
            estimated_days=data.get('estimated_days'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(rate)
        db.session.commit()
        
        return jsonify(rate.to_dict()), 201

@shipping.route('/admin/shipping-rates/<string:rate_uuid>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_shipping_rate(rate_uuid):
    rate = ShippingRate.query.get_or_404(rate_uuid)
    
    if request.method == 'GET':
        return jsonify(rate.to_dict())
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        updateable_fields = [
            'name', 'description', 'base_rate', 'weight_rate',
            'min_weight', 'max_weight', 'estimated_days', 'is_active'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(rate, field, data[field])
        
        db.session.commit()
        return jsonify(rate.to_dict())
    
    elif request.method == 'DELETE':
        db.session.delete(rate)
        db.session.commit()
        return '', 204

# Calculate shipping fee for a product
@shipping.route('/calculate/<string:rate_uuid>', methods=['POST'])
def calculate_shipping_fee(rate_uuid):
    rate = ShippingRate.query.get_or_404(rate_uuid)
    data = request.get_json()
    
    if 'weight' not in data:
        return jsonify({'message': 'Product weight is required'}), 400
    
    weight = float(data['weight'])
    fee = rate.calculate_shipping_fee(weight)
    
    if fee is None:
        return jsonify({
            'message': f'Weight exceeds maximum limit of {rate.max_weight}kg for this shipping rate'
        }), 400
    
    return jsonify({
        'shipping_fee': fee,
        'rate': rate.to_dict()
    })

# Get all active shipping providers and their rates
@shipping.route('/providers', methods=['GET'])
def get_active_providers():
    providers = ShippingProvider.query.filter_by(is_active=True).all()
    return jsonify([provider.to_dict() for provider in providers])

# Get active rates for a specific provider
@shipping.route('/providers/<string:provider_uuid>/rates', methods=['GET'])
def get_provider_rates(provider_uuid):
    provider = ShippingProvider.query.get_or_404(provider_uuid)
    active_rates = [rate for rate in provider.rates if rate.is_active]
    return jsonify([rate.to_dict() for rate in active_rates])

# Export the blueprint
__all__ = ['shipping'] 