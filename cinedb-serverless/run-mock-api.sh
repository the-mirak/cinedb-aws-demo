#!/bin/bash
# Script to run the mock API server

cd mock-api

# Check if node_modules exists, if not, install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the setup script if movies.json doesn't exist
if [ ! -f "movies.json" ]; then
  echo "Setting up sample data..."
  npm run setup
fi

# Run the server
echo "Starting mock API server..."
node server.js 