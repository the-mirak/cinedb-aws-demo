# Update Movie Lambda Function

This Lambda function handles updating existing movies in the CineDB catalog, including:
- Processing multipart form data submissions
- Optionally updating movie poster images in S3
- Updating existing movie records in DynamoDB
- Returning the updated movie information

## Functionality

- Accepts multipart/form-data with movie ID and fields to update
- Validates that the movie exists before attempting updates
- Handles partial updates (only specified fields are updated)
- Processes image uploads to S3 if a new poster is provided
- Uses consistent naming for S3 objects based on movie ID
- Adds an updatedAt timestamp to track modifications
- Returns a complete updated movie object in the response

## Deployment Guide

### Step 1: Create the IAM Role

If you haven't already created a role for the CineDB Lambda functions, follow these steps:

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
                "dynamodb:GetItem",
                "dynamodb:UpdateItem"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:472443946497:table/cinedb"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
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

1. Navigate to the function directory:

```bash
cd cinedb-serverless/backend/lambda_functions/update_movie
```

2. Create a deployment package:

```bash
zip -r function.zip lambda_function.py
```

### Step 3: Create the Lambda Function

```bash
aws lambda create-function \
  --function-name update-movie \
  --runtime python3.9 \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --role $(aws iam get-role --role-name cinedb-lambda-role --query 'Role.Arn' --output text) \
  --environment Variables="{DYNAMODB_TABLE=cinedb,S3_BUCKET=cinedb-bucket-2025}" \
  --timeout 30 \
  --memory-size 256 \
  --region us-east-1
```

### Step 4: Update the Lambda Function (for subsequent deployments)

```bash
aws lambda update-function-code \
  --function-name update-movie \
  --zip-file fileb://function.zip \
  --region us-east-1
```

## Testing the Function

### Step 1: Find an existing movie ID

First, scan the DynamoDB table to find an existing movie ID to update:

```bash
aws dynamodb scan \
  --table-name cinedb \
  --projection-expression "id, title" \
  --region us-east-1
```

Note down one of the movie IDs for testing.

### Step 2: Create a test payload

Create a Python script to generate a test payload with the movie ID:

```bash
cat > create-update-test.py << EOF
import base64
import json

# Replace with an actual movie ID from your database
MOVIE_ID = "replace-with-actual-movie-id"

# Create a multipart form data payload
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = ""

# Add movie ID field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"id\"\r\n\r\n"
body += f"{MOVIE_ID}\r\n"

# Add updated title field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"title\"\r\n\r\n"
body += "Updated Movie Title\r\n"

# Add updated synopsis field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"synopsis\"\r\n\r\n"
body += "This is an updated synopsis for testing purposes.\r\n"

# Add updated rating field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"rating\"\r\n\r\n"
body += "9.5\r\n"

# Close boundary
body += f"--{boundary}--\r\n"

# Create the test event
event = {
    "httpMethod": "PUT",
    "headers": {
        "content-type": f"multipart/form-data; boundary={boundary}"
    },
    "body": base64.b64encode(body.encode()).decode(),
    "isBase64Encoded": True
}

# Write to file
with open("test-update.json", "w") as f:
    json.dump(event, f, indent=2)

print("Test payload created: test-update.json")
EOF
```

Edit the script to include the correct movie ID:

```bash
# Edit the script to replace the movie ID
nano create-update-test.py

# Run the script to generate the test file
python create-update-test.py
```

### Step 3: Invoke the Lambda function

```bash
aws lambda invoke \
  --function-name update-movie \
  --payload file://test-update.json \
  --cli-binary-format raw-in-base64-out \
  response.json

cat response.json
```

### Step 4: Test with image upload (advanced)

For testing with an image upload, create a more complex test script:

```bash
cat > create-update-with-image.py << EOF
import base64
import json
import os

# Replace with an actual movie ID from your database
MOVIE_ID = "replace-with-actual-movie-id"

# Path to a small test image (replace with your image path)
test_image_path = "test_image.jpg"  # Make sure this file exists

# Create a multipart form data payload
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = ""

# Add movie ID field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"id\"\r\n\r\n"
body += f"{MOVIE_ID}\r\n"

# Add updated title field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"title\"\r\n\r\n"
body += "Movie With Updated Image\r\n"

# Add poster image field
if os.path.exists(test_image_path):
    with open(test_image_path, "rb") as img_file:
        image_data = img_file.read()
        
    body += f"--{boundary}\r\n"
    body += f"Content-Disposition: form-data; name=\"poster\"; filename=\"new_poster.jpg\"\r\n"
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
    "httpMethod": "PUT",
    "headers": {
        "content-type": f"multipart/form-data; boundary={boundary}"
    },
    "body": base64.b64encode(body if isinstance(body, bytes) else body.encode()).decode(),
    "isBase64Encoded": True
}

# Write to file
with open("test-update-image.json", "w") as f:
    json.dump(event, f, indent=2)

print("Test payload with image created: test-update-image.json")
EOF

# Create a small test image if you don't have one
convert -size 100x100 xc:red test_image.jpg  # Requires ImageMagick

# Update the movie ID
nano create-update-with-image.py

# Run the script
python create-update-with-image.py

# Invoke the Lambda
aws lambda invoke \
  --function-name update-movie \
  --payload file://test-update-image.json \
  --cli-binary-format raw-in-base64-out \
  response-image.json

cat response-image.json
```

## API Gateway Integration

### HTTP API Setup (Recommended)

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

3. Create a route for the update-movie function:

```bash
aws apigatewayv2 create-route \
  --api-id <API_ID> \
  --route-key "PUT /movies/{id}" \
  --region us-east-1
```

4. Create an integration with payload format version 2.0:

```bash
aws apigatewayv2 create-integration \
  --api-id <API_ID> \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:472443946497:function:update-movie \
  --payload-format-version 2.0 \
  --region us-east-1
```

5. Attach the integration to the route:

```bash
aws apigatewayv2 update-route \
  --api-id <API_ID> \
  --route-id <ROUTE_ID> \
  --target integrations/<INTEGRATION_ID> \
  --region us-east-1
```

6. Deploy the API:

```bash
aws apigatewayv2 create-stage \
  --api-id <API_ID> \
  --stage-name prod \
  --auto-deploy \
  --region us-east-1
```

### Testing with curl

Once your API Gateway is set up, you can test with curl:

```bash
curl -X PUT \
  https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod/movies/<MOVIE_ID> \
  -H "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW" \
  -F "title=Updated from API Gateway" \
  -F "synopsis=This movie was updated via API Gateway" \
  -F "rating=9.0" \
  -F "poster=@/path/to/image.jpg"
```

## Troubleshooting

### Common Issues

1. **404 Movie Not Found**: Verify that the movie ID exists in the DynamoDB table.

2. **400 No Fields to Update**: Ensure you're providing at least one field to update.

3. **500 Error with Decimal Conversion**: Ensure the rating is a valid number format.

4. **IAM Permission Issues**: Check that your Lambda role has the correct permissions for DynamoDB UpdateItem and S3 PutObject.

5. **S3 Upload Errors**: If you have problems with image uploads, check the CloudWatch logs.

### CloudWatch Logs

View the CloudWatch logs for detailed error information:

```bash
# Get the most recent log stream
LOG_GROUP_NAME="/aws/lambda/update-movie"
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