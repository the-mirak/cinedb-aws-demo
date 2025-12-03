#!/bin/bash
# Script to enable CORS for API Gateway endpoints
# This script addresses APIGW-03 requirement: Enable CORS for API Gateway

# Configuration
API_ID="u8cf224qu3"
STAGE_NAME="prod"
REGION="us-east-1"
# Set this to your CloudFront distribution domain or use * for development
ALLOWED_ORIGIN="*"

echo "Enabling CORS for CineDB API Gateway (ID: $API_ID)"

# Step 1: Get API resources to identify endpoint IDs
echo "Getting API resources..."
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION)

# Find all resources that have methods (endpoints)
echo "Finding endpoints to enable CORS..."
RESOURCE_IDS=$(echo $RESOURCES | jq -r '.items[] | .id')

# Loop through each resource and enable CORS
for RESOURCE_ID in $RESOURCE_IDS; do
  RESOURCE=$(echo $RESOURCES | jq -r ".items[] | select(.id == \"$RESOURCE_ID\")")
  RESOURCE_PATH=$(echo $RESOURCE | jq -r '.path')
  METHODS=$(echo $RESOURCE | jq -r '.resourceMethods | keys[]' 2>/dev/null)
  
  if [ -z "$METHODS" ]; then
    echo "Skipping resource $RESOURCE_PATH (no methods)"
    continue
  fi
  
  echo "Configuring CORS for resource: $RESOURCE_PATH"
  
  # Step 2: Add OPTIONS method for preflight requests if it doesn't exist
  if [[ ! "$METHODS" =~ "OPTIONS" ]]; then
    echo "  Adding OPTIONS method..."
    aws apigateway put-method \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method OPTIONS \
      --authorization-type NONE \
      --region $REGION || echo "  Failed to add OPTIONS method (may already exist)"
    
    # Configure OPTIONS integration
    echo "  Configuring OPTIONS integration..."
    aws apigateway put-integration \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method OPTIONS \
      --type MOCK \
      --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
      --region $REGION || echo "  Failed to configure OPTIONS integration (may already exist)"
    
    # Configure OPTIONS method response
    echo "  Setting up OPTIONS method response..."
    aws apigateway put-method-response \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method OPTIONS \
      --status-code 200 \
      --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}' \
      --region $REGION || echo "  Failed to add OPTIONS method response (may already exist)"
    
    # Configure OPTIONS integration response
    echo "  Setting up OPTIONS integration response..."
    aws apigateway put-integration-response \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method OPTIONS \
      --status-code 200 \
      --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key'\"}" \
      --region $REGION || echo "  Failed to add OPTIONS integration response (may already exist)"
    
    # Update the integration response with additional headers
    echo "  Adding CORS headers to OPTIONS integration response..."
    aws apigateway update-integration-response \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method OPTIONS \
      --status-code 200 \
      --patch-operations "op=add,path=/responseParameters/method.response.header.Access-Control-Allow-Methods,value='\"GET,POST,PUT,DELETE,OPTIONS\"'" \
      --region $REGION || echo "  Failed to add Allow-Methods header (may already exist)"
    
    aws apigateway update-integration-response \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method OPTIONS \
      --status-code 200 \
      --patch-operations "op=add,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value='\"$ALLOWED_ORIGIN\"'" \
      --region $REGION || echo "  Failed to add Allow-Origin header (may already exist)"
  else
    echo "  OPTIONS method already exists."
  fi
  
  # Step 3: Add CORS headers to all non-OPTIONS method responses
  for METHOD in $METHODS; do
    if [ "$METHOD" != "OPTIONS" ]; then
      echo "  Adding CORS headers to $METHOD method..."
      
      # Ensure method response includes CORS headers
      aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $METHOD \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false}' \
        --region $REGION || echo "  Failed to update method response (may already exist)"
      
      # Update integration response for each method to include CORS headers
      aws apigateway update-integration-response \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $METHOD \
        --status-code 200 \
        --patch-operations "op=add,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value='\"$ALLOWED_ORIGIN\"'" \
        --region $REGION || echo "  Failed to add CORS header (may already exist)"
    fi
  done
done

# Step 4: Deploy changes to the API
echo "Deploying API with CORS configuration..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name $STAGE_NAME \
  --region $REGION

echo "CORS configuration complete!"
echo "API Gateway endpoints now have CORS enabled with:"
echo "- Access-Control-Allow-Origin: $ALLOWED_ORIGIN"
echo "- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"
echo "- Access-Control-Allow-Headers: Content-Type, X-Amz-Date, Authorization, X-Api-Key"
echo "- OPTIONS method for preflight requests on all resources"

echo "Done." 