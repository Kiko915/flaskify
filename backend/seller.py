from flask import request, jsonify, Blueprint, send_from_directory
from flask_login import login_required, current_user
from datetime import datetime
from sqlalchemy import or_
from models import SellerInfo, Shop, db, Users, Role  
from utils.emails import send_seller_approval_email, send_seller_rejection_email, send_seller_suspension_email
from utils.auth_utils import role_required
from utils.ocr_utils import verify_bir_certificate
from utils.file_utils import verify_image_file
import cloudinary.uploader
import os

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
                # First validate the image file format and quality
                file_content = bir_certificate.read()
                is_valid_image, image_error = verify_image_file(file_content)
                if not is_valid_image:
                    return jsonify({
                        "message": "Invalid BIR certificate image",
                        "error": image_error,
                        "error_type": "invalid_image"
                    }), 400
                
                # Reset file pointer after reading
                bir_certificate.seek(0)
                
                # Now validate the BIR certificate content using OCR
                is_valid_bir, bir_error, viz_path = verify_bir_certificate(file_content)
                if not is_valid_bir:
                    return jsonify({
                        "message": "Invalid BIR certificate content",
                        "error": bir_error,
                        "error_type": "invalid_content",
                        "visualization": viz_path
                    }), 400
                    
                # Reset file pointer again before upload
                bir_certificate.seek(0)
                
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    bir_certificate,
                    folder="bir_certificates",
                    resource_type="auto",  # Changed to auto to handle different file types
                    allowed_formats=["pdf", "png", "jpg", "jpeg"]
                )
                bir_certificate_url = upload_result['secure_url']
            except Exception as e:
                print(f"Error processing file: {str(e)}")  # Add debugging
                return jsonify({
                    "message": "Failed to process BIR certificate",
                    "error": str(e)
                }), 400

        # Create new seller instance
        new_seller = SellerInfo(
            user_id=current_user.user_uuid,  # Use user_id as per model
            business_name=owner_name,
            business_owner=owner_name,
            business_type=data.get('sellerType'),
            business_email=business_email,
            business_phone=data.get('phNum'),
            business_country=data.get('country'),
            business_province=data.get('province'),
            business_city=data.get('city'),
            business_address=data.get('address'),
            tax_id=data.get('taxId') if has_tin else None,
            tax_certificate_doc=bir_certificate_url,
            status='Pending'
        )

        # Save to database
        db.session.add(new_seller)
        db.session.commit()

        return jsonify({
            "message": "Seller registration submitted successfully!",
            "seller_id": new_seller.seller_id
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error in add_seller: {str(e)}")  # Add debugging
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
    seller_list = []
    
    for seller in sellers:
        seller_data = {
            "id": seller.seller_id,
            "business_owner": seller.business_owner,
            "business_email": seller.business_email,
            "business_phone": seller.business_phone,
            "business_type": seller.business_type,
            "status": seller.status,
            "submission_date": seller.submission_date,
            "tax_id": seller.tax_id,
            "bir_certificate": seller.tax_certificate_doc,
            "approval_date": seller.approval_date,
            "remarks": seller.remarks
        }
        
        # Get admin name if approved_by exists
        if seller.approved_by:
            admin = Users.query.get(seller.approved_by)
            seller_data["approved_by"] = f"{admin.first_name} {admin.last_name}" if admin else seller.approved_by
        else:
            seller_data["approved_by"] = None
            
        seller_list.append(seller_data)
    
    return jsonify(seller_list)


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
    if not seller or seller.user_id != current_user.user_uuid:
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
    try:
        data = request.get_json()
        new_status = data.get('status')
        remarks = data.get('remarks')
        approved_by = data.get('approved_by')
        violation_type = data.get('violation_type')
        rejection_reason = data.get('rejection_reason')

        if not new_status:
            return jsonify({'error': 'Status is required'}), 400

        seller = SellerInfo.query.get_or_404(seller_id)
        old_status = seller.status

        # Update seller status and related fields
        seller.status = new_status
        seller.remarks = remarks
        seller.approved_by = approved_by
        
        if new_status == 'Approved':
            seller.approval_date = datetime.now()
            # Update user role to Seller
            user = Users.query.get(seller.user_id)  # Use user_id as per model
            if user:
                user.role = Role.SELLER  # Use role as per Users model
                db.session.add(user)
        elif new_status == 'Suspended':
            if not violation_type:
                return jsonify({'error': 'Violation type is required for suspension'}), 400
            seller.violation_type = violation_type

        db.session.commit()

        # Send email notification based on status change
        try:
            if new_status == 'Approved':
                send_seller_approval_email(seller.business_email, seller.business_owner)
            elif new_status == 'Rejected':
                send_seller_rejection_email(seller.business_email, seller.business_owner, rejection_reason, remarks)
            elif new_status == 'Suspended':
                send_seller_suspension_email(seller.business_email, seller.business_owner, remarks, violation_type)
        except Exception as e:
            # Log the error but don't fail the status update
            print(f"Failed to send email notification: {str(e)}")

        return jsonify({
            'message': f'Seller status updated to {new_status}',
            'seller_id': seller_id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

# Add a new route to get all the shops of a seller by seller_id
@seller.route('/seller/<string:seller_id>/shops', methods=['GET'])
@login_required
@role_required([Role.ADMIN, Role.SELLER])
def get_seller_shops(seller_id):
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        sort_by = request.args.get('sort_by', 'date_created')  # Default sort by creation date
        order = request.args.get('order', 'desc')

        # Validate pagination parameters
        if page < 1 or per_page < 1 or per_page > 100:
            return jsonify({"error": "Invalid pagination parameters"}), 400

        # Check seller exists and verify access
        seller = SellerInfo.query.get(seller_id)
        if not seller:
            return jsonify({"error": "Seller not found"}), 404
        
        if seller.user_id != current_user.user_uuid and current_user.role != Role.ADMIN:
            return jsonify({"error": "Access denied"}), 403

        # Build the query
        query = Shop.query.filter_by(seller_id=seller_id)

        # Apply sorting
        if hasattr(Shop, sort_by):
            sort_column = getattr(Shop, sort_by)
            if order.lower() == 'desc':
                sort_column = sort_column.desc()
            query = query.order_by(sort_column)

        # Execute paginated query
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        shops = pagination.items

        # Prepare response
        shop_list = [{
            "shop_uuid": shop.shop_uuid,
            "business_name": shop.business_name,
            "business_country": shop.business_country,
            "business_province": shop.business_province,
            "business_city": shop.business_city,
            "business_address": shop.business_address,
            "shop_logo": shop.shop_logo,
            "total_products": shop.total_products,
            "shop_sales": float(shop.shop_sales) if shop.shop_sales else 0.00,
            "date_created": shop.date_created.isoformat() if shop.date_created else None,
            "last_updated": shop.last_updated.isoformat() if shop.last_updated else None,
            "is_active": shop.is_active(),
            "is_archived": shop.is_archived,
            "archived_at": shop.archived_at.isoformat() if shop.archived_at else None
        } for shop in shops]

        return jsonify({
            "shops": shop_list,
            "pagination": {
                "total_items": pagination.total,
                "total_pages": pagination.pages,
                "current_page": page,
                "per_page": per_page,
                "has_next": pagination.has_next,
                "has_prev": pagination.has_prev
            },
            "metadata": {
                "seller_name": seller.business_owner,
                "sort_by": sort_by,
                "order": order
            }
        })

    except Exception as e:
        return jsonify({"error": "An error occurred while fetching shops", "details": str(e)}), 500

@seller.route('/seller/<string:seller_id>/shops', methods=['POST'])
@login_required
@role_required([Role.ADMIN, Role.SELLER])
def create_shop(seller_id):
    try:
        # Verify seller exists and user has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller:
            return jsonify({"error": "Seller not found"}), 404
        
        if seller.user_id != current_user.user_uuid and current_user.role != Role.ADMIN:
            return jsonify({"error": "Access denied"}), 403

        # Verify seller is approved
        if seller.status != 'Approved':
            return jsonify({"error": "Seller must be approved to create shops"}), 403

        # Get form data
        business_name = request.form.get('business_name')
        business_country = request.form.get('business_country')
        business_province = request.form.get('business_province')
        business_city = request.form.get('business_city')
        business_address = request.form.get('business_address')

        # Validate required fields
        if not all([business_name, business_country, business_province, business_city, business_address]):
            return jsonify({"error": "Missing required fields"}), 400

        # Handle shop logo upload
        shop_logo_url = None
        if 'shop_logo' in request.files:
            shop_logo = request.files['shop_logo']
            if shop_logo:
                # Validate file size (5MB limit)
                file_data = shop_logo.read()
                if len(file_data) > 5 * 1024 * 1024:  # 5MB in bytes
                    return jsonify({"error": "Shop logo file size must be less than 5MB"}), 400

                # Verify image quality and format
                is_valid, message = verify_image_file(file_data)
                if not is_valid:
                    return jsonify({
                        "error": "Invalid shop logo image",
                        "details": message
                    }), 400

                # Reset file pointer for upload
                shop_logo.seek(0)

                try:
                    # Upload new logo to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        shop_logo,
                        folder="shop_logos",
                        resource_type="image",
                        allowed_formats=["jpg", "jpeg", "png"],
                        public_id=f"shop_logo_{seller_id}_{datetime.now().timestamp()}",
                        transformation={
                            'width': 500,
                            'height': 500,
                            'crop': 'fill',
                            'quality': 'auto:good'
                        }
                    )
                    shop_logo_url = upload_result['secure_url']
                except Exception as upload_error:
                    return jsonify({
                        "error": "Failed to upload shop logo",
                        "details": str(upload_error)
                    }), 400

        # Create new shop
        new_shop = Shop(
            seller_id=seller_id,
            business_name=business_name,
            business_country=business_country,
            business_province=business_province,
            business_city=business_city,
            business_address=business_address,
            shop_logo=shop_logo_url,
            total_products=0,
            shop_sales=0.00,
            date_created=datetime.now()
        )

        db.session.add(new_shop)
        db.session.commit()

        return jsonify({
            "message": "Shop created successfully",
            "shop_uuid": new_shop.shop_uuid,
            "business_name": new_shop.business_name,
            "shop_logo": new_shop.shop_logo
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Failed to create shop",
            "details": str(e)
        }), 500

@seller.route('/seller/<string:seller_id>/shops/<string:shop_uuid>', methods=['PUT'])
@login_required
@role_required([Role.ADMIN, Role.SELLER])
def update_shop(seller_id, shop_uuid):
    try:
        # Verify shop exists and belongs to seller
        shop = Shop.query.filter_by(shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not shop:
            return jsonify({"error": "Shop not found"}), 404

        # Verify user has permission
        if shop.seller_info.user_id != current_user.user_uuid and current_user.role != Role.ADMIN:
            return jsonify({"error": "Access denied"}), 403

        # Get form data
        business_name = request.form.get('business_name')
        business_country = request.form.get('business_country')
        business_province = request.form.get('business_province')
        business_city = request.form.get('business_city')
        business_address = request.form.get('business_address')

        # Validate required fields
        if not all([business_name, business_country, business_province, business_city, business_address]):
            return jsonify({"error": "Missing required fields"}), 400

        # Handle shop logo update
        if 'shop_logo' in request.files:
            shop_logo = request.files['shop_logo']
            if shop_logo:
                # Validate file size (5MB limit)
                file_data = shop_logo.read()
                if len(file_data) > 5 * 1024 * 1024:  # 5MB in bytes
                    return jsonify({"error": "Shop logo file size must be less than 5MB"}), 400

                # Verify image quality and format
                is_valid, message = verify_image_file(file_data)
                if not is_valid:
                    return jsonify({
                        "error": "Invalid shop logo image",
                        "details": message
                    }), 400

                # Reset file pointer for upload
                shop_logo.seek(0)

                try:
                    # Upload new logo to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        shop_logo,
                        folder="shop_logos",
                        resource_type="image",
                        allowed_formats=["jpg", "jpeg", "png"],
                        public_id=f"shop_logo_{seller_id}_{datetime.now().timestamp()}",
                        transformation={
                            'width': 500,
                            'height': 500,
                            'crop': 'fill',
                            'quality': 'auto:good'
                        }
                    )
                    shop.shop_logo = upload_result['secure_url']
                except Exception as upload_error:
                    return jsonify({
                        "error": "Failed to upload shop logo",
                        "details": str(upload_error)
                    }), 400
        elif 'remove_logo' in request.form and request.form['remove_logo'] == 'true':
            # Handle logo removal
            if shop.shop_logo:
                try:
                    # Extract public_id from the Cloudinary URL
                    public_id = shop.shop_logo.split('/')[-1].split('.')[0]
                    # Delete the image from Cloudinary
                    cloudinary.uploader.destroy(public_id)
                except Exception as delete_error:
                    print(f"Warning: Failed to delete old logo from Cloudinary: {str(delete_error)}")
                # Set shop_logo to None
                shop.shop_logo = None

        # Update shop information
        shop.business_name = business_name
        shop.business_country = business_country
        shop.business_province = business_province
        shop.business_city = business_city
        shop.business_address = business_address
        shop.last_updated = datetime.now()

        db.session.commit()

        return jsonify({
            "message": "Shop updated successfully",
            "shop": {
                "shop_uuid": shop.shop_uuid,
                "business_name": shop.business_name,
                "business_country": shop.business_country,
                "business_province": shop.business_province,
                "business_city": shop.business_city,
                "business_address": shop.business_address,
                "shop_logo": shop.shop_logo,
                "last_updated": shop.last_updated.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Failed to update shop",
            "details": str(e)
        }), 500

@seller.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/archive', methods=['POST'])
@login_required
def archive_shop(seller_id, shop_uuid):
    try:
        # Check if the shop exists and belongs to the seller
        shop = Shop.query.filter_by(shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not shop:
            return jsonify({"message": "Shop not found"}), 404

        # Check if user has permission (must be the shop owner)
        if current_user.user_uuid != shop.seller_info.user_id:
            return jsonify({"message": "Unauthorized to archive this shop"}), 403

        # Archive or unarchive the shop
        shop.is_archived = not shop.is_archived
        shop.archived_at = datetime.now() if shop.is_archived else None
        
        db.session.commit()

        return jsonify({
            "message": f"Shop {'archived' if shop.is_archived else 'unarchived'} successfully",
            "is_archived": shop.is_archived
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "message": "Failed to archive shop",
            "error": str(e)
        }), 500

@seller.route('/seller/<string:seller_id>/shops/<string:shop_uuid>', methods=['GET'])
@login_required
def get_shop_details(seller_id, shop_uuid):
    try:
        # Check if the seller exists and the current user has access
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Get the shop
        shop = Shop.query.filter_by(shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not shop:
            return jsonify({"message": "Shop not found"}), 404

        # Return shop details
        return jsonify({
            "shop": {
                "shop_uuid": shop.shop_uuid,
                "business_name": shop.business_name,
                "business_address": shop.business_address,
                "business_city": shop.business_city,
                "business_province": shop.business_province,
                "business_country": shop.business_country,
                "shop_logo": shop.shop_logo,
                "total_products": shop.total_products,
                "shop_sales": float(shop.shop_sales),
                "is_archived": shop.is_archived,
                "archived_at": shop.archived_at.isoformat() if shop.archived_at else None,
                "created_at": shop.date_created.isoformat(),
                "last_updated": shop.last_updated.isoformat(),
                # Get seller contact info
                "business_email": shop.seller_info.business_email,
                "business_phone": shop.seller_info.business_phone,
                "business_type": shop.seller_info.business_type
            }
        }), 200

    except Exception as e:
        return jsonify({"message": "Failed to fetch shop details", "error": str(e)}), 500

def send_suspension_email(email, business_owner, remarks, violation_type):
    subject = "Account Suspension Notice - Flaskify Seller Account"
    
    violation_types = {
        'counterfeit': 'Selling Counterfeit Products',
        'misrepresentation': 'Product Misrepresentation',
        'shipping': 'Shipping Violations',
        'customer_service': 'Poor Customer Service',
        'policy': 'Policy Violations',
        'fraud': 'Fraudulent Activity',
        'other': 'Other Violations'
    }
    
    violation_description = violation_types.get(violation_type, 'Policy Violation')
    
    body = f"""
    Dear {business_owner},

    We regret to inform you that your seller account on Flaskify has been suspended due to:
    
    Violation Type: {violation_description}
    
    Additional Details:
    {remarks}
    
    During the suspension period, you will not be able to:
    - List new products
    - Process new orders
    - Access seller features
    
    To appeal this suspension or provide additional information, please contact our seller support team.
    
    Best regards,
    The Flaskify Team
    """
    
    send_email(email, subject, body)
