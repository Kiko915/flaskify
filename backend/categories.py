from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from models import db, Category, CategoryAttribute, Role
from datetime import datetime
import cloudinary
import cloudinary.uploader
import uuid

categories = Blueprint('categories', __name__)

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@categories.route('/admin/categories', methods=['POST'])
@login_required
def create_category():
    try:
        if not current_user.role == Role.ADMIN:
            return jsonify({"message": "Unauthorized"}), 403

        data = request.form.to_dict()
        
        # Validate required fields
        if 'name' not in data:
            return jsonify({"message": "Category name is required"}), 400

        # Handle parent_id - set to None if 'null' or empty
        parent_id = data.get('parent_id')
        if parent_id in ['null', '', None]:
            parent_id = None

        # Convert is_active to boolean
        is_active = data.get('is_active', '1')
        is_active = bool(int(is_active)) if is_active in ['0', '1'] else True

        # Use custom UUID if provided, otherwise generate one
        custom_uuid = data.get('uuid')
        
        # Create new category with custom UUID if provided
        new_category = Category(
            category_uuid=custom_uuid,  # This will use the custom ID if provided
            name=data['name'],
            description=data.get('description'),
            parent_id=parent_id,
            is_active=is_active
        )

        # Handle category image
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                result = cloudinary.uploader.upload(
                    file,
                    folder='flaskify/categories',
                    public_id=f"{uuid.uuid4()}",
                    overwrite=True,
                    resource_type="auto"
                )
                new_category.image_url = result['secure_url']

        db.session.add(new_category)
        db.session.flush()  # Get category_uuid without committing

        # Handle attributes if provided
        attributes_data = request.form.get('attributes')
        if attributes_data:
            attributes = eval(attributes_data)  # Convert string to list
            for attr in attributes:
                attribute = CategoryAttribute(
                    category_uuid=new_category.category_uuid,
                    name=attr['name'],
                    type=attr['type'],
                    is_required=attr.get('is_required', False),
                    is_variant=attr.get('is_variant', True),
                    options=attr.get('options', [])
                )
                db.session.add(attribute)

        db.session.commit()
        return jsonify({
            "message": "Category created successfully",
            "category_uuid": new_category.category_uuid
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@categories.route('/admin/categories/<category_uuid>', methods=['PATCH'])
@login_required
def update_category(category_uuid):
    try:
        if not current_user.role == Role.ADMIN:
            return jsonify({"message": "Unauthorized"}), 403

        category = Category.query.get_or_404(category_uuid)
        data = request.form.to_dict()

        # Update basic fields
        if 'name' in data:
            category.name = data['name']
        if 'description' in data:
            category.description = data['description']
        if 'parent_id' in data:
            # Handle parent_id properly
            parent_id = data['parent_id']
            category.parent_id = None if parent_id in ['null', '', 'none', None] else parent_id
        if 'is_active' in data:
            is_active = data.get('is_active')
            category.is_active = is_active == '1' or is_active.lower() == 'true'

        # Handle image update
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                # Delete old image if exists
                if category.image_url:
                    try:
                        public_id = category.image_url.split('/')[-1].split('.')[0]
                        cloudinary.uploader.destroy(f"flaskify/categories/{public_id}")
                    except:
                        pass

                # Upload new image
                result = cloudinary.uploader.upload(
                    file,
                    folder='flaskify/categories',
                    public_id=f"{uuid.uuid4()}",
                    overwrite=True,
                    resource_type="auto"
                )
                category.image_url = result['secure_url']

        category.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            "message": "Category updated successfully",
            "category_uuid": category.category_uuid
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@categories.route('/admin/categories/<category_uuid>', methods=['DELETE'])
@login_required
def delete_category(category_uuid):
    try:
        if not current_user.role == Role.ADMIN:
            return jsonify({"message": "Unauthorized"}), 403

        category = Category.query.get_or_404(category_uuid)

        # Check if category has subcategories
        if category.subcategories.count() > 0:
            return jsonify({
                "message": "Cannot delete category with existing subcategories. Please delete subcategories first."
            }), 400

        # Delete category image from Cloudinary if exists
        if category.image_url:
            try:
                public_id = category.image_url.split('/')[-1].split('.')[0]
                cloudinary.uploader.destroy(f"flaskify/categories/{public_id}")
            except:
                pass

        # Delete all attributes
        CategoryAttribute.query.filter_by(category_uuid=category_uuid).delete()

        # Delete the category
        db.session.delete(category)
        db.session.commit()

        return jsonify({"message": "Category deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@categories.route('/categories', methods=['GET'])
def get_categories():
    try:
        # Get query parameters
        search = request.args.get('search')
        is_active = request.args.get('is_active')
        category_type = request.args.get('type')  # 'parent' or 'sub'
        parent_id = request.args.get('parent_id')

        # Base query
        query = Category.query

        # Apply filters
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(db.func.lower(Category.name).like(search_term))
        
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            query = query.filter(Category.is_active.is_(is_active_bool))

        if category_type == 'parent':
            query = query.filter(Category.parent_id == None)
        elif category_type == 'sub':
            query = query.filter(Category.parent_id != None)

        if parent_id:
            query = query.filter(Category.parent_id == parent_id)

        # Get all categories after applying filters
        categories = query.all()

        def format_category(category):
            formatted = {
                'uuid': category.category_uuid,
                'name': category.name,
                'description': category.description,
                'parent_id': category.parent_id,
                'is_active': category.is_active,
                'image_url': category.image_url,
                'subcategories': []
            }
            
            # Format subcategories if they exist
            if hasattr(category, 'subcategories'):
                formatted['subcategories'] = [
                    {
                        'uuid': sub.category_uuid,
                        'name': sub.name,
                        'description': sub.description,
                        'parent_id': sub.parent_id,
                        'is_active': sub.is_active,
                        'image_url': sub.image_url,
                    } for sub in category.subcategories
                ]
            
            print(f"Category {category.name} image_url: {category.image_url}")  # Debug log
            return formatted

        # Format response based on whether we're getting all categories or specific ones
        if category_type == 'sub' or parent_id:
            # Return flat list for subcategories
            result = [format_category(cat) for cat in categories]
        else:
            # Return hierarchical structure for main categories
            result = [format_category(cat) for cat in categories if cat.parent_id is None]

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400

@categories.route('/categories/<category_uuid>/attributes', methods=['GET'])
def get_category_attributes(category_uuid):
    try:
        category = Category.query.get_or_404(category_uuid)
        attributes = [{
            'uuid': attr.attribute_uuid,
            'name': attr.name,
            'type': attr.type,
            'is_required': attr.is_required,
            'is_variant': attr.is_variant,
            'options': attr.options
        } for attr in category.attributes]

        return jsonify(attributes), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400

@categories.route('/admin/categories/bulk-create', methods=['POST'])
@login_required
def bulk_create_categories():
    try:
        if not current_user.role == Role.ADMIN:
            return jsonify({"message": "Unauthorized"}), 403

        data = request.get_json()
        if not data or 'categories' not in data:
            return jsonify({"message": "No categories data provided"}), 400

        created_categories = []
        
        for category_data in data['categories']:
            parent_data = category_data.get('parent')
            children_data = category_data.get('children', [])

            if not parent_data or not parent_data.get('name'):
                continue

            # Create parent category with custom UUID
            parent_category = Category(
                category_uuid=parent_data.get('uuid'),  # Use provided custom UUID
                name=parent_data['name'].strip(),
                description=parent_data.get('description', '').strip() if parent_data.get('description') else '',
                is_active=parent_data.get('is_active', True),
                parent_id=None,
                image_url=parent_data.get('image_url')  # Add image_url
            )
            db.session.add(parent_category)
            db.session.flush()  # Get UUID without committing
            created_categories.append({
                'uuid': parent_category.category_uuid,
                'name': parent_category.name,
                'type': 'parent',
                'image_url': parent_category.image_url  # Include image_url in response
            })

            # Create child categories with custom UUIDs
            for child_data in children_data:
                if not child_data.get('name'):
                    continue

                child_category = Category(
                    category_uuid=child_data.get('uuid'),  # Use provided custom UUID
                    name=child_data['name'].strip(),
                    description=child_data.get('description', '').strip() if child_data.get('description') else '',
                    is_active=child_data.get('is_active', True),
                    parent_id=parent_category.category_uuid,
                    image_url=child_data.get('image_url')  # Add image_url
                )
                db.session.add(child_category)
                db.session.flush()
                created_categories.append({
                    'uuid': child_category.category_uuid,
                    'name': child_category.name,
                    'type': 'child',
                    'parent_uuid': parent_category.category_uuid,
                    'image_url': child_category.image_url  # Include image_url in response
                })

        db.session.commit()
        return jsonify({
            "message": "Categories created successfully",
            "categories": created_categories
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@categories.route('/categories/<category_uuid>', methods=['GET'])
def get_category(category_uuid):
    try:
        category = Category.query.filter_by(category_uuid=category_uuid).first()
        
        if not category:
            return jsonify({"message": "Category not found"}), 404

        # Format the category response
        result = {
            'uuid': category.category_uuid,
            'name': category.name,
            'description': category.description,
            'parent_id': category.parent_id,
            'is_active': category.is_active,
            'image_url': category.image_url,
            'subcategories': []
        }
        
        # Add subcategories if they exist
        if hasattr(category, 'subcategories'):
            result['subcategories'] = [
                {
                    'uuid': sub.category_uuid,
                    'name': sub.name,
                    'description': sub.description,
                    'parent_id': sub.parent_id,
                    'is_active': sub.is_active,
                    'image_url': sub.image_url,
                } for sub in category.subcategories
            ]

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"message": str(e)}), 400
