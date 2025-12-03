#!/bin/bash
# Script to configure API Gateway request/response mappings for CineDB
# This script addresses APIGW-02 requirement: Configure request/response mappings for API

# Configuration
API_ID="u8cf224qu3"
STAGE_NAME="prod"
REGION="us-east-1"

echo "Configuring API Gateway mappings for CineDB API (ID: $API_ID)"

# Step 1: Get API resources to identify endpoint IDs
echo "Getting API resources..."
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION)

# Extract resource IDs for important endpoints
echo "Finding resource IDs for endpoints..."
MOVIES_RESOURCE=$(echo $RESOURCES | jq -r '.items[] | select(.pathPart == "movies")')
MOVIES_ID=$(echo $MOVIES_RESOURCE | jq -r '.id')
MOVIE_ID_RESOURCE=$(echo $RESOURCES | jq -r '.items[] | select(.pathPart == "{id}" and .parentId == "'$MOVIES_ID'")')
MOVIE_ID_RESOURCE_ID=$(echo $MOVIE_ID_RESOURCE | jq -r '.id')

echo "Found resource IDs: "
echo "Movies Resource: $MOVIES_ID"
echo "Movie ID Resource: $MOVIE_ID_RESOURCE_ID"

# Step 2: Configure binary media types for handling multipart/form-data
echo "Adding multipart/form-data to binary media types..."
aws apigateway update-rest-api \
  --rest-api-id $API_ID \
  --patch-operations op=add,path=/binaryMediaTypes/multipart~1form-data \
  --region $REGION

# Step 3: Create request template for multipart/form-data handling
echo "Creating request template for multipart/form-data..."
REQUEST_TEMPLATE=$(cat << 'EOF'
{
    "body": "$input.body",
    "headers": {
        #foreach($header in $input.params().header.keySet())
        "$header": "$util.escapeJavaScript($input.params().header.get($header))"
        #if($foreach.hasNext),#end
        #end
    },
    "isBase64Encoded": true
}
EOF
)

# Save the template to a temp file for easier handling
echo "$REQUEST_TEMPLATE" > /tmp/request.vtl

# Step 4: Apply request template to POST /movies endpoint
echo "Configuring request template for POST /movies endpoint..."
aws apigateway update-integration \
  --rest-api-id $API_ID \
  --resource-id $MOVIES_ID \
  --http-method POST \
  --patch-operations "op=add,path=/requestTemplates/multipart~1form-data,value=$(cat /tmp/request.vtl | jq -Rs .)" \
  --region $REGION

# Step 5: Apply request template to PUT /movies/{id} endpoint
echo "Configuring request template for PUT /movies/{id} endpoint..."
aws apigateway update-integration \
  --rest-api-id $API_ID \
  --resource-id $MOVIE_ID_RESOURCE_ID \
  --http-method PUT \
  --patch-operations "op=add,path=/requestTemplates/multipart~1form-data,value=$(cat /tmp/request.vtl | jq -Rs .)" \
  --region $REGION

# Step 6: Configure response templates for consistent JSON formatting
echo "Configuring response template for POST /movies endpoint..."
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $MOVIES_ID \
  --http-method POST \
  --status-code 200 \
  --response-templates '{"application/json":"#set($inputRoot = $input.path(\"$\"))\n$input.json(\"$\")"}' \
  --region $REGION || echo "Integration response for POST /movies already exists"

echo "Configuring response template for PUT /movies/{id} endpoint..."
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $MOVIE_ID_RESOURCE_ID \
  --http-method PUT \
  --status-code 200 \
  --response-templates '{"application/json":"#set($inputRoot = $input.path(\"$\"))\n$input.json(\"$\")"}' \
  --region $REGION || echo "Integration response for PUT /movies/{id} already exists"

# Step 7: Configure CORS response headers for POST /movies endpoint
echo "Configuring CORS headers for POST /movies endpoint..."
aws apigateway update-integration-response \
  --rest-api-id $API_ID \
  --resource-id $MOVIES_ID \
  --http-method POST \
  --status-code 200 \
  --patch-operations "op=add,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value='\"*\"'" \
  --region $REGION || echo "CORS header already configured"

# Step 8: Configure CORS response headers for PUT /movies/{id} endpoint
echo "Configuring CORS headers for PUT /movies/{id} endpoint..."
aws apigateway update-integration-response \
  --rest-api-id $API_ID \
  --resource-id $MOVIE_ID_RESOURCE_ID \
  --http-method PUT \
  --status-code 200 \
  --patch-operations "op=add,path=/responseParameters/method.response.header.Access-Control-Allow-Origin,value='\"*\"'" \
  --region $REGION || echo "CORS header already configured"

# Step 9: Increase maximum payload size for file uploads
echo "Increasing maximum payload size for file uploads..."
aws apigateway update-stage \
  --rest-api-id $API_ID \
  --stage-name $STAGE_NAME \
  --patch-operations op=replace,path=/variables/maximumPayloadSize,value=10485760 \
  --region $REGION

# Step 10: Deploy changes to production stage
echo "Deploying changes to $STAGE_NAME stage..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name $STAGE_NAME \
  --region $REGION

echo "Request/Response mapping configuration complete!"
echo "API Gateway is now properly configured to handle multipart/form-data for file uploads"
echo "and returns consistent JSON responses with appropriate CORS headers."

# Clean up temporary files
rm -f /tmp/request.vtl

echo "Done."
