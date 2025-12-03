#!/bin/bash
set -e

# Source the API Gateway configuration
source "$(dirname "$0")/api-gateway-config.sh"

echo "========================================"
echo "  Applying Cognito Authorization       "
echo "========================================"
echo ""

# Get the Cognito Authorizer ID from CloudFormation
AUTHORIZER_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoAuthorizerId`].OutputValue' \
  --output text \
  --region $REGION)

if [ -z "$AUTHORIZER_ID" ]; then
    echo "❌ Error: Could not retrieve Cognito Authorizer ID from CloudFormation stack"
    echo "Make sure the cinedb-cognito-stack is deployed"
    exit 1
fi

echo "Using Cognito Authorizer ID: $AUTHORIZER_ID"
echo ""
echo "Applying Cognito authorizer to protected endpoints..."
echo ""

# POST /movies (add movie)
echo "1. Protecting POST /movies..."
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $MOVIES_RESOURCE_ID \
  --http-method POST \
  --patch-operations \
    op=replace,path=/authorizationType,value=COGNITO_USER_POOLS \
    op=replace,path=/authorizerId,value=$AUTHORIZER_ID \
  --region $REGION
echo "   ✅ POST /movies protected"

# PUT /movies/{id} (update movie)
echo "2. Protecting PUT /movies/{id}..."
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $MOVIE_ID_RESOURCE_ID \
  --http-method PUT \
  --patch-operations \
    op=replace,path=/authorizationType,value=COGNITO_USER_POOLS \
    op=replace,path=/authorizerId,value=$AUTHORIZER_ID \
  --region $REGION
echo "   ✅ PUT /movies/{id} protected"

# DELETE /movies/{id} (delete movie)
echo "3. Protecting DELETE /movies/{id}..."
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $MOVIE_ID_RESOURCE_ID \
  --http-method DELETE \
  --patch-operations \
    op=replace,path=/authorizationType,value=COGNITO_USER_POOLS \
    op=replace,path=/authorizerId,value=$AUTHORIZER_ID \
  --region $REGION
echo "   ✅ DELETE /movies/{id} protected"

echo ""
echo "Creating new API Gateway deployment..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION \
  --description "Applied Cognito authorization to write operations"

echo ""
echo "========================================"
echo "  ✅ Cognito Authorization Applied      "
echo "========================================"
echo ""
echo "Protected endpoints:"
echo "  - POST /movies"
echo "  - PUT /movies/{id}"
echo "  - DELETE /movies/{id}"
echo ""
echo "Unprotected endpoints (read-only):"
echo "  - GET /movies"
echo "  - GET /movies/{id}"
echo ""
echo "Authorization will be enforced on the next API call."
echo "========================================"

