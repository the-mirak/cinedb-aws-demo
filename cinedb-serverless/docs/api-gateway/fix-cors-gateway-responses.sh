#!/bin/bash
set -e

# Source the API Gateway configuration
source "$(dirname "$0")/api-gateway-config.sh"

echo "========================================"
echo "  Fixing CORS for Gateway Responses    "
echo "========================================"
echo ""

# Add CORS headers to Gateway Responses (error responses)
# This ensures CORS headers are present even when authorization fails

echo "Adding CORS headers to Gateway Responses..."

# 1. Unauthorized (401) - Most important for Cognito auth failures
echo "1. Configuring 401 UNAUTHORIZED response..."
aws apigateway put-gateway-response \
  --rest-api-id $API_ID \
  --response-type UNAUTHORIZED \
  --status-code 401 \
  --response-parameters "{\"gatewayresponse.header.Access-Control-Allow-Origin\":\"'*'\",\"gatewayresponse.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",\"gatewayresponse.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\"}" \
  --region $REGION \
  > /dev/null
echo "   ✅ 401 Unauthorized"

# 2. Access Denied (403)
echo "2. Configuring 403 ACCESS_DENIED response..."
aws apigateway put-gateway-response \
  --rest-api-id $API_ID \
  --response-type ACCESS_DENIED \
  --status-code 403 \
  --response-parameters "{\"gatewayresponse.header.Access-Control-Allow-Origin\":\"'*'\",\"gatewayresponse.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",\"gatewayresponse.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\"}" \
  --region $REGION \
  > /dev/null
echo "   ✅ 403 Access Denied"

# 3. Bad Request (400)
echo "3. Configuring 400 BAD_REQUEST_BODY response..."
aws apigateway put-gateway-response \
  --rest-api-id $API_ID \
  --response-type BAD_REQUEST_BODY \
  --status-code 400 \
  --response-parameters "{\"gatewayresponse.header.Access-Control-Allow-Origin\":\"'*'\",\"gatewayresponse.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",\"gatewayresponse.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\"}" \
  --region $REGION \
  > /dev/null
echo "   ✅ 400 Bad Request Body"

# 4. Expired Token (403)
echo "4. Configuring EXPIRED_TOKEN response..."
aws apigateway put-gateway-response \
  --rest-api-id $API_ID \
  --response-type EXPIRED_TOKEN \
  --status-code 403 \
  --response-parameters "{\"gatewayresponse.header.Access-Control-Allow-Origin\":\"'*'\",\"gatewayresponse.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",\"gatewayresponse.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\"}" \
  --region $REGION \
  > /dev/null
echo "   ✅ Expired Token"

# 5. Invalid Signature (403)
echo "5. Configuring INVALID_SIGNATURE response..."
aws apigateway put-gateway-response \
  --rest-api-id $API_ID \
  --response-type INVALID_SIGNATURE \
  --status-code 403 \
  --response-parameters "{\"gatewayresponse.header.Access-Control-Allow-Origin\":\"'*'\",\"gatewayresponse.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",\"gatewayresponse.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\"}" \
  --region $REGION \
  > /dev/null
echo "   ✅ Invalid Signature"

# 6. Missing Authentication Token (403)
echo "6. Configuring MISSING_AUTHENTICATION_TOKEN response..."
aws apigateway put-gateway-response \
  --rest-api-id $API_ID \
  --response-type MISSING_AUTHENTICATION_TOKEN \
  --status-code 403 \
  --response-parameters "{\"gatewayresponse.header.Access-Control-Allow-Origin\":\"'*'\",\"gatewayresponse.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",\"gatewayresponse.header.Access-Control-Allow-Methods\":\"'GET,POST,PUT,DELETE,OPTIONS'\"}" \
  --region $REGION \
  > /dev/null
echo "   ✅ Missing Authentication Token"

echo ""
echo "Creating new API Gateway deployment..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION \
  --description "Fixed CORS headers for gateway error responses" \
  > /dev/null

echo ""
echo "========================================"
echo "  ✅ CORS Headers Fixed                 "
echo "========================================"
echo ""
echo "Gateway responses now include CORS headers:"
echo "  - 401 Unauthorized"
echo "  - 403 Access Denied"
echo "  - 403 Expired Token"
echo "  - 403 Invalid Signature"
echo "  - 403 Missing Authentication Token"
echo "  - 400 Bad Request Body"
echo ""
echo "CORS errors should now be resolved!"
echo "The 401/403 errors will still occur if not authenticated,"
echo "but the browser will now show the proper error messages."
echo "========================================"
