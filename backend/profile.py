from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from datetime import datetime
from __init__ import db, Users
import cloudinary.uploader


profile_bp = Blueprint('profile', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@profile_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Not authenticated'}), 401
        
    return jsonify({
        'username': current_user.username,
        'email': current_user.email,
        'first_name': current_user.first_name,
        'last_name': current_user.last_name,
        'phone': current_user.phone,
        'gender': current_user.gender,
        'date_of_birth': current_user.date_of_birth.strftime('%Y-%m-%d') if current_user.date_of_birth else None,
        'profile_image': current_user.profile_image_url
    })


@profile_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Not authenticated'}), 401

    try:
        # Handle file upload first if exists
        profile_image_url = None
        if 'profileImage' in request.files:
            profile_image = request.files['profileImage']
            if profile_image and allowed_file(profile_image.filename):
                try:
                    # Upload image to Cloudinary
                    upload_result = cloudinary.uploader.upload(
                        profile_image,
                        folder="flaskify/profile-images",  # Specify your folder path here
                        public_id=f"user_{current_user.user_uuid}",    # Optional: Set a custom public ID
                        overwrite=True,                         # Overwrite existing image with same public_id
                        resource_type="auto",                   # Auto-detect resource type
                        transformation={                        # Optional: Add transformations
                            'width': 500,                      # Resize to width
                            'height': 500,                     # Resize to height
                            'crop': 'fill',                    # Crop method
                            'gravity': 'face'                  # Focus on face if present
                        }
                    )
                    profile_image_url = upload_result['secure_url']
                    current_user.profile_image_url = profile_image_url
                except Exception as e:
                    return jsonify({'error': f'Error uploading image: {str(e)}'}), 500

        # Handle form data
        # Get form fields, checking both form and json data
        data = request.form.to_dict() if request.form else request.json

        if not data and not profile_image_url:
            return jsonify({'error': 'No data provided'}), 400

        # Update user fields if provided
        if 'username' in data and data['username'] != current_user.username:
            existing_user = Users.query.filter_by(username=data['username']).first()
            if existing_user:
                return jsonify({'error': 'Username already exists'}), 400
            current_user.username = data['username']
            
        if 'email' in data and data['email'] != current_user.email:
            existing_email = Users.query.filter_by(email=data['email']).first()
            if existing_email:
                return jsonify({'error': 'Email already exists'}), 400
            current_user.email = data['email']
            
        if 'firstName' in data:
            current_user.first_name = data['firstName']
        if 'lastName' in data:
            current_user.last_name = data['lastName']
        if 'phone' in data:
            current_user.phone = data['phone']
        if 'gender' in data:
            current_user.gender = data['gender']
        if 'date_of_birth' in data and data['date_of_birth']:
            try:
                current_user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format'}), 400

        # Commit the changes
        db.session.add(current_user)
        db.session.commit()
        
        response_data = {'message': 'Profile updated successfully'}
        if profile_image_url:
            response_data['url'] = profile_image_url
            
        return jsonify(response_data)

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    

@profile_bp.route('/profile/image', methods=['POST'])
@login_required
def upload_profile_image():
    if not current_user.is_authenticated:
        return jsonify({'error': 'Not authenticated'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file.content_length > 5 * 1024 * 1024:
        return jsonify({'error': 'File size exceeds 5 MB limit'}), 400

    if file and allowed_file(file.filename):
        try:
            # Upload image to Cloudinary
            upload_result = cloudinary.uploader.upload(file)
            current_user.profile_image_url = upload_result['secure_url']  # Save the secure URL in the user's profile
            
            db.session.add(current_user)
            db.session.commit()
            return jsonify({'message': 'Profile image uploaded successfully', 'url': current_user.profile_image_url}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Invalid file type'}), 400