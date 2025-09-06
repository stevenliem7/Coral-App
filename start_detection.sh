#!/bin/bash

echo "🪸 Starting CoralCollective YOLOv8 Detection Server..."
echo "=================================================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.7 or higher."
    exit 1
fi

# Check if requirements are installed
if ! python3 -c "import flask, ultralytics" &> /dev/null; then
    echo "📦 Installing dependencies..."
    python3 setup_yolo.py
fi

echo "🚀 Starting detection server on http://localhost:5000"
echo "📸 Bicycle detection ready!"
echo "♻️ Recyclables detection ready!"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================="

python3 yolo_detection_server.py
