from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from models import db, CartItem, Product, ProductVariation
from uuid import UUID
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
import uuid

cart_bp = Blueprint('cart', __name__)

@cart_bp.route('/api/cart', methods=['GET'])
@login_required
def get_cart():
    """Get the current user's cart items"""
    try:
        cart_items = CartItem.query.filter_by(user_id=current_user.user_uuid).all()
        return jsonify({
            'items': [item.to_dict() for item in cart_items],
            'total_items': sum(item.quantity for item in cart_items),
            'total_price': sum(float(item.selected_option['price']) if item.selected_option and 'price' in item.selected_option else float(item.product.price) * item.quantity for item in cart_items)
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching cart: {str(e)}")
        return jsonify({'error': 'Failed to fetch cart items'}), 500

@cart_bp.route('/api/cart/add', methods=['POST'])
@login_required
def add_to_cart():
    """Add an item to the cart"""
    try:
        data = request.get_json()
        product_uuid = data.get('product_uuid')
        variation_uuid = data.get('variation_uuid')
        quantity = int(data.get('quantity', 1))
        selected_option = data.get('selected_option')
        auto_check = data.get('auto_check', False)

        # Validate product exists
        product = Product.query.get(product_uuid)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        # Validate variation if provided
        if variation_uuid:
            variation = ProductVariation.query.get(variation_uuid)
            if not variation or variation.product_uuid != product_uuid:
                return jsonify({'error': 'Invalid variation'}), 400
            
            # Check variation stock
            if variation.quantity < quantity:
                return jsonify({'error': 'Not enough stock available'}), 400
        else:
            # Check product stock
            if product.quantity < quantity:
                return jsonify({'error': 'Not enough stock available'}), 400

        # Check if item already exists in cart with the same selected option
        filter_conditions = {
            'user_id': str(current_user.user_uuid),
            'product_uuid': str(product_uuid),
            'variation_uuid': str(variation_uuid) if variation_uuid else None,
        }

        if selected_option:
            # Use MySQL JSON_EXTRACT for option_uuid comparison
            existing_item = CartItem.query.filter_by(**filter_conditions).filter(
                text("JSON_EXTRACT(selected_option, '$.option_uuid') = :option_uuid")
            ).params(option_uuid=selected_option['option_uuid']).first()
        else:
            existing_item = CartItem.query.filter_by(**filter_conditions).filter(
                CartItem.selected_option.is_(None)
            ).first()

        item_uuid = None
        if existing_item:
            # Update quantity if item exists
            new_quantity = existing_item.quantity + quantity
            
            # Validate stock for updated quantity
            if variation_uuid:
                if variation.quantity < new_quantity:
                    return jsonify({'error': 'Not enough stock available'}), 400
            else:
                if product.quantity < new_quantity:
                    return jsonify({'error': 'Not enough stock available'}), 400
                    
            existing_item.quantity = new_quantity
            item_uuid = existing_item.item_uuid
        else:
            # Create new cart item
            item_uuid = str(uuid.uuid4())
            cart_item = CartItem(
                item_uuid=item_uuid,
                user_id=str(current_user.user_uuid),
                product_uuid=str(product_uuid),
                variation_uuid=str(variation_uuid) if variation_uuid else None,
                quantity=quantity,
                selected_option=selected_option
            )
            db.session.add(cart_item)

        db.session.commit()

        # Return updated cart with the item_uuid
        cart_data = get_cart()
        response_data = cart_data.get_json()
        response_data['item_uuid'] = item_uuid
        return jsonify(response_data)

    except ValueError as e:
        return jsonify({'error': 'Invalid quantity'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        current_app.logger.error(f"Error adding to cart: {str(e)}")
        return jsonify({'error': 'Failed to add item to cart'}), 500

@cart_bp.route('/api/cart/update/<item_uuid>', methods=['PUT'])
@login_required
def update_cart_item(item_uuid):
    """Update cart item quantity"""
    try:
        data = request.get_json()
        quantity = int(data.get('quantity', 1))

        if quantity < 1:
            return jsonify({'error': 'Quantity must be at least 1'}), 400

        # Find cart item
        cart_item = CartItem.query.filter_by(
            item_uuid=str(item_uuid),
            user_id=str(current_user.user_uuid)
        ).first()

        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404

        # Check stock availability
        if cart_item.variation_uuid:
            if cart_item.variation.quantity < quantity:
                return jsonify({'error': 'Not enough stock available'}), 400
        else:
            if cart_item.product.quantity < quantity:
                return jsonify({'error': 'Not enough stock available'}), 400

        # Update quantity
        cart_item.quantity = quantity
        db.session.commit()

        # Return updated cart
        return get_cart()

    except ValueError:
        return jsonify({'error': 'Invalid quantity'}), 400
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        current_app.logger.error(f"Error updating cart item: {str(e)}")
        return jsonify({'error': 'Failed to update cart item'}), 500

@cart_bp.route('/api/cart/remove/<item_uuid>', methods=['DELETE'])
@login_required
def remove_from_cart(item_uuid):
    """Remove an item from the cart"""
    try:
        # Find and delete cart item
        cart_item = CartItem.query.filter_by(
            item_uuid=str(item_uuid),
            user_id=str(current_user.user_uuid)
        ).first()

        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404

        db.session.delete(cart_item)
        db.session.commit()

        # Return updated cart
        return get_cart()

    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        current_app.logger.error(f"Error removing cart item: {str(e)}")
        return jsonify({'error': 'Failed to remove cart item'}), 500

@cart_bp.route('/api/cart/clear', methods=['POST'])
@login_required
def clear_cart():
    """Clear all cart items for the current user"""
    try:
        CartItem.query.filter_by(user_id=current_user.user_uuid).delete()
        db.session.commit()
        return jsonify({'message': 'Cart cleared successfully'})
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        current_app.logger.error(f"Error clearing cart: {str(e)}")
        return jsonify({'error': 'Failed to clear cart'}), 500 