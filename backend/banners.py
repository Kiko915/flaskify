from flask import Blueprint, request, jsonify, make_response
from flask_login import login_required, current_user
from models import db, Banner, Role
import cloudinary.uploader
from datetime import datetime
import uuid
from flask_cors import CORS

banners = Blueprint('banners', __name__)
CORS(banners, supports_credentials=True)

def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@banners.route('/banners', methods=['GET'])
def get_banners():
    """Get all banners"""
    try:
        banners = Banner.query.filter_by(is_active=True).all()
        response = make_response(jsonify([banner.to_dict() for banner in banners]), 200)
        return add_cors_headers(response)
    except Exception as e:
        print(f"Error in get_banners: {str(e)}")  # Debug log
        response = make_response(jsonify({'error': str(e)}), 500)
        return add_cors_headers(response)

@banners.route('/admin/banners', methods=['GET', 'POST', 'OPTIONS'])
@login_required
def manage_banners():
    """Admin endpoint to manage banners"""
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)

    if current_user.role != Role.ADMIN:
        response = make_response(jsonify({'error': 'Unauthorized'}), 403)
        return add_cors_headers(response)
        
    if request.method == 'GET':
        try:
            banners = Banner.query.all()
            response = make_response(jsonify([banner.to_dict() for banner in banners]), 200)
            return add_cors_headers(response)
        except Exception as e:
            print(f"Error in get_all_banners: {str(e)}")  # Debug log
            response = make_response(jsonify({'error': str(e)}), 500)
            return add_cors_headers(response)
            
    elif request.method == 'POST':
        try:
            if 'image' not in request.files:
                response = make_response(jsonify({'error': 'No image file provided'}), 400)
                return add_cors_headers(response)

            file = request.files['image']
            if not file or not allowed_file(file.filename):
                response = make_response(jsonify({'error': 'Invalid file type'}), 400)
                return add_cors_headers(response)

            title = request.form.get('title')
            if not title:
                response = make_response(jsonify({'error': 'Title is required'}), 400)
                return add_cors_headers(response)

            # Upload image to Cloudinary
            result = cloudinary.uploader.upload(
                file,
                folder='flaskify/banners',
                public_id=f"banner_{uuid.uuid4()}",
                overwrite=True,
                resource_type="auto"
            )

            # Create new banner
            banner = Banner(
                title=title,
                description=request.form.get('description'),
                image_url=result['secure_url'],
                is_active=request.form.get('is_active', '1') == '1',
                button_text=request.form.get('button_text', 'Shop Now'),
                button_link=request.form.get('button_link', '#'),
                secondary_button_text=request.form.get('secondary_button_text', 'Learn More'),
                secondary_button_link=request.form.get('secondary_button_link', '#'),
                overlay_opacity=int(request.form.get('overlay_opacity', 50)),
                title_color=request.form.get('title_color', '#FFFFFF'),
                description_color=request.form.get('description_color', '#E5E7EB'),
                button_style=request.form.get('button_style', 'primary'),
                show_secondary_button=request.form.get('show_secondary_button', '1') == '1',
                show_special_offer=request.form.get('show_special_offer', '1') == '1',
                special_offer_text=request.form.get('special_offer_text', 'Special Offer')
            )

            db.session.add(banner)
            db.session.commit()

            response = make_response(jsonify(banner.to_dict()), 201)
            return add_cors_headers(response)

        except Exception as e:
            db.session.rollback()
            print(f"Error in create_banner: {str(e)}")  # Debug log
            response = make_response(jsonify({'error': str(e)}), 500)
            return add_cors_headers(response)

@banners.route('/admin/banners/<int:banner_id>', methods=['PUT', 'DELETE', 'OPTIONS'])
@login_required
def banner_operations(banner_id):
    """Handle banner operations"""
    if request.method == 'OPTIONS':
        response = make_response()
        return add_cors_headers(response)

    if current_user.role != Role.ADMIN:
        response = make_response(jsonify({'error': 'Unauthorized'}), 403)
        return add_cors_headers(response)

    banner = Banner.query.get(banner_id)
    if not banner:
        response = make_response(jsonify({'error': 'Banner not found'}), 404)
        return add_cors_headers(response)

    if request.method == 'PUT':
        try:
            print("Form data received:", dict(request.form))  # Debug log
            
            # Update image if provided
            if 'image' in request.files:
                file = request.files['image']
                if file and allowed_file(file.filename):
                    result = cloudinary.uploader.upload(
                        file,
                        folder='flaskify/banners',
                        public_id=f"banner_{uuid.uuid4()}",
                        overwrite=True,
                        resource_type="auto"
                    )
                    banner.image_url = result['secure_url']

            # Update other fields
            if 'title' in request.form:
                banner.title = request.form['title']
            if 'description' in request.form:
                banner.description = request.form['description']
            if 'is_active' in request.form:
                banner.is_active = request.form['is_active'] == '1'
            
            # Update button and styling fields
            if 'button_text' in request.form:
                banner.button_text = request.form['button_text']
            if 'button_link' in request.form:
                banner.button_link = request.form['button_link']
            if 'secondary_button_text' in request.form:
                banner.secondary_button_text = request.form['secondary_button_text']
            if 'secondary_button_link' in request.form:
                banner.secondary_button_link = request.form['secondary_button_link']
            if 'overlay_opacity' in request.form:
                banner.overlay_opacity = int(request.form['overlay_opacity'])
            if 'title_color' in request.form:
                banner.title_color = request.form['title_color']
            if 'description_color' in request.form:
                banner.description_color = request.form['description_color']
            if 'button_style' in request.form:
                banner.button_style = request.form['button_style']
            
            # Handle boolean fields
            # Convert string 'true'/'false' to boolean
            show_secondary = request.form.get('show_secondary_button', 'false').lower()
            show_special = request.form.get('show_special_offer', 'false').lower()
            
            banner.show_secondary_button = show_secondary in ['true', '1', 'on']
            banner.show_special_offer = show_special in ['true', '1', 'on']
            
            print(f"show_secondary_button raw value: {show_secondary}")  # Debug log
            print(f"Converted show_secondary_button value: {banner.show_secondary_button}")  # Debug log
            
            if 'special_offer_text' in request.form:
                banner.special_offer_text = request.form['special_offer_text']

            db.session.commit()
            
            # Log the final state
            print("Updated banner state:", banner.to_dict())  # Debug log
            
            response = make_response(jsonify(banner.to_dict()), 200)
            return add_cors_headers(response)

        except Exception as e:
            db.session.rollback()
            print(f"Error in update_banner: {str(e)}")  # Debug log
            response = make_response(jsonify({'error': str(e)}), 500)
            return add_cors_headers(response)

    elif request.method == 'DELETE':
        try:
            db.session.delete(banner)
            db.session.commit()
            response = make_response(jsonify({'message': 'Banner deleted successfully'}), 200)
            return add_cors_headers(response)
        except Exception as e:
            db.session.rollback()
            print(f"Error in delete_banner: {str(e)}")  # Debug log
            response = make_response(jsonify({'error': str(e)}), 500)
            return add_cors_headers(response) 