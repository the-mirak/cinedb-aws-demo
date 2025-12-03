#!/bin/bash
# Script to deploy the frontend to S3

# Configuration
S3_BUCKET=${1:-"your-s3-bucket-name"}  # First argument or default value
REGION=${2:-"us-west-2"}                # Second argument or default region

echo "Deploying frontend to S3 bucket: $S3_BUCKET in region: $REGION"

# Validate bucket name
if [ "$S3_BUCKET" == "your-s3-bucket-name" ]; then
    echo "Please provide a valid S3 bucket name as the first argument."
    echo "Usage: $0 <bucket-name> [region]"
    exit 1
fi

# Make sure AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Deploy files to S3
echo "Uploading files to S3..."
aws s3 sync frontend/ s3://$S3_BUCKET/ --region $REGION --delete

# Set website configuration
echo "Configuring S3 bucket for static website hosting..."
aws s3 website s3://$S3_BUCKET \
    --index-document index.html \
    --error-document error.html \
    --region $REGION

echo "Deployment complete! Your website is now available at:"
echo "http://$S3_BUCKET.s3-website.$REGION.amazonaws.com/"

echo "Note: For production use, you should set up CloudFront in front of this S3 bucket." 