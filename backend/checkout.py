from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from models import db, Order, OrderItem, PaymentMethod, CartItem
from products import Product, ProductVariation, ProductVariationOption
from utils.emails import generate_and_send_invoice, send_order_confirmation
from datetime import datetime
import os

checkout = Blueprint('checkout', __name__)

# Create uploads directory if it doesn't exist
os.makedirs('invoices', exist_ok=True)

@checkout.route('/api/checkout/payment-methods', methods=['GET'])
@login_required
def get_payment_methods():
    """Get user's saved payment methods"""
    payment_methods = PaymentMethod.query.filter_by(user_uuid=current_user.user_uuid).all()
    return jsonify({
        'status': 'success',
        'payment_methods': [method.to_dict() for method in payment_methods]
    })

@checkout.route('/api/checkout/payment-methods', methods=['POST'])
@login_required
def add_payment_method():
    """Add a new payment method"""
    data = request.get_json()
    
    # Set all existing payment methods as non-default if this one is default
    if data.get('is_default'):
        PaymentMethod.query.filter_by(user_uuid=current_user.user_uuid).update({'is_default': False})
    
    payment_method = PaymentMethod(
        user_uuid=current_user.user_uuid,
        type=data['type'],
        is_default=data.get('is_default', False)
    )
    
    if data['type'] == 'credit_card':
        payment_method.card_type = data['card_type']
        payment_method.last_four = data['card_number'][-4:]
        payment_method.expiry_month = data['expiry_month']
        payment_method.expiry_year = data['expiry_year']
        payment_method.card_holder_name = data['card_holder_name']
    elif data['type'] == 'paypal':
        payment_method.paypal_email = data['paypal_email']
    
    db.session.add(payment_method)
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'Payment method added successfully',
        'payment_method': payment_method.to_dict()
    })

@checkout.route('/api/checkout/process', methods=['POST'])
@login_required
def process_checkout():
    """Process the checkout"""
    data = request.get_json()
    print("Received data:", data)  # Debug print
    
    # Validate required fields
    required_fields = ['items', 'shipping_address', 'payment_method_uuid', 'shipping_fee']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'status': 'error',
                'message': f'Missing required field: {field}'
            }), 400
    
    try:
        # Get payment method
        payment_method = PaymentMethod.query.get(data['payment_method_uuid'])
        if not payment_method:
            return jsonify({
                'status': 'error',
                'message': 'Invalid payment method'
            }), 400

        # Get cart items
        cart_items = []
        for item_data in data['items']:
            cart_item = CartItem.query.filter_by(
                user_id=current_user.user_uuid,
                product_uuid=item_data['product_uuid']
            ).first()
            if cart_item:
                cart_items.append(cart_item)
        
        if not cart_items:
            return jsonify({
                'status': 'error',
                'message': 'No items found in cart'
            }), 400
        
        # Validate inventory before proceeding
        for cart_item in cart_items:
            product = Product.query.get(cart_item.product_uuid)
            if not product:
                return jsonify({
                    'status': 'error',
                    'message': f'Product not found: {cart_item.product_uuid}'
                }), 400
            
            if cart_item.variation_uuid:
                # Check variation stock
                variation = ProductVariation.query.get(cart_item.variation_uuid)
                if not variation:
                    return jsonify({
                        'status': 'error',
                        'message': f'Product variation not found: {cart_item.variation_uuid}'
                    }), 400
                
                if cart_item.selected_option:
                    option = ProductVariationOption.query.filter_by(
                        variation_uuid=variation.variation_uuid,
                        value=cart_item.selected_option['value']
                    ).first()
                    
                    if not option:
                        return jsonify({
                            'status': 'error',
                            'message': f'Product variation option not found'
                        }), 400
                    
                    if option.stock < cart_item.quantity:
                        return jsonify({
                            'status': 'error',
                            'message': f'Insufficient stock for {product.name} - {option.value}'
                        }), 400
            else:
                # Check main product stock
                if product.quantity < cart_item.quantity:
                    return jsonify({
                        'status': 'error',
                        'message': f'Insufficient stock for {product.name}'
                    }), 400
        
        # Calculate totals
        subtotal = sum(
            item.quantity * float(
                item.selected_option['price'] 
                if item.selected_option and 'price' in item.selected_option 
                else item.product.price
            ) for item in cart_items
        )
        
        shipping_fee = float(data['shipping_fee'])
        total = subtotal + shipping_fee
        
        # Create order
        order = Order(
            user_uuid=current_user.user_uuid,
            payment_method=payment_method.type,
            shipping_address=data['shipping_address'],
            shipping_method=data.get('shipping_method', 'standard'),
            shipping_fee=shipping_fee,
            subtotal=subtotal,
            total=total,
            status='processing' if payment_method.type == 'cod' else 'pending',
            payment_status='pending'
        )
        db.session.add(order)
        db.session.flush()  # This ensures order_uuid is generated
        
        # Create order items and update inventory
        for cart_item in cart_items:
            product = Product.query.get(cart_item.product_uuid)
            
            # Get the correct price based on variation/option
            unit_price = float(cart_item.selected_option['price']) if cart_item.selected_option and 'price' in cart_item.selected_option else float(product.price)
            
            order_item = OrderItem(
                order_uuid=order.order_uuid,
                product_uuid=cart_item.product_uuid,
                variation_uuid=cart_item.variation_uuid,
                quantity=cart_item.quantity,
                unit_price=unit_price,
                subtotal=cart_item.quantity * unit_price,
                selected_option=cart_item.selected_option
            )
            db.session.add(order_item)
            
            # Update inventory
            if cart_item.variation_uuid and cart_item.selected_option:
                # Update variation option stock
                option = ProductVariationOption.query.filter_by(
                    variation_uuid=cart_item.variation_uuid,
                    value=cart_item.selected_option['value']
                ).first()
                if option:
                    option.stock -= cart_item.quantity
            else:
                # Update main product stock
                product.quantity -= cart_item.quantity
            
            # Update product stats
            product.total_sales = (product.total_sales or 0) + cart_item.quantity
            product.total_revenue = float(product.total_revenue or 0) + (unit_price * cart_item.quantity)
        
        # For COD orders, process immediately
        if payment_method.type == 'cod':
            # Send invoice and confirmation email
            generate_and_send_invoice(order, current_user.email)
            send_order_confirmation(order, current_user.email)
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Order placed successfully',
            'order': order.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print("Error processing order:", str(e))  # Debug print
        return jsonify({
            'status': 'error',
            'message': f'Failed to process order: {str(e)}'
        }), 400

@checkout.route('/api/checkout/process-payment', methods=['POST'])
@login_required
def process_payment():
    """Process payment for an order"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['order_uuid', 'payment_method_uuid', 'amount', 'status']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'status': 'error',
                'message': f'Missing required field: {field}'
            }), 400
    
    try:
        # Get the order
        order = Order.query.get(data['order_uuid'])
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        # Verify order belongs to current user
        if order.user_uuid != current_user.user_uuid:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized'
            }), 403
        
        # Get payment method
        payment_method = PaymentMethod.query.get(data['payment_method_uuid'])
        if not payment_method:
            return jsonify({
                'status': 'error',
                'message': 'Invalid payment method'
            }), 400
        
        # Here you would integrate with your payment processor (Stripe, PayPal, etc.)
        # For now, we'll simulate a successful payment
        order.payment_status = data['status']
        order.status = 'paid' if data['status'] == 'completed' else 'pending'
        order.paid_at = datetime.utcnow() if data['status'] == 'completed' else None
        order.transaction_id = f'SIMULATED_{datetime.utcnow().timestamp()}'
        
        # If payment is completed, send notifications
        if data['status'] == 'completed':
            try:
                # Generate and send invoice
                generate_and_send_invoice(order, current_user.email)
                
                # Send confirmation email
                send_order_confirmation(order, current_user.email)
                
                db.session.commit()
                
                return jsonify({
                    'status': 'success',
                    'message': 'Payment processed successfully',
                    'order': order.to_dict()
                })
            except Exception as e:
                print(f"Error in notifications: {str(e)}")
                # Even if notifications fail, we want to commit the payment
                db.session.commit()
                return jsonify({
                    'status': 'success',
                    'message': 'Payment processed successfully (notification error)',
                    'order': order.to_dict()
                })
        else:
            db.session.commit()
            return jsonify({
                'status': 'success',
                'message': 'Payment status updated',
                'order': order.to_dict()
            })
        
    except Exception as e:
        db.session.rollback()
        print("Error processing payment:", str(e))  # Debug print
        return jsonify({
            'status': 'error',
            'message': f'Payment processing failed: {str(e)}'
        }), 400

@checkout.route('/api/checkout/cancel-order', methods=['POST', 'OPTIONS'])
@login_required
def cancel_order():
    """Request cancellation of an order"""
    # Handle preflight request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response

    data = request.get_json()
    print("Received data:", data)  # Debug print
    
    # Validate required fields
    if not data or 'order_uuid' not in data or 'reason' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields'
        }), 400
    
    try:
        # Get the order
        order = Order.query.get(data['order_uuid'])
        if not order:
            return jsonify({
                'status': 'error',
                'message': 'Order not found'
            }), 404
        
        # Verify order belongs to current user
        if order.user_uuid != current_user.user_uuid:
            return jsonify({
                'status': 'error',
                'message': 'Unauthorized'
            }), 403
        
        # Check if order can be cancelled
        if order.shipped_at or order.delivered_at or order.status in ['cancelled', 'cancellation_pending']:
            return jsonify({
                'status': 'error',
                'message': 'Cannot request cancellation in current state'
            }), 400

        # Update order status to cancellation pending
        order.status = 'cancellation_pending'
        order.cancellation_reason = data['reason']
        order.cancellation_requested_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Cancellation request submitted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error requesting cancellation: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to submit cancellation request'
        }), 500