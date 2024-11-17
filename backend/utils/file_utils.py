from PIL import Image
import io

def verify_image_file(image_data):
    """
    Verify if an image file is valid and meets our requirements.
    
    Args:
        image_data: Bytes of the image file
        
    Returns:
        tuple: (is_valid, message)
            is_valid (bool): True if the image is valid
            message (str): Validation message or error details
    """
    try:
        # Try to open the image using PIL
        image = Image.open(io.BytesIO(image_data))
        
        # Check if it's a supported format
        if image.format.lower() not in ['jpeg', 'jpg', 'png']:
            return False, f"Unsupported image format: {image.format}. Please use JPG, JPEG, or PNG."
        
        # Check image dimensions (min 800x600, max 4000x4000)
        width, height = image.size
        if width < 800 or height < 600:
            return False, "Image dimensions too small. Minimum size is 800x600 pixels."
        if width > 4000 or height > 4000:
            return False, "Image dimensions too large. Maximum size is 4000x4000 pixels."
        
        # Check if image is clear enough (not too dark or blurry)
        # Convert to grayscale and check average brightness
        gray_image = image.convert('L')
        brightness = sum(gray_image.getdata()) / (width * height)
        if brightness < 50:  # threshold for too dark
            return False, "Image appears too dark. Please provide a clearer image."
            
        return True, "Valid image file"
        
    except Exception as e:
        return False, f"Error processing image: {str(e)}"
