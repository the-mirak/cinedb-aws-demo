# Get All Movies Lambda Function

This Lambda function retrieves all movies from a DynamoDB table and generates presigned URLs for the movie posters stored in S3.

## Functionality

- Scans the DynamoDB table to retrieve all movies
- Handles pagination for large datasets
- Generates presigned URLs for movie posters with 1-hour expiration
- Returns the movie data as a JSON response with proper CORS headers

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

Before deploying the Lambda function, you need to create an IAM role with the proper permissions and trust relationship:

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
                "dynamodb:Scan",
                "dynamodb:GetItem"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:472443946497:table/cinedb"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
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
cd cinedb-serverless/backend/lambda_functions/get_all_movies

# Create a deployment package
zip -r function.zip lambda_function.py
```

2. Create the Lambda function:

```bash
aws lambda create-function \
  --function-name get-all-movies \
  --runtime python3.9 \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --role arn:aws:iam::<ACCOUNT_ID>:role/lambda-dynamodb-s3-role \
  --environment Variables="{DYNAMODB_TABLE=cinedb,S3_BUCKET=cinedb-bucket-2025,AWS_REGION=us-east-1}" \
  --timeout 30 \
  --memory-size 256 \
  --region us-east-1
```

3. Update an existing function:

```bash
aws lambda update-function-code \
  --function-name get-all-movies \
  --zip-file fileb://function.zip \
  --region us-east-1
```

## Troubleshooting

### Role Cannot Be Assumed Error

If you encounter an error like:
```
An error occurred (InvalidParameterValueException) when calling the CreateFunction operation: The role defined for the function cannot be assumed by Lambda.
```

This indicates one of the following issues:

1. The IAM role doesn't exist
2. The role doesn't have the proper trust relationship with Lambda
3. IAM changes need time to propagate (typically 10-15 seconds)

Fix by:
- Ensuring the role exists
- Updating the trust relationship as shown in the IAM Role Setup section
- Waiting 15 seconds after role creation before creating the Lambda function

### Presigned URL Access Denied Error

If you encounter an error like:
```
<Error>
<Code>AccessDenied</Code>
<Message>Invalid date (should be seconds since epoch)</Message>
<RequestId>XXXXX</RequestId>
<HostId>XXXXX</HostId>
</Error>
```

This could be caused by:

1. **IAM Permission Issues**: Ensure your Lambda role has the proper permissions as shown in the IAM policy above.

2. **Temporary Credentials**: If using temporary credentials (via STS), make sure they haven't expired. The Lambda function should automatically use the correct credentials.

3. **S3 Bucket Region**: Verify that your S3 bucket and Lambda function are in the same region (us-east-1) or that your S3 client is configured with the correct region.

4. **URL Escaping**: API Gateway might cause double-escaping of the URL. In this case, consider setting up an API Gateway response mapping template.

To verify your Lambda has the right permissions, check the CloudWatch logs for the function and ensure the role policy is correctly attached with:

```bash
aws iam get-role-policy \
  --role-name lambda-dynamodb-s3-role \
  --policy-name DynamoDBAndS3Access
```

## API Gateway Integration

To expose this Lambda function via API Gateway:

1. Create a new REST API in the same region (us-east-1)
2. Create a resource (e.g., `/movies`) and add a GET method
3. Set the integration type to "Lambda Function"
4. Select the `get-all-movies` function
5. Enable CORS for the resource
6. Deploy the API to a stage

## Testing

Test the Lambda function using the AWS Console or AWS CLI:

```bash
aws lambda invoke \
  --function-name get-all-movies \
  --payload '{}' \
  --region us-east-1 \
  response.json

# View the response
cat response.json
``` 