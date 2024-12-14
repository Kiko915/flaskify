from flask import Blueprint, jsonify, request
from models import db, mail, Users, SellerInfo, Role, Shop, Product
from flask_mail import Message
import random
import string
from flask_login import login_required, current_user
from utils.auth_utils import role_required
from werkzeug.security import generate_password_hash
from datetime import datetime

main = Blueprint('main', __name__)

@main.route('/')
def hello_world():
    return 'Hello World!'


@main.route('/check_email', methods=['POST'])
def check_email():
    data = request.json
    email = data.get('email')
    user = Users.query.filter_by(email=email).first()
    if user:
        return jsonify({'message': 'Email already exists'}), 400
    return jsonify({'message': 'Email is available'}), 200


@main.route('/check_username', methods=['POST'])
def check_username():
    data = request.json
    username = data.get('username')
    user = Users.query.filter_by(username=username).first()
    if user:
        return jsonify({'message': 'Username already exists'}), 400
    return jsonify({'message': 'Username is available'}), 200


@main.route('/admin/dashboard/stats', methods=['GET'])
@login_required
@role_required(Role.ADMIN)
def get_dashboard_stats():
    # Get buyer count (users with role 'Buyer')
    buyers_count = Users.query.filter_by(role='Buyer').count()
    
    # Get all sellers count (users with role 'Seller')
    sellers_count = Users.query.filter_by(role='Seller').count()
    
    # Get approved sellers count
    approved_sellers = SellerInfo.query.filter_by(status='Approved').count()
    
    # Get pending sellers count
    pending_sellers = SellerInfo.query.filter_by(status='Pending').count()
    
    # Get active shops count (non-archived shops from approved sellers)
    active_shops = Shop.query.join(SellerInfo).filter(
        SellerInfo.status == 'Approved',
        Shop.is_archived == False
    ).count()
    
    # Get total products and revenue
    total_products = 0  # TODO: Implement when products are added
    total_revenue = 0.00  # TODO: Implement when orders are added
    
    return jsonify({
        'buyers': buyers_count,
        'sellers': sellers_count,
        'approvedSellers': approved_sellers,
        'pendingSellers': pending_sellers,
        'totalProducts': total_products,
        'totalRevenue': total_revenue,
        'totalOrders': 0,
        'pendingOrders': 0,
        'activeShops': active_shops,
        'pendingShops': 0
    })


@main.route('/admin/users', methods=['GET'])
@login_required
@role_required(Role.ADMIN)
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    role = request.args.get('role', '')
    status = request.args.get('status', '')

    query = Users.query

    if search:
        search_filter = (
            (Users.username.ilike(f'%{search}%')) |
            (Users.email.ilike(f'%{search}%')) |
            (Users.first_name.ilike(f'%{search}%')) |
            (Users.last_name.ilike(f'%{search}%'))
        )
        query = query.filter(search_filter)

    if role:
        query = query.filter(Users.role == role)
    if status:
        query = query.filter(Users.status == status)

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    users = pagination.items

    return jsonify({
        'users': [{
            'id': user.user_uuid,
            'username': user.username if hasattr(user, 'username') else None,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'status': user.status,
            'profile_image': user.profile_image_url if hasattr(user, 'profile_image_url') else None,
            'date_joined': user.date_joined.isoformat()
        } for user in users],
        'total': pagination.total,
        'pages': pagination.pages,
        'currentPage': page,
        'perPage': per_page
    })

@main.route('/admin/users/<user_uuid>', methods=['GET'])
@login_required
@role_required(Role.ADMIN)
def get_user_details(user_uuid):
    user = Users.query.get_or_404(user_uuid)
    return jsonify({
        'id': user.user_uuid,
        'username': user.username if hasattr(user, 'username') else None,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'status': user.status,
        'profile_image': user.profile_image_url if hasattr(user, 'profile_image_url') else None,
        'date_joined': user.date_joined.isoformat()
    })

@main.route('/admin/users/<user_uuid>', methods=['PUT'])
@login_required
@role_required(Role.ADMIN)
def update_user(user_uuid):
    if not current_user.role == Role.ADMIN:
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = Users.query.get_or_404(user_uuid)
    data = request.json
    
    # Prevent editing other admins
    if user.role == Role.ADMIN and user.user_uuid != current_user.user_uuid:
        return jsonify({'error': 'Cannot edit other administrators'}), 403
    
    if 'username' in data:
        user.username = data['username']
    if 'email' in data:
        user.email = data['email']
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'role' in data and user.user_uuid != current_user.user_uuid:  # Prevent changing own role
        user.role = data['role']
        
    try:
        db.session.commit()
        return jsonify({'message': 'User updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@main.route('/admin/users/<user_uuid>/status', methods=['PUT'])
@login_required
@role_required(Role.ADMIN)
def update_user_status(user_uuid):
    if not current_user.role == Role.ADMIN:
        return jsonify({'error': 'Unauthorized'}), 403
        
    user = Users.query.get_or_404(user_uuid)
    data = request.json
    
    # Prevent suspending admins
    if user.role == Role.ADMIN and user.user_uuid != current_user.user_uuid:
        return jsonify({'error': 'Cannot modify status of other administrators'}), 403
    
    if 'status' in data:
        user.status = data['status']
        try:
            db.session.commit()
            return jsonify({'message': f'User status updated to {data["status"]}'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 400
    
    return jsonify({'error': 'Status not provided'}), 400

# Seller Management Routes
@main.route('/api/sellers', methods=['GET'])
@login_required
@role_required(Role.ADMIN)
def get_sellers():
    try:
        sellers = SellerInfo.query.all()
        sellers_data = []
        for seller in sellers:
            # Get the associated user's profile image URL if user exists
            profile_image_url = None
            if seller.user:
                profile_image_url = seller.user.profile_image_url if hasattr(seller.user, 'profile_image_url') else None
            
            sellers_data.append({
                'id': seller.seller_id,
                'business_owner': seller.business_owner,
                'business_type': seller.business_type,
                'business_email': seller.business_email,
                'tax_id': seller.tax_id,
                'status': seller.status,
                'remarks': seller.admin_notes,
                'submission_date': seller.date_registered.isoformat(),
                'updated_at': seller.last_updated.isoformat(),
                'profile_image_url': profile_image_url
            })
        return jsonify(sellers_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Shop Routes
@main.route('/api/shops/<shop_uuid>', methods=['GET'])
def get_shop_details(shop_uuid):
    try:
        shop = Shop.query.get_or_404(shop_uuid)
        seller = SellerInfo.query.get(shop.seller_id)
        
        # Get shop metrics
        total_products = Product.query.filter_by(shop_uuid=shop_uuid, status='active').count()
        
        return jsonify({
            'shop_uuid': shop.shop_uuid,
            'seller_id': shop.seller_id,
            'seller_user_id': seller.user_id if seller else None,
            'business_name': shop.business_name,
            'business_country': shop.business_country,
            'business_province': shop.business_province,
            'business_city': shop.business_city,
            'business_address': shop.business_address,
            'shop_logo': shop.shop_logo,
            'total_products': total_products,
            'shop_sales': float(shop.shop_sales) if shop.shop_sales else 0.00,
            'date_created': shop.date_created.isoformat() if shop.date_created else None,
            'last_updated': shop.last_updated.isoformat() if shop.last_updated else None,
            'is_archived': shop.is_archived
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/api/shops/<shop_uuid>/products', methods=['GET'])
def get_shop_products(shop_uuid):
    try:
        # Get query parameters for filtering and sorting
        sort_by = request.args.get('sort', 'newest')  # Default sort by newest
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Base query for active products
        query = Product.query.filter_by(
            shop_uuid=shop_uuid,
            status='active',
            visibility=True
        )
        
        # Apply sorting
        if sort_by == 'popular':
            query = query.order_by(Product.total_sales.desc())
        elif sort_by == 'price-low':
            query = query.order_by(Product.price.asc())
        elif sort_by == 'price-high':
            query = query.order_by(Product.price.desc())
        else:  # newest
            query = query.order_by(Product.created_at.desc())
            
        # Paginate results
        products = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Convert products to dictionary format
        products_data = []
        for product in products.items:
            product_dict = product.to_dict()
            # Add any additional shop-specific data if needed
            products_data.append(product_dict)
        
        return jsonify({
            'products': products_data,
            'total': products.total,
            'pages': products.pages,
            'current_page': page,
            'per_page': per_page
        })
    except Exception as e:
        print(f"Error in get_shop_products: {str(e)}")  # Add debug logging
        return jsonify({'error': str(e)}), 500
