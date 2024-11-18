from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from models import db, Product, Shop, SellerInfo, Role
from sqlalchemy import or_
import cloudinary
import cloudinary.uploader
import cloudinary.api
import uuid

products = Blueprint('products', __name__)

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products', methods=['POST'])
@login_required
def create_product(seller_id, shop_uuid):
    try:
        # Check if seller exists and user has permission
        seller = SellerInfo.query.get(seller_id)
        if not seller or (seller.user_id != current_user.user_uuid and not current_user.has_role(Role.ADMIN)):
            return jsonify({"message": "Seller not found or access denied"}), 404

        # Check if shop exists and belongs to seller
        shop = Shop.query.filter_by(shop_uuid=shop_uuid, seller_id=seller_id).first()
        if not shop:
            return jsonify({"message": "Shop not found"}), 404

        # Get product data from form
        data = request.form.to_dict()
        
        # Validate required fields
        required_fields = ['name', 'description', 'price', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({"message": f"Missing required field: {field}"}), 400

        # Create new product
        product = Product(
            shop_uuid=shop_uuid,
            seller_id=seller_id,
            name=data['name'],
            description=data['description'],
            price=float(data['price']),
            category=data['category'],
            compare_at_price=float(data.get('compare_at_price', 0)) or None,
            sku=data.get('sku'),
            barcode=data.get('barcode'),
            quantity=int(data.get('quantity', 0)),
            low_stock_alert=int(data.get('low_stock_alert', 5)),
            brand=data.get('brand'),
            subcategory=data.get('subcategory'),
            tags=data.get('tags'),
            meta_title=data.get('meta_title'),
            meta_description=data.get('meta_description'),
            weight=float(data.get('weight', 0)) or None,
            width=float(data.get('width', 0)) or None,
            height=float(data.get('height', 0)) or None,
            length=float(data.get('length', 0)) or None
        )

        # Handle main product image
        if 'main_image' in request.files:
            file = request.files['main_image']
            if file and allowed_file(file.filename):
                # Upload to Cloudinary
                result = cloudinary.uploader.upload(
                    file,
                    folder='flaskify/products',
                    public_id=f"{uuid.uuid4()}",
                    overwrite=True,
                    resource_type="auto"
                )
                product.main_image = result['secure_url']

        # Handle additional images
        additional_images = []
        if 'additional_images' in request.files:
            files = request.files.getlist('additional_images')
            for file in files:
                if file and allowed_file(file.filename):
                    # Upload each image to Cloudinary
                    result = cloudinary.uploader.upload(
                        file,
                        folder='flaskify/products',
                        public_id=f"{uuid.uuid4()}",
                        overwrite=True,
                        resource_type="auto"
                    )
                    additional_images.append(result['secure_url'])
            if additional_images:
                product.additional_images = additional_images

        db.session.add(product)
        db.session.commit()

        return jsonify({
            "message": "Product created successfully",
            "product": product.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Failed to create product", "error": str(e)}), 500

@products.route('/seller/<string:seller_id>/shops/<string:shop_uuid>/products/<string:product_uuid>', methods=['GET'])
@login_required
def get_product(seller_id, shop_uuid, product_uuid):
    try:
        # Get product with validation
        product = Product.query.filter_by(
            product_uuid=product_uuid,
            shop_uuid=shop_uuid,
            seller_id=seller_id
        ).first()
        
        if not product:
            return jsonify({"message": "Product not found"}), 404

        # Increment view count
        product.view_count += 1
        db.session.commit()

        return jsonify(product.to_dict()), 200

    except Exception as e:
        return jsonify({"message": "Failed to fetch product", "error": str(e)}), 500

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
            query = query.filter(
                or_(
                    Product.name.ilike(f'%{search}%'),
                    Product.description.ilike(f'%{search}%'),
                    Product.sku.ilike(f'%{search}%')
                )
            )
        
        if category:
            query = query.filter_by(category=category)
        
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
        return jsonify({"message": "Failed to fetch products", "error": str(e)}), 500

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
        
        # Update basic fields
        fields_to_update = [
            'name', 'description', 'price', 'compare_at_price', 'sku', 'barcode',
            'quantity', 'low_stock_alert', 'brand', 'category', 'subcategory',
            'tags', 'status', 'visibility', 'featured', 'meta_title',
            'meta_description', 'weight', 'width', 'height', 'length'
        ]
        
        for field in fields_to_update:
            if field in data:
                if field in ['price', 'compare_at_price', 'weight', 'width', 'height', 'length']:
                    value = float(data[field]) if data[field] else None
                elif field in ['quantity', 'low_stock_alert']:
                    value = int(data[field])
                else:
                    value = data[field]
                setattr(product, field, value)

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
        if 'additional_images' in request.files:
            # Delete old images from Cloudinary
            if product.additional_images:
                for img_url in product.additional_images:
                    try:
                        # Extract public_id from the URL
                        public_id = img_url.split('/')[-1].split('.')[0]
                        cloudinary.uploader.destroy(f"flaskify/products/{public_id}")
                    except:
                        continue

            # Upload new images
            additional_images = []
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
                    additional_images.append(result['secure_url'])
            product.additional_images = additional_images

        product.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "message": "Product updated successfully",
            "product": product.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Failed to update product", "error": str(e)}), 500

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

        # Delete product from database
        db.session.delete(product)
        db.session.commit()

        return jsonify({"message": "Product deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Failed to delete product", "error": str(e)}), 500