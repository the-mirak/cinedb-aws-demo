#!/bin/bash
# Script to update the API endpoint configuration in the frontend

source api-gateway-config.sh

echo "Updating API endpoint configuration..."
echo "API ID: $API_ID"
echo "Region: $REGION"
echo "API Invoke URL: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

# Update the API endpoint in the frontend
sed -i "s|: 'https://.*\.execute-api\..*\.amazonaws\.com/prod'|: 'https://$API_ID.execute-api.$REGION.amazonaws.com/prod'|g" frontend/static/js/api-client.js

echo "API endpoint configuration updated successfully!"
echo "You can now deploy the frontend to S3 using the deploy-frontend.sh script." 