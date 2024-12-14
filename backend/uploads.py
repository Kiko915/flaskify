from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
import cloudinary.uploader
from utils.file_utils import verify_image_file

uploads = Blueprint('uploads', __name__)

@uploads.route('/upload/bir-certificate', methods=['POST'])
@login_required
def upload_bir_certificate():
    try:
        if 'birCertificate' not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files['birCertificate']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400

        # Read file content for validation
        file_content = file.read()
        
        # Validate file
        is_valid, message = verify_image_file(file_content)
        if not is_valid:
            return jsonify({
                "error": "Invalid file",
                "details": message
            }), 400

        # Reset file pointer after reading
        file.seek(0)

        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file,
            folder="bir_certificates",
            resource_type="auto",
            allowed_formats=["pdf", "png", "jpg", "jpeg"]
        )

        return jsonify({
            "message": "File uploaded successfully",
            "url": upload_result['secure_url']
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to upload file",
            "details": str(e)
        }), 500
