# Add Movie Lambda Function

This Lambda function handles adding new movies to the CineDB catalog, including:
- Processing multipart form data submissions
- Uploading movie poster images to S3
- Creating new movie records in DynamoDB
- Generating unique IDs for each movie

## Functionality

- Parses `multipart/form-data` requests from API Gateway
- Extracts form fields (title, synopsis, rating) and file data (poster image)
- Uploads image files to S3 with unique names
- Creates new DynamoDB records with generated UUIDs
- Returns status 201 with the newly created movie on success
- Provides detailed error messages on failure
- Includes CORS support for browser-based form submissions

## Complete Deployment Guide

### Step 1: Create the IAM Role

1. Create a trust policy file:

```bash

cat > trust-policy.json << EOF
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
  --role-name cinedb-lambda-role \
  --assume-role-policy-document file://trust-policy.json
```

3. Create a permissions policy for DynamoDB, S3, and CloudWatch:

```bash
cat > permissions-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:472443946497:table/cinedb"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject"
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
```

4. Attach the permissions policy to the role:

```bash
aws iam put-role-policy \
  --role-name cinedb-lambda-role \
  --policy-name cinedb-lambda-permissions \
  --policy-document file://permissions-policy.json
```

5. Attach the basic Lambda execution policy:

```bash
aws iam attach-role-policy \
  --role-name cinedb-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### Step 2: Create the Deployment Package

1. Create a directory for the Lambda function:

```bash
mkdir -p cinedb-serverless/backend/lambda_functions/add_movie
cd cinedb-serverless/backend/lambda_functions/add_movie
```

2. Create a deployment package:

```bash
zip -r function.zip lambda_function.py
```

### Step 3: Create the Lambda Function

```bash
aws lambda create-function \
  --function-name add-movie \
  --runtime python3.9 \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --role $(aws iam get-role --role-name cinedb-lambda-role --query 'Role.Arn' --output text) \
  --environment Variables="{DYNAMODB_TABLE=cinedb,S3_BUCKET=cinedb-bucket-2025}" \
  --timeout 30 \
  --memory-size 256 \
  --region us-east-1
```

### Step 4: Update the Lambda Function (For Subsequent Deployments)

```bash
aws lambda update-function-code \
  --function-name add-movie \
  --zip-file fileb://function.zip \
  --region us-east-1
```

### Step 5: Test the Lambda Function with Simple JSON Input

Create a simple test event to verify that the Lambda function is working:

```bash
cat > test-simple.json << EOF
{
  "httpMethod": "POST",
  "headers": {
    "content-type": "application/json"
  },
  "body": "{\"title\":\"Test Movie\",\"synopsis\":\"This is a test\",\"rating\":\"8.5\"}"
}
EOF

aws lambda invoke \
  --function-name add-movie \
  --payload file://test-simple.json \
  --cli-binary-format raw-in-base64-out \
  response.json

cat response.json
```

You should see a 400 error about Content-Type, which is expected since we're not sending multipart/form-data.

### Step 6: Test with Multipart Form Data

Testing with multipart form data requires a more complex payload:

1. Create a base64-encoded form data payload:

```bash
cat > create-test-payload.py << EOF
import base64
import json

# Create a multipart form data payload
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = ""

# Add title field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"title\"\r\n\r\n"
body += "Test Movie Title\r\n"

# Add synopsis field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"synopsis\"\r\n\r\n"
body += "This is a test movie synopsis.\r\n"

# Add rating field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"rating\"\r\n\r\n"
body += "8.5\r\n"

# Close boundary
body += f"--{boundary}--\r\n"

# Create the test event
event = {
    "httpMethod": "POST",
    "headers": {
        "content-type": f"multipart/form-data; boundary={boundary}"
    },
    "body": base64.b64encode(body.encode()).decode(),
    "isBase64Encoded": True
}

# Write to file
with open("test-multipart.json", "w") as f:
    json.dump(event, f, indent=2)

print("Test payload created: test-multipart.json")
EOF

python create-test-payload.py
```

2. Invoke the Lambda function with the multipart payload:

```bash
aws lambda invoke \
  --function-name add-movie \
  --payload file://test-multipart.json \
  --cli-binary-format raw-in-base64-out \
  response.json

cat response.json
```

### Step 7: Advanced Testing with Image Upload

For advanced testing with an actual image upload:

1. Create a script to generate a test payload with an image:

```bash
cat > create-test-with-image.py << EOF
import base64
import json
import os

# Path to a small test image (replace with your image path)
test_image_path = "test_image.jpg"  # Make sure this file exists

# Create a multipart form data payload
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = ""

# Add title field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"title\"\r\n\r\n"
body += "Test Movie With Image\r\n"

# Add synopsis field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"synopsis\"\r\n\r\n"
body += "This is a test movie with an image upload.\r\n"

# Add rating field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"rating\"\r\n\r\n"
body += "9.0\r\n"

# Add poster image field
if os.path.exists(test_image_path):
    with open(test_image_path, "rb") as img_file:
        image_data = img_file.read()
        
    body += f"--{boundary}\r\n"
    body += f"Content-Disposition: form-data; name=\"poster\"; filename=\"test_image.jpg\"\r\n"
    body += "Content-Type: image/jpeg\r\n\r\n"
    
    # Convert body to bytes if it's not already
    if isinstance(body, str):
        body = body.encode()
    
    # Add binary image data
    body += image_data
    
    # Add closing boundary (must be bytes if body is bytes)
    if isinstance(body, bytes):
        body += f"\r\n--{boundary}--\r\n".encode()
    else:
        body += f"\r\n--{boundary}--\r\n"
else:
    print(f"Warning: {test_image_path} not found. Skipping image attachment.")
    body += f"--{boundary}--\r\n"

# Create the test event
event = {
    "httpMethod": "POST",
    "headers": {
        "content-type": f"multipart/form-data; boundary={boundary}"
    },
    "body": base64.b64encode(body if isinstance(body, bytes) else body.encode()).decode(),
    "isBase64Encoded": True
}

# Write to file
with open("test-with-image.json", "w") as f:
    json.dump(event, f, indent=2)

print("Test payload with image created: test-with-image.json")
EOF

# Create a small test image if needed
# You can replace this with any small image file
convert -size 100x100 xc:blue test_image.jpg  # Requires ImageMagick

python create-test-with-image.py
```

2. Invoke the Lambda function with the image payload:

```bash
aws lambda invoke \
  --function-name add-movie \
  --payload file://test-with-image.json \
  --cli-binary-format raw-in-base64-out \
  response.json

cat response.json
```

### Step 8: Configure CloudWatch Logs

1. View CloudWatch logs for troubleshooting:

```bash
# Get the most recent log stream
LOG_GROUP_NAME="/aws/lambda/add-movie"
LOG_STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP_NAME" \
  --order-by LastEventTime \
  --descending \
  --limit 1 \
  --query 'logStreams[0].logStreamName' \
  --output text)

# Get logs from the stream
aws logs get-log-events \
  --log-group-name "$LOG_GROUP_NAME" \
  --log-stream-name "$LOG_STREAM" \
  --limit 100
```

## API Gateway Configuration

This Lambda function requires special configuration in API Gateway to handle binary multipart form data:

### HTTP API Configuration

1. Create a new HTTP API or use an existing one:

```bash
aws apigatewayv2 create-api \
  --name cinedb-api \
  --protocol-type HTTP \
  --region us-east-1
```

2. Configure binary media types:

```bash
aws apigatewayv2 update-api \
  --api-id <API_ID> \
  --body '{"binaryMediaTypes": ["multipart/form-data"]}'
```

3. Create a route for the add-movie function:

```bash
aws apigatewayv2 create-route \
  --api-id <API_ID> \
  --route-key "POST /movies" \
  --region us-east-1
```

4. Create an integration with payload format version 2.0:

```bash
aws apigatewayv2 create-integration \
  --api-id <API_ID> \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:472443946497:function:add-movie \
  --payload-format-version 2.0 \
  --region us-east-1
```

5. Configure the integration to convert base64:

```bash
aws apigatewayv2 update-integration \
  --api-id <API_ID> \
  --integration-id <INTEGRATION_ID> \
  --integration-method POST \
  --content-handling CONVERT_TO_BINARY \
  --region us-east-1
```

### REST API Configuration

1. Create a REST API:

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

3. Create a /movies resource:

```bash
aws apigateway create-resource \
  --rest-api-id <REST_API_ID> \
  --parent-id <PARENT_RESOURCE_ID> \
  --path-part "movies" \
  --region us-east-1
```

4. Create a POST method:

```bash
aws apigateway put-method \
  --rest-api-id <REST_API_ID> \
  --resource-id <MOVIES_RESOURCE_ID> \
  --http-method POST \
  --authorization-type NONE \
  --region us-east-1
```

5. Create a lambda integration:

```bash
aws apigateway put-integration \
  --rest-api-id <REST_API_ID> \
  --resource-id <MOVIES_RESOURCE_ID> \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:472443946497:function:add-movie/invocations \
  --region us-east-1
```

6. Configure binary support for the API:

```bash
aws apigateway update-rest-api \
  --rest-api-id <REST_API_ID> \
  --patch-operations op=add,path=/binaryMediaTypes/multipart~1form-data,value='' \
  --region us-east-1
```

7. Deploy the API:

```bash
aws apigateway create-deployment \
  --rest-api-id <REST_API_ID> \
  --stage-name prod \
  --region us-east-1
```

## Testing with curl

You can test the function using curl with a multipart form:

```bash
curl -X POST https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/movies \
  -H "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW" \
  -F "title=New Movie Title" \
  -F "synopsis=This is a test movie" \
  -F "rating=8.5" \
  -F "poster=@/path/to/local/image.jpg"
```

## Troubleshooting

### Common Issues

1. **API Gateway 413 Request Entity Too Large**: By default, API Gateway has a payload size limit. You may need to increase this limit or use presigned URLs for larger files.

2. **CORS Issues**: If testing from a browser, ensure the CORS headers match your frontend domain.

3. **Lambda Timeouts**: Increase the timeout if handling larger images.

4. **Base64 Encoding Problems**: Ensure API Gateway is correctly configured to handle binary data and that the 'Content-Type' header is correctly set.

5. **S3 Access Denied**: Check that the Lambda role has s3:PutObject permissions for the bucket.

6. **Missing Required Fields**: Ensure all required fields (title, synopsis, rating) are included in the form.

7. **IAM Role Errors**: The error "The role defined for the function cannot be assumed by Lambda" often means the role has just been created and takes a few seconds to propagate. Wait and try again.

### Lambda Logs

If you're experiencing issues, check the CloudWatch logs:

```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/add-movie \
  --filter-pattern "ERROR" \
  --region us-east-1
``` 