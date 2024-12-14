from flask import Blueprint, jsonify
from models import Product
from sqlalchemy import and_

featured_products = Blueprint('featured_products', __name__)

def get_featured_products():
    """
    Get featured products ranked by a dynamic weighting algorithm.
    
    Weights:
    - Manual Feature (featured=True): +100 points
    - View Count: +0.5 points per view
    - Total Sales: +1.0 points per sale
    - Discount Percentage: +2.0 points per percentage
    
    Returns:
        List of top 10 products sorted by score
    """
    try:
        # Query active and visible products
        products = Product.query.filter(
            and_(
                Product.status == 'active',
                Product.visibility == True
            )
        ).all()
        
        # Calculate scores for each product
        product_scores = []
        for product in products:
            score = 0
            
            # Manual feature weight
            if product.featured:
                score += 100
            
            # View count weight
            score += product.view_count * 0.5
            
            # Total sales weight
            score += product.total_sales * 1.0
            
            # Discount percentage weight
            if product.discount_percentage:
                score += product.discount_percentage * 2.0
            
            product_scores.append({
                'product': product,
                'score': score
            })
        
        # Sort products by score in descending order
        sorted_products = sorted(product_scores, key=lambda x: x['score'], reverse=True)
        
        # Return top 10 products
        top_products = [item['product'] for item in sorted_products[:10]]
        return top_products
        
    except Exception as e:
        print(f"Error getting featured products: {str(e)}")
        return []

@featured_products.route('/featured', methods=['GET'])
def get_featured_products_endpoint():
    """API endpoint to get featured products"""
    try:
        featured_products = get_featured_products()
        return jsonify([product.to_dict() for product in featured_products]), 200
    except Exception as e:
        return jsonify({
            'error': f'Error fetching featured products: {str(e)}'
        }), 500 