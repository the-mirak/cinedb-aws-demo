# Generate Presigned URL Lambda Function

This Lambda function generates presigned URLs for S3 objects, allowing secure, temporary access to poster images.

## Functionality

- Accepts a poster key or full S3 URL as input
- Parses the key from a full URL if provided
- Supports configurable expiration time (default: 1 hour)
- Generates a presigned URL with proper expiration
- Returns the URL for client access with appropriate CORS headers
- Handles various input scenarios (path parameters, query parameters, direct invocation)
- Provides appropriate error responses

## Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- S3 bucket for poster image storage

### Environment Variables

The Lambda function requires the following environment variables:

- `S3_BUCKET`: Name of the S3 bucket for poster storage (default: 'cinedb-bucket-2025')
- `AWS_REGION`: AWS region (default: 'us-east-1')
- `DEFAULT_EXPIRATION`: Default URL expiration time in seconds (default: '3600')

### IAM Role Setup

Before deploying the Lambda function, you need to create an IAM role with the proper permissions and trust relationship (or reuse an existing role with these permissions):

1. Create a trust policy file:

```bash
cat > lambda-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
```

2. Create the IAM role with the trust policy:

```bash
aws iam create-role \
  --role-name lambda-s3-access-role \
  --assume-role-policy-document file://lambda-trust-policy.json
```

3. Attach the required permissions:

```bash
# Basic Lambda execution permissions (for CloudWatch logs)
aws iam attach-role-policy \
  --role-name lambda-s3-access-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for S3 access
cat > lambda-permissions-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject"
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

# Attach the custom policy
aws iam put-role-policy \
  --role-name lambda-s3-access-role \
  --policy-name S3Access \
  --policy-document file://lambda-permissions-policy.json
```

### Deployment Steps

1. Create a deployment package:

```bash
# Navigate to the function directory
cd cinedb-serverless/backend/lambda_functions/generate_presigned_url

# Create a deployment package
zip -r function.zip lambda_function.py
```

2. Create the Lambda function:

```bash
aws lambda create-function \
  --function-name generate-presigned-url \
  --runtime python3.9 \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::472443946497:role/lambda-s3-access-role \
  --environment Variables="{S3_BUCKET=cinedb-bucket-2025,DEFAULT_EXPIRATION=3600}" \
  --timeout 10 \
  --memory-size 128 \
  --region us-east-1
```

3. Update an existing function:

```bash
aws lambda update-function-code \
  --function-name generate-presigned-url \
  --zip-file fileb://function.zip \
  --region us-east-1
```

## Direct Lambda Testing

You can test the Lambda function directly using the AWS CLI without setting up an API Gateway:

### Testing with Path Parameters

```bash
# Create a test event JSON file
cat > test-event.json << EOF
{
  "pathParameters": {
    "key": "CelestialNomads.png"
  }
}
EOF

# Invoke the Lambda function
aws lambda invoke \
  --function-name generate-presigned-url \
  --payload file://test-event.json \
  --cli-binary-format raw-in-base64-out \
  response.json

# View the response
cat response.json
```

### Testing with Query Parameters

```bash
# Create a test event JSON file
cat > test-event.json << EOF
{
  "queryStringParameters": {
    "key": "CelestialNomads.png",
    "expiration": "7200"
  }
}
EOF

# Invoke the Lambda function
aws lambda invoke \
  --function-name generate-presigned-url \
  --payload file://test-event.json \
  --cli-binary-format raw-in-base64-out \
  response.json

# View the response
cat response.json
```

### Testing with Request Body

```bash
# Create a test event JSON file
cat > test-event.json << EOF
{
  "body": {
    "key": "CelestialNomads.png",
    "expiration": 7200
  }
}
EOF

# Invoke the Lambda function
aws lambda invoke \
  --function-name generate-presigned-url \
  --payload file://test-event.json \
  --cli-binary-format raw-in-base64-out \
  response.json

# View the response
cat response.json
```

### Testing with a Full URL

```bash
# Create a test event JSON file
cat > test-event.json << EOF
{
  "queryStringParameters": {
    "key": "https://cinedb-bucket-2025.s3.amazonaws.com/CelestialNomads.png"
  }
}
EOF

# Invoke the Lambda function
aws lambda invoke \
  --function-name generate-presigned-url \
  --payload file://test-event.json \
  --cli-binary-format raw-in-base64-out \
  response.json

# View the response
cat response.json
```

## API Gateway Integration

### HTTP API (Recommended)

1. Create a HTTP API (if not already created):

```bash
aws apigatewayv2 create-api \
  --name cinedb-api \
  --protocol-type HTTP \
  --region us-east-1
```

2. Create a route for the generate-presigned-url function:

```bash
aws apigatewayv2 create-route \
  --api-id <API_ID> \
  --route-key "GET /presigned/{key}" \
  --region us-east-1
```

3. Create an integration:

```bash
aws apigatewayv2 create-integration \
  --api-id <API_ID> \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:generate-presigned-url \
  --payload-format-version 2.0 \
  --region us-east-1
```

4. Attach the integration to the route:

```bash
aws apigatewayv2 update-route \
  --api-id <API_ID> \
  --route-id <ROUTE_ID> \
  --target integrations/<INTEGRATION_ID> \
  --region us-east-1
```

### REST API (Alternative)

1. Create a REST API (if not already created):

```bash
aws apigateway create-rest-api \
  --name cinedb-rest-api \
  --region us-east-1
```

2. Get the parent resource ID:

```bash
aws apigateway get-resources \
  --rest-api-id <REST_API_ID> \
  --region us-east-1
```

3. Create a /presigned resource:

```bash
aws apigateway create-resource \
  --rest-api-id <REST_API_ID> \
  --parent-id <PARENT_RESOURCE_ID> \
  --path-part "presigned" \
  --region us-east-1
```

4. Create a /presigned/{key} resource:

```bash
aws apigateway create-resource \
  --rest-api-id <REST_API_ID> \
  --parent-id <PRESIGNED_RESOURCE_ID> \
  --path-part "{key}" \
  --region us-east-1
```

5. Create a GET method:

```bash
aws apigateway put-method \
  --rest-api-id <REST_API_ID> \
  --resource-id <PRESIGNED_KEY_RESOURCE_ID> \
  --http-method GET \
  --authorization-type NONE \
  --region us-east-1
```

6. Create a lambda integration:

```bash
aws apigateway put-integration \
  --rest-api-id <REST_API_ID> \
  --resource-id <PRESIGNED_KEY_RESOURCE_ID> \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:generate-presigned-url/invocations \
  --region us-east-1
```

7. Deploy the API:

```bash
aws apigateway create-deployment \
  --rest-api-id <REST_API_ID> \
  --stage-name prod \
  --region us-east-1
```

## Testing

Test the Lambda function with the following event payload:

```json
{
  "pathParameters": {
    "key": "CelestialNomads.png"
  }
}
```

Or directly with the API:

```bash
curl -X GET "https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/presigned/CelestialNomads.png"
```

With expiration parameter:

```bash
curl -X GET "https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/presigned/CelestialNomads.png?expiration=7200"
```

## Troubleshooting

### Common Issues

1. **400 - S3 object key is required**: Ensure the key is being properly passed in the request.

2. **403 - Access Denied**: Check that your Lambda role has the proper permissions for S3.

3. **404 - NoSuchKey**: Verify that the object exists in the S3 bucket.

4. **500 - Internal Server Error**: Check the CloudWatch logs for the specific error message.

### Debugging Presigned URLs

If you encounter an error when accessing the presigned URL:

1. Check that the S3 bucket name and region match in both the Lambda function and your S3 bucket configuration.

2. Verify that the URL expiration time is within reasonable limits (60 seconds to 7 days).

3. Ensure that the S3 object referenced by the key exists in the bucket.

4. Test generating a presigned URL directly in the AWS Console to compare with the one generated by the Lambda function. 