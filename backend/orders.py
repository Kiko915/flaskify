from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import Order, Product, ProductVariationOption, db
from datetime import datetime

orders = Blueprint('orders', __name__)

@orders.route('/api/orders', methods=['GET'])
@login_required
def get_user_orders():
    """Get all orders for the current user"""
    try:
        user_orders = Order.query.filter_by(user_uuid=current_user.user_uuid)\
            .order_by(Order.created_at.desc())\
            .all()
        
        return jsonify({
            'status': 'success',
            'orders': [order.to_dict() for order in user_orders]
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch orders: {str(e)}'
        }), 400

@orders.route('/api/orders/<order_uuid>', methods=['GET'])
@login_required
def get_order_details(order_uuid):
    """Get details for a specific order"""
    try:
        order = Order.query.filter_by(
            order_uuid=order_uuid,
            user_uuid=current_user.user_uuid
        ).first()
        
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        return jsonify({
            'status': 'success',
            'order': order.to_dict()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch order details: {str(e)}'
        }), 400 

@orders.route('/api/orders/<order_uuid>/receive', methods=['POST'])
@login_required
def receive_order(order_uuid):
    """Mark an order as received and handle revenue updates for COD payments"""
    try:
        # Get the order
        order = Order.query.filter_by(
            order_uuid=order_uuid,
            user_uuid=current_user.user_uuid
        ).first()
        
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        # Verify order can be received
        if not order.shipped_at:
            return jsonify({
                'status': 'error',
                'message': 'Order has not been shipped yet'
            }), 400
            
        if order.delivered_at:
            return jsonify({
                'status': 'error',
                'message': 'Order has already been marked as received'
            }), 400
            
        if order.status == 'cancelled':
            return jsonify({
                'status': 'error',
                'message': 'Cannot receive a cancelled order'
            }), 400

        # Update order status
        order.delivered_at = datetime.utcnow()
        order.status = 'completed'
        
        # For COD orders, update payment status and handle revenue
        if order.payment_method == 'cod':
            order.payment_status = 'completed'
            order.paid_at = datetime.utcnow()
            
            # Update revenue for each product
            for item in order.items:
                product = Product.query.get(item.product_uuid)
                if product:
                    # Update product revenue
                    current_revenue = float(product.total_revenue or 0)
                    item_total = float(item.unit_price) * item.quantity
                    product.total_revenue = current_revenue + item_total
                    
                    # Update total sales count
                    product.total_sales += item.quantity

        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Order marked as received successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error receiving order: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to mark order as received'
        }), 500