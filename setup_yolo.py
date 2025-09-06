#!/usr/bin/env python3
"""
Setup script for CoralCollective YOLOv8 Detection
Installs dependencies and tests the YOLOv8 model
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a shell command with error handling"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("🪸 CoralCollective YOLOv8 Setup")
    print("=" * 50)
    
    # Check if Python 3 is available
    if sys.version_info[0] < 3:
        print("❌ Python 3 is required. Please install Python 3.7 or higher.")
        return False
    
    print(f"✅ Python {sys.version} detected")
    
    # Install pip if not available
    try:
        import pip
        print("✅ pip is available")
    except ImportError:
        print("📦 Installing pip...")
        if not run_command("python3 -m ensurepip --default-pip", "Installing pip"):
            return False
    
    # Install requirements
    if not run_command("pip3 install -r requirements.txt", "Installing Python dependencies"):
        print("⚠️  If installation fails, try:")
        print("   pip3 install --user -r requirements.txt")
        return False
    
    # Test YOLOv8 import and model download
    print("🤖 Testing YOLOv8 model...")
    try:
        from ultralytics import YOLO
        model = YOLO('yolov8n.pt')  # This will download the model if needed
        print("✅ YOLOv8 model loaded successfully!")
        
        # Test with a simple detection
        import numpy as np
        test_image = np.zeros((640, 640, 3), dtype=np.uint8)  # Black test image
        results = model(test_image, verbose=False)
        print("✅ YOLOv8 detection test passed!")
        
    except Exception as e:
        print(f"❌ YOLOv8 test failed: {e}")
        return False
    
    print("\n🎉 Setup completed successfully!")
    print("\n🚀 To start the detection server:")
    print("   python3 yolo_detection_server.py")
    print("\n📱 Then open your CoralCollective app and test bike verification!")
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        sys.exit(1)
