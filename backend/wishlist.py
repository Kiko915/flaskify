from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import db, Wishlist, Product

wishlist_bp = Blueprint('wishlist', __name__)

@wishlist_bp.route('/api/wishlist/check/<product_uuid>', methods=['GET'])
@login_required
def check_wishlist_status(product_uuid):
    """Check if a product is in user's wishlist"""
    try:
        item = Wishlist.query.filter_by(
            user_uuid=current_user.user_uuid,  # Changed from uuid to user_uuid
            product_uuid=product_uuid
        ).first()
        return jsonify({'inWishlist': bool(item)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@wishlist_bp.route('/api/wishlist', methods=['GET'])
@login_required
def get_wishlist():
    """Get all wishlist items for the current user"""
    try:
        wishlist_items = Wishlist.query.filter_by(user_uuid=current_user.user_uuid).all()  # Changed from uuid to user_uuid
        return jsonify([item.to_dict() for item in wishlist_items]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@wishlist_bp.route('/api/wishlist', methods=['POST'])
@login_required
def add_to_wishlist():
    """Add a product to wishlist"""
    try:
        data = request.get_json()
        product_uuid = data.get('product_uuid')
        
        # Check if product exists
        product = Product.query.filter_by(product_uuid=product_uuid).first()
        if not product:
            return jsonify({'error': 'Product not found'}), 404
            
        # Check if already in wishlist
        existing = Wishlist.query.filter_by(
            user_uuid=current_user.user_uuid,  # Changed from uuid to user_uuid
            product_uuid=product_uuid
        ).first()
        
        if existing:
            return jsonify({'message': 'Product already in wishlist'}), 200
            
        # Create wishlist item
        wishlist_item = Wishlist(
            user_uuid=current_user.user_uuid,  # Changed from uuid to user_uuid
            product_uuid=product_uuid
        )
        
        db.session.add(wishlist_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Added to wishlist',
            'item': wishlist_item.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@wishlist_bp.route('/api/wishlist/<product_uuid>', methods=['DELETE'])
@login_required
def remove_from_wishlist(product_uuid):
    """Remove a product from wishlist"""
    try:
        wishlist_item = Wishlist.query.filter_by(
            user_uuid=current_user.user_uuid,  # Changed from uuid to user_uuid
            product_uuid=product_uuid
        ).first()
        
        if not wishlist_item:
            return jsonify({'error': 'Item not found in wishlist'}), 404
            
        db.session.delete(wishlist_item)
        db.session.commit()
        
        return jsonify({'message': 'Removed from wishlist'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500