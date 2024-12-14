from flask import Blueprint, request, jsonify, send_file
from flask_login import login_required, current_user
from datetime import datetime, timedelta, timezone
from models import db, Product, Shop, SellerInfo, Role, ProductVariation, ProductVariationOption, Category, ShippingProvider, ShippingRate, Review, ChatRoom, Users, Wishlist
from sqlalchemy import or_, and_
import cloudinary
import cloudinary.uploader
import cloudinary.api
import uuid
import json
import re
from decimal import Decimal
import secrets
import string
import pandas as pd
import io
from werkzeug.utils import secure_filename
import requests
from utils.auth_utils import role_required

products = Blueprint('products', __name__)

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_verification_code():
    """Generate a random 6-character verification code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(6))

def apply_discount_to_product(product, discount_percentage):
    """Helper function to apply discount to a product and its variations"""
    if product.compare_at_price:
        product.price = round(float(product.compare_at_price) * (1 - discount_percentage / 100), 2)
        
        # Apply to variations
        for variation in product.variations:
            if variation.compare_at_price:
                variation.price = round(float(variation.compare_at_price) * (1 - discount_percentage / 100), 2)
                
                # Apply to options
                for option in variation.options:
                    if option.price is not None and option.compare_at_price:
                        option.price = round(float(option.compare_at_price) * (1 - discount_percentage / 100), 2)

def remove_discount_from_product(product):
    """Helper function to remove discount from a product and its variations"""
    if product.compare_at_price:
        product.price = product.compare_at_price
        product.compare_at_price = None
        product.discount_name = None
        product.discount_percentage = None
        product.discount_start_date = None
        product.discount_end_date = None
        
        # Remove from variations
        for variation in product.variations:
            if variation.compare_at_price:
                variation.price = variation.compare_at_price
                variation.compare_at_price = None
                
                # Remove from options
                for option in variation.options:
                    if option.compare_at_price:
                        option.price = option.compare_at_price
                        option.compare_at_price = None

@products.route('/cron/update-discounts', methods=['POST'])
def update_discounts():
    try:
        # Get current time in UTC
        now = datetime.now(timezone.utc)
        print(f"Running discount updates at {now}")

        # Find products with pending discounts that should be active
        pending_products = Product.query.filter(
            Product.discount_name.isnot(None),
            Product.discount_start_date <= now,
            Product.discount_end_date >= now,
            Product.price == Product.compare_at_price  # Price hasn't been discounted yet
        ).all()

        # Find products with expired discounts
        expired_products = Product.query.filter(
            Product.discount_name.isnot(None),
            Product.discount_end_date < now
        ).all()

        # Apply pending discounts
        activated_count = 0
        for product in pending_products:
            print(f"Activating discount for product {product.name}")
            if product.compare_at_price:
                product.price = round(float(product.compare_at_price) * (1 - product.discount_percentage / 100), 2)
                
                # Apply to variations
                for variation in product.variations:
                    if variation.compare_at_price:
                        variation.price = round(float(variation.compare_at_price) * (1 - product.discount_percentage / 100), 2)
                        
                        # Apply to options
                        for option in variation.options:
                            if option.price is not None and option.compare_at_price:
                                option.price = round(float(option.compare_at_price) * (1 - product.discount_percentage / 100), 2)
            activated_count += 1

        # Remove expired discounts
        expired_count = 0
        for product in expired_products:
            print(f"Removing expired discount from product {product.name}")
            if product.compare_at_price:
                product.price = product.compare_at_price
                product.compare_at_price = None
                
                # Remove from variations
                for variation in product.variations:
                    if variation.compare_at_price:
                        variation.price = variation.compare_at_price
                        variation.compare_at_price = None
                        
                        # Remove from options
                        for option in variation.options:
                            if option.compare_at_price:
                                option.price = option.compare_at_price
                                option.compare_at_price = None
            
            # Clear discount info
            product.discount_name = None
            product.discount_percentage = None
            product.discount_start_date = None
            product.discount_end_date = None
            expired_count += 1

        db.session.commit()

        return jsonify({
            "message": "Discount updates completed",
            "discounts_activated": activated_count,
            "discounts_expired": expired_count
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error updating discounts: {str(e)}")
        return jsonify({"message": f"Error updating discounts: {str(e)}"}), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products', methods=['POST'])
@login_required
def create_product(seller_id, shop_uuid):
    try:
        # Verify seller exists and has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Verify shop exists and belongs to seller
        shop = Shop.query.filter_by(shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not shop:
            return jsonify({"message": "Shop not found"}), 404

        # Check content type
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json()
        else:
            data = request.form.to_dict()
            # Convert string numbers to appropriate types
            for key in ['price', 'quantity', 'shipping_height', 'shipping_width', 'shipping_length', 'shipping_weight', 'shipping_fee']:
                if key in data and data[key]:
                    try:
                        if key == 'price' or key == 'shipping_fee':
                            data[key] = float(data[key])
                    except ValueError:
                        return jsonify({"message": f"Invalid value for {key}"}), 400

            # Handle compare_at_price separately
            if 'compare_at_price' in data:
                try:
                    if data['compare_at_price'] and data['compare_at_price'].lower() != 'null' and data['compare_at_price'].lower() != 'undefined':
                        data['compare_at_price'] = float(data['compare_at_price'])
                    else:
                        data['compare_at_price'] = None
                except ValueError:
                    return jsonify({"message": "Invalid value for compare_at_price"}), 400

            # Parse JSON strings from form data
            for key in ['specifications', 'variations']:
                if key in data and data[key]:
                    try:
                        data[key] = json.loads(data[key])
                    except json.JSONDecodeError:
                        pass

        print("Processed product data:", data)  # Debug log

        # Create the product
        product = Product(
            shop_uuid=shop_uuid,
            seller_id=seller_id,
            name=data['name'],
            description=data['description'],
            price=data['price'],
            compare_at_price=data.get('compare_at_price'),
            sku=data.get('sku'),
            barcode=data.get('barcode'),
            quantity=data.get('quantity', 0),
            low_stock_alert=data.get('low_stock_alert', 5),
            brand=data.get('brand'),
            category_uuid=data['category_uuid'],
            tags=data.get('tags'),
            specifications=data.get('specifications'),
            shipping_provider_uuid=data.get('shipping_provider_uuid'),
            shipping_rate_uuid=data.get('shipping_rate_uuid'),
            shipping_fee=float(data.get('shipping_fee', 0)),
            shipping_length=float(data.get('shipping_length', 0)),
            shipping_width=float(data.get('shipping_width', 0)),
            shipping_height=float(data.get('shipping_height', 0)),
            shipping_weight=float(data.get('shipping_weight', 0)),
            status=data.get('status', 'active'),
            visibility=data.get('visibility', True),
            featured=data.get('featured', False),
            meta_title=data.get('meta_title'),
            meta_description=data.get('meta_description'),
            weight=data.get('weight'),
            width=data.get('width'),
            height=data.get('height'),
            length=data.get('length')
        )

        # Handle image uploads if present
        if request.files:
            if 'main_image' in request.files:
                main_image = request.files['main_image']
                if main_image and allowed_file(main_image.filename):
                    # Upload to Cloudinary
                    result = cloudinary.uploader.upload(main_image)
                    product.main_image = result['secure_url']

            additional_images = []
            for key in request.files:
                if key.startswith('additional_image_'):
                    image = request.files[key]
                    if image and allowed_file(image.filename):
                        # Upload to Cloudinary
                        result = cloudinary.uploader.upload(image)
                        additional_images.append(result['secure_url'])
            if additional_images:
                product.additional_images = additional_images

        # Add variations if they exist
        if 'variations' in data and data['variations']:
            for var_data in data['variations']:
                variation = ProductVariation(
                    product_uuid=product.product_uuid,
                    price=var_data.get('price', product.price),  # Use variation price or product price
                    quantity=var_data.get('quantity', 0),
                    has_individual_stock=var_data.get('has_individual_stock', True)
                )

                # Add options for this variation
                if 'options' in var_data:
                    for opt_data in var_data['options']:
                        option = ProductVariationOption(
                            name=opt_data['name'],
                            value=opt_data['value'],
                            price=opt_data.get('price', product.price),  # Add option price
                            stock=int(opt_data.get('stock', 0)),
                            low_stock_alert=int(opt_data.get('low_stock_alert', 5)),
                            sku=opt_data.get('sku')
                        )
                        variation.options.append(option)

                product.variations.append(variation)

        db.session.add(product)
        db.session.commit()

        return jsonify({
            "message": "Product created successfully",
            "product_uuid": product.product_uuid
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating product: {str(e)}")  # Debug log
        return jsonify({"message": f"Error creating product: {str(e)}"}), 400

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>', methods=['PATCH'])
@login_required
def update_product(seller_id, shop_uuid, product_uuid):
    try:
        # Get product with validation
        product = Product.query.filter_by(
            product_uuid=product_uuid,
            shop_uuid=shop_uuid,
            seller_id=seller_id
        ).first()
        
        if not product:
            return jsonify({"message": "Product not found"}), 404

        # Check permissions
        if product.seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN):
            return jsonify({"message": "Unauthorized to update this product"}), 403

        # Update fields from form data
        data = request.form.to_dict()
        
        # Get variations data if provided
        try:
            variations_data = json.loads(data.get('variations', '[]'))
        except json.JSONDecodeError:
            return jsonify({"message": "Invalid JSON format for variations"}), 400
        
        # Update basic fields
        fields_to_update = [
            'name', 'description', 'price', 'compare_at_price', 'sku', 'barcode',
            'quantity', 'low_stock_alert', 'brand', 'category_uuid', 'tags',
            'meta_title', 'meta_description', 'weight', 'width', 'height', 'length',
            'shipping_height', 'shipping_width', 'shipping_length', 'shipping_weight',
            'shipping_provider', 'shipping_fee'
        ]
        
        for field in fields_to_update:
            if field in data:
                if field in ['price', 'compare_at_price', 'weight', 'width', 'height', 'length',
                             'shipping_height', 'shipping_width', 'shipping_length', 'shipping_weight',
                             'shipping_fee']:
                    value = float(data[field]) if data[field] else None
                elif field in ['quantity', 'low_stock_alert']:
                    value = int(data[field])
                else:
                    value = data[field]
                setattr(product, field, value)

        # Handle specifications
        if 'specifications' in data:
            try:
                specifications = json.loads(data['specifications'])
                if isinstance(specifications, dict):
                    # Filter out empty or invalid specifications
                    valid_specs = {k: v for k, v in specifications.items() 
                                 if k and v is not None and k != '0'}
                    product.specifications = valid_specs
                else:
                    return jsonify({"message": "Specifications must be a dictionary"}), 400
            except json.JSONDecodeError:
                return jsonify({"message": "Invalid JSON format for specifications"}), 400

        # Handle main image update
        if 'main_image' in request.files:
            file = request.files['main_image']
            if file and allowed_file(file.filename):
                # Delete old image from Cloudinary if exists
                if product.main_image:
                    try:
                        # Extract public_id from the URL
                        public_id = product.main_image.split('/')[-1].split('.')[0]
                        cloudinary.uploader.destroy(f"flaskify/products/{public_id}")
                    except:
                        pass  # If deletion fails, continue with upload
                
                # Upload new image
                result = cloudinary.uploader.upload(
                    file,
                    folder='flaskify/products',
                    public_id=f"{uuid.uuid4()}",
                    overwrite=True,
                    resource_type="auto"
                )
                product.main_image = result['secure_url']

        # Handle additional images update
        new_additional_images = []
        
        # Keep existing images that weren't removed
        images_to_keep = request.form.getlist('images_to_keep')
        if images_to_keep:
            new_additional_images.extend(images_to_keep)

        # Upload new additional images
        if 'additional_images' in request.files:
            files = request.files.getlist('additional_images')
            for file in files:
                if file and allowed_file(file.filename):
                    result = cloudinary.uploader.upload(
                        file,
                        folder='flaskify/products',
                        public_id=f"{uuid.uuid4()}",
                        overwrite=True,
                        resource_type="auto"
                    )
                    new_additional_images.append(result['secure_url'])

        # Delete removed images from Cloudinary
        if product.additional_images:
            for img_url in product.additional_images:
                if img_url not in images_to_keep:
                    try:
                        # Extract public_id from the URL
                        public_id = img_url.split('/')[-1].split('.')[0]
                        cloudinary.uploader.destroy(f"flaskify/products/{public_id}")
                    except:
                        continue

        # Update product with new image list
        product.additional_images = new_additional_images

        # Handle variations
        if 'variations' in data:
            try:
                variations_data = json.loads(data.get('variations', '[]'))
                print('Received variations data:', variations_data)  # Debug log
                
                # Only update variations if new ones are explicitly provided
                if variations_data:
                    # Delete existing variations and their options
                    variations = ProductVariation.query.filter_by(product_uuid=product_uuid).all()
                    for variation in variations:
                        ProductVariationOption.query.filter_by(variation_uuid=variation.variation_uuid).delete()
                    ProductVariation.query.filter_by(product_uuid=product_uuid).delete()

                    total_stock = 0  # Initialize total stock counter

                    # Create new variations
                    for variation_data in variations_data:
                        if 'options' in variation_data:
                            variation_stock = 0  # Initialize variation stock counter
                            
                            # Create variation
                            variation = ProductVariation(
                                product_uuid=product.product_uuid,
                                price=Decimal(str(variation_data.get('price', product.price))),
                                quantity=variation_data.get('quantity', 0),
                                has_individual_stock=True
                            )
                            db.session.add(variation)
                            db.session.flush()  # Flush to get the variation_uuid

                            print('Creating variation:', variation_data)  # Debug log

                            # Create options for this variation
                            for option_data in variation_data['options']:
                                option_stock = int(option_data.get('stock', 0))
                                variation_stock += option_stock
                                
                                option = ProductVariationOption(
                                    option_uuid=str(uuid.uuid4()),
                                    variation_uuid=variation.variation_uuid,
                                    name=option_data['name'],
                                    value=option_data['value'],
                                    price=option_data.get('price', product.price),  # Add option price
                                    stock=option_stock,
                                    low_stock_alert=int(option_data.get('low_stock_alert', 5)),
                                    sku=option_data.get('sku')
                                )
                                db.session.add(option)
                                print('Creating option:', option_data)  # Debug log
                            
                            total_stock += variation_stock
                            variation.stock = variation_stock  # Update variation stock

                    # Update product's total stock
                    product.quantity = total_stock
                    print('Updated product quantity to:', total_stock)  # Debug log

            except json.JSONDecodeError as e:
                print('JSON decode error:', str(e))  # Debug log
                return jsonify({"message": "Invalid JSON format for variations"}), 400
            except Exception as e:
                print('Error handling variations:', str(e))  # Debug log
                return jsonify({"message": f"Error handling variations: {str(e)}"}), 400

        product.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "message": "Product updated successfully",
            "product_uuid": product.product_uuid
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>/publish', methods=['POST'])
@login_required
def publish_product(seller_id, shop_uuid, product_uuid):
    try:
        # Get product with validation
        product = Product.query.filter_by(
            product_uuid=product_uuid,
            shop_uuid=shop_uuid,
            seller_id=seller_id
        ).first()
        
        if not product:
            return jsonify({"message": "Product not found"}), 404

        # Check permissions
        if product.seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN):
            return jsonify({"message": "Unauthorized to update this product"}), 403

        # Update product status
        product.status = 'active'
        product.published_at = datetime.utcnow()

        try:
            db.session.commit()
            return jsonify({
                "message": "Product published successfully",
                "status": product.status
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Database error: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"message": str(e)}), 400

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>/status', methods=['PATCH'])
@login_required
def update_product_status(seller_id, shop_uuid, product_uuid):
    try:
        # Get product with validation
        product = Product.query.filter_by(
            product_uuid=product_uuid,
            shop_uuid=shop_uuid,
            seller_id=seller_id
        ).first()
        
        if not product:
            return jsonify({"message": "Product not found"}), 404

        # Check permissions
        if product.seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN):
            return jsonify({"message": "Unauthorized to update this product"}), 403

        # Get new status from request
        data = request.get_json()
        new_status = data.get('status')
        
        # Validate status
        valid_statuses = ['draft', 'active', 'archived']
        if not new_status or new_status not in valid_statuses:
            return jsonify({"message": "Invalid status. Must be one of: draft, active, archived"}), 400

        # Update product status
        product.status = new_status
        product.updated_at = datetime.utcnow()

        try:
            db.session.commit()
            return jsonify({
                "message": "Product status updated successfully",
                "status": product.status
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"message": f"Database error: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"message": str(e)}), 400

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>/archive', methods=['POST'])
@login_required
def archive_product(seller_id, shop_uuid, product_uuid):
    data = request.get_json()
    verification_code = data.get('verification_code')
    expected_code = request.args.get('code')  # Get the code from query parameter
    
    if not verification_code or not expected_code or verification_code != expected_code:
        return jsonify({
            'status': 'error',
            'message': 'Invalid verification code'
        }), 400

    product = Product.query.filter_by(
        product_uuid=product_uuid,
        shop_uuid=shop_uuid,
        seller_id=seller_id
    ).first()
    
    if not product:
        return jsonify({
            'status': 'error',
            'message': 'Product not found'
        }), 404

    try:
        product.status = 'archived'
        product.visibility = False
        db.session.commit()

        product_data = product.to_dict()
        product_data.update({
            'archive_code': generate_verification_code(),
            'unarchive_code': generate_verification_code(),
            'expires_at': (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        })

        return jsonify({
            'status': 'success',
            'message': 'Product archived successfully',
            'product': product_data
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>/unarchive', methods=['POST'])
@login_required
def unarchive_product(seller_id, shop_uuid, product_uuid):
    data = request.get_json()
    verification_code = data.get('verification_code')
    expected_code = request.args.get('code')  # Get the code from query parameter
    
    if not verification_code or not expected_code or verification_code != expected_code:
        return jsonify({
            'status': 'error',
            'message': 'Invalid verification code'
        }), 400

    product = Product.query.filter_by(
        product_uuid=product_uuid,
        shop_uuid=shop_uuid,
        seller_id=seller_id
    ).first()
    
    if not product:
        return jsonify({
            'status': 'error',
            'message': 'Product not found'
        }), 404

    try:
        product.status = 'draft'
        product.visibility = True
        db.session.commit()

        product_data = product.to_dict()
        product_data.update({
            'archive_code': generate_verification_code(),
            'unarchive_code': generate_verification_code(),
            'expires_at': (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        })

        return jsonify({
            'status': 'success',
            'message': 'Product unarchived successfully',
            'product': product_data
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>', methods=['GET'])
@login_required
def get_product(seller_id, shop_uuid, product_uuid):
    try:
        # Get the product with all relationships eagerly loaded
        product = Product.query.options(
            db.joinedload(Product.category),
            db.joinedload(Product.variations).joinedload(ProductVariation.options)
        ).filter_by(
            product_uuid=product_uuid,
            seller_id=seller_id,
            shop_uuid=shop_uuid
        ).first()
        
        if not product:
            return jsonify({"message": "Product not found"}), 404

        # Get category path if category exists
        category_name = None
        category_path = None
        if product.category:
            category_name = product.category.name
            category_path = product.category.get_path()

        # Convert product to dict with all necessary data
        product_data = product.to_dict()  # Use the model's to_dict method
        
        # Add category path information
        product_data.update({
            'category_name': category_name,
            'category_path': category_path
        })

        return jsonify(product_data), 200

    except Exception as e:
        print(f"Error getting product: {str(e)}")
        return jsonify({"message": str(e)}), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products', methods=['GET'])
@login_required
def get_products(seller_id, shop_uuid):
    try:
        # Validate access
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')
        category = request.args.get('category')
        status = request.args.get('status')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')

        # Base query
        query = Product.query.filter_by(shop_uuid=shop_uuid)

        # Apply filters
        if search:
            search_filter = or_(
                Product.name.ilike(f'%{search}%'),
                Product.description.ilike(f'%{search}%'),
                Product.sku.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)

        if category:
            query = query.filter_by(category_uuid=category)

        if status:
            query = query.filter_by(status=status)

        # Apply sorting
        if sort_order == 'desc':
            query = query.order_by(getattr(Product, sort_by).desc())
        else:
            query = query.order_by(getattr(Product, sort_by).asc())

        # Paginate results
        products = query.paginate(page=page, per_page=per_page)

        return jsonify({
            "products": [p.to_dict() for p in products.items],
            "total": products.total,
            "pages": products.pages,
            "current_page": products.page
        }), 200

    except Exception as e:
        print(f"Error fetching products: {str(e)}")
        return jsonify({"message": "Failed to fetch products", "error": str(e)}), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/count', methods=['GET'])
@login_required
def get_product_count(seller_id, shop_uuid):
    try:
        # Check if seller exists and user has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Check if shop exists and belongs to seller
        shop = Shop.query.filter_by(shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not shop:
            return jsonify({"message": "Shop not found"}), 404

        # Count products for the shop
        product_count = Product.query.filter_by(shop_uuid=shop_uuid).count()

        return jsonify({
            "count": product_count
        }), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>', methods=['DELETE'])
@login_required
def delete_product(seller_id, shop_uuid, product_uuid):
    try:
        # Get product with validation
        product = Product.query.filter_by(
            product_uuid=product_uuid,
            shop_uuid=shop_uuid,
            seller_id=seller_id
        ).first()
        
        if not product:
            return jsonify({"message": "Product not found"}), 404

        # Check permissions
        if product.seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN):
            return jsonify({"message": "Unauthorized to delete this product"}), 403

        # Delete images from Cloudinary
        if product.main_image:
            try:
                # Extract public_id from the URL
                public_id = product.main_image.split('/')[-1].split('.')[0]
                cloudinary.uploader.destroy(f"flaskify/products/{public_id}")
            except:
                pass

        if product.additional_images:
            for img_url in product.additional_images:
                try:
                    public_id = img_url.split('/')[-1].split('.')[0]
                    cloudinary.uploader.destroy(f"flaskify/products/{public_id}")
                except:
                    continue

        # Delete product variations
        ProductVariation.query.filter_by(product_uuid=product_uuid).delete()

        # Delete product from database
        db.session.delete(product)
        db.session.commit()

        return jsonify({"message": "Product deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Failed to delete product", "error": str(e)}), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>/inventory', methods=['GET', 'PUT'])
@login_required
def manage_inventory(seller_id, shop_uuid, product_uuid):
    try:
        print(f"Managing inventory for product: {product_uuid}")
        
        # Check if seller exists and user has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            print("Seller not found or access denied")
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Check if shop exists and belongs to seller
        shop = Shop.query.filter_by(shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not shop:
            print("Shop not found")
            return jsonify({"message": "Shop not found"}), 404

        # Check if product exists and belongs to shop
        product = Product.query.filter_by(product_uuid=product_uuid, shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not product:
            print("Product not found")
            return jsonify({"message": "Product not found"}), 404

        if request.method == 'GET':
            print("Processing GET request")
            # Return product inventory data
            response_data = {
                "quantity": product.quantity,  # Use quantity for base product
                "low_stock_alert": product.low_stock_alert,
                "sku": product.sku,
                "variations": [],
                "product_name": product.name
            }

            # Add variation data if product has variations
            if product.variations:
                print(f"Found {len(product.variations)} variations for product {product_uuid}")
                for variation in product.variations:
                    print(f"Processing variation {variation.variation_uuid}")
                    var_data = {
                        "variation_uuid": variation.variation_uuid,
                        "options": []
                    }
                    print(f"Found {len(variation.options)} options for variation {variation.variation_uuid}")
                    for option in variation.options:
                        print(f"Processing option {option.option_uuid}: {option.value} (stock: {option.stock})")
                        var_data["options"].append({
                            "option_uuid": option.option_uuid,
                            "name": option.value,
                            "stock": option.stock,
                            "low_stock_alert": option.low_stock_alert,
                            "sku": option.sku
                        })
                    response_data["variations"].append(var_data)

            print("Returning inventory data:", response_data)
            return jsonify(response_data), 200

        elif request.method == 'PUT':
            try:
                data = request.get_json()
                print("\n=== Processing PUT Request ===")
                print("Raw request data:", data)
                
                if not data or 'updates' not in data:
                    print("No updates found in request data")
                    return jsonify({"message": "No updates provided"}), 400

                updates = data['updates']
                print(f"\nProcessing {len(updates)} updates")

                for update in updates:
                    print(f"\n=== Processing Update ===")
                    print(f"Update data: {update}")
                    
                    if update['type'] == 'base':
                        # Update base product
                        field = update['field']
                        value = update['value']
                        
                        if field == 'stock':
                            product.quantity = max(0, value)
                            print(f"Updated base stock to: {product.quantity}")
                        elif field == 'low_stock_alert':
                            product.low_stock_alert = max(0, value)
                            print(f"Updated base low stock alert to: {product.low_stock_alert}")
                    
                    elif update['type'] == 'variation':
                        # Get the full UUIDs
                        variation_uuid = update['variation_uuid']
                        option_uuid = update['option_uuid']
                        field = update['field']
                        value = update['value']
                        
                        print(f"Looking for variation {variation_uuid} and option {option_uuid}")
                        
                        # Get all variations for debugging
                        all_variations = ProductVariation.query.filter_by(product_uuid=product_uuid).all()
                        print("Available variations:")
                        for v in all_variations:
                            print(f"  Variation: {v.variation_uuid}")
                            for o in v.options:
                                print(f"    Option: {o.option_uuid} - {o.value}")
                        
                        # Find the variation
                        variation = ProductVariation.query.filter(
                            ProductVariation.variation_uuid.like(f"{variation_uuid}%"),
                            ProductVariation.product_uuid == product_uuid
                        ).first()
                        
                        if variation:
                            print(f"Found variation: {variation.variation_uuid}")
                            
                            # Find the option
                            option = ProductVariationOption.query.filter(
                                ProductVariationOption.option_uuid.like(f"{option_uuid}%"),
                                ProductVariationOption.variation_uuid == variation.variation_uuid
                            ).first()
                            
                            if option:
                                print(f"Found option: {option.option_uuid} ({option.value})")
                                if field == 'stock':
                                    option.stock = max(0, value)
                                    print(f"Updated option stock to: {option.stock}")
                                elif field == 'low_stock_alert':
                                    option.low_stock_alert = max(0, value)
                                    print(f"Updated option low stock alert to: {option.low_stock_alert}")
                                
                                # Update variation quantity if needed
                                if field == 'stock' and variation.has_individual_stock:
                                    total_stock = sum(opt.stock for opt in variation.options)
                                    variation.quantity = total_stock
                                    print(f"Updated variation total stock to: {variation.quantity}")
                                    
                                    # Update base product quantity as sum of all variation stocks
                                    total_stock = 0
                                    for var in product.variations:
                                        var_stock = sum(opt.stock for opt in var.options)
                                        total_stock += var_stock
                                    product.quantity = total_stock
                                    print(f"Updated base product total stock to: {product.quantity}")
                            else:
                                print(f"Option not found: {option_uuid}")
                                print("Available options for this variation:")
                                for o in variation.options:
                                    print(f"  {o.option_uuid} - {o.value}")
                        else:
                            print(f"Variation not found: {variation_uuid}")

                # Commit all changes
                db.session.commit()
                print("\nSuccessfully committed all updates")

                # Return updated data
                response_data = {
                    "quantity": product.quantity,
                    "low_stock_alert": product.low_stock_alert,
                    "sku": product.sku,
                    "variations": [],
                    "product_name": product.name
                }

                if product.variations:
                    for variation in product.variations:
                        var_data = {
                            "variation_uuid": variation.variation_uuid,
                            "options": []
                        }
                        for option in variation.options:
                            var_data["options"].append({
                                "option_uuid": option.option_uuid,
                                "name": option.value,
                                "stock": option.stock,
                                "low_stock_alert": option.low_stock_alert,
                                "sku": option.sku
                            })
                        response_data["variations"].append(var_data)

                print(f"Returning updated data: {response_data}")
                return jsonify(response_data), 200

            except Exception as e:
                db.session.rollback()
                print(f"Error processing updates: {str(e)}")
                return jsonify({"message": f"Error processing updates: {str(e)}"}), 500

    except Exception as e:
        print(f"Error in manage_inventory: {str(e)}")
        return jsonify({"message": str(e)}), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>/images', methods=['POST'])
@login_required
def upload_product_images(seller_id, shop_uuid, product_uuid):
    try:
        # Verify seller exists and has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Verify shop exists and belongs to seller
        shop = Shop.query.filter_by(shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not shop:
            return jsonify({"message": "Shop not found"}), 404

        # Verify product exists and belongs to shop
        product = Product.query.filter_by(product_uuid=product_uuid, shop_uuid=shop_uuid).first()
        if not product:
            return jsonify({"message": "Product not found"}), 404

        if 'main_image' in request.files:
            main_image = request.files['main_image']
            if main_image and allowed_file(main_image.filename):
                # Upload to Cloudinary
                result = cloudinary.uploader.upload(main_image)
                product.main_image = result['secure_url']

        additional_images = []
        for key in request.files:
            if key.startswith('additional_image_'):
                image = request.files[key]
                if image and allowed_file(image.filename):
                    # Upload to Cloudinary
                    result = cloudinary.uploader.upload(image)
                    additional_images.append(result['secure_url'])
        if additional_images:
            product.additional_images = additional_images

        db.session.commit()

        return jsonify({
            "message": "Product images uploaded successfully",
            "main_image": product.main_image,
            "additional_images": product.additional_images
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error uploading product images: {str(e)}")
        return jsonify({"message": f"Error uploading product images: {str(e)}"}), 400

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>/inventory', methods=['PUT'])
@login_required
def manage_inventory_put(seller_id, shop_uuid, product_uuid):
    try:
        print("\n=== Starting Inventory Update ===")
        # Get the product
        product = Product.query.filter_by(product_uuid=product_uuid).first()
        if not product:
            return jsonify({"message": "Product not found"}), 404

        # Get update data
        data = request.get_json()
        if not data or 'updates' not in data:
            return jsonify({"message": "No updates provided"}), 400

        updates = data['updates']
        print(f"Received updates: {updates}")

        try:
            for update in updates:
                print(f"\nProcessing update: {update}")
                
                if update['type'] == 'base':
                    # Update base product
                    field = update['field']
                    value = update['value']
                    
                    if field == 'stock':
                        product.quantity = max(0, value)
                        print(f"Updated base stock to: {product.quantity}")
                    elif field == 'low_stock_alert':
                        product.low_stock_alert = max(0, value)
                        print(f"Updated base low stock alert to: {product.low_stock_alert}")
                
                elif update['type'] == 'variation':
                    # Get the full UUIDs
                    variation_uuid = update['variation_uuid']
                    option_uuid = update['option_uuid']
                    field = update['field']
                    value = update['value']
                    
                    print(f"Looking for variation {variation_uuid} and option {option_uuid}")
                    
                    # First get the variation
                    variation = ProductVariation.query.filter_by(
                        variation_uuid=variation_uuid,
                        product_uuid=product_uuid
                    ).first()
                    
                    if variation:
                        print(f"Found variation: {variation.variation_uuid}")
                        
                        # Then get the option
                        option = ProductVariationOption.query.filter_by(
                            option_uuid=option_uuid,
                            variation_uuid=variation_uuid
                        ).first()
                        
                        if option:
                            print(f"Found option: {option.option_uuid}")
                            if field == 'stock':
                                option.stock = max(0, value)
                                print(f"Updated option stock to: {option.stock}")
                            elif field == 'low_stock_alert':
                                option.low_stock_alert = max(0, value)
                                print(f"Updated option low stock alert to: {option.low_stock_alert}")
                            
                            # Update variation quantity if needed
                            if field == 'stock' and variation.has_individual_stock:
                                total_stock = sum(opt.stock for opt in variation.options)
                                variation.quantity = total_stock
                                print(f"Updated variation total stock to: {variation.quantity}")
                                
                                # Update base product quantity as sum of all variation stocks
                                total_stock = 0
                                for var in product.variations:
                                    var_stock = sum(opt.stock for opt in var.options)
                                    total_stock += var_stock
                                product.quantity = total_stock
                                print(f"Updated base product total stock to: {product.quantity}")
                            else:
                                print(f"Option not found: {option_uuid}")
                        else:
                            print(f"Variation not found: {variation_uuid}")

            # Commit all changes
            db.session.commit()
            print("\nSuccessfully committed all updates")

            # Return updated data
            response_data = {
                "quantity": product.quantity,
                "low_stock_alert": product.low_stock_alert,
                "sku": product.sku,
                "variations": [],
                "product_name": product.name
            }

            if product.variations:
                for variation in product.variations:
                    var_data = {
                        "variation_uuid": variation.variation_uuid,
                        "options": []
                    }
                    for option in variation.options:
                        var_data["options"].append({
                            "option_uuid": option.option_uuid,
                            "name": option.value,
                            "stock": option.stock,
                            "low_stock_alert": option.low_stock_alert,
                            "sku": option.sku
                        })
                    response_data["variations"].append(var_data)

            print(f"Returning updated data: {response_data}")
            return jsonify(response_data), 200

        except Exception as e:
            db.session.rollback()
            print(f"Error processing updates: {str(e)}")
            return jsonify({"message": f"Error processing updates: {str(e)}"}), 500

    except Exception as e:
        print(f"Error in manage_inventory: {str(e)}")
        return jsonify({"message": str(e)}), 500

# Category endpoints
@products.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([{
            'uuid': category.category_uuid,
            'name': category.name,
            'description': category.description,
            'parent_id': category.parent_id,
            'is_active': category.is_active,
            'image_url': category.image_url,
            'subcategories': [{
                'uuid': sub.category_uuid,
                'name': sub.name,
                'description': sub.description,
                'is_active': sub.is_active,
                'image_url': sub.image_url
            } for sub in category.subcategories if sub.is_active]
        } for category in categories]), 200
    except Exception as e:
        print(f"Error fetching categories: {str(e)}")  # Add logging
        return jsonify({'message': 'Failed to fetch categories', 'error': str(e)}), 500

@products.route('/api/categories', methods=['POST'])
@login_required
def create_category():
    if not current_user.has_role(Role.ADMIN):
        return jsonify({'message': 'Access denied'}), 403
        
    try:
        data = request.json
        category = Category(
            name=data['name'],
            description=data.get('description'),
            parent_id=data.get('parent_id'),
            is_active=data.get('is_active', True),
            image_url=data.get('image_url')
        )
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'id': category.category_uuid,
            'name': category.name,
            'description': category.description,
            'parent_id': category.parent_id,
            'is_active': category.is_active,
            'image_url': category.image_url,
            'created_at': category.created_at.isoformat(),
            'updated_at': category.updated_at.isoformat()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@products.route('/api/categories/<string:category_id>', methods=['PUT'])
@login_required
def update_category(category_id):
    if not current_user.has_role(Role.ADMIN):
        return jsonify({'message': 'Access denied'}), 403
        
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'message': 'Category not found'}), 404
            
        data = request.json
        category.name = data.get('name', category.name)
        category.description = data.get('description', category.description)
        category.parent_id = data.get('parent_id', category.parent_id)
        category.is_active = data.get('is_active', category.is_active)
        category.image_url = data.get('image_url', category.image_url)
        category.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'id': category.category_uuid,
            'name': category.name,
            'description': category.description,
            'parent_id': category.parent_id,
            'is_active': category.is_active,
            'image_url': category.image_url,
            'created_at': category.created_at.isoformat(),
            'updated_at': category.updated_at.isoformat()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@products.route('/api/categories/<string:category_id>', methods=['DELETE'])
@login_required
def delete_category(category_id):
    if not current_user.has_role(Role.ADMIN):
        return jsonify({'message': 'Access denied'}), 403
        
    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'message': 'Category not found'}), 404
            
        # Check if category has children
        children = Category.query.filter_by(parent_id=category_id).first()
        if children:
            return jsonify({'message': 'Cannot delete category with child categories'}), 400
            
        # Check if category has products
        products = Product.query.filter_by(category_uuid=category_id).first()
        if products:
            return jsonify({'message': 'Cannot delete category with associated products'}), 400
            
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

# Shipping Provider Routes
@products.route('/admin/shipping-providers', methods=['GET', 'POST'])
@login_required
def manage_shipping_providers():
    if request.method == 'GET':
        providers = ShippingProvider.query.all()
        return jsonify([provider.to_dict() for provider in providers])
    
    elif request.method == 'POST':
        try:
            # Handle form data
            form_data = request.form
            file = request.files.get('logo')
            
            # Validate required fields
            if not form_data.get('name'):
                return jsonify({'message': 'Provider name is required'}), 400
            
            # Convert string boolean values to actual booleans
            is_active = form_data.get('is_active', 'true').lower() == 'true'
            is_default = form_data.get('is_default', 'false').lower() == 'true'
            
            # If this is marked as default, unset any existing default
            if is_default:
                current_default = ShippingProvider.query.filter_by(is_default=True).first()
                if current_default:
                    current_default.is_default = False
            
            # Create new provider
            provider = ShippingProvider(
                name=form_data['name'],
                description=form_data.get('description'),
                is_active=is_active,
                is_default=is_default
            )
            
            # Handle logo upload if present
            if file:
                try:
                    result = cloudinary.uploader.upload(
                        file,
                        folder='flaskify/shipping_providers',
                        public_id=f"provider_{uuid.uuid4()}",
                        overwrite=True,
                        resource_type="auto"
                    )
                    provider.logo_url = result['secure_url']
                except Exception as e:
                    print(f"Error uploading logo: {str(e)}")
                    return jsonify({'message': 'Error uploading logo'}), 400
            
            db.session.add(provider)
            db.session.commit()
            
            return jsonify(provider.to_dict()), 201
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating shipping provider: {str(e)}")
            return jsonify({'message': f'Error creating shipping provider: {str(e)}'}), 400

@products.route('/admin/shipping-providers/<string:provider_uuid>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_shipping_provider(provider_uuid):
    provider = ShippingProvider.query.get_or_404(provider_uuid)
    
    if request.method == 'GET':
        return jsonify(provider.to_dict())
    
    elif request.method == 'PUT':
        try:
            # Handle form data
            form_data = request.form
            file = request.files.get('logo')
            
            if 'name' in form_data:
                provider.name = form_data['name']
            if 'description' in form_data:
                provider.description = form_data['description']
            if 'is_active' in form_data:
                provider.is_active = form_data['is_active'].lower() == 'true'
            if 'is_default' in form_data:
                is_default = form_data['is_default'].lower() == 'true'
                if is_default:
                    # Unset any existing default
                    current_default = ShippingProvider.query.filter_by(is_default=True).first()
                    if current_default and current_default.provider_uuid != provider_uuid:
                        current_default.is_default = False
                provider.is_default = is_default
            
            # Handle logo upload if present
            if file:
                try:
                    # Delete old logo if it exists
                    if provider.logo_url:
                        try:
                            public_id = provider.logo_url.split('/')[-1].split('.')[0]
                            cloudinary.uploader.destroy(f"flaskify/shipping_providers/{public_id}")
                        except:
                            pass
                    
                    # Upload new logo
                    result = cloudinary.uploader.upload(
                        file,
                        folder='flaskify/shipping_providers',
                        public_id=f"provider_{uuid.uuid4()}",
                        overwrite=True,
                        resource_type="auto"
                    )
                    provider.logo_url = result['secure_url']
                except Exception as e:
                    print(f"Error uploading logo: {str(e)}")
                    return jsonify({'message': 'Error uploading logo'}), 400
            
            db.session.commit()
            return jsonify(provider.to_dict())
            
        except Exception as e:
            db.session.rollback()
            print(f"Error updating shipping provider: {str(e)}")
            return jsonify({'message': f'Error updating shipping provider: {str(e)}'}), 400
    
    elif request.method == 'DELETE':
        if provider.is_default:
            return jsonify({'message': 'Cannot delete the default shipping provider'}), 400
            
        # Delete logo from Cloudinary if it exists
        if provider.logo_url:
            try:
                public_id = provider.logo_url.split('/')[-1].split('.')[0]
                cloudinary.uploader.destroy(f"flaskify/shipping_providers/{public_id}")
            except:
                pass
        
        db.session.delete(provider)
        db.session.commit()
        return '', 204

# Shipping Rate Routes
@products.route('/admin/shipping-providers/<string:provider_uuid>/rates', methods=['GET', 'POST'])
@login_required
def manage_shipping_rates(provider_uuid):
    provider = ShippingProvider.query.get_or_404(provider_uuid)
    
    if request.method == 'GET':
        return jsonify([rate.to_dict() for rate in provider.rates])
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'base_rate', 'weight_rate']
        for field in required_fields:
            if field not in data:
                return jsonify({'message': f'{field} is required'}), 400
        
        rate = ShippingRate(
            provider_uuid=provider_uuid,
            name=data['name'],
            description=data.get('description'),
            base_rate=data['base_rate'],
            weight_rate=data['weight_rate'],
            min_weight=data.get('min_weight', 0.0),
            max_weight=data.get('max_weight'),
            estimated_days=data.get('estimated_days'),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(rate)
        db.session.commit()
        
        return jsonify(rate.to_dict()), 201

@products.route('/admin/shipping-rates/<string:rate_uuid>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_shipping_rate(rate_uuid):
    rate = ShippingRate.query.get_or_404(rate_uuid)
    
    if request.method == 'GET':
        return jsonify(rate.to_dict())
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        updateable_fields = [
            'name', 'description', 'base_rate', 'weight_rate',
            'min_weight', 'max_weight', 'estimated_days', 'is_active'
        ]
        
        for field in updateable_fields:
            if field in data:
                setattr(rate, field, data[field])
        
        db.session.commit()
        return jsonify(rate.to_dict())
    
    elif request.method == 'DELETE':
        db.session.delete(rate)
        db.session.commit()
        return '', 204

# Calculate shipping fee for a product
@products.route('/shipping/calculate/<string:rate_uuid>', methods=['POST'])
def calculate_shipping_fee(rate_uuid):
    rate = ShippingRate.query.get_or_404(rate_uuid)
    data = request.get_json()
    
    if 'weight' not in data:
        return jsonify({'message': 'Product weight is required'}), 400
    
    weight = float(data['weight'])
    fee = rate.calculate_shipping_fee(weight)
    
    if fee is None:
        return jsonify({
            'message': f'Weight exceeds maximum limit of {rate.max_weight}kg for this shipping rate'
        }), 400
    
    return jsonify({
        'shipping_fee': fee,
        'rate': rate.to_dict()
    })

# Add this new endpoint to fetch all shipping rates
@products.route('/admin/shipping-rates', methods=['GET'])
@login_required
def get_all_shipping_rates():
    try:
        # Get all shipping rates
        rates = ShippingRate.query.all()
        return jsonify([rate.to_dict() for rate in rates])
    except Exception as e:
        print(f"Error fetching shipping rates: {str(e)}")
        return jsonify({'message': 'Failed to fetch shipping rates'}), 500

@products.route('/products', methods=['GET'])
def get_products_by_category():
    try:
        # Get query parameters
        category_uuid = request.args.get('category_uuid')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        sort_by = request.args.get('sort_by', 'popular')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        rating = request.args.get('rating', type=int)

        # Base query
        query = Product.query.filter(
            Product.status == 'active',
            Product.visibility == True
        )

        # Apply category filter with parent category handling
        if category_uuid:
            # Check if it's a parent category
            if category_uuid.startswith('main-cat-'):
                # Get all subcategories of this parent category
                subcategories = Category.query.filter(
                    Category.parent_id == category_uuid,
                    Category.is_active == True
                ).all()
                
                # Get subcategory IDs including the parent category
                category_ids = [category_uuid]
                category_ids.extend([sub.category_uuid for sub in subcategories])
                
                # Filter products by all these categories
                query = query.filter(Product.category_uuid.in_(category_ids))
            else:
                # For subcategories, just filter by the specific category
                query = query.filter(Product.category_uuid == category_uuid)

        # Apply price filter
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        # Apply sorting
        if sort_by == 'latest':
            query = query.order_by(Product.created_at.desc())
        elif sort_by == 'topSales':
            query = query.order_by(Product.total_sales.desc())
        elif sort_by == 'priceAsc':
            query = query.order_by(Product.price.asc())
        elif sort_by == 'priceDesc':
            query = query.order_by(Product.price.desc())
        else:  # default 'popular'
            query = query.order_by(Product.total_sales.desc(), Product.view_count.desc())

        # Paginate results
        products = query.paginate(page=page, per_page=per_page, error_out=False)
        
        response = []
        for product in products.items:
            # Get shop information
            shop = Shop.query.get(product.shop_uuid)
            
            # Calculate discount percentage if applicable
            discount_percentage = None
            if product.compare_at_price and float(product.compare_at_price) > float(product.price):
                discount_percentage = round(
                    ((float(product.compare_at_price) - float(product.price)) / float(product.compare_at_price)) * 100,
                    1
                )

            product_dict = {
                'product_uuid': product.product_uuid,
                'name': product.name,
                'price': float(product.price),
                'compare_at_price': float(product.compare_at_price) if product.compare_at_price else None,
                'discount_percentage': discount_percentage,
                'discount_name': product.discount_name,  # Add discount name
                'main_image': product.main_image,
                'rating': 4.5,  # TODO: Implement actual rating system
                'total_sales': product.total_sales,
                'quantity': product.quantity,
                'shipping_fee': float(product.shipping_fee) if product.shipping_fee else 0,
                'created_at': product.created_at.isoformat() if product.created_at else None,
                'updated_at': product.updated_at.isoformat() if product.updated_at else None,
                'shop': {
                    'shop_uuid': shop.shop_uuid,
                    'business_name': shop.business_name,
                    'business_city': shop.business_city,
                    'business_province': shop.business_province
                } if shop else None
            }
            response.append(product_dict)

        return jsonify({
            'products': response,
            'total': products.total,
            'pages': products.pages,
            'current_page': products.page
        })

    except Exception as e:
        print(f"Error fetching products: {str(e)}")
        return jsonify({'message': str(e)}), 500

@products.route('/products/daily-finds', methods=['GET'])
def get_daily_finds():
    try:
        # Get products that are:
        # 1. Active and visible
        # 2. Have a compare_at_price (meaning they're discounted)
        # 3. Have stock available
        # 4. Sorted by discount percentage and total sales
        daily_finds = Product.query.filter(
            Product.status == 'active',
            Product.visibility == True,
            Product.compare_at_price.isnot(None),
            Product.compare_at_price > Product.price,
            Product.quantity > 0
        ).order_by(
            # Order by discount percentage (higher discount first)
            ((Product.compare_at_price - Product.price) / Product.compare_at_price).desc(),
            Product.total_sales.desc()
        ).limit(20).all()

        # Convert products to dictionary format
        products_data = []
        for product in daily_finds:
            # Calculate discount percentage
            original_price = float(product.compare_at_price)
            current_price = float(product.price)
            discount_percentage = ((original_price - current_price) / original_price) * 100

            # Get shop information
            shop = Shop.query.get(product.shop_uuid)

            product_dict = {
                'product_uuid': product.product_uuid,
                'name': product.name,
                'price': current_price,
                'compare_at_price': original_price,
                'discount_percentage': round(discount_percentage, 1),
                'discount_name': product.discount_name,  # Add discount name
                'main_image': product.main_image,
                'rating': 4.5,  # TODO: Implement actual rating system
                'total_sales': product.total_sales,
                'quantity': product.quantity,
                'shipping_fee': float(product.shipping_fee) if product.shipping_fee else 0,
                'shop': {
                    'shop_uuid': shop.shop_uuid,
                    'business_name': shop.business_name,
                    'business_city': shop.business_city,
                    'business_province': shop.business_province
                } if shop else None
            }
            products_data.append(product_dict)

        return jsonify(products_data), 200

    except Exception as e:
        print(f"Error fetching daily finds: {str(e)}")
        return jsonify({'message': 'Error fetching daily finds', 'error': str(e)}), 500

# Discount Management Routes
@products.route('/seller/<string:seller_id>/products/discountable', methods=['GET'])
@login_required
def get_discountable_products(seller_id):
    try:
        # Verify seller exists and has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '')

        # Query products
        query = Product.query.filter(
            Product.seller_id == seller_id,
            Product.status == 'active',
            Product.visibility == True
        )

        # Apply search if provided
        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f'%{search}%'),
                    Product.sku.ilike(f'%{search}%')
                )
            )

        # Get paginated results
        products = query.paginate(page=page, per_page=per_page, error_out=False)

        # Format response
        response = {
            "products": [{
                "product_uuid": p.product_uuid,
                "name": p.name,
                "sku": p.sku,
                "price": float(p.price),
                "current_discount": {
                    "name": p.discount_name,
                    "percentage": p.discount_percentage,
                    "start_date": p.discount_start_date.isoformat() if p.discount_start_date else None,
                    "end_date": p.discount_end_date.isoformat() if p.discount_end_date else None
                } if p.discount_name else None
            } for p in products.items],
            "total": products.total,
            "pages": products.pages,
            "current_page": products.page
        }

        return jsonify(response), 200

    except Exception as e:
        print(f"Error fetching discountable products: {str(e)}")
        return jsonify({"message": str(e)}), 500

@products.route('/seller/<string:seller_id>/discounts/active', methods=['GET'])
@login_required
def get_active_discounts(seller_id):
    try:
        # Verify seller exists and has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Get current time in UTC
        now = datetime.now(timezone.utc)
        print(f"Current UTC time: {now}")

        # Query products with any discount
        products = Product.query.filter(
            Product.seller_id == seller_id,
            Product.discount_name.isnot(None)
        ).all()

        # Separate active and pending discounts
        active_products = []
        pending_products = []
        for product in products:
            if not product.discount_start_date or not product.discount_end_date:
                continue
                
            # Convert naive datetime to UTC
            start_date = product.discount_start_date
            end_date = product.discount_end_date
            
            # If the dates are naive (no timezone), assume they are in UTC
            if start_date.tzinfo is None:
                start_date = start_date.replace(tzinfo=timezone.utc)
            if end_date.tzinfo is None:
                end_date = end_date.replace(tzinfo=timezone.utc)
            
            # Convert all times to timestamps for accurate comparison
            start_ts = start_date.timestamp()
            end_ts = end_date.timestamp()
            now_ts = now.timestamp()
            
            # Compare using timestamps
            if start_ts <= now_ts <= end_ts:
                active_products.append(product)
            elif start_ts > now_ts:
                pending_products.append(product)

        # Helper function to group products by discount
        def group_products_by_discount(product_list):
            grouped = {}
            for product in product_list:
                discount_key = (product.discount_name, product.discount_percentage)
                if discount_key not in grouped:
                    grouped[discount_key] = {
                        "discount_name": product.discount_name,
                        "discount_percentage": product.discount_percentage,
                        "start_date": product.discount_start_date.replace(tzinfo=timezone.utc).isoformat(),
                        "end_date": product.discount_end_date.replace(tzinfo=timezone.utc).isoformat(),
                        "products": []
                    }
                grouped[discount_key]["products"].append({
                    "product_uuid": product.product_uuid,
                    "name": product.name,
                    "original_price": float(product.compare_at_price) if product.compare_at_price else float(product.price),
                    "discounted_price": float(product.price)
                })
            return list(grouped.values())

        return jsonify({
            "active": group_products_by_discount(active_products),
            "pending": group_products_by_discount(pending_products)
        }), 200

    except Exception as e:
        print(f"Error fetching discounts: {str(e)}")
        return jsonify({"message": str(e)}), 500

@products.route('/seller/<string:seller_id>/discounts', methods=['POST'])
@login_required
def create_discount(seller_id):
    try:
        # Verify seller exists and has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        data = request.get_json()

        # Validate input
        if not data.get('discount_name') or len(data['discount_name']) > 50:
            return jsonify({"message": "Invalid discount name"}), 400

        try:
            discount_percentage = float(data['discount_percentage'])
            if not (0 < discount_percentage <= 100):
                raise ValueError
        except (ValueError, TypeError):
            return jsonify({"message": "Invalid discount percentage"}), 400

        # Validate dates
        try:
            start_date = datetime.fromisoformat(data['start_date'].replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(data['end_date'].replace('Z', '+00:00'))
            if start_date >= end_date:
                return jsonify({"message": "End date must be after start date"}), 400
        except (ValueError, TypeError):
            return jsonify({"message": "Invalid date format"}), 400

        # Validate product IDs
        product_ids = data.get('product_ids', [])
        if not product_ids:
            return jsonify({"message": "No products selected"}), 400

        # Get products and verify ownership
        products = Product.query.filter(
            Product.product_uuid.in_(product_ids),
            Product.seller_id == seller_id
        ).all()

        if len(products) != len(product_ids):
            return jsonify({"message": "Some products not found or not owned by seller"}), 400

        # Get current time in UTC
        now = datetime.now(timezone.utc)
        is_active = start_date <= now <= end_date

        # Update products with discount info
        for product in products:
            # Store original price in compare_at_price if not already set
            if not product.compare_at_price:
                product.compare_at_price = product.price
            
            # Only apply discount to price if the discount is active now
            if is_active:
                product.price = round(float(product.compare_at_price) * (1 - discount_percentage / 100), 2)
            
            product.discount_name = data['discount_name']
            product.discount_start_date = start_date
            product.discount_end_date = end_date
            product.discount_percentage = discount_percentage

            # Handle variations
            for variation in product.variations:
                # Store original price in compare_at_price if not already set
                if not variation.compare_at_price:
                    variation.compare_at_price = variation.price
                
                # Only apply discount if active
                if is_active:
                    variation.price = round(float(variation.compare_at_price) * (1 - discount_percentage / 100), 2)

                # Handle options
                for option in variation.options:
                    if option.price is not None:
                        # Store original price in compare_at_price if not already set
                        if not option.compare_at_price:
                            option.compare_at_price = option.price
                        # Only apply discount if active
                        if is_active:
                            option.price = round(float(option.compare_at_price) * (1 - discount_percentage / 100), 2)

        db.session.commit()

        return jsonify({
            "message": f"Discount {'activated' if is_active else 'scheduled'} successfully",
            "products_updated": len(products),
            "status": "active" if is_active else "pending"
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creating discount: {str(e)}")
        return jsonify({"message": f"Error creating discount: {str(e)}"}), 500

@products.route('/seller/<string:seller_id>/discounts/<string:discount_name>', methods=['PUT'])
@login_required
def manage_discount(seller_id, discount_name):
    try:
        # Verify seller exists and has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Unauthorized"}), 403

        data = request.get_json()
        if not data:
            return jsonify({"message": "No data provided"}), 400

        # Validate input
        if 'discount_name' in data and (not data['discount_name'] or len(data['discount_name']) > 50):
            return jsonify({"message": "Invalid discount name"}), 400

        # ... rest of the function code ...
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@products.route('/seller/<string:seller_id>/discounts/cleanup', methods=['POST'])
@login_required
def cleanup_expired_discounts(seller_id):
    try:
        # Verify seller exists and has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Get current time in UTC
        now = datetime.now(timezone.utc)
        print(f"Running manual cleanup at {now}")

        # Find all products with expired discounts
        expired_products = Product.query.filter(
            Product.seller_id == seller_id,
            Product.discount_name.isnot(None),
            Product.discount_end_date < now
        ).all()

        cleaned_count = 0
        for product in expired_products:
            print(f"Cleaning up expired discount for product {product.name}")
            
            # Restore original prices
            if product.compare_at_price:
                product.price = product.compare_at_price
                product.compare_at_price = None
                
                # Restore variation prices
                for variation in product.variations:
                    if variation.compare_at_price:
                        variation.price = variation.compare_at_price
                        variation.compare_at_price = None
                        
                        # Restore option prices
                        for option in variation.options:
                            if option.compare_at_price:
                                option.price = option.compare_at_price
                                option.compare_at_price = None
            
            # Clear discount info
            product.discount_name = None
            product.discount_percentage = None
            product.discount_start_date = None
            product.discount_end_date = None
            cleaned_count += 1

        db.session.commit()

        return jsonify({
            "message": "Expired discounts cleaned up successfully",
            "products_cleaned": cleaned_count
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error cleaning up discounts: {str(e)}")
        return jsonify({"message": f"Error cleaning up discounts: {str(e)}"}), 500

@products.route('/products/search', methods=['GET'])
def search_products():
    try:
        # Get query parameters
        query = request.args.get('q', '').strip().lower()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        sort_by = request.args.get('sort_by', 'relevance')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        rating = request.args.get('rating', type=float)
        category_uuid = request.args.get('category', None)

        print(f"Search request - Query: {query}, Page: {page}, Sort: {sort_by}, Price Range: {min_price}-{max_price}, Rating: {rating}")

        # Find related shops
        related_shops = []
        if query:
            # Join Shop with SellerInfo to search across both tables
            shop_query = db.session.query(Shop, SellerInfo).join(
            SellerInfo, Shop.seller_id == SellerInfo.seller_id
                ).filter(
                and_(
                    SellerInfo.status == 'Approved',
                    Shop.is_archived == False,
                    or_(
                        Shop.business_name.ilike(f'%{query}%'),
                        SellerInfo.business_type.ilike(f'%{query}%')
                    )
                )
            ).limit(5).all()

            for shop, seller_info in shop_query:
                # Get shop statistics
                product_count = Product.query.filter_by(
                    shop_uuid=shop.shop_uuid,
                    status='active',
                    visibility=True
                ).count()

                rating_avg = 4.5  # TODO: Implement actual rating system
                response_rate = 57  # TODO: Implement actual response rate

                related_shops.append({
                    'shop_uuid': shop.shop_uuid,
                    'business_name': shop.business_name,
                    'logo_url': shop.shop_logo,
                    'business_city': shop.business_city,
                    'business_province': shop.business_province,
                    'product_count': product_count,
                    'rating': rating_avg,
                    'response_rate': response_rate,
                    'response_time': 'N/A',  # TODO: Implement response time tracking
                    'follower_count': 2,  # TODO: Implement follower system
                    'following_count': 1  # TODO: Implement following system
                })

        # Base query for active and visible products
        base_query = Product.query.filter(
            Product.status == 'active',
            Product.visibility == True
        )

        # Search query with improved matching
        if query:
            # First, try to find matching categories
            matching_categories = Category.query.filter(
                Category.name.ilike(f'%{query}%')
            ).all()
            category_ids = [cat.category_uuid for cat in matching_categories]
            
            # Build search filter
            search_conditions = [
                Product.name.ilike(f'%{query}%'),
                Product.description.ilike(f'%{query}%'),
                Product.tags.contains([query])
            ]
            
            # Add category-based search
            if category_ids:
                search_conditions.append(Product.category_uuid.in_(category_ids))
                
                # Also search in parent categories
                parent_categories = Category.query.filter(
                    Category.name.ilike(f'%{query}%'),
                    Category.parent_id.isnot(None)
                ).all()
                for parent_cat in parent_categories:
                    search_conditions.append(Product.category_uuid == parent_cat.category_uuid)

            # Combine all search conditions with OR
            base_query = base_query.filter(or_(*search_conditions))

        # Apply category filter if specifically requested
        if category_uuid:
            base_query = base_query.filter(Product.category_uuid == category_uuid)

        # Apply price filters
        if min_price is not None:
            base_query = base_query.filter(Product.price >= min_price)
        if max_price is not None:
            base_query = base_query.filter(Product.price <= max_price)

        # Apply rating filter
        if rating is not None:
            # For now, we'll use a fixed rating since we haven't implemented the rating system
            # In a real implementation, you would filter based on average ratings from reviews
            base_query = base_query.filter(Product.rating >= rating)

        # Apply sorting
        if sort_by == 'price_asc':
            base_query = base_query.order_by(Product.price.asc())
        elif sort_by == 'price_desc':
            base_query = base_query.order_by(Product.price.desc())
        elif sort_by == 'newest':
            base_query = base_query.order_by(Product.created_at.desc())
        elif sort_by == 'bestselling':
            base_query = base_query.order_by(Product.total_sales.desc())
        else:  # relevance - sort by match relevance and then by popularity
            base_query = base_query.order_by(
                Product.total_sales.desc(),
                Product.view_count.desc()
            )

        # Paginate results
        products = base_query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Format response
        response = []
        for product in products.items:
            shop = Shop.query.get(product.shop_uuid)
            category = Category.query.get(product.category_uuid) if product.category_uuid else None
            
            # Calculate discount percentage
            discount_percentage = None
            if product.compare_at_price and float(product.compare_at_price) > float(product.price):
                discount_percentage = round(
                    ((float(product.compare_at_price) - float(product.price)) / float(product.compare_at_price)) * 100,
                1)

            product_dict = {
                'product_uuid': product.product_uuid,
                'name': product.name,
                'price': float(product.price),
                'compare_at_price': float(product.compare_at_price) if product.compare_at_price else None,
                'discount_percentage': discount_percentage,
                'main_image': product.main_image,
                'rating': 4.5,  # TODO: Implement actual rating system
                'total_sales': product.total_sales,
                'quantity': product.quantity,
                'shipping_fee': float(product.shipping_fee) if product.shipping_fee else 0,
                'category': {
                    'uuid': category.category_uuid,
                    'name': category.name,
                    'parent_name': Category.query.get(category.parent_id).name if category and category.parent_id else None
                } if category else None,
                'shop': {
                    'shop_uuid': shop.shop_uuid,
                    'business_name': shop.business_name,
                    'business_city': shop.business_city,
                    'business_province': shop.business_province
                } if shop else None
            }
            response.append(product_dict)

        print(f"Found {len(response)} products")
        
        # Get related categories for the search
        related_categories = []
        if query:
            related_categories = Category.query.filter(
                Category.name.ilike(f'%{query}%')
            ).limit(5).all()

        return jsonify({
            'products': response,
            'total': products.total,
            'pages': products.pages,
            'current_page': products.page,
            'query': query,
            'related_categories': [{
                'uuid': cat.category_uuid,
                'name': cat.name,
                'parent_name': Category.query.get(cat.parent_id).name if cat.parent_id else None
            } for cat in related_categories],
            'related_shops': related_shops
        })

    except Exception as e:
        print(f"Error searching products: {str(e)}")
        return jsonify({'message': str(e)}), 500

@products.route('/products/suggestions', methods=['GET'])
def get_product_suggestions():
    try:
        query = request.args.get('q', '').strip()
        print(f"Received suggestion request for query: {query}")
        
        # Get product name suggestions
        suggestions = Product.query.filter(
            and_(
                Product.status == 'active',
                Product.visibility == True,
                or_(
                    Product.name.ilike(f'%{query}%'),
                    Product.tags.contains([query])
                )
            )
        ).with_entities(
            Product.name,
            Product.product_uuid,
            Product.main_image,
            Product.price
        ).limit(10).all()

        # Format suggestions
        formatted_suggestions = [{
            'name': s.name,
            'product_uuid': s.product_uuid,
            'main_image': s.main_image,
            'price': float(s.price)
        } for s in suggestions]

        return jsonify({
            'suggestions': formatted_suggestions
        })

    except Exception as e:
        print(f"Error getting product suggestions: {str(e)}")
        return jsonify({
            'message': 'Error getting product suggestions',
            'error': str(e)
        }), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/bulk-upload', methods=['POST'])
@login_required
def bulk_upload_products(seller_id, shop_uuid):
    try:
        # Verify seller exists and has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Verify shop exists and belongs to seller
        shop = Shop.query.filter_by(shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not shop:
            return jsonify({"message": "Shop not found"}), 404

        if 'file' not in request.files:
            return jsonify({"message": "No file provided"}), 400

        file = request.files['file']
        if not file.filename.endswith('.csv'):
            return jsonify({"message": "Invalid file format. Please upload a CSV file"}), 400

        # Read CSV file
        df = pd.read_csv(file)
        errors = []
        products_created = 0

        for index, row in df.iterrows():
            try:
                # Create product using the new method
                product = Product.create_from_bulk_data(row.to_dict(), shop_uuid, seller_id)
                
                # Handle variations if present
                if row.get('variation_name') and row.get('variation_values'):
                    variation_name = row['variation_name']
                    variation_values = row['variation_values'].split('|')
                    
                    for value_str in variation_values:
                        value_parts = value_str.split(':')
                        if len(value_parts) >= 3:
                            value, price, stock = value_parts[:3]
                            variation = ProductVariation(
                                variation_uuid=str(uuid.uuid4()),
                                product_uuid=product.product_uuid,
                                price=float(price),
                                quantity=int(stock)
                            )
                            db.session.add(variation)
                            
                            option = ProductVariationOption(
                                option_uuid=str(uuid.uuid4()),
                                variation_uuid=variation.variation_uuid,
                                name=variation_name,
                                value=value,
                                stock=int(stock)
                            )
                            db.session.add(option)

                db.session.add(product)
                products_created += 1

            except Exception as e:
                error_msg = f"Error in row {index + 2}: {str(e)}"
                errors.append(error_msg)
                print(error_msg)
                continue

        if products_created > 0:
            db.session.commit()

        response = {
            "message": f"Successfully processed {products_created} products",
            "products_created": products_created
        }
        if errors:
            response["errors"] = errors

        return jsonify(response), 200 if products_created > 0 else 400

    except Exception as e:
        db.session.rollback()
        print(f"Error in bulk upload: {str(e)}")
        return jsonify({"message": f"Error processing upload: {str(e)}"}), 500

@products.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"}), 200

@products.route('/products/<string:product_uuid>', methods=['GET'])
def get_product_details(product_uuid):
    try:
        # Get the product with all its relationships
        product = Product.query.options(
            db.joinedload(Product.category),
            db.joinedload(Product.variations).joinedload(ProductVariation.options)
        ).get_or_404(product_uuid)
        
        # Get the shop details
        shop = Shop.query.get_or_404(product.shop_uuid)
        seller = SellerInfo.query.get_or_404(product.seller_id)
        
        # Get category path if category exists
        category_name = None
        category_path = None
        if product.category:
            category_name = product.category.name
            category_path = product.category.get_path()
        
        # Get shop's other products (limit to 12)
        other_products = Product.query.filter(
            Product.shop_uuid == shop.shop_uuid,
            Product.product_uuid != product_uuid,
            Product.status == 'active',
            Product.visibility == True
        ).limit(12).all()
        
        # Get variations with their options
        variations = ProductVariation.query.filter_by(product_uuid=product_uuid).all()
        
        # Format variations with their options
        formatted_variations = []
        for variation in variations:
            # Get options for this variation
            options = ProductVariationOption.query.filter_by(variation_uuid=variation.variation_uuid).all()
            
            formatted_options = [{
                'option_uuid': opt.option_uuid,
                'name': opt.name,
                'value': opt.value,
                'price': float(opt.price) if opt.price is not None else float(variation.price),
                'compare_at_price': float(opt.compare_at_price) if opt.compare_at_price else None,
                'stock': opt.stock,
                'sku': opt.sku
            } for opt in options]
            
            formatted_variations.append({
                'variation_uuid': variation.variation_uuid,
                'price': float(variation.price) if variation.price is not None else None,
                'compare_at_price': float(variation.compare_at_price) if variation.compare_at_price else None,
                'quantity': variation.quantity,
                'has_individual_stock': variation.has_individual_stock,
                'options': formatted_options
            })
        
        # Calculate average rating and get reviews
        reviews = db.session.query(
            Review.review_uuid,
            Review.rating,
            Review.comment,
            Review.created_at,
            Review.images,
            Review.user_uuid,  # Add user_uuid to query
            Review.seller_reply,  # Add seller_reply
            Review.seller_reply_at,  # Add seller_reply_at
            Users.first_name,
            Users.last_name,
            Users.profile_image_url
        ).join(Users).filter(
            Review.product_uuid == product_uuid
        ).order_by(Review.created_at.desc()).all()
        
        # Calculate rating breakdown
        rating_breakdown = {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        }
        total_rating = 0
        for review in reviews:
            rating_breakdown[review.rating] += 1
            total_rating += review.rating
        
        avg_rating = total_rating / len(reviews) if reviews else 0
        
        # Format the response
        response = {
            **product.to_dict(),
            'category_name': category_name,
            'category_path': category_path,
            'shop': {
                'shop_uuid': shop.shop_uuid,
                'id': shop.shop_uuid,
                'name': shop.business_name,
                'logo': shop.shop_logo,
                'rating': avg_rating,
                'products': shop.total_products,
                'followers': 0,
                'responseTime': '< 24h',
                'responseRate': 98,
                'joinDate': shop.date_created.strftime('%B %Y'),
                'business_city': shop.business_city,
                'business_province': shop.business_province,
                'otherProducts': [p.to_dict() for p in other_products]
            },
            'variations': formatted_variations,
            'rating': round(avg_rating, 1),
            'totalReviews': len(reviews),
            'ratingBreakdown': rating_breakdown,
            'reviews': [{
                'review_uuid': r.review_uuid,
                'user_uuid': r.user_uuid,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at.isoformat(),
                'seller_reply': r.seller_reply,  # Add seller_reply
                'seller_reply_at': r.seller_reply_at.isoformat() if r.seller_reply_at else None,  # Add seller_reply_at
                'user': {
                    'user_uuid': r.user_uuid,
                    'first_name': r.first_name,
                    'last_name': r.last_name,
                    'profile_image_url': r.profile_image_url
                },
                'images': r.images or []
            } for r in reviews]
        }
        
        return jsonify(response), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>/verification-code', methods=['GET'])
@login_required
def get_verification_code(seller_id, shop_uuid, product_uuid):
    try:
        # Verify seller exists and has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Get the action type from query params
        action = request.args.get('action')
        if action not in ['archive', 'unarchive']:
            return jsonify({"message": "Invalid action type"}), 400

        # Generate a new verification code
        code = generate_verification_code()

        return jsonify({
            "code": code,
            "expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat()
        }), 200

    except Exception as e:
        print(f"Error generating verification code: {str(e)}")
        return jsonify({"message": str(e)}), 500

@products.route('/api/products/<product_uuid>/reviews', methods=['GET'])
def get_product_reviews(product_uuid):
    """Get all reviews for a product"""
    try:
        reviews = Review.query.filter_by(product_uuid=product_uuid)\
            .order_by(Review.created_at.desc())\
            .all()

        review_list = []
        for review in reviews:
            review_data = {
                'review_uuid': review.review_uuid,
                'user_uuid': review.user_uuid,
                'rating': review.rating,
                'comment': review.comment,
                'images': review.images,
                'created_at': review.created_at.isoformat() if review.created_at else None,
                'user': {
                    'user_uuid': review.user_uuid,
                    'first_name': review.user.first_name,
                    'last_name': review.user.last_name,
                    'profile_image_url': review.user.profile_image_url
                }
            }
            if review.seller_reply:
                review_data['seller_reply'] = review.seller_reply
                review_data['seller_reply_at'] = review.seller_reply_at.isoformat() if review.seller_reply_at else None

            review_list.append(review_data)

        return jsonify({
            'status': 'success',
            'reviews': review_list
        })

    except Exception as e:
        print(f"Error fetching reviews: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch reviews'
        }), 500

@products.route('/api/products/<product_uuid>/reviews', methods=['POST'])
@login_required
def add_review(product_uuid):
    """Add a review for a product"""
    try:
        # Get form data
        rating = request.form.get('rating')
        comment = request.form.get('comment')
        images = request.files.getlist('images')

        if not all([rating, comment]):
            return jsonify({
                'status': 'error',
                'message': 'Rating and comment are required'
            }), 400

        # Convert rating to integer
        try:
            rating = int(rating)
        except ValueError:
            return jsonify({
                'status': 'error',
                'message': 'Invalid rating value'
            }), 400

        # Validate rating is between 1 and 5
        if not 1 <= rating <= 5:
            return jsonify({
                'status': 'error',
                'message': 'Rating must be between 1 and 5'
            }), 400

        # Check if product exists
        product = Product.query.get(product_uuid)
        if not product:
            return jsonify({
                'status': 'error',
                'message': 'Product not found'
            }), 404

        # Check if user is the seller
        if current_user.user_uuid == product.shop.seller_info.user_id:
            return jsonify({
                'status': 'error',
                'message': 'Sellers cannot review their own products'
            }), 403

        # Handle image uploads
        image_urls = []
        if images:
            for image in images[:5]:  # Limit to 5 images
                if image:
                    # Validate file type
                    if not image.content_type.startswith('image/'):
                        return jsonify({
                            'status': 'error',
                            'message': f'Invalid file type for {image.filename}'
                        }), 400

                    # Validate file size (5MB limit)
                    if len(image.read()) > 5 * 1024 * 1024:
                        return jsonify({
                            'status': 'error',
                            'message': f'File {image.filename} is too large. Maximum size is 5MB'
                        }), 400
                    
                    # Reset file pointer after reading
                    image.seek(0)

                    try:
                        # Upload to Cloudinary
                        upload_result = cloudinary.uploader.upload(
                            image,
                            folder="review_images",
                            allowed_formats=["jpg", "jpeg", "png", "gif"],
                            transformation={
                                'quality': 'auto:good',
                                'fetch_format': 'auto'
                            }
                        )
                        image_urls.append(upload_result['secure_url'])
                    except Exception as e:
                        print(f"Error uploading image to Cloudinary: {str(e)}")
                        return jsonify({
                            'status': 'error',
                            'message': f'Failed to upload image {image.filename}'
                        }), 500

        # Create new review
        new_review = Review(
            product_uuid=product_uuid,
            user_uuid=current_user.user_uuid,
            rating=rating,
            comment=comment,
            images=image_urls if image_urls else None
        )

        db.session.add(new_review)

        # Update product rating
        all_reviews = Review.query.filter_by(product_uuid=product_uuid).all()
        total_ratings = sum(review.rating for review in all_reviews) + rating
        new_rating = total_ratings / (len(all_reviews) + 1)
        product.rating = round(new_rating, 1)

        db.session.commit()

        # Return the review with user data
        review_data = {
            'review_uuid': new_review.review_uuid,
            'user_uuid': new_review.user_uuid,
            'rating': new_review.rating,
            'comment': new_review.comment,
            'images': new_review.images,
            'created_at': new_review.created_at.isoformat(),
            'user': {
                'user_uuid': current_user.user_uuid,
                'first_name': current_user.first_name,
                'last_name': current_user.last_name,
                'profile_image_url': current_user.profile_image_url
            }
        }

        return jsonify({
            'status': 'success',
            'message': 'Review added successfully',
            'review': review_data
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error adding review: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to add review'
        }), 500

@products.route('/api/reviews/<review_uuid>/reply', methods=['POST'])
@login_required
@role_required(Role.SELLER)
def reply_to_review(review_uuid):
    """Add a seller reply to a review"""
    try:
        data = request.get_json()
        reply = data.get('reply')

        if not reply:
            return jsonify({
                'status': 'error',
                'message': 'Reply text is required'
            }), 400

        # Get the review
        review = Review.query.get(review_uuid)
        if not review:
            return jsonify({
                'status': 'error',
                'message': 'Review not found'
            }), 404

        # Get the seller info for the current user
        seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
        if not seller:
            return jsonify({
                'status': 'error',
                'message': 'Seller information not found'
            }), 403

        # Check if the seller owns the product
        product = Product.query.get(review.product_uuid)
        if not product or product.seller_id != seller.seller_id:
            return jsonify({
                'status': 'error',
                'message': 'You do not have permission to reply to this review'
            }), 403

        # Add the reply
        review.seller_reply = reply
        review.seller_reply_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Reply added successfully',
            'review': review.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error adding reply to review: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to add reply'
        }), 500

@products.route('/api/seller/reviews', methods=['GET'])
@login_required
@role_required(Role.SELLER)
def get_seller_reviews():
    """Get all reviews for a seller's products"""
    try:
        # Get the seller info for the current user
        seller = SellerInfo.query.filter_by(user_id=current_user.user_uuid).first()
        if not seller:
            return jsonify({
                'status': 'error',
                'message': 'Seller information not found'
            }), 403

        print(f"Fetching reviews for seller: {seller.seller_id}")
        # Get all products for the seller
        products = Product.query.filter_by(seller_id=seller.seller_id).all()
        print(f"Found {len(products)} products")
        
        product_uuids = [p.product_uuid for p in products]

        # Get all reviews for these products
        reviews = Review.query.filter(Review.product_uuid.in_(product_uuids)).all()
        print(f"Found {len(reviews)} reviews")

        # Format reviews with product info
        formatted_reviews = []
        for review in reviews:
            product = Product.query.get(review.product_uuid)
            if product:  # Only include reviews for existing products
                review_dict = review.to_dict()
                review_dict['product'] = {
                    'product_uuid': product.product_uuid,
                    'name': product.name,
                    'main_image': product.main_image
                }
                formatted_reviews.append(review_dict)

        # Sort reviews by date, newest first
        formatted_reviews.sort(key=lambda x: x['created_at'], reverse=True)

        return jsonify({
            'status': 'success',
            'reviews': formatted_reviews
        }), 200

    except Exception as e:
        print(f"Error fetching seller reviews: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch reviews'
        }), 500

@products.route('/api/reviews/<review_uuid>', methods=['DELETE'])
@login_required
def delete_review(review_uuid):
    """Delete a review"""
    try:
        # Find the review
        review = Review.query.get(review_uuid)
        
        if not review:
            return jsonify({
                'status': 'error',
                'message': 'Review not found'
            }), 404
            
        # Check if the user owns this review
        if review.user_uuid != current_user.user_uuid:
            return jsonify({
                'status': 'error',
                'message': 'You can only delete your own reviews'
            }), 403

        # Delete images from Cloudinary if they exist
        if review.images:
            for image_url in review.images:
                try:
                    # Extract public_id from the Cloudinary URL
                    public_id = image_url.split('/')[-1].split('.')[0]
                    cloudinary.uploader.destroy(public_id)
                except Exception as e:
                    print(f"Error deleting image from Cloudinary: {str(e)}")

        # Get the product to update its rating
        product = Product.query.get(review.product_uuid)
        
        # Delete the review
        db.session.delete(review)
        
        # Update product rating
        remaining_reviews = Review.query.filter_by(product_uuid=review.product_uuid).all()
        if remaining_reviews:
            total_ratings = sum(r.rating for r in remaining_reviews)
            new_rating = total_ratings / len(remaining_reviews)
            product.rating = round(new_rating, 1)
        else:
            product.rating = 0

        db.session.commit()

        return jsonify({
            'status': 'success',
            'message': 'Review deleted successfully'
        })

    except Exception as e:
        db.session.rollback()
        print(f"Error deleting review: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete review'
        }), 500
