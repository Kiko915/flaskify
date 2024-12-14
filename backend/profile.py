from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from models import db, Users, Address, PaymentMethod, SellerInfo, Role
import cloudinary.uploader


profile_bp = Blueprint('profile', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@profile_bp.route('/user/account', methods=['GET'])
@login_required
def get_profile():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Not authenticated'}), 401
        
    # Get seller info if exists
    seller_info = None
    if current_user.role == Role.SELLER:
        seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
        if seller:
            seller_info = {
                'seller_id': seller.seller_id,
                'business_name': seller.business_name,
                'status': seller.status
            }

    return jsonify({
        'user_uuid': current_user.user_uuid,
        'username': current_user.username,
        'email': current_user.email,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'phone': current_user.phone,
        'gender': current_user.gender,
        'country': current_user.country,
        'province': current_user.province,
        'city': current_user.city,
        'complete_address': current_user.complete_address,
        'role': current_user.role,
        'status': current_user.status,
        'date_joined': current_user.date_joined.isoformat() if current_user.date_joined else None,
        'is_verified': current_user.is_verified,
        'date_of_birth': current_user.date_of_birth.strftime('%Y-%m-%d') if current_user.date_of_birth else None,
        'profile_image_url': current_user.profile_image_url,
        'seller': seller_info
    })


@profile_bp.route('/user/account', methods=['PUT'])
@login_required
def update_profile():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        # Handle file upload first if exists
        profile_image_url = None
        if request.files and 'profileImage' in request.files:
            profile_image = request.files['profileImage']
            if profile_image and allowed_file(profile_image.filename):
                try:
                    # Upload image to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        profile_image,
                        folder="flaskify/profile-images",
                        public_id=f"user_{current_user.user_uuid}",
                        overwrite=True,
                        resource_type="auto",
                        transformation={
                            'width': 500,
                            'height': 500,
                            'crop': 'fill',
                            'gravity': 'face'
                        }
                    )
                    profile_image_url = upload_result['secure_url']
                    current_user.profile_image_url = profile_image_url
                except Exception as e:
                    print(f"Error uploading image: {str(e)}")
                    return jsonify({'error': f'Error uploading image: {str(e)}'}), 500

        # Handle form data
        # Get form fields, checking both form and json data
        data = request.form.to_dict() if request.form else request.get_json()

        if not data and not profile_image_url:
            return jsonify({'error': 'No data provided'}), 400

        # Update user fields if provided
        if 'username' in data and data['username'] != current_user.username:
            existing_user = Users.query.filter_by(username=data['username']).first()
            if existing_user and existing_user.user_uuid != current_user.user_uuid:
                return jsonify({'error': 'Username already exists'}), 400
            current_user.username = data['username']
            
        if 'email' in data and data['email'] != current_user.email:
            existing_email = Users.query.filter_by(email=data['email']).first()
            if existing_email and existing_email.user_uuid != current_user.user_uuid:
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
        if 'dateOfBirth' in data and data['dateOfBirth']:
            try:
                current_user.date_of_birth = datetime.strptime(data['dateOfBirth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format'}), 400
        if 'country' in data:
            current_user.country = data['country']
        if 'province' in data:
            current_user.province = data['province']
        if 'city' in data:
            current_user.city = data['city']
        if 'completeAddress' in data:
            current_user.complete_address = data['completeAddress']

        # Commit the changes
        db.session.commit()
        
        # Get seller info if exists
        seller_info = None
        if current_user.role == 'Seller':
            seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
            if seller:
                seller_info = {
                    'seller_id': seller.seller_id,
                    'business_name': seller.business_name,
                    'status': seller.status
                }

        # Return updated user data
        response_data = {
            'message': 'Profile updated successfully',
            'user': {
                'user_uuid': current_user.user_uuid,
                'username': current_user.username,
                'email': current_user.email,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'phone': current_user.phone,
                'gender': current_user.gender,
                'country': current_user.country,
                'province': current_user.province,
                'city': current_user.city,
                'complete_address': current_user.complete_address,
                'role': current_user.role,
                'status': current_user.status,
                'date_joined': current_user.date_joined.isoformat() if current_user.date_joined else None,
                'is_verified': current_user.is_verified,
                'date_of_birth': current_user.date_of_birth.strftime('%Y-%m-%d') if current_user.date_of_birth else None,
                'profile_image_url': current_user.profile_image_url,
                'seller': seller_info
            }
        }
            
        return jsonify(response_data)

    except Exception as e:
        print(f"Error updating profile: {str(e)}")
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
        payment_type = data['type']

        # Handle different payment types
        if payment_type == 'credit_card':
            card_number = data['card_number']
            
            # Validate Visa or Mastercard based on starting digits
            if not (card_number.startswith('4') or 
                    51 <= int(card_number[:2]) <= 55 or 
                    2221 <= int(card_number[:4]) <= 2720):
                return jsonify({'error': 'Only Visa and Mastercard are accepted'}), 400

            payment_method = PaymentMethod(
                user_uuid=current_user.user_uuid,
                type=payment_type,
                card_type='visa' if card_number.startswith('4') else 'mastercard',
                last_four=card_number[-4:],
                expiry_month=data['expiry_month'],
                expiry_year=data['expiry_year'],
                card_holder_name=data['card_holder_name'],
                is_default=data.get('is_default', False)
            )
        elif payment_type == 'paypal':
            payment_method = PaymentMethod(
                user_uuid=current_user.user_uuid,
                type=payment_type,
                paypal_email=data['paypal_email'],
                is_default=data.get('is_default', False)
            )
        elif payment_type == 'cod':
            payment_method = PaymentMethod(
                user_uuid=current_user.user_uuid,
                type=payment_type,
                is_default=data.get('is_default', False)
            )
        else:
            return jsonify({'error': 'Unsupported payment type'}), 400

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