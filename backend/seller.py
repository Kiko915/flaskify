from flask import request, jsonify, Blueprint
from flask_login import login_required, current_user
from datetime import datetime
from sqlalchemy import or_
from __init__ import SellerInfo, Shop, db, Users, Role  # Ensure Shop is imported
from utils.emails import send_seller_approval_email
import cloudinary.uploader
from utils.auth_utils import role_required

seller = Blueprint('seller', __name__)

def check_existing_seller(owner_name, email):
    """
    Check if a seller with the given owner name or email already exists.
    Returns a tuple of (exists, message).
    """
    existing_seller = SellerInfo.query.filter(
        or_(
            SellerInfo.business_owner.ilike(owner_name),  # Case-insensitive comparison
            SellerInfo.business_email == email
        )
    ).first()

    if existing_seller:
        if existing_seller.business_owner.lower() == owner_name.lower():
            return True, "A seller with this owner name already exists"
        if existing_seller.business_email == email:
            return True, "This email is already registered with another seller"
    
    return False, None

@seller.route('/seller', methods=['POST'])
@login_required
def add_seller():
    try:
        # Retrieve form data
        data = request.form.to_dict()
        owner_name = data.get('ownerName')  # Use owner name for checking
        business_email = data.get('email')

        if not owner_name or not business_email:
            return jsonify({'message': 'Owner name and email are required'}), 400

        # Check for existing seller
        exists, error_message = check_existing_seller(owner_name, business_email)
        if exists:
            return jsonify({
                "message": error_message,
                "error": "duplicate_entry"
            }), 409  # 409 Conflict status code

        has_tin = data.get('hasTIN') == 'true'
        bir_certificate = request.files.get('birCertificate')

        # Upload BIR certificate to Cloudinary if provided
        bir_certificate_url = None
        if bir_certificate:
            try:
                upload_result = cloudinary.uploader.upload(
                    bir_certificate,
                    folder="bir_certificates",  # Cloudinary folder to organize uploads
                    resource_type="raw",  # For handling documents
                    allowed_formats=["pdf", "png", "jpg", "jpeg"],  # Allowed file formats
                    public_id=f"bir_{current_user.user_uuid}_{datetime.now().timestamp()}"  # Unique identifier
                )
                bir_certificate_url = upload_result['secure_url']
            except Exception as upload_error:
                return jsonify({
                    "message": "Failed to upload BIR certificate",
                    "error": str(upload_error)
                }), 400

        # Create new seller instance
        new_seller = SellerInfo(
            user_uuid=current_user.user_uuid,  # Associate with current user
            business_owner=owner_name,
            business_type=data.get('sellerType'),
            tax_id=data.get('tinNumber') if has_tin else None,
            business_email=business_email,
            business_phone=data.get('phNum'),
            tax_certificate_doc=bir_certificate_url,
            date_registered=datetime.now(),
            status='Pending'  # Initial status for admin review
        )

        # Save to database
        db.session.add(new_seller)
        db.session.commit()

        return jsonify({
            "message": "Seller registration submitted successfully!",
            "seller_id": new_seller.seller_id  # Changed to seller_id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": "Failed to register seller",
            "error": str(e)
        }), 500

@seller.route('/seller/check-availability', methods=['POST'])
@login_required
def check_availability():
    data = request.json
    owner_name = data.get('owner_name')
    email = data.get('email')
    
    if not owner_name and not email:
        return jsonify({
            "message": "Please provide owner name or email to check",
        }), 400

    exists, message = check_existing_seller(owner_name, email)
    
    return jsonify({
        "available": not exists,
        "message": message if exists else "Available"
    }), 200 if not exists else 409


@seller.route('/sellers', methods=['GET'])
@login_required
@role_required(Role.ADMIN)
def get_all_sellers():
    sellers = SellerInfo.query.all()
    print(sellers)
    return jsonify([{
        "id": seller.seller_id,
        "business_owner": seller.business_owner,
        "business_type": seller.business_type,
        "status": seller.status,
        "submission_date": seller.date_registered,
        "tax_id": seller.tax_id,
        "business_email": seller.business_email,
        "bir_certificate": seller.tax_certificate_doc,
    } for seller in sellers])


@seller.route('/seller/<string:seller_id>', methods=['GET'])
@login_required
@role_required([Role.ADMIN, Role.SELLER])
def get_seller(seller_id):
    seller = SellerInfo.query.get(seller_id)
    """if not seller or seller.user_uuid != current_user.user_uuid:
        return jsonify({"error": "Seller not found or access denied"}), 404"""

    return jsonify({
        "business_owner": seller.business_owner,
        "business_type": seller.business_type,
        "tax_id": seller.tax_id,
        "business_email": seller.business_email,
        "business_phone": seller.business_phone,
        "status": seller.status,
        "admin_notes": seller.admin_notes,
        "approval_date": seller.approval_date,
        "total_sales": seller.total_sales 
    })

@seller.route('/seller/status', methods=['GET'])
@login_required
@role_required([Role.ADMIN, Role.SELLER])
def check_status():
    email = request.args.get('email')
    seller = SellerInfo.query.filter_by(business_email=email).first()

    if not seller:
        return jsonify({"message": "Seller not found"}), 404

    return jsonify({"status": seller.status}), 200

@seller.route('/seller/<string:seller_id>', methods=['PUT'])
@login_required
@role_required([Role.ADMIN, Role.SELLER])
def update_seller(seller_id):
    seller = SellerInfo.query.get(seller_id)
    if not seller or seller.user_uuid != current_user.user_uuid:
        return jsonify({"error": "Seller not found or access denied"}), 404
    
    data = request.get_json()
    
    # Update seller fields
    seller.business_owner = data.get('business_owner', seller.business_owner)
    seller.business_type = data.get('business_type', seller.business_type)
    seller.tax_id = data.get('tax_id', seller.tax_id)
    seller.business_email = data.get('business_email', seller.business_email)
    seller.business_phone = data.get('business_phone', seller.business_phone)
    seller.business_country = data.get('business_country', seller.business_country)
    seller.business_province = data.get('business_province', seller.business_province)
    seller.business_city = data.get('business_city', seller.business_city)
    seller.business_address = data.get('business_address', seller.business_address)
    seller.last_updated = datetime.now()

    db.session.commit()
    
    return jsonify({"message": "Seller information updated successfully"})


@seller.route('/admin/seller/<string:seller_id>/status', methods=['PATCH'])
@login_required
@role_required(Role.ADMIN)
def update_seller_status(seller_id):
    if not current_user.is_admin():  
        return jsonify({"error": "Access denied. Admins only"}), 403
    
    seller = SellerInfo.query.get(seller_id)
    if not seller:
        return jsonify({"error": "Seller not found"}), 404
    
    data = request.get_json()
    new_status = data.get('status')
    admin_notes = data.get('remarks')
    
    # Validate status
    if new_status not in ['Pending', 'Approved', 'Rejected']:
        return jsonify({"error": "Invalid status"}), 400
    
    try:
        # Update seller status with admin info
        seller.update_status(new_status, current_user, admin_notes)  # Pass current_user as admin
        
        # If status is Approved, update user role to Seller
        if new_status == 'Approved':
            user = Users.query.get(seller.user_uuid)  # Assuming seller model has user_id field
            if user:
                # Option 2: If using role enum
                user.role = Role.SELLER
                
                # Option 3: If using many-to-many relationship with Role model
                # seller_role = Role.query.filter_by(name='seller').first()
                # if seller_role and seller_role not in user.roles:
                #     user.roles.append(seller_role)
        
        # Send email notification to seller
        send_seller_approval_email(seller.business_email, seller.business_owner)

        db.session.commit()
        return jsonify({
            "message": f"Seller status updated to {new_status}",
            "role_updated": new_status == 'Approved'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Failed to update seller status",
            "details": str(e)
        }), 500