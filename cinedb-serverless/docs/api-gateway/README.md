# CineDB API Gateway Documentation

This directory contains documentation for the CineDB API Gateway setup and testing.

## Files

- **setup-commands.md**: Contains all the AWS CLI commands used to set up the API Gateway, resources, methods, integrations, and CORS configuration.

- **api-testing-guide.md**: Comprehensive guide for testing the API, including example requests and responses for all endpoints.

- **aws-proxy-integration-fix.md**: Detailed documentation of the AWS_PROXY integration issue and fix that resolved CORS and 500 errors.

- **problematic-commands-example.md**: Educational reference showing the exact problematic commands that caused issues (DO NOT USE).

- **test-api.sh**: Executable shell script for testing the API endpoints.

- **lambda-policy.json**: IAM policy document with the necessary permissions for Lambda functions to access DynamoDB and S3.

## API Endpoints

| Endpoint | Method | Description | Lambda |
|----------|--------|-------------|--------|
| /movies | GET | List all movies | get-all-movies |
| /movies | POST | Add a new movie | add-movie |
| /movies/{id} | GET | Get a movie by ID | get-movie-by-id |
| /movies/{id} | PUT | Update a movie | update-movie |
| /movies/{id} | DELETE | Delete a movie | delete-movie |
| /presigned/{key} | GET | Generate presigned URL | generate-presigned-url |

## API Base URL

The API is accessible at: `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod`

## IAM Permissions

Proper IAM permissions are **crucial** for the functioning of Lambda functions. Ensure that:

1. All Lambda functions have permission to:
   - Access DynamoDB (Scan, Query, GetItem, PutItem, etc.)
   - Access S3 (GetObject, PutObject, DeleteObject, ListBucket)
   - Write to CloudWatch Logs

2. API Gateway has permission to invoke the Lambda functions.

3. **Important**: Lambda functions in this project may use different IAM roles! Check each function's role and apply the necessary permissions to all roles. Known roles include:
   - `lambda-dynamodb-s3-role`
   - `cinedb-lambda-role`

4. See `lambda-policy.json` for the complete set of required permissions.

5. If you encounter permission issues, check the Troubleshooting section in `api-testing-guide.md`.

## Testing the API

To run the test script:

```bash
# Navigate to the api-gateway directory
cd cinedb-serverless/docs/api-gateway

# Make sure the script is executable
chmod +x test-api.sh

# Run the test script
./test-api.sh
```

> **Note**: The test script requires `jq` to be installed for formatting JSON output. Install it with:
> - Ubuntu/Debian: `sudo apt-get install jq`
> - macOS: `brew install jq`
> - Windows: `choco install jq` (with Chocolatey) or download from [stedolan.github.io/jq](https://stedolan.github.io/jq/)

## Troubleshooting

### Common Issues

**CORS Errors or 500 Internal Server Errors**
- Check if API Gateway integrations are using `AWS_PROXY` instead of `AWS`
- See `aws-proxy-integration-fix.md` for detailed troubleshooting steps

**Lambda Function Not Receiving Correct Data**
- Verify integration type is `AWS_PROXY`
- Check Lambda function logs in CloudWatch for parsing errors

**API Gateway Returns Malformed Responses**
- Ensure Lambda functions return proper response format with status code and headers 