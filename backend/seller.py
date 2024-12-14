from flask import request, jsonify, Blueprint, send_from_directory
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from sqlalchemy import or_, func, distinct
from models import SellerInfo, Shop, db, Users, Role, Order, Product, OrderItem, ProductVariationOption  
from utils.emails import send_seller_approval_email, send_seller_rejection_email, send_seller_suspension_email, send_order_cancellation_email
from utils.auth_utils import role_required
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
        # If seller exists but was rejected, allow them to register again
        if existing_seller.status == 'Rejected':
            # Delete the rejected seller entry
            db.session.delete(existing_seller)
            db.session.commit()
            return False, None
            
        if existing_seller.business_owner.lower() == owner_name.lower():
            return True, "A seller with this owner name already exists"
        if existing_seller.business_email == email:
            return True, "This email is already registered with another seller"
    
    return False, None

@seller.route('/seller', methods=['POST'])
@login_required
def add_seller():
    try:
        # Get JSON data
        data = request.get_json()
        
        owner_name = data.get('owner_name')
        business_email = data.get('email')

        if not owner_name or not business_email:
            return jsonify({'message': 'Owner name and email are required'}), 400

        # Check for existing seller
        exists, error_message = check_existing_seller(owner_name, business_email)
        if exists:
            return jsonify({
                "message": error_message,
                "error": "duplicate_entry"
            }), 409

        # Create new seller instance
        new_seller = SellerInfo(
            user_id=current_user.user_uuid,
            business_name=data.get('business_name'),
            business_owner=owner_name,
            business_type=data.get('business_type'),
            business_email=business_email,
            business_phone=data.get('phone'),
            business_country=data.get('business_country'),
            business_province=data.get('business_province'),
            business_city=data.get('business_city'),
            business_address=data.get('business_address'),
            tax_id=data.get('tax_id'),
            tax_certificate_doc=data.get('bir_certificate_url'),
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
        print(f"Error in add_seller: {str(e)}")
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
            "remarks": seller.remarks,
            "business_country": seller.business_country,
            "business_region": seller.business_region,
            "business_province": seller.business_province,
            "business_city": seller.business_city,
            "business_address": seller.business_address
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

@seller.route('/shop/<string:shop_uuid>', methods=['GET'])
def get_shop_details(shop_uuid):
    try:
        # Get the shop with seller info
        shop = Shop.query.options(
            db.joinedload(Shop.seller_info)
        ).filter_by(shop_uuid=shop_uuid).first_or_404()

        # Get shop's active products
        products = Product.query.filter(
            Product.shop_uuid == shop_uuid,
            Product.status == 'active',
            Product.visibility == True
        ).all()

        # Calculate shop statistics
        total_products = len(products)
        total_sales = sum(product.total_sales for product in products)
        avg_rating = 4.5  # TODO: Implement actual rating calculation

        # Format response
        response = {
            'shop_uuid': shop.shop_uuid,
            'business_name': shop.business_name,
            'business_city': shop.business_city,
            'business_province': shop.business_province,
            'business_address': shop.business_address,
            'shop_logo': shop.shop_logo,
            'total_products': total_products,
            'total_sales': total_sales,
            'avg_rating': avg_rating,
            'date_created': shop.date_created.isoformat() if shop.date_created else None,
            'seller': {
                'seller_id': shop.seller_info.seller_id,
                'business_type': shop.seller_info.business_type,
                'status': shop.seller_info.status
            },
            'products': [{
                'product_uuid': product.product_uuid,
                'name': product.name,
                'price': float(product.price),
                'compare_at_price': float(product.compare_at_price) if product.compare_at_price else None,
                'main_image': product.main_image,
                'total_sales': product.total_sales,
                'quantity': product.quantity
            } for product in products]
        }

        return jsonify(response), 200

    except Exception as e:
        print(f"Error getting shop details: {str(e)}")
        return jsonify({"message": str(e)}), 500

@seller.route('/seller/current', methods=['GET'])
@login_required
def get_current_seller():
    try:
        # Get seller info for current user
        seller_info = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
        
        if not seller_info:
            return jsonify({
                "message": "No seller information found for current user"
            }), 404
            
        return jsonify({
            "seller_id": seller_info.seller_id,
            "business_name": seller_info.business_name,
            "business_owner": seller_info.business_owner,
            "business_email": seller_info.business_email,
            "status": seller_info.status,
            "user_id": seller_info.user_id
        }), 200
            
    except Exception as e:
        return jsonify({
            "message": "Failed to fetch current seller information",
            "error": str(e)
        }), 500

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

@seller.route('/api/seller/orders', methods=['GET'])
@login_required
@role_required(Role.SELLER)
def get_seller_orders():
    try:
        # Get the seller info for the current user
        seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
        if not seller:
            return jsonify({
                'status': 'error',
                'message': 'Seller not found'
            }), 404

        # Get all products for this seller
        seller_products = Product.query.filter_by(seller_id=seller.seller_id).all()
        product_uuids = [p.product_uuid for p in seller_products]

        # Get all order items containing seller's products
        order_items = OrderItem.query.filter(OrderItem.product_uuid.in_(product_uuids)).all()
        order_uuids = list(set([item.order_uuid for item in order_items]))

        # Get the full orders
        orders = Order.query.filter(Order.order_uuid.in_(order_uuids)).all()
        
        # Format orders with customer info
        formatted_orders = []
        for order in orders:
            # Get customer info
            customer = Users.query.get(order.user_uuid)
            
            # Filter order items to only include this seller's products
            seller_items = [item for item in order.items 
                          if item.product_uuid in product_uuids]
            
            # Calculate subtotal for seller's items
            seller_subtotal = sum(float(item.subtotal) for item in seller_items)
            
            formatted_order = order.to_dict()
            formatted_order['items'] = [item.to_dict() for item in seller_items]
            formatted_order['subtotal'] = seller_subtotal
            formatted_order['customer_name'] = f"{customer.first_name} {customer.last_name}"
            formatted_order['customer_email'] = customer.email
            formatted_order['customer_phone'] = customer.phone

            formatted_orders.append(formatted_order)

        return jsonify({
            'status': 'success',
            'orders': formatted_orders
        })

    except Exception as e:
        print(f"Error getting seller orders: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch orders'
        }), 500

@seller.route('/api/seller/orders/<order_uuid>/update-status', methods=['POST'])
@login_required
@role_required(Role.SELLER)
def update_order_status(order_uuid):
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'status': 'error',
                'message': 'New status is required'
            }), 400

        # Get the order
        order = Order.query.get(order_uuid)
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404

        # Verify seller owns the products in this order
        seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
        seller_products = Product.query.filter_by(seller_id=seller.seller_id).all()
        product_uuids = [p.product_uuid for p in seller_products]
        
        # Check if any order items belong to this seller
        seller_items = [item for item in order.items 
                       if item.product_uuid in product_uuids]
        if not seller_items:
            return jsonify({
                'status': 'error',
                'message': 'Order does not contain any of your products'
            }), 403

        # Update status based on the request
        if new_status == 'shipped':
            if not order.paid_at:
                return jsonify({
                    'status': 'error',
                    'message': 'Cannot ship an unpaid order'
                }), 400
            order.shipped_at = datetime.utcnow()
            order.status = 'to_ship'  # Update status to 'to_ship' for buyer view
        elif new_status == 'delivered':
            if not order.shipped_at:
                return jsonify({
                    'status': 'error',
                    'message': 'Cannot mark as delivered before shipping'
                }), 400
            order.delivered_at = datetime.utcnow()
            order.status = 'completed'
        else:
            return jsonify({
                'status': 'error',
                'message': 'Invalid status update'
            }), 400

        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': f'Order status updated to {new_status}'
        })

    except Exception as e:
        print(f"Error updating order status: {str(e)}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Failed to update order status'
        }), 500

@seller.route('/api/seller/orders/<order_uuid>/cancel', methods=['POST'])
@login_required
@role_required(Role.SELLER)
def cancel_seller_order(order_uuid):
    try:
        data = request.get_json()
        cancellation_reason = data.get('reason')
        
        if not cancellation_reason:
            return jsonify({
                'status': 'error',
                'message': 'Cancellation reason is required'
            }), 400

        # Get the order
        order = Order.query.get(order_uuid)
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404

        # Verify seller owns the products in this order
        seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
        seller_products = Product.query.filter_by(seller_id=seller.seller_id).all()
        product_uuids = [p.product_uuid for p in seller_products]
        
        # Check if any order items belong to this seller
        seller_items = [item for item in order.items 
                       if item.product_uuid in product_uuids]
        if not seller_items:
            return jsonify({
                'status': 'error',
                'message': 'Order does not contain any of your products'
            }), 403

        # Check if order can be cancelled
        if order.shipped_at or order.delivered_at or order.status == 'cancelled':
            return jsonify({
                'status': 'error',
                'message': 'Order cannot be cancelled in its current state'
            }), 400

        # Update order status
        order.status = 'cancelled'
        order.cancelled_at = datetime.utcnow()
        order.cancellation_reason = cancellation_reason
        order.cancelled_by = 'seller'

        # Restore inventory for seller's items
        for item in seller_items:
            product = Product.query.get(item.product_uuid)
            if product:
                if item.variation_uuid and item.selected_option:
                    # Restore variation option stock
                    option = ProductVariationOption.query.filter_by(
                        variation_uuid=item.variation_uuid,
                        value=item.selected_option['value']
                    ).first()
                    if option:
                        option.stock += item.quantity
                else:
                    # Restore main product stock
                    product.quantity += item.quantity
                
                # Update product stats
                product.total_sales -= item.quantity
                # Convert Decimal to float before subtraction
                current_revenue = float(product.total_revenue or 0)
                item_total = float(item.unit_price) * item.quantity
                product.total_revenue = current_revenue - item_total

        # Get customer email
        customer = Users.query.get(order.user_uuid)
        if customer:
            try:
                # Send cancellation email to customer
                send_order_cancellation_email(order, customer.email)
            except Exception as e:
                print(f"Failed to send cancellation email: {str(e)}")
                # Continue with order cancellation even if email fails

        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Order cancelled successfully'
        })

    except Exception as e:
        print(f"Error cancelling order: {str(e)}")
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': 'Failed to cancel order'
        }), 500

@seller.route('/api/seller/orders/<order_uuid>/handle-cancellation', methods=['POST'])
@login_required
@role_required(Role.SELLER)
def handle_cancellation_request(order_uuid):
    """Handle order cancellation request (approve/reject)"""
    try:
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        rejection_reason = data.get('rejection_reason')  # required if action is 'reject'
        
        if not action or action not in ['approve', 'reject']:
            return jsonify({
                'status': 'error',
                'message': 'Invalid action'
            }), 400
            
        if action == 'reject' and not rejection_reason:
            return jsonify({
                'status': 'error',
                'message': 'Rejection reason is required'
            }), 400

        # Get the order
        order = Order.query.get(order_uuid)
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404

        # Verify seller owns the products in this order
        seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
        seller_products = Product.query.filter_by(seller_id=seller.seller_id).all()
        product_uuids = [p.product_uuid for p in seller_products]
        
        # Check if any order items belong to this seller
        seller_items = [item for item in order.items 
                       if item.product_uuid in product_uuids]
        if not seller_items:
            return jsonify({
                'status': 'error',
                'message': 'Order does not contain any of your products'
            }), 403

        # Verify order is in cancellation_pending state
        if order.status != 'cancellation_pending':
            return jsonify({
                'status': 'error',
                'message': 'Order is not pending cancellation'
            }), 400

        if action == 'approve':
            # Update order status
            order.status = 'cancelled'
            order.payment_status = 'cancelled'
            order.cancelled_at = datetime.utcnow()
            order.cancellation_approved_at = datetime.utcnow()
            
            # Restore inventory and update sales metrics for all items
            for item in seller_items:
                product = Product.query.get(item.product_uuid)
                if product:
                    # Restore inventory based on variation or main product
                    if item.variation_uuid and item.selected_option:
                        # Restore variation option stock
                        option = ProductVariationOption.query.filter_by(
                            variation_uuid=item.variation_uuid,
                            value=item.selected_option['value']
                        ).first()
                        if option:
                            option.stock += item.quantity
                    else:
                        # Restore main product stock
                        product.quantity += item.quantity
                    
                    # Update sales metrics if order was paid
                    if order.paid_at:
                        # Deduct from total sales count
                        product.total_sales = max(0, product.total_sales - item.quantity)
                        
                        # Deduct from total revenue
                        current_revenue = float(product.total_revenue or 0)
                        item_total = float(item.unit_price) * item.quantity
                        product.total_revenue = max(0, current_revenue - item_total)

            message = 'Cancellation request approved'
        else:
            # Reject cancellation
            order.status = order.status.replace('cancellation_pending', 'paid' if order.paid_at else 'pending')
            order.cancellation_rejected_at = datetime.utcnow()
            order.cancellation_rejected_reason = rejection_reason
            message = 'Cancellation request rejected'

        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': message
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error handling cancellation request: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to handle cancellation request'
        }), 500

@seller.route('/seller/dashboard/stats', methods=['GET'])
@login_required
def get_seller_dashboard_stats():
    try:
        # Verify user is a seller
        if current_user.role != Role.SELLER:
            return jsonify({'error': 'Unauthorized - Seller access only'}), 403

        # Get seller info
        seller_info = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
        if not seller_info:
            return jsonify({'error': 'Seller information not found'}), 404

        # Get seller's shops
        shops = Shop.query.filter_by(seller_id=seller_info.seller_id).all()
        shop_ids = [shop.shop_uuid for shop in shops]

        # Calculate total revenue from completed orders
        total_revenue = 0
        total_orders = 0
        daily_revenue = {}
        monthly_revenue = {}
        monthly_orders = {}

        # Get all completed orders for this seller's products for the last 12 months
        twelve_months_ago = datetime.now() - timedelta(days=365)
        completed_orders = db.session.query(Order).join(
            OrderItem, Order.order_uuid == OrderItem.order_uuid
        ).join(
            Product, OrderItem.product_uuid == Product.product_uuid
        ).filter(
            Product.shop_uuid.in_(shop_ids),
            Order.status.in_(['completed', 'delivered']),
            Order.created_at >= twelve_months_ago
        ).order_by(Order.created_at.asc()).all()

        # Calculate totals and breakdowns
        for order in completed_orders:
            # Only count items from this seller's shops
            order_total = sum(
                float(item.subtotal)
                for item in order.items
                if item.product.shop_uuid in shop_ids
            )
            
            total_revenue += order_total
            total_orders += 1

            # Get date keys for breakdowns
            date_key = order.created_at.strftime('%Y-%m-%d')
            month_key = order.created_at.strftime('%Y-%m')
            
            # Update daily revenue
            daily_revenue[date_key] = daily_revenue.get(date_key, 0) + order_total
            
            # Update monthly breakdowns
            monthly_revenue[month_key] = monthly_revenue.get(month_key, 0) + order_total
            monthly_orders[month_key] = monthly_orders.get(month_key, 0) + 1

        # Get total products
        total_products = Product.query.filter(
            Product.shop_uuid.in_(shop_ids),
            Product.visibility == True
        ).count()

        # Get total customers (unique buyers)
        total_customers = db.session.query(func.count(distinct(Order.user_uuid))).join(
            OrderItem, Order.order_uuid == OrderItem.order_uuid
        ).join(
            Product, OrderItem.product_uuid == Product.product_uuid
        ).filter(
            Product.shop_uuid.in_(shop_ids)
        ).scalar()

        # Calculate trends
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        
        # Revenue trend
        current_month_revenue = monthly_revenue.get(current_month.strftime('%Y-%m'), 0)
        last_month_revenue = monthly_revenue.get(last_month.strftime('%Y-%m'), 0)
        revenue_trend = calculate_trend(current_month_revenue, last_month_revenue)

        # Orders trend
        current_month_orders = monthly_orders.get(current_month.strftime('%Y-%m'), 0)
        last_month_orders = monthly_orders.get(last_month.strftime('%Y-%m'), 0)
        orders_trend = calculate_trend(current_month_orders, last_month_orders)

        # Products trend
        current_products = total_products
        last_month_products = Product.query.filter(
            Product.shop_uuid.in_(shop_ids),
            Product.visibility == True,
            Product.created_at < last_month
        ).count()
        products_trend = calculate_trend(current_products, last_month_products)

        # Customers trend
        current_month_customers = db.session.query(func.count(distinct(Order.user_uuid))).join(
            OrderItem, Order.order_uuid == OrderItem.order_uuid
        ).join(
            Product, OrderItem.product_uuid == Product.product_uuid
        ).filter(
            Product.shop_uuid.in_(shop_ids),
            Order.created_at >= current_month
        ).scalar()

        last_month_customers = db.session.query(func.count(distinct(Order.user_uuid))).join(
            OrderItem, Order.order_uuid == OrderItem.order_uuid
        ).join(
            Product, OrderItem.product_uuid == Product.product_uuid
        ).filter(
            Product.shop_uuid.in_(shop_ids),
            Order.created_at >= last_month,
            Order.created_at < current_month
        ).scalar()
        customers_trend = calculate_trend(current_month_customers, last_month_customers)

        # Prepare revenue data for charts (last 30 days)
        today = datetime.now().date()
        thirty_days_ago = today - timedelta(days=30)
        
        revenue_data = []
        current_date = thirty_days_ago
        
        while current_date <= today:
            date_str = current_date.strftime('%Y-%m-%d')
            revenue_amount = daily_revenue.get(date_str, 0)
            
            revenue_data.append({
                'date': date_str,
                'amount': round(revenue_amount, 2),
                'formattedAmount': f"₱{revenue_amount:,.2f}",
                'day': current_date.strftime('%d'),
                'month': current_date.strftime('%b'),
                'dayOfWeek': current_date.strftime('%a')
            })
            
            current_date += timedelta(days=1)

        # Calculate sales distribution
        sales_distribution = calculate_sales_distribution(completed_orders, shop_ids)

        stats = {
            'totalRevenue': float(total_revenue),
            'totalOrders': total_orders,
            'totalProducts': total_products,
            'totalCustomers': total_customers,
            'trends': {
                'revenue': revenue_trend,
                'orders': orders_trend,
                'products': products_trend,
                'customers': customers_trend
            },
            'revenueData': revenue_data,
            'salesDistribution': sales_distribution
        }

        return jsonify(stats), 200

    except Exception as e:
        print(f"Error getting seller dashboard stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

def calculate_trend(current, previous):
    """Calculate percentage change between two periods"""
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100, 1)

def calculate_sales_distribution(orders, shop_ids):
    """Calculate sales distribution by product category"""
    category_sales = {}
    
    for order in orders:
        for item in order.items:
            if item.product.shop_uuid in shop_ids:
                category_name = item.product.category.name
                category_sales[category_name] = category_sales.get(category_name, 0) + float(item.subtotal)
    
    # Convert to list of objects
    distribution = [
        {'name': category, 'value': total}
        for category, total in category_sales.items()
    ]
    
    return sorted(distribution, key=lambda x: x['value'], reverse=True)
