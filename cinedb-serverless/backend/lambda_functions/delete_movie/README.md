# Delete Movie Lambda Function

This Lambda function deletes a movie from the DynamoDB table and removes its associated poster image from S3.

## Functionality

- Retrieves the movie record from DynamoDB to get the poster URL
- Deletes the movie record from DynamoDB 
- Identifies and removes the associated poster image from S3
- Returns a success response with proper CORS headers
- Handles various input scenarios (path parameters, query parameters, direct invocation)
- Provides appropriate error responses for missing IDs, not-found movies, and other errors

## Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- DynamoDB table for movie storage
- S3 bucket for poster images

### Environment Variables

The Lambda function requires the following environment variables:

- `DYNAMODB_TABLE`: Name of the DynamoDB table (default: 'cinedb')
- `S3_BUCKET`: Name of the S3 bucket for poster storage (default: 'cinedb-bucket-2025')
- `AWS_REGION`: AWS region (default: 'us-east-1')

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
  --role-name lambda-dynamodb-s3-role \
  --assume-role-policy-document file://lambda-trust-policy.json
```

3. Attach the required permissions:

```bash
# Basic Lambda execution permissions (for CloudWatch logs)
aws iam attach-role-policy \
  --role-name lambda-dynamodb-s3-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for DynamoDB and S3 access
cat > lambda-permissions-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:472443946497:table/cinedb"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:DeleteObject"
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
  --role-name lambda-dynamodb-s3-role \
  --policy-name DynamoDBAndS3Access \
  --policy-document file://lambda-permissions-policy.json
```

### Deployment Steps

1. Create a deployment package:

```bash
# Navigate to the function directory
cd cinedb-serverless/backend/lambda_functions/delete_movie

# Create a deployment package
zip -r function.zip lambda_function.py
```

2. Create the Lambda function:

```bash
aws lambda create-function \
  --function-name delete-movie \
  --runtime python3.9 \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::472443946497:role/lambda-dynamodb-s3-role \
  --environment Variables="{DYNAMODB_TABLE=cinedb,S3_BUCKET=cinedb-bucket-2025}" \
  --timeout 30 \
  --memory-size 256 \
  --region us-east-1
```

3. Update an existing function:

```bash
aws lambda update-function-code \
  --function-name delete-movie \
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
    "id": "2829c888-ec22-43a3-ae68-d5c959875d79"
  }
}
EOF

# Invoke the Lambda function
aws lambda invoke \
  --function-name delete-movie \
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
    "id": "REPLACE_WITH_ACTUAL_MOVIE_ID"
  }
}
EOF

# Invoke the Lambda function
aws lambda invoke \
  --function-name delete-movie \
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
    "id": "REPLACE_WITH_ACTUAL_MOVIE_ID"
  }
}
EOF

# Invoke the Lambda function
aws lambda invoke \
  --function-name delete-movie \
  --payload file://test-event.json \
  --cli-binary-format raw-in-base64-out \
  response.json

# View the response
cat response.json
```

### Finding Movie IDs for Testing

To find valid movie IDs for testing, you can first run a scan of your DynamoDB table:

```bash
# Scan the DynamoDB table to get all movie IDs
aws dynamodb scan \
  --table-name cinedb \
  --projection-expression "id, title" \
  --region us-east-1
```

Then use one of the returned IDs in your test event.

## API Gateway Integration

### HTTP API (Recommended)

1. Create a HTTP API (if not already created):

```bash
aws apigatewayv2 create-api \
  --name cinedb-api \
  --protocol-type HTTP \
  --region us-east-1
```

2. Create a route for the delete-movie function:

```bash
aws apigatewayv2 create-route \
  --api-id <API_ID> \
  --route-key "DELETE /movies/{id}" \
  --region us-east-1
```

3. Create an integration:

```bash
aws apigatewayv2 create-integration \
  --api-id <API_ID> \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:delete-movie \
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

3. Create a /movies resource (if not already created):

```bash
aws apigateway create-resource \
  --rest-api-id <REST_API_ID> \
  --parent-id <PARENT_RESOURCE_ID> \
  --path-part "movies" \
  --region us-east-1
```

4. Create a /movies/{id} resource (if not already created):

```bash
aws apigateway create-resource \
  --rest-api-id <REST_API_ID> \
  --parent-id <MOVIES_RESOURCE_ID> \
  --path-part "{id}" \
  --region us-east-1
```

5. Create a DELETE method:

```bash
aws apigateway put-method \
  --rest-api-id <REST_API_ID> \
  --resource-id <MOVIES_ID_RESOURCE_ID> \
  --http-method DELETE \
  --authorization-type NONE \
  --region us-east-1
```

6. Create a lambda integration:

```bash
aws apigateway put-integration \
  --rest-api-id <REST_API_ID> \
  --resource-id <MOVIES_ID_RESOURCE_ID> \
  --http-method DELETE \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:delete-movie/invocations \
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
    "id": "12345678-1234-1234-1234-123456789012"
  }
}
```

Or directly with the API:

```bash
curl -X DELETE https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/movies/12345678-1234-1234-1234-123456789012
```

## Troubleshooting

### Common Issues

1. **404 - Movie Not Found**: Verify that the movie ID exists in the DynamoDB table.

2. **400 - Movie ID Required**: Ensure the ID is being properly passed in the request.

3. **403 - Access Denied**: Check that your Lambda role has the proper permissions for both DynamoDB and S3.

4. **500 - Internal Server Error**: Check the CloudWatch logs for the specific error message.

### Debugging S3 Deletion

If you encounter an error when deleting the S3 object:

1. Check that the S3 bucket name and region match in both the Lambda function and your S3 bucket configuration.

2. Verify that the key extraction from the full URL is working correctly by examining the CloudWatch logs.

3. Ensure the Lambda role has the appropriate permissions to delete objects from S3.