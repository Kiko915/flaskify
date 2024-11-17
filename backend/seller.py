from flask import request, jsonify, Blueprint
from flask_login import login_required, current_user
from datetime import datetime
from sqlalchemy import or_
from __init__ import SellerInfo, Shop, db, Users, Role  # Ensure Shop is imported
from utils.emails import send_seller_approval_email, send_seller_rejection_email
import cloudinary.uploader
from utils.auth_utils import role_required
from utils.ocr_utils import verify_bir_certificate
from utils.file_utils import verify_image_file

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
            # First validate the image file format and quality
            is_valid_image, image_error = verify_image_file(bir_certificate.read())
            if not is_valid_image:
                return jsonify({
                    "message": "Invalid BIR certificate image",
                    "error": image_error,
                    "error_type": "invalid_image"
                }), 400
            
            # Reset file pointer after reading
            bir_certificate.seek(0)
            
            # Now validate the BIR certificate content using OCR
            is_valid_bir, bir_error = verify_bir_certificate(bir_certificate.read())
            if not is_valid_bir:
                return jsonify({
                    "message": "Invalid BIR certificate content",
                    "error": bir_error,
                    "error_type": "invalid_content"
                }), 400
                
            # Reset file pointer again before upload
            bir_certificate.seek(0)
            
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
        if new_status == 'Rejected':
            # Store email and owner name before deletion for email notification
            business_email = seller.business_email
            business_owner = seller.business_owner
            
            # Update status first (for audit purposes if needed)
            seller.update_status(new_status, current_user, admin_notes)
            
            """# Update associated user role back to USER if needed
            user = Users.query.get(seller.user_uuid)
            if user and user.role == Role.SELLER:
                user.role = Role.USER"""
            
            # Delete only the seller record
            db.session.delete(seller)
            db.session.commit()
            
            # Send rejection email after successful deletion
            send_seller_rejection_email(business_email, business_owner)
            
            return jsonify({
                "message": "Seller application rejected and seller profile removed",
                "user_preserved": True
            })
            
        else:  # For Approved or Pending status
            # Update seller status with admin info
            seller.update_status(new_status, current_user, admin_notes)
            
            # If status is Approved, update user role to Seller
            if new_status == 'Approved':
                user = Users.query.get(seller.user_uuid)
                if user:
                    user.role = Role.SELLER
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
        
        if seller.user_uuid != current_user.user_uuid and current_user.role != Role.ADMIN:
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
            "business_registration_doc": shop.business_registration_doc,
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
        
        if seller.user_uuid != current_user.user_uuid and current_user.role != Role.ADMIN:
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

        # Validate BIR certificate
        if 'business_registration_doc' not in request.files:
            return jsonify({"error": "BIR certificate is required"}), 400

        doc = request.files['business_registration_doc']
        if not doc:
            return jsonify({"error": "BIR certificate is required"}), 400

        # Check file size (5MB limit)
        file_data = doc.read()
        if len(file_data) > 5 * 1024 * 1024:  # 5MB in bytes
            return jsonify({"error": "File size must be less than 5MB"}), 400

        # Verify image quality
        is_valid, message = verify_image_file(file_data)
        if not is_valid:
            return jsonify({
                "error": "Invalid BIR certificate",
                "details": message
            }), 400

        # Reset file pointer for upload
        doc.seek(0)

        # Upload to Cloudinary if validation passes
        try:
            upload_result = cloudinary.uploader.upload(
                doc,
                folder="shop_documents",
                resource_type="auto",
                allowed_formats=["jpg", "jpeg", "png"],
                public_id=f"shop_{seller_id}_{datetime.now().timestamp()}"
            )
            business_registration_doc_url = upload_result['secure_url']
        except Exception as upload_error:
            return jsonify({
                "error": "Failed to upload BIR certificate",
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
            business_registration_doc=business_registration_doc_url,
            total_products=0,
            shop_sales=0.00,
            date_created=datetime.now()
        )

        db.session.add(new_shop)
        db.session.commit()

        return jsonify({
            "message": "Shop created successfully",
            "shop_uuid": new_shop.shop_uuid,
            "business_name": new_shop.business_name
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
        if shop.seller.user_uuid != current_user.user_uuid and current_user.role != Role.ADMIN:
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

        # Handle optional document upload
        if 'business_registration_doc' in request.files:
            doc = request.files['business_registration_doc']
            if doc:
                try:
                    upload_result = cloudinary.uploader.upload(
                        doc,
                        folder="shop_documents",
                        resource_type="auto",
                        allowed_formats=["pdf", "png", "jpg", "jpeg", "doc", "docx"],
                        public_id=f"shop_{seller_id}_{datetime.now().timestamp()}"
                    )
                    shop.business_registration_doc = upload_result['secure_url']
                except Exception as upload_error:
                    return jsonify({
                        "error": "Failed to upload business registration document",
                        "details": str(upload_error)
                    }), 400

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
                "business_registration_doc": shop.business_registration_doc,
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
        if current_user.user_uuid != shop.seller.user_uuid:
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
        if not seller or (seller.user_uuid != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
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
                "business_registration_doc": shop.business_registration_doc,
                "total_products": shop.total_products,
                "shop_sales": float(shop.shop_sales),
                "is_archived": shop.is_archived,
                "archived_at": shop.archived_at.isoformat() if shop.archived_at else None,
                "created_at": shop.date_created.isoformat(),
                "last_updated": shop.last_updated.isoformat(),
                # Get seller contact info
                "business_email": shop.seller.business_email,
                "business_phone": shop.seller.business_phone,
                "business_type": shop.seller.business_type
            }
        }), 200

    except Exception as e:
        return jsonify({"message": "Failed to fetch shop details", "error": str(e)}), 500
