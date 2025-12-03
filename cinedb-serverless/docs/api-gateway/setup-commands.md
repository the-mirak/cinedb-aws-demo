# API Gateway Setup Commands

This document contains all the commands used to set up the CineDB API Gateway.

## ⚠️ IMPORTANT: Integration Type Warning

**CRITICAL**: Always use `AWS_PROXY` integration type for Lambda functions, NOT `AWS` integration type.

### Why AWS_PROXY is Required:
- **Standard Event Format**: Lambda receives the standard API Gateway proxy event
- **Direct CORS Control**: Lambda function handles CORS headers directly
- **No Custom Templates**: Eliminates complex request/response mapping
- **Error Transparency**: Errors pass through without transformation

### What Happens with AWS Integration (❌ Wrong):
- Custom request templates wrap the data in additional JSON structure
- Lambda receives malformed, double-encoded JSON
- Results in JSON parsing errors and 500 Internal Server Errors
- CORS headers may not be properly returned

### Commands in this file show:
- ❌ **Commented problematic commands** (for learning purposes)
- ✅ **Correct commands** to use for deployment

## Initial API Gateway Creation

```bash
# Create the REST API
aws apigateway create-rest-api --name "CineDB-API" --description "CineDB Serverless API" --region us-east-1

# Save API and resource IDs
export API_ID=u8cf224qu3
export ROOT_RESOURCE_ID=ubtwnb69p9
export REGION=us-east-1
```

## Creating Resources

```bash
# Create /movies resource
aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_RESOURCE_ID --path-part "movies" --region $REGION
export MOVIES_RESOURCE_ID=w9krmo

# Create /movies/{id} resource
aws apigateway create-resource --rest-api-id $API_ID --parent-id $MOVIES_RESOURCE_ID --path-part "{id}" --region $REGION
export MOVIE_ID_RESOURCE_ID=b3fgli

# Create /presigned resource
aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_RESOURCE_ID --path-part "presigned" --region $REGION
export PRESIGNED_RESOURCE_ID=73c8cs

# Create /presigned/{key} resource
aws apigateway create-resource --rest-api-id $API_ID --parent-id $PRESIGNED_RESOURCE_ID --path-part "{key}" --region $REGION
export PRESIGNED_KEY_RESOURCE_ID=6r9lou
```

## IAM Role Permissions Setup

Before setting up the Lambda integrations, it's crucial to ensure that your Lambda functions have the necessary permissions to access DynamoDB and S3.

```bash
# Create a policy file with all necessary permissions
cat > lambda-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:DescribeTable"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:472443946497:table/cinedb"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::cinedb-bucket-2025",
                "arn:aws:s3:::cinedb-bucket-2025/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:us-east-1:*:*"
        }
    ]
}
EOF

# NOTE: In this project, Lambda functions may use different IAM roles.
# Make sure to check which roles your Lambda functions are using and apply the policy to all of them.
# Common role names might include: lambda-dynamodb-s3-role, cinedb-lambda-role, etc.

# Attach the policy to the Lambda execution roles
aws iam put-role-policy --role-name lambda-dynamodb-s3-role --policy-name DynamoDBAndS3FullAccess --policy-document file://lambda-policy.json
aws iam put-role-policy --role-name cinedb-lambda-role --policy-name DynamoDBAndS3FullAccess --policy-document file://lambda-policy.json

# For additional assurance, you can also attach AWS managed policies
aws iam attach-role-policy --role-name lambda-dynamodb-s3-role --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam attach-role-policy --role-name cinedb-lambda-role --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Update the Lambda function configurations to refresh IAM permissions
aws lambda update-function-configuration --function-name get-all-movies --description "Updated to refresh IAM permissions" --region us-east-1
aws lambda update-function-configuration --function-name get-movie-by-id --description "Updated to refresh IAM permissions" --region us-east-1
aws lambda update-function-configuration --function-name add-movie --description "Updated to refresh IAM permissions" --region us-east-1
aws lambda update-function-configuration --function-name update-movie --description "Updated to refresh IAM permissions" --region us-east-1
aws lambda update-function-configuration --function-name delete-movie --description "Updated to refresh IAM permissions" --region us-east-1
aws lambda update-function-configuration --function-name generate-presigned-url --description "Updated to refresh IAM permissions" --region us-east-1
```

## Setting up GET /movies (List all movies)

```bash
# Create GET method
aws apigateway put-method --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method GET --authorization-type NONE --region $REGION

# Create integration with Lambda
aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$GET_ALL_MOVIES_ARN/invocations --region $REGION

# Add Lambda permission
aws lambda add-permission --function-name get-all-movies --statement-id apigateway-get-all-movies --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/GET/movies" --region $REGION
```

## Setting up POST /movies (Add a movie)

```bash
# Create POST method
aws apigateway put-method --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method POST --authorization-type NONE --region $REGION

# ❌ PROBLEMATIC COMMAND - DO NOT USE (causes CORS and 500 errors)
# This creates AWS integration with custom templates that wrap the request data
# aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method POST --type AWS --integration-http-method POST --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$ADD_MOVIE_ARN/invocations --request-templates '{"application/json":"{\"httpMethod\":\"$context.httpMethod\",\"body\":\"$input.body\",\"headers\":{#foreach($header in $input.params().header.keySet())\"$header\":\"$util.escapeJavaScript($input.params().header.get($header))\"#if($foreach.hasNext),#end#end}}","multipart/form-data":"{\"body\":\"$input.body\",\"headers\":{#foreach($header in $input.params().header.keySet())\"$header\":\"$util.escapeJavaScript($input.params().header.get($header))\"#if($foreach.hasNext),#end#end},\"isBase64Encoded\":true}"}' --region $REGION

# ✅ CORRECT COMMAND - Use AWS_PROXY integration (standard format)
aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method POST --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$ADD_MOVIE_ARN/invocations --region $REGION

# Add Lambda permission
aws lambda add-permission --function-name add-movie --statement-id apigateway-add-movie --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/POST/movies" --region $REGION
```

## Setting up GET /movies/{id} (Get movie by ID)

```bash
# Create GET method
aws apigateway put-method --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method GET --authorization-type NONE --region $REGION

# Create integration with Lambda
aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$GET_MOVIE_BY_ID_ARN/invocations --region $REGION

# Add Lambda permission
aws lambda add-permission --function-name get-movie-by-id --statement-id apigateway-get-movie-by-id --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/GET/movies/*" --region $REGION
```

## Setting up PUT /movies/{id} (Update movie)

```bash
# Create PUT method
aws apigateway put-method --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method PUT --authorization-type NONE --region $REGION

# ❌ PROBLEMATIC COMMAND - DO NOT USE (causes CORS and 500 errors)
# This creates AWS integration with custom templates that wrap the request data
# aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method PUT --type AWS --integration-http-method POST --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$UPDATE_MOVIE_ARN/invocations --request-templates '{"application/json":"{\"httpMethod\":\"$context.httpMethod\",\"body\":\"$input.body\",\"headers\":{#foreach($header in $input.params().header.keySet())\"$header\":\"$util.escapeJavaScript($input.params().header.get($header))\"#if($foreach.hasNext),#end#end}}","multipart/form-data":"{\"body\":\"$input.body\",\"headers\":{#foreach($header in $input.params().header.keySet())\"$header\":\"$util.escapeJavaScript($input.params().header.get($header))\"#if($foreach.hasNext),#end#end},\"isBase64Encoded\":true}"}' --region $REGION

# ✅ CORRECT COMMAND - Use AWS_PROXY integration (standard format)
aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method PUT --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$UPDATE_MOVIE_ARN/invocations --region $REGION

# Add Lambda permission
aws lambda add-permission --function-name update-movie --statement-id apigateway-update-movie --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/PUT/movies/*" --region $REGION
```

## Setting up DELETE /movies/{id} (Delete movie)

```bash
# Create DELETE method
aws apigateway put-method --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method DELETE --authorization-type NONE --region $REGION

# Create integration with Lambda
aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method DELETE --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$DELETE_MOVIE_ARN/invocations --region $REGION

# Add Lambda permission
aws lambda add-permission --function-name delete-movie --statement-id apigateway-delete-movie --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/DELETE/movies/*" --region $REGION
```

## Setting up GET /presigned/{key} (Generate presigned URL)

```bash
# Create GET method
aws apigateway put-method --rest-api-id $API_ID --resource-id $PRESIGNED_KEY_RESOURCE_ID --http-method GET --authorization-type NONE --region $REGION

# Create integration with Lambda
aws apigateway put-integration --rest-api-id $API_ID --resource-id $PRESIGNED_KEY_RESOURCE_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$GENERATE_PRESIGNED_URL_ARN/invocations --region $REGION

# Add Lambda permission
aws lambda add-permission --function-name generate-presigned-url --statement-id apigateway-generate-presigned-url --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/GET/presigned/*" --region $REGION
```

## CORS Configuration

### For /movies (CORS)

```bash
# Create OPTIONS method
aws apigateway put-method --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method OPTIONS --authorization-type NONE --region $REGION

# Create mock integration
aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}' --region $REGION

# Create method response
aws apigateway put-method-response --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' --region $REGION

# Create integration response
aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,POST,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''*'\''"}' --region $REGION
```

### For /movies/{id} (CORS)

```bash
# Create OPTIONS method
aws apigateway put-method --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method OPTIONS --authorization-type NONE --region $REGION

# Create mock integration
aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}' --region $REGION

# Create method response
aws apigateway put-method-response --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' --region $REGION

# Create integration response
aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $MOVIE_ID_RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,PUT,DELETE,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''*'\''"}' --region $REGION
```

### For /presigned/{key} (CORS)

```bash
# Create OPTIONS method
aws apigateway put-method --rest-api-id $API_ID --resource-id $PRESIGNED_KEY_RESOURCE_ID --http-method OPTIONS --authorization-type NONE --region $REGION

# Create mock integration
aws apigateway put-integration --rest-api-id $API_ID --resource-id $PRESIGNED_KEY_RESOURCE_ID --http-method OPTIONS --type MOCK --request-templates '{"application/json":"{\"statusCode\": 200}"}' --region $REGION

# Create method response
aws apigateway put-method-response --rest-api-id $API_ID --resource-id $PRESIGNED_KEY_RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":true,"method.response.header.Access-Control-Allow-Methods":true,"method.response.header.Access-Control-Allow-Origin":true}' --region $REGION

# Create integration response
aws apigateway put-integration-response --rest-api-id $API_ID --resource-id $PRESIGNED_KEY_RESOURCE_ID --http-method OPTIONS --status-code 200 --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''","method.response.header.Access-Control-Allow-Methods":"'\''GET,OPTIONS'\''","method.response.header.Access-Control-Allow-Origin":"'\''*'\''"}' --region $REGION
```

## Deployment

```bash
# Deploy the API to a stage
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod --description "Production deployment" --region $REGION

# Get the API invoke URL
echo "API Invoke URL: https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
```

## Troubleshooting: Fixing Existing AWS Integration Issues

If you already have an API Gateway with `AWS` integration type that's causing issues, use these commands to fix it:

### 1. Identify the Problem
```bash
# Check current integration type for POST /movies
aws apigateway get-integration \
  --rest-api-id $API_ID \
  --resource-id $MOVIES_RESOURCE_ID \
  --http-method POST \
  --region $REGION | grep '"type"'

# If output shows "type": "AWS", you need to fix it
```

### 2. Fix POST /movies Integration
```bash
# Update POST /movies to use AWS_PROXY (replace with your actual ARN)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $MOVIES_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:add-movie/invocations" \
  --region $REGION
```

### 3. Fix PUT /movies/{id} Integration
```bash
# Check PUT method integration type
aws apigateway get-integration \
  --rest-api-id $API_ID \
  --resource-id $MOVIE_ID_RESOURCE_ID \
  --http-method PUT \
  --region $REGION | grep '"type"'

# Update PUT /movies/{id} to use AWS_PROXY (replace with your actual ARN)
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $MOVIE_ID_RESOURCE_ID \
  --http-method PUT \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:$ACCOUNT_ID:function:update-movie/invocations" \
  --region $REGION
```

### 4. Deploy Changes
```bash
# Deploy the fixes
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --description "Fixed AWS_PROXY integration for POST and PUT methods" \
  --region $REGION
```

### 5. Verify the Fix
```bash
# Test CORS preflight
curl -X OPTIONS "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/movies" \
  -H "Origin: https://your-frontend-domain.com" \
  -v

# Test POST request
curl -X POST "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/movies" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Movie", "year": 2024}' \
  | jq .
```

## Environment Variables for ARNs

Set these environment variables before running the commands:

```bash
export API_ID=u8cf224qu3
export ROOT_RESOURCE_ID=ubtwnb69p9
export MOVIES_RESOURCE_ID=w9krmo
export MOVIE_ID_RESOURCE_ID=b3fgli
export PRESIGNED_RESOURCE_ID=73c8cs
export PRESIGNED_KEY_RESOURCE_ID=6r9lou
export REGION=us-east-1
export ACCOUNT_ID=472443946497

# Lambda function ARNs
export GET_ALL_MOVIES_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:get-all-movies"
export GET_MOVIE_BY_ID_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:get-movie-by-id"
export ADD_MOVIE_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:add-movie"
export UPDATE_MOVIE_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:update-movie"
export DELETE_MOVIE_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:delete-movie"
export GENERATE_PRESIGNED_URL_ARN="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:generate-presigned-url"
``` 