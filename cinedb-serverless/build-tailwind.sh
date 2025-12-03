#!/bin/bash
# Script to build Tailwind CSS for development

cd frontend

# Check if node_modules exists, if not, install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build Tailwind CSS
echo "Building Tailwind CSS..."
npm run build:css

echo "Tailwind CSS built successfully!" 