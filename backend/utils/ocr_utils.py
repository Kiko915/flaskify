import pytesseract
from PIL import Image, ImageEnhance
import io
import re
import numpy as np

def verify_bir_certificate(image_data):
    """
    Verify if an image contains valid BIR certificate content.
    
    Args:
        image_data: Bytes of the image file
        
    Returns:
        tuple: (is_valid, message)
            is_valid (bool): True if the image appears to be a valid BIR certificate
            message (str): Validation message or error details
    """
    try:
        # Open image using PIL
        image = Image.open(io.BytesIO(image_data))
        
        # Convert image to text using OCR
        text = pytesseract.image_to_string(image)
        
        # Convert to lowercase for case-insensitive matching
        text_lower = text.lower()
        
        # Keywords that should be present in a BIR certificate
        required_keywords = [
            'bir',
            'bureau of internal revenue',
            'certificate',
            'registration',
            'tin',
            '2303'
        ]
        
        # Check for required keywords
        missing_keywords = [
            keyword for keyword in required_keywords 
            if keyword not in text_lower
        ]
        
        if missing_keywords:
            return False, f"Missing required content: {', '.join(missing_keywords)}"
            
        # Look for TIN number pattern (XXX-XXX-XXX-XXX)
        tin_pattern = r'\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{3}'
        tin_match = re.search(tin_pattern, text)
        
        if not tin_match:
            return False, "No valid TIN number found in the document"
            
        # If we reach here, the document appears valid
        return True, "Valid BIR certificate"
        
    except Exception as e:
        return False, f"Error processing image: {str(e)}"

def verify_image_file(image_data):
    """
    Verify if an image appears to be a BIR certificate based on visual characteristics.
    
    Args:
        image_data: Bytes of the image file
        
    Returns:
        tuple: (is_valid, message)
            is_valid (bool): True if the image appears to be a valid BIR certificate
            message (str): Validation message or error details
    """
    try:
        # Open image using PIL
        image = Image.open(io.BytesIO(image_data))
        
        # Check if it's a supported format
        if image.format.lower() not in ['jpeg', 'jpg', 'png']:
            return False, f"Unsupported image format: {image.format}. Please use JPG, JPEG, or PNG."
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Check image dimensions (typical document sizes)
        width, height = image.size
        if width < 800 or height < 1000:
            return False, "Image dimensions too small. Please provide a higher resolution scan."
        if width > 4000 or height > 4000:
            return False, "Image dimensions too large. Please resize the image."
        
        # Check aspect ratio (typical for documents)
        aspect_ratio = width / height
        if not (0.6 <= aspect_ratio <= 0.9):  # Standard document aspect ratios
            return False, "Image proportions don't match typical document format."
        
        # Convert to grayscale for analysis
        gray_image = image.convert('L')
        
        # Check image brightness and contrast
        brightness = np.mean(list(gray_image.getdata()))
        if brightness < 150:  # Document scans should be bright
            return False, "Image appears too dark. Please provide a clearer scan."
        
        # Check for uniform background (common in documents)
        std_dev = np.std(list(gray_image.getdata()))
        if std_dev < 30:  # Too uniform, might be blank
            return False, "Image appears to be blank or too uniform."
        if std_dev > 80:  # Too noisy, might be a photo of something else
            return False, "Image appears too noisy. Please provide a clean scan."
        
        # Check for text-like content
        enhancer = ImageEnhance.Contrast(gray_image)
        high_contrast = enhancer.enhance(2.0)
        black_pixels = sum(1 for pixel in high_contrast.getdata() if pixel < 128)
        total_pixels = width * height
        text_ratio = black_pixels / total_pixels
        
        if text_ratio < 0.05:  # Too little text
            return False, "Image appears to have insufficient text content."
        if text_ratio > 0.3:  # Too much dark content
            return False, "Image appears to have too much dark content."
        
        return True, "Valid document image"
        
    except Exception as e:
        return False, f"Error processing image: {str(e)}"
