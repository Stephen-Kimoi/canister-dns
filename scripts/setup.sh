#!/bin/bash

# Exit on error
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Starting initial project setup..."

# Start dfx in clean mode
echo "📦 Starting dfx in clean mode..."
dfx start --clean --background  

# Verify file exists
if [ ! -f "$ASSET_STORAGE_PATH" ]; then
    echo "Error: Failed to create $ASSET_STORAGE_PATH"
    exit 1
fi
echo "✅ Asset storage file created at $ASSET_STORAGE_PATH"

# Generate backend interface
echo "🔧 Generating backend interface..."
npm install -g canister-tools
npx generate-did backend

# Setup frontend
echo "🎨 Setting up frontend..."
cd src/frontend
npm install
npm run build
cd ../..

# Create asset storage directory and file
echo "📁 Creating asset storage directory and file..."
cd "$PROJECT_ROOT"
ASSET_STORAGE_PATH=".dfx/local/canisters/frontend/assetstorage.did"
mkdir -p "$(dirname "$ASSET_STORAGE_PATH")"
echo "service : {}" > "$ASSET_STORAGE_PATH"

# Deploy all canisters
echo "🚀 Deploying all canisters..."
dfx generate backend
dfx deploy backend
dfx deploy frontend

echo "✅ Setup completed successfully!" 