from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from __init__ import db, Users, Address, PaymentMethod
import cloudinary.uploader


profile_bp = Blueprint('profile', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@profile_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Not authenticated'}), 401
        
    return jsonify({
        'username': current_user.username,
        'email': current_user.email,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'phone': current_user.phone,
        'gender': current_user.gender,
        'date_of_birth': current_user.date_of_birth.strftime('%Y-%m-%d') if current_user.date_of_birth else None,
        'profile_image': current_user.profile_image_url
    })


@profile_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        # Handle file upload first if exists
        profile_image_url = None
        if 'profileImage' in request.files:
            profile_image = request.files['profileImage']
            if profile_image and allowed_file(profile_image.filename):
                try:
                    # Upload image to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        profile_image,
                        folder="flaskify/profile-images",  # Specify your folder path here
                        public_id=f"user_{current_user.user_uuid}",    # Optional: Set a custom public ID
                        overwrite=True,                         # Overwrite existing image with same public_id
                        resource_type="auto",                   # Auto-detect resource type
                        transformation={                        # Optional: Add transformations
                            'width': 500,                      # Resize to width
                            'height': 500,                     # Resize to height
                            'crop': 'fill',                    # Crop method
                            'gravity': 'face'                  # Focus on face if present
                        }
                    )
                    profile_image_url = upload_result['secure_url']
                    current_user.profile_image_url = profile_image_url
                except Exception as e:
                    return jsonify({'error': f'Error uploading image: {str(e)}'}), 500

        # Handle form data
        # Get form fields, checking both form and json data
        data = request.form.to_dict() if request.form else request.json

        if not data and not profile_image_url:
            return jsonify({'error': 'No data provided'}), 400

        # Update user fields if provided
        if 'username' in data and data['username'] != current_user.username:
            existing_user = Users.query.filter_by(username=data['username']).first()
            if existing_user:
                return jsonify({'error': 'Username already exists'}), 400
            current_user.username = data['username']
            
        if 'email' in data and data['email'] != current_user.email:
            existing_email = Users.query.filter_by(email=data['email']).first()
            if existing_email:
                return jsonify({'error': 'Email already exists'}), 400
            current_user.email = data['email']
            
        if 'firstName' in data:
            current_user.first_name = data['firstName']
        if 'lastName' in data:
            current_user.last_name = data['lastName']
        if 'phone' in data:
            current_user.phone = data['phone']
        if 'gender' in data:
            current_user.gender = data['gender']
        if 'date_of_birth' in data and data['date_of_birth']:
            try:
                current_user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format'}), 400

        # Commit the changes
        db.session.add(current_user)
        db.session.commit()
        
        response_data = {'message': 'Profile updated successfully'}
        if profile_image_url:
            response_data['url'] = profile_image_url
            
        return jsonify(response_data)

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

@profile_bp.route('/profile/image', methods=['POST'])
@login_required
def upload_profile_image():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Not authenticated'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file.content_length > 5 * 1024 * 1024:
        return jsonify({'error': 'File size exceeds 5 MB limit'}), 400

    if file and allowed_file(file.filename):
        try:
            # Upload image to Cloudinary
            upload_result = cloudinary.uploader.upload(file)
            current_user.profile_image_url = upload_result['secure_url']  # Save the secure URL in the user's profile
            
            db.session.add(current_user)
            db.session.commit()
            return jsonify({'message': 'Profile image uploaded successfully', 'url': current_user.profile_image_url}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Invalid file type'}), 400
    


@profile_bp.route('/api/addresses', methods=['POST'])
@login_required
def add_address():
    data = request.json
    
    # Create new address
    new_address = Address(
        user_uuid=current_user.user_uuid,
        address_name=data['address_name'],
        recipient_name=data['recipient_name'],
        phone_number=data['phone_number'],
        country=data['country'],
        province=data['province'],
        city=data['city'],
        postal_code=data['postal_code'],
        complete_address=data['complete_address'],
        additional_info=data.get('additional_info', '')
    )
    
    # If this is the user's first address, make it active and default
    existing_addresses = Address.query.filter_by(user_uuid=current_user.user_uuid).count()
    if not existing_addresses:
        new_address.is_active = True
        new_address.is_default_shipping = True
        new_address.is_default_billing = True
    
    db.session.add(new_address)
    db.session.commit()
    
    return jsonify({
        'message': 'Address added successfully',
        'address_uuid': new_address.address_uuid
    })

@profile_bp.route('/api/addresses/<address_uuid>/set-active', methods=['POST'])
@login_required
def set_active_address(address_uuid):
    if current_user.set_active_address(address_uuid):
        return jsonify({'message': 'Active address updated successfully'})
    return jsonify({'error': 'Address not found'}), 404


@profile_bp.route('/api/addresses/<address_uuid>', methods=['DELETE'])
@login_required
def delete_address(address_uuid):
    try:
        # Find the address
        address = Address.query.filter_by(
            address_uuid=address_uuid,
            user_uuid=current_user.user_uuid
        ).first()
        
        if not address:
            return jsonify({
                'error': 'Address not found'
            }), 404
            
        # Check if this is the user's only address
        address_count = Address.query.filter_by(
            user_uuid=current_user.user_uuid,
            is_deleted=False
        ).count()
        
        if address_count == 1:
            return jsonify({
                'error': 'Cannot delete the only address. Please add another address first.'
            }), 400
        
        # Perform soft delete
        address.soft_delete()
        
        return jsonify({
            'message': 'Address deleted successfully',
            'address_uuid': address_uuid
        })
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'error': 'Database error occurred',
            'details': str(e)
        }), 500


@profile_bp.route('/api/addresses/<address_uuid>/hard-delete', methods=['DELETE'])
@login_required
def hard_delete_address(address_uuid):
    try:
        # Find the address
        address = Address.query.filter_by(
            address_uuid=address_uuid,
            user_uuid=current_user.user_uuid
        ).first()
        
        if not address:
            return jsonify({
                'error': 'Address not found'
            }), 404
            
        # Check if this is the user's only address
        address_count = Address.query.filter_by(
            user_uuid=current_user.user_uuid,
            is_deleted=False
        ).count()
        
        if address_count == 1:
            return jsonify({
                'error': 'Cannot delete the only address. Please add another address first.'
            }), 400
        
        # Perform hard delete
        db.session.delete(address)
        db.session.commit()
        
        return jsonify({
            'message': 'Address permanently deleted',
            'address_uuid': address_uuid
        })
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'error': 'Database error occurred',
            'details': str(e)
        }), 500

# Optional: Endpoint to restore a soft-deleted address
@profile_bp.route('/api/addresses/<address_uuid>/restore', methods=['POST'])
@login_required
def restore_address(address_uuid):
    try:
        address = Address.query.filter_by(
            address_uuid=address_uuid,
            user_uuid=current_user.user_uuid,
            is_deleted=True
        ).first()
        
        if not address:
            return jsonify({
                'error': 'Deleted address not found'
            }), 404
            
        address.is_deleted = False
        address.deleted_at = None
        db.session.commit()
        
        return jsonify({
            'message': 'Address restored successfully',
            'address_uuid': address_uuid
        })
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'error': 'Database error occurred',
            'details': str(e)
        }), 500

# Modified get addresses endpoint to include filter for deleted addresses
@profile_bp.route('/api/addresses', methods=['GET'])
@login_required
def get_addresses():
    # Get query parameter for including deleted addresses
    include_deleted = request.args.get('include_deleted', 'false').lower() == 'true'
    
    # Build query
    query = Address.query.filter_by(user_uuid=current_user.user_uuid)
    if not include_deleted:
        query = query.filter_by(is_deleted=False)
        
    addresses = query.all()
    
    return jsonify([{
        'address_uuid': addr.address_uuid,
        'address_name': addr.address_name,
        'recipient_name': addr.recipient_name,
        'phone_number': addr.phone_number,
        'country': addr.country,
        'province': addr.province,
        'city': addr.city,
        'postal_code': addr.postal_code,
        'complete_address': addr.complete_address,
        'additional_info': addr.additional_info,
        'is_active': addr.is_active,
        'is_default_shipping': addr.is_default_shipping,
        'is_default_billing': addr.is_default_billing,
        'is_deleted': addr.is_deleted,
        'deleted_at': addr.deleted_at.isoformat() if addr.deleted_at else None,
        'created_at': addr.created_at.isoformat(),
        'updated_at': addr.updated_at.isoformat()
    } for addr in addresses])


@profile_bp.route('/api/addresses/<address_uuid>', methods=['PUT'])
@login_required
def update_address(address_uuid):
    try:
        # Find the address
        address = Address.query.filter_by(
            address_uuid=address_uuid,
            user_uuid=current_user.user_uuid,
            is_deleted=False
        ).first()
        
        if not address:
            return jsonify({
                'error': 'Address not found'
            }), 404
            
        # Get update data
        data = request.json
        
        # Update fields if provided in request
        if 'address_name' in data:
            address.address_name = data['address_name']
        if 'recipient_name' in data:
            address.recipient_name = data['recipient_name']
        if 'phone_number' in data:
            address.phone_number = data['phone_number']
        if 'country' in data:
            address.country = data['country']
        if 'province' in data:
            address.province = data['province']
        if 'city' in data:
            address.city = data['city']
        if 'postal_code' in data:
            address.postal_code = data['postal_code']
        if 'complete_address' in data:
            address.complete_address = data['complete_address']
        if 'additional_info' in data:
            address.additional_info = data['additional_info']
        if 'is_default_shipping' in data:
            # If setting as default shipping, unset other addresses
            if data['is_default_shipping']:
                Address.query.filter_by(
                    user_uuid=current_user.user_uuid,
                    is_deleted=False,
                    is_default_shipping=True
                ).update({'is_default_shipping': False})
            address.is_default_shipping = data['is_default_shipping']
        if 'is_default_billing' in data:
            # If setting as default billing, unset other addresses
            if data['is_default_billing']:
                Address.query.filter_by(
                    user_uuid=current_user.user_uuid,
                    is_deleted=False,
                    is_default_billing=True
                ).update({'is_default_billing': False})
            address.is_default_billing = data['is_default_billing']
            
        db.session.commit()
        
        return jsonify({
            'message': 'Address updated successfully',
            'address_uuid': address_uuid
        })
        
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({
            'error': 'Database error occurred',
            'details': str(e)
        }), 500
    

# PAYMENT METHODS
@profile_bp.route('/api/payment-methods', methods=['GET', 'POST'])
@login_required
def payment_methods():
    if request.method == 'POST':
        data = request.get_json()
        payment_type = data['payment_type']
        payment_details = {}

        # Handle different payment types
        if payment_type == 'card':
            card_number = data['card_number']
            
            # Validate Visa or Mastercard based on starting digits
            if not (card_number.startswith('4') or 
                    51 <= int(card_number[:2]) <= 55 or 
                    2221 <= int(card_number[:4]) <= 2720):
                return jsonify({'error': 'Only Visa and Mastercard are accepted'}), 400

            payment_details = {
                'card_number': card_number,
                'expiry_date': data['expiry_date'],
                'card_holder_name': data['card_holder_name'],
                'cvv': data['cvv']
            }
        elif payment_type == 'paypal':
            payment_details = {
                'paypal_email': data['paypal_email']
            }
        elif payment_type == 'cod':
            payment_details = {'description': 'Cash on Delivery'}
        else:
            return jsonify({'error': 'Unsupported payment type'}), 400

        payment_method = PaymentMethod(
            user_uuid=current_user.user_uuid,  # Use the current user's ID
            payment_type=payment_type,
            payment_details=payment_details,
            is_default=data.get('is_default', False)
        )
        db.session.add(payment_method)
        db.session.commit()
        return jsonify(payment_method.to_dict()), 201
    else:
        payment_methods = PaymentMethod.query.filter_by(user_uuid=current_user.user_uuid).all()
        return jsonify([pm.to_dict() for pm in payment_methods])
    

@profile_bp.route('/api/payment-methods/<int:id>/set-default', methods=['POST'])
@login_required
def set_default_payment_method(id):
    # Fetch the payment method and check if it belongs to the current user
    payment_method = PaymentMethod.query.get_or_404(id)
    if payment_method.user_uuid != current_user.user_uuid:
        return jsonify({'error': 'Unauthorized access'}), 403

    # Unset all other default payment methods for the user
    PaymentMethod.query.filter_by(user_uuid=current_user.user_uuid, is_default=True).update({'is_default': False})
    payment_method.is_default = True
    db.session.commit()

    return jsonify(payment_method.to_dict()), 200


@profile_bp.route('/api/payment-methods/<id>', methods=['DELETE'])
@login_required
def delete_payment_method(id):
    # Fetch the payment method by ID and check if it belongs to the current user
    payment_method = PaymentMethod.query.get_or_404(id)
    if payment_method.user_uuid != current_user.user_uuid:
        return jsonify({'error': 'Unauthorized access'}), 403

    # Delete the payment method
    db.session.delete(payment_method)
    db.session.commit()
    
    return jsonify({'message': 'Payment method deleted'}), 204