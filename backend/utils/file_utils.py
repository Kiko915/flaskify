from io import BytesIO
from PIL import Image

def verify_image_file(file_data):
    """
    Verify image file format and quality.
    Returns (is_valid, message)
    """
    try:
        # Open image using PIL
        img = Image.open(BytesIO(file_data))
        
        # Check image format
        if img.format.lower() not in ['jpeg', 'jpg', 'png']:
            return False, "Invalid image format. Only JPG, JPEG, or PNG files are allowed."
        
        # Get image dimensions
        width, height = img.size
        
        # Check minimum dimensions (150x150)
        if width < 150 or height < 150:
            return False, f"Image dimensions too small. Minimum size is 150x150 pixels. Current size: {width}x{height}"
        
        # Check file size (already checked in route handler)
        # file_size = len(file_data)
        # if file_size > 5 * 1024 * 1024:  # 5MB
        #     return False, "File size must be less than 5MB"
        
        return True, "Image validation successful"
        
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"
