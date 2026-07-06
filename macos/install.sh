#!/bin/bash
set -e

echo "Setting up Vaultkey (macOS/Linux)..."

echo "1. Installing Frontend Dependencies..."
cd ..
cd frontend
npm install
npm run build
cd ..

echo "2. Setting up Backend Python Environment..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

echo "Done! You can now run start.sh"