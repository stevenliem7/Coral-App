#!/usr/bin/env python3
"""
YOLOv8 Detection Server for CoralCollective
Provides bicycle and recyclable detection via REST API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
from ultralytics import YOLO
import io
from PIL import Image

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Load YOLOv8 model (downloads automatically on first run)
print("Loading YOLOv8 model...")
model = YOLO('yolov8n.pt')  # nano version for speed, use yolov8s.pt for better accuracy
print("YOLOv8 model loaded successfully!")

# COCO class names that we care about
TARGET_CLASSES = {
    1: 'bicycle',
    39: 'bottle',        # plastic bottle
    41: 'cup',           # disposable cup
    67: 'cell phone',    # electronics for e-waste
    # Add more recyclable classes as needed
}

def decode_image(image_data):
    """Decode base64 image data to OpenCV format"""
    try:
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Convert to PIL Image
        pil_image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        
        return opencv_image
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def detect_objects(image, target_class_ids, confidence_threshold=0.5):
    """Detect specific objects in image using YOLOv8"""
    try:
        results = model(image, verbose=False)
        detections = []
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    class_id = int(box.cls[0])
                    confidence = float(box.conf[0])
                    
                    if class_id in target_class_ids and confidence >= confidence_threshold:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        
                        detections.append({
                            'class_id': class_id,
                            'class_name': TARGET_CLASSES.get(class_id, 'unknown'),
                            'confidence': confidence,
                            'bbox': [x1, y1, x2, y2]
                        })
        
        return detections
    except Exception as e:
        print(f"Error in object detection: {e}")
        return []

@app.route('/api/verify-bicycle', methods=['POST'])
def verify_bicycle():
    """Verify bicycle in uploaded image"""
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode image
        image = decode_image(image_data)
        if image is None:
            return jsonify({'error': 'Failed to decode image'}), 400
        
        # Detect bicycles
        detections = detect_objects(image, [1], confidence_threshold=0.4)  # Class 1 = bicycle
        
        if detections:
            best_detection = max(detections, key=lambda x: x['confidence'])
            return jsonify({
                'detected': True,
                'confidence': best_detection['confidence'],
                'object': 'bicycle',
                'details': best_detection,
                'count': len(detections)
            })
        else:
            return jsonify({
                'detected': False,
                'confidence': 0.0,
                'object': None,
                'message': 'No bicycle detected in image'
            })
            
    except Exception as e:
        print(f"Error in bicycle verification: {e}")
        return jsonify({'error': 'Verification failed'}), 500

@app.route('/api/verify-recyclables', methods=['POST'])
def verify_recyclables():
    """Verify recyclable items in uploaded image"""
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode image
        image = decode_image(image_data)
        if image is None:
            return jsonify({'error': 'Failed to decode image'}), 400
        
        # Detect recyclables (bottles, cups, electronics)
        recyclable_classes = [39, 41, 67]  # bottle, cup, cell phone
        detections = detect_objects(image, recyclable_classes, confidence_threshold=0.4)
        
        if detections:
            return jsonify({
                'detected': True,
                'items': detections,
                'count': len(detections),
                'message': f'Found {len(detections)} recyclable item(s)'
            })
        else:
            return jsonify({
                'detected': False,
                'items': [],
                'count': 0,
                'message': 'No recyclable items detected'
            })
            
    except Exception as e:
        print(f"Error in recyclables verification: {e}")
        return jsonify({'error': 'Verification failed'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': 'YOLOv8n',
        'available_endpoints': ['/api/verify-bicycle', '/api/verify-recyclables']
    })

@app.route('/', methods=['GET'])
def index():
    """Root endpoint with API info"""
    return jsonify({
        'name': 'CoralCollective YOLOv8 Detection Server',
        'version': '1.0.0',
        'endpoints': {
            '/api/verify-bicycle': 'POST - Detect bicycles in images',
            '/api/verify-recyclables': 'POST - Detect recyclable items',
            '/api/health': 'GET - Health check'
        },
        'usage': {
            'image_format': 'base64 encoded JPEG/PNG',
            'request_body': {'image': 'data:image/jpeg;base64,/9j/4AAQ...'}
        }
    })

if __name__ == '__main__':
    print("🪸 CoralCollective YOLOv8 Detection Server Starting...")
    print("📸 Bicycle detection ready!")
    print("♻️ Recyclables detection ready!")
    print("🌐 Server running on http://localhost:5001")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
