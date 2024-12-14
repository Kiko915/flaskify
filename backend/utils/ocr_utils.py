import numpy as np
import cv2
import io
import re
from PIL import Image, ImageEnhance
from paddleocr import PaddleOCR, draw_ocr
import os
import time
import uuid


ocr = PaddleOCR(lang='en')

def verify_bir_certificate(image_data):
    try:
        # Convert image bytes to PIL Image
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # Convert to numpy array for OCR
        img_array = np.array(image)
        
        # Perform OCR
        result = ocr.ocr(img_array, cls=False)
        
        if not result or not result[0]:
            return False, "No text detected in the image", None

        # Create visualization
        boxes = [line[0] for line in result[0]]
        txts = [line[1][0] for line in result[0]]
        scores = [line[1][1] for line in result[0]]

        # Generate unique filename for visualization
        viz_filename = f'ocr_viz_{uuid.uuid4().hex[:8]}.jpg'
        viz_path = os.path.join('static', 'ocr_results', viz_filename)
        
        # Ensure directory exists
        os.makedirs(os.path.join('static', 'ocr_results'), exist_ok=True)
        
        # Draw OCR results on image
        font_path = os.path.join('static', 'fonts', 'arial.ttf')  # Update with your font path
        im_show = draw_ocr(img_array, boxes, txts, scores, font_path=font_path)
        im_show = Image.fromarray(im_show)
        im_show.save(viz_path)

        # Extract and combine all detected text
        text = " ".join([line[1][0].lower() for line in result[0]])
        
        # Keywords that should be present in a BIR certificate
        required_keywords = [
            'bir',
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
            return False, f"Missing required content: {', '.join(missing_keywords)}", viz_path
            
        # Look for TIN number pattern (XXX-XXX-XXX-XXX)
        tin_pattern = r'\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{3}'
        tin_match = re.search(tin_pattern, text)
        
        if not tin_match:
            return False, "No valid TIN number found", viz_path
            
        return True, "Valid BIR certificate", viz_path

    except Exception as e:
        return False, f"Error processing image: {str(e)}", None