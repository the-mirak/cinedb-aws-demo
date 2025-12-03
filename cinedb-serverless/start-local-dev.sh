#!/bin/bash
# Script to run both the frontend and mock API for local development

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is required for the mock API server but not installed."
    echo "Please install Node.js and try again."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is required for the frontend container but not installed."
    echo "Please install Docker and try again."
    exit 1
fi

# Make sure scripts are executable
chmod +x run-local.sh
chmod +x run-mock-api.sh

# Start the mock API server in the background
echo "Starting mock API server..."
./run-mock-api.sh &
mock_api_pid=$!

# Give the API server a moment to start
echo "Waiting for mock API server to start..."
sleep 3

# Build and start the frontend container
echo "Starting frontend container..."
./run-local.sh

# Clean up when the user presses Ctrl+C
trap "echo 'Shutting down...'; kill $mock_api_pid; exit 0" INT TERM
wait 