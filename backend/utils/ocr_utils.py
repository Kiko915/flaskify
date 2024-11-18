import numpy as np
import cv2
import io
import re
from PIL import Image, ImageEnhance
import keras_ocr
import os
import time

# Initialize keras-ocr pipeline
pipeline = keras_ocr.pipeline.Pipeline()

# Initialize PaddleOCR with English support
ocr = PaddleOCR(use_angle_cls=True, lang='en')

def verify_bir_certificate(image_data):
    """
    Verify if an image contains valid BIR certificate content using keras-ocr.
    
    Args:
        image_data: Bytes of the image file
        
    Returns:
        tuple: (is_valid, message)
            is_valid (bool): True if the image appears to be a valid BIR certificate
            message (str): Validation message or error details
    """
    try:
        # Convert image bytes to numpy array
        image = np.array(Image.open(io.BytesIO(image_data)))
        
        # Perform OCR using keras-ocr
        images = [image]
        prediction_groups = pipeline.recognize(images)
        
        if not prediction_groups or not prediction_groups[0]:
            return False, "No text detected in the image"

        # Extract text from predictions
        text = " ".join([word[0].lower() for word in prediction_groups[0]])
        
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
            if keyword not in text
        ]
        
        if missing_keywords:
            return False, f"Missing required content: {', '.join(missing_keywords)}"
            
        # Look for TIN number pattern (XXX-XXX-XXX-XXX)
        tin_pattern = r'\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{3}'
        tin_match = re.search(tin_pattern, text)
        
        if not tin_match:
            return False, "No valid TIN number found"
            
        return True, "Valid BIR certificate"

    except Exception as e:
        return False, f"Error processing image: {str(e)}"