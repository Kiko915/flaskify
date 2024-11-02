from flask import request, jsonify, Blueprint
from flask_login import login_required, current_user
from datetime import datetime
from sqlalchemy import or_
from __init__ import SellerInfo, db  # Adjust the import as necessary
import cloudinary.uploader

seller = Blueprint('seller', __name__)

def check_existing_seller(business_name, email):
    """
    Check if a seller with the given business name or email already exists
    Returns a tuple of (exists, message)
    """
    existing_seller = SellerInfo.query.filter(
        or_(
            SellerInfo.business_name.ilike(business_name),  # Case-insensitive comparison
            SellerInfo.business_email == email
        )
    ).first()

    if existing_seller:
        if existing_seller.business_name.lower() == business_name.lower():
            return True, "A shop with this business name already exists"
        if existing_seller.business_email == email:
            return True, "This email is already registered with another shop"
    
    return False, None


@seller.route('/seller', methods=['POST'])
@login_required
def add_seller():
    try:
        # Retrieve form data
        data = request.form.to_dict()
        business_name = data.get('shopName')
        business_email = data.get('email')

        if not business_name or not business_email:
            return jsonify({'message': 'Business name and email are required'}), 400

         # Check for existing seller
        exists, error_message = check_existing_seller(business_name, business_email)
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
            business_name=business_name,
            business_owner=data.get('ownerName'),
            business_type=data.get('sellerType'),
            tax_id=data.get('tinNumber') if has_tin else None,
            business_email=business_email,
            business_phone=data.get('phNum'),
            business_address=data.get('pickupAddress.completeAddress'),
            business_country=data.get('pickupAddress.country'),
            business_province=data.get('pickupAddress.province'),
            business_city=data.get('pickupAddress.city'),
            business_registration_doc=bir_certificate_url,
            date_registered=datetime.now(),
            seller_uuid=current_user.user_uuid,
            status='Pending'  # Initial status for admin review
        )

        # Save to database
        db.session.add(new_seller)
        db.session.commit()

        return jsonify({
            "message": "Seller registration submitted successfully!",
            "seller_id": new_seller.seller_uuid
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
    business_name = data.get('business_name')
    email = data.get('email')
    
    if not business_name and not email:
        return jsonify({
            "message": "Please provide business name or email to check",
        }), 400

    exists, message = check_existing_seller(business_name, email)
    
    return jsonify({
        "available": not exists,
        "message": message if exists else "Available"
    }), 200 if not exists else 409


@seller.route('/seller/<int:seller_id>', methods=['GET'])
@login_required
def get_seller(seller_id):
    seller = SellerInfo.query.get(seller_id)
    if not seller or seller.seller_uuid != current_user.user_uuid:
        return jsonify({"error": "Seller not found or access denied"}), 404

    return jsonify({
        "business_name": seller.business_name,
        "business_type": seller.business_type,
        "tax_id": seller.tax_id,
        "business_email": seller.business_email,
        "business_phone": seller.business_phone,
        "business_country": seller.business_country,
        "business_province": seller.business_province,
        "business_city": seller.business_city,
        "business_address": seller.business_address,
        "status": seller.status,
        "admin_notes": seller.admin_notes,
        "approval_date": seller.approval_date,
        "total_products": seller.total_products,
        "total_sales": seller.total_sales
    })


@seller.route('/seller/<int:seller_id>', methods=['PUT'])
@login_required
def update_seller(seller_id):
    seller = SellerInfo.query.get(seller_id)
    if not seller or seller.seller_uuid != current_user.user_uuid:
        return jsonify({"error": "Seller not found or access denied"}), 404
    
    data = request.get_json()
    
    # Update seller fields
    seller.business_name = data.get('business_name', seller.business_name)
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


@seller.route('/admin/seller/<int:seller_id>/status', methods=['PATCH'])
@login_required
def update_seller_status(seller_id):
    # Only allow admins to update the seller status
    if not current_user.is_admin:  # Assuming `is_admin` is a property of the user model
        return jsonify({"error": "Access denied. Admins only"}), 403
    
    seller = SellerInfo.query.get(seller_id)
    if not seller:
        return jsonify({"error": "Seller not found"}), 404
    
    data = request.get_json()
    new_status = data.get('status')
    admin_notes = data.get('admin_notes')
    
    # Update seller status with admin info
    if new_status in ['Pending', 'Approved', 'Rejected']:
        seller.update_status(new_status, current_user, admin_notes)  # Pass current_user as admin
        db.session.commit()
        return jsonify({"message": f"Seller status updated to {new_status}"})
    else:
        return jsonify({"error": "Invalid status"}), 400

