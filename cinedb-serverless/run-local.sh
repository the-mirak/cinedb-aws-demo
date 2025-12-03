#!/bin/bash
# Script to build and run the frontend container locally

# Build the Docker image
echo "Building Docker image..."
docker build -t cinedb-frontend .

# Run the container
echo "Starting container..."
docker run --rm -p 8080:80 cinedb-frontend

# The site will be available at http://localhost:8080 