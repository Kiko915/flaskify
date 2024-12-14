from flask import Blueprint, jsonify, make_response
from flask_login import login_required, current_user
from models import db, Users, Product, Order, Shop, SellerInfo, Role
from sqlalchemy import func, and_, distinct
from datetime import datetime, timedelta
import sys

admin = Blueprint('admin', __name__)

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

@admin.route('/admin/dashboard/stats', methods=['GET'])
@login_required
def get_dashboard_stats():
    if current_user.role != Role.ADMIN:
        print("Access denied: User is not admin", flush=True)
        response = make_response(jsonify({'error': 'Unauthorized'}), 403)
        return add_cors_headers(response)

    try:
        print("\n=== DASHBOARD STATS CALCULATION ===", flush=True)
        
        # Debug current user
        print(f"Current User: {current_user.email} (Role: {current_user.role})", flush=True)

        # Get user counts
        print("\nCounting users...", flush=True)
        total_users = Users.query.count()
        buyers = Users.query.filter_by(role=Role.BUYER).count()
        sellers = Users.query.filter_by(role=Role.SELLER).count()
        approved_sellers = SellerInfo.query.filter_by(status='Approved').count()
        pending_sellers = SellerInfo.query.filter_by(status='Pending').count()
        
        print(f"User counts - Total: {total_users}, Buyers: {buyers}, Sellers: {sellers}", flush=True)
        print(f"Seller status - Approved: {approved_sellers}, Pending: {pending_sellers}", flush=True)

        # Get products count - count all visible products
        print("\nCounting products...", flush=True)
        total_products = Product.query.filter_by(visibility=True).count()
        print(f"Total visible products in database: {total_products}", flush=True)
        
        # Debug product info
        print("\nFirst 3 visible products:", flush=True)
        products = Product.query.filter_by(visibility=True).limit(3).all()
        for product in products:
            print(f"- {product.name} (ID: {product.product_uuid})", flush=True)
            print(f"  Status: {product.status}", flush=True)
            print(f"  Price: ${product.price}", flush=True)
            print(f"  Total Revenue: ${product.total_revenue}", flush=True)

        # Calculate total revenue from completed orders and update product revenue
        print("\nCalculating total revenue...", flush=True)
        
        # First update each product's total revenue from its completed orders
        completed_orders = Order.query.filter(
            Order.status.in_(['completed', 'delivered'])
        ).all()
        
        total_revenue = 0
        for order in completed_orders:
            total_revenue += float(order.total or 0)
            # Update product revenue
            for item in order.items:
                product = Product.query.get(item.product_uuid)
                if product:
                    product.total_revenue = float(product.total_revenue or 0) + float(item.subtotal or 0)
        
        try:
            db.session.commit()
            print("Updated product revenues successfully", flush=True)
        except Exception as e:
            db.session.rollback()
            print(f"Error updating product revenues: {str(e)}", flush=True)
        
        print(f"Total revenue from completed orders: ${total_revenue}", flush=True)

        # Get order counts
        print("\nCounting orders...", flush=True)
        total_orders = Order.query.count()
        pending_orders = Order.query.filter(
            Order.status.in_(['pending', 'processing'])
        ).count()
        
        print(f"Order counts - Total: {total_orders}, Pending: {pending_orders}", flush=True)

        # Get shop counts
        print("\nCounting shops...", flush=True)
        active_shops = Shop.query.filter_by(is_archived=False).join(
            SellerInfo, Shop.seller_id == SellerInfo.seller_id
        ).filter(SellerInfo.status == 'Approved').count()

        pending_shops = Shop.query.filter_by(is_archived=False).join(
            SellerInfo, Shop.seller_id == SellerInfo.seller_id
        ).filter(SellerInfo.status == 'Pending').count()
        
        print(f"Shop counts - Active: {active_shops}, Pending: {pending_shops}", flush=True)

        # Prepare response
        stats = {
            'buyers': buyers,
            'sellers': sellers,
            'approvedSellers': approved_sellers,
            'pendingSellers': pending_sellers,
            'totalProducts': total_products,
            'totalRevenue': float(total_revenue),
            'totalOrders': total_orders,
            'pendingOrders': pending_orders,
            'activeShops': active_shops,
            'pendingShops': pending_shops
        }

        print("\nFinal stats:", flush=True)
        print(stats, flush=True)
        print("\n=== CALCULATION COMPLETE ===", flush=True)

        response = make_response(jsonify(stats), 200)
        return add_cors_headers(response)

    except Exception as e:
        print("\nERROR in get_dashboard_stats:", flush=True)
        print(f"Error message: {str(e)}", flush=True)
        import traceback
        print("Traceback:", flush=True)
        print(traceback.format_exc(), flush=True)
        
        response = make_response(jsonify({'error': str(e)}), 500)
        return add_cors_headers(response)

@admin.route('/admin/dashboard/sales', methods=['GET'])
@login_required
def get_sales_data():
    if current_user.role != Role.ADMIN:
        response = make_response(jsonify({'error': 'Unauthorized'}), 403)
        return add_cors_headers(response)

    try:
        # Get daily data for the last 30 days
        current_date = datetime.utcnow()
        start_date = current_date - timedelta(days=30)
        
        # Query for daily metrics with proper joins and filters
        daily_metrics = db.session.query(
            func.date(Order.created_at).label('date'),
            func.coalesce(func.sum(Order.total), 0).label('sales'),
            func.count(Order.order_uuid).label('orders'),
            func.count(distinct(Users.user_uuid)).label('users')
        ).outerjoin(
            Users, Users.user_uuid == Order.user_uuid
        ).filter(
            Order.created_at >= start_date,
            Order.status.in_(['paid', 'shipped', 'delivered'])
        ).group_by(
            func.date(Order.created_at)
        ).all()

        # Format data for the charts
        sales_data = []
        for metric in daily_metrics:
            sales_data.append({
                'date': metric.date.strftime('%Y-%m-%d'),
                'sales': float(metric.sales),
                'orders': int(metric.orders),
                'users': int(metric.users)
            })

        # Fill in missing dates with zero values
        date_set = {metric['date'] for metric in sales_data}
        current = start_date
        while current <= current_date:
            date_str = current.strftime('%Y-%m-%d')
            if date_str not in date_set:
                sales_data.append({
                    'date': date_str,
                    'sales': 0.0,
                    'orders': 0,
                    'users': 0
                })
            current += timedelta(days=1)

        # Sort by date
        sales_data.sort(key=lambda x: x['date'])

        response = make_response(jsonify(sales_data), 200)
        return add_cors_headers(response)

    except Exception as e:
        print(f"Error in get_sales_data: {str(e)}")
        response = make_response(jsonify({'error': str(e)}), 500)
        return add_cors_headers(response)
