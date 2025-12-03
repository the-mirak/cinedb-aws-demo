# API Gateway AWS_PROXY Integration Fix

## Issue Summary

**Date**: May 27, 2025  
**Severity**: Critical  
**Impact**: Complete failure of POST and PUT operations from frontend  
**Root Cause**: Incorrect API Gateway integration type configuration  

## Problem Description

The CineDB serverless application was experiencing CORS errors and 500 Internal Server Errors when attempting to add or update movies through the CloudFront frontend. Users would see the following errors in the browser console:

```
Access to fetch at 'https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies' from origin 'https://dvvitcc6i0tnr.cloudfront.net' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

POST https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies net::ERR_FAILED 500 (Internal Server Error)
```

## Technical Analysis

### What Was Wrong

The API Gateway methods were configured with **`AWS` integration type** instead of **`AWS_PROXY`** integration type. This caused the following issues:

#### 1. Custom Request Templates
The `AWS` integration was using custom request templates that wrapped the incoming request in additional JSON structure:

```json
{
  "httpMethod": "$context.httpMethod",
  "body": "$input.body",
  "headers": {
    "content-type": "application/json",
    "origin": "https://dvvitcc6i0tnr.cloudfront.net"
  }
}
```

#### 2. Lambda Function Receiving Malformed Data
Instead of receiving the standard API Gateway proxy event format, the Lambda function was receiving this wrapped structure, causing parsing errors:

```python
# What the Lambda function expected (AWS_PROXY format):
{
    "httpMethod": "POST",
    "body": "{\"title\": \"Test Movie\", \"year\": 2024}",
    "headers": {"content-type": "application/json"},
    "pathParameters": null,
    "queryStringParameters": null
}

# What it actually received (AWS format with custom template):
"{\"httpMethod\":\"POST\",\"body\":\"{\"title\": \"Test Movie\", \"year\": 2024}\",\"headers\":{...}}"
```

#### 3. JSON Parsing Errors
The Lambda function tried to parse this double-encoded JSON, resulting in errors like:

```
Could not parse request body into json: Unexpected character ('t' (code 116)): was expecting comma to separate Object entries
```

## Architectural Impact

### AWS Architecture Components Affected

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │    │   API Gateway   │    │     Lambda      │    │    DynamoDB     │
│   (Frontend)    │───▶│   (REST API)    │───▶│   (add-movie)   │───▶│   (cinedb)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ❌ WRONG: AWS Integration
                          with custom templates
                          
                       ✅ CORRECT: AWS_PROXY Integration
                          with standard event format
```

### Integration Types Comparison

| Aspect | AWS Integration (❌ Wrong) | AWS_PROXY Integration (✅ Correct) |
|--------|---------------------------|-----------------------------------|
| **Request Format** | Custom template required | Standard API Gateway proxy event |
| **Response Format** | Custom mapping required | Direct Lambda response |
| **CORS Handling** | Manual configuration needed | Handled by Lambda function |
| **Error Handling** | Complex mapping required | Direct error responses |
| **Maintenance** | High (custom templates) | Low (standard format) |

### What AWS_PROXY Integration Provides

1. **Standard Event Format**: Lambda receives a consistent, well-documented event structure
2. **Automatic Request Parsing**: Headers, body, path parameters automatically parsed
3. **Direct Response Control**: Lambda can directly control HTTP status codes and headers
4. **CORS Simplification**: Lambda function handles CORS headers directly
5. **Error Transparency**: Errors are passed through without transformation

## Solution Implementation

### Commands Executed

#### 1. Identify the Problem
```bash
# Check current integration type for POST /movies
aws apigateway get-integration \
  --rest-api-id u8cf224qu3 \
  --resource-id w9krmo \
  --http-method POST \
  --region us-east-1

# Output showed: "type": "AWS" (incorrect)
```

#### 2. Fix POST /movies Integration
```bash
# Update POST /movies to use AWS_PROXY
aws apigateway put-integration \
  --rest-api-id u8cf224qu3 \
  --resource-id w9krmo \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:472443946497:function:add-movie/invocations" \
  --region us-east-1
```

#### 3. Fix PUT /movies/{id} Integration
```bash
# Check PUT method integration type
aws apigateway get-integration \
  --rest-api-id u8cf224qu3 \
  --resource-id b3fgli \
  --http-method PUT \
  --region us-east-1 | grep '"type"'

# Update PUT /movies/{id} to use AWS_PROXY
aws apigateway put-integration \
  --rest-api-id u8cf224qu3 \
  --resource-id b3fgli \
  --http-method PUT \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:472443946497:function:update-movie/invocations" \
  --region us-east-1
```

#### 4. Deploy Changes
```bash
# Deploy POST method fix
aws apigateway create-deployment \
  --rest-api-id u8cf224qu3 \
  --stage-name prod \
  --description "Fixed AWS_PROXY integration for POST /movies" \
  --region us-east-1

# Deploy PUT method fix
aws apigateway create-deployment \
  --rest-api-id u8cf224qu3 \
  --stage-name prod \
  --description "Fixed AWS_PROXY integration for PUT /movies/{id}" \
  --region us-east-1
```

### Verification Commands

#### 1. Test CORS Preflight
```bash
curl -X OPTIONS "https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies" \
  -H "Origin: https://dvvitcc6i0tnr.cloudfront.net" \
  -v
```

**Expected Response Headers:**
```
access-control-allow-origin: *
access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
access-control-allow-headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key
```

#### 2. Test POST Request
```bash
curl -X POST "https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies" \
  -H "Content-Type: application/json" \
  -H "Origin: https://dvvitcc6i0tnr.cloudfront.net" \
  -d '{"title": "Test Movie", "year": 2024, "synopsis": "A test movie"}' \
  | jq .
```

**Expected Response:**
```json
{
  "message": "Movie added successfully",
  "movie": {
    "id": "998f2380-afa0-4cca-bac1-b36638b23ea9",
    "title": "Test Movie",
    "year": 2024,
    "createdAt": "2025-05-27T18:52:13.987324",
    "synopsis": "A test movie"
  }
}
```

## Best Practices Learned

### 1. Always Use AWS_PROXY for Lambda Integrations
- **Simplicity**: Standard event format reduces complexity
- **Maintainability**: No custom templates to maintain
- **Debugging**: Easier to troubleshoot with standard format
- **Documentation**: Well-documented event structure

### 2. Integration Type Selection Guide

| Use Case | Recommended Integration |
|----------|------------------------|
| Lambda functions with HTTP APIs | AWS_PROXY |
| Lambda functions with custom logic | AWS_PROXY |
| Legacy systems requiring transformation | AWS (with templates) |
| Direct service integrations | AWS |

### 3. CORS Configuration
With AWS_PROXY integration:
- Lambda function controls CORS headers directly
- No need for complex API Gateway CORS configuration
- Consistent CORS handling across all responses

### 4. Error Handling
AWS_PROXY integration provides:
- Direct error response control
- Consistent error format
- Proper HTTP status codes
- Custom error messages

## Prevention Measures

### 1. Infrastructure as Code
Create SAM templates to ensure consistent configuration:

```yaml
# SAM Template Example
AddMovieFunction:
  Type: AWS::Serverless::Function
  Properties:
    Events:
      AddMovieApi:
        Type: Api
        Properties:
          Path: /movies
          Method: POST
          # AWS_PROXY is the default for SAM
```

### 2. Integration Testing
Implement automated tests to verify:
- CORS functionality
- Request/response format
- Error handling
- Integration type configuration

### 3. Monitoring
Set up CloudWatch alarms for:
- API Gateway 4xx/5xx errors
- Lambda function errors
- CORS-related failures

## Conclusion

The issue was caused by using the wrong API Gateway integration type (`AWS` instead of `AWS_PROXY`), which resulted in malformed request data being sent to Lambda functions. The fix involved updating the integration configuration and redeploying the API.

**Key Takeaway**: Always use `AWS_PROXY` integration for Lambda functions unless there's a specific need for custom request/response transformation.

**Impact**: This fix resolved all CORS errors and 500 Internal Server Errors, enabling full functionality of the CineDB frontend application.

**Files Modified**: API Gateway integration configuration only (no code changes required)

**Deployment Time**: ~2 minutes for configuration changes and deployment 