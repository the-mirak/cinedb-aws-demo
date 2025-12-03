# Problematic API Gateway Commands (Educational Reference)

## ⚠️ WARNING: DO NOT USE THESE COMMANDS

This file contains the **problematic commands** that were originally used and caused CORS errors and 500 Internal Server Errors. These are preserved for educational purposes to understand what NOT to do.

## The Problem: AWS Integration with Custom Templates

The original setup used `AWS` integration type with custom request templates instead of `AWS_PROXY`. This caused the following issues:

### Issue 1: Double-Encoded JSON
The custom templates wrapped the request data in additional JSON structure, causing Lambda functions to receive malformed data.

### Issue 2: CORS Header Issues
The custom integration didn't properly handle CORS headers, leading to browser blocking requests.

### Issue 3: Complex Error Handling
Errors were transformed by the custom templates, making debugging difficult.

## Problematic Commands Used Originally

### ❌ POST /movies Integration (WRONG)
```bash
# This command creates AWS integration with custom templates - DO NOT USE
aws apigateway put-integration \
  --rest-api-id u8cf224qu3 \
  --resource-id w9krmo \
  --http-method POST \
  --type AWS \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:472443946497:function:add-movie/invocations" \
  --request-templates '{
    "application/json": "{\"httpMethod\":\"$context.httpMethod\",\"body\":\"$input.body\",\"headers\":{#foreach($header in $input.params().header.keySet())\"$header\":\"$util.escapeJavaScript($input.params().header.get($header))\"#if($foreach.hasNext),#end#end}}",
    "multipart/form-data": "{\"body\":\"$input.body\",\"headers\":{#foreach($header in $input.params().header.keySet())\"$header\":\"$util.escapeJavaScript($input.params().header.get($header))\"#if($foreach.hasNext),#end#end},\"isBase64Encoded\":true}"
  }' \
  --region us-east-1
```

**What this caused:**
- Lambda received: `"{\"httpMethod\":\"POST\",\"body\":\"{\"title\":\"Movie\"}\",...}"`
- Instead of standard API Gateway proxy event format
- JSON parsing errors in Lambda function
- 500 Internal Server Error responses

### ❌ PUT /movies/{id} Integration (WRONG)
```bash
# This command creates AWS integration with custom templates - DO NOT USE
aws apigateway put-integration \
  --rest-api-id u8cf224qu3 \
  --resource-id b3fgli \
  --http-method PUT \
  --type AWS \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:472443946497:function:update-movie/invocations" \
  --request-templates '{
    "application/json": "{\"httpMethod\":\"$context.httpMethod\",\"body\":\"$input.body\",\"headers\":{#foreach($header in $input.params().header.keySet())\"$header\":\"$util.escapeJavaScript($input.params().header.get($header))\"#if($foreach.hasNext),#end#end}}",
    "multipart/form-data": "{\"body\":\"$input.body\",\"headers\":{#foreach($header in $input.params().header.keySet())\"$header\":\"$util.escapeJavaScript($input.params().header.get($header))\"#if($foreach.hasNext),#end#end},\"isBase64Encoded\":true}"
  }' \
  --region us-east-1
```

**What this caused:**
- Same issues as POST method
- Lambda couldn't parse the wrapped JSON structure
- Update operations failed with 500 errors

## Error Examples

### Browser Console Errors
```
Access to fetch at 'https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies' 
from origin 'https://dvvitcc6i0tnr.cloudfront.net' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.

POST https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies 
net::ERR_FAILED 500 (Internal Server Error)
```

### Lambda Function Errors
```
Could not parse request body into json: Unexpected character ('t' (code 116)): 
was expecting comma to separate Object entries
at [Source: (byte[])"{"httpMethod":"POST","body":"{\"title\": \"Test Movie\"}"...
```

### API Gateway Response
```json
{
  "message": "Could not parse request body into json: Could not parse payload into json: Unexpected character..."
}
```

## The Correct Solution

### ✅ Use AWS_PROXY Integration Instead
```bash
# POST /movies - CORRECT
aws apigateway put-integration \
  --rest-api-id u8cf224qu3 \
  --resource-id w9krmo \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:472443946497:function:add-movie/invocations" \
  --region us-east-1

# PUT /movies/{id} - CORRECT
aws apigateway put-integration \
  --rest-api-id u8cf224qu3 \
  --resource-id b3fgli \
  --http-method PUT \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:472443946497:function:update-movie/invocations" \
  --region us-east-1
```

## Key Differences

| Aspect | AWS Integration (❌ Wrong) | AWS_PROXY Integration (✅ Correct) |
|--------|---------------------------|-----------------------------------|
| **Request Format** | Custom wrapped JSON | Standard API Gateway proxy event |
| **Templates Required** | Yes, complex VTL templates | No templates needed |
| **CORS Handling** | Manual, error-prone | Handled by Lambda function |
| **Error Debugging** | Difficult, errors transformed | Easy, direct error responses |
| **Maintenance** | High complexity | Low complexity |

## Lessons Learned

1. **Always use AWS_PROXY** for Lambda integrations unless you have a specific need for custom transformation
2. **Custom templates are complex** and error-prone for standard use cases
3. **CORS is simpler** when handled directly by Lambda functions
4. **Standard formats** make debugging and maintenance much easier
5. **Test thoroughly** after any integration type changes

## Prevention

- Use SAM templates which default to AWS_PROXY
- Always test API endpoints after deployment
- Monitor CloudWatch logs for Lambda parsing errors
- Implement automated integration tests

This documentation serves as a reference for understanding what went wrong and how to avoid similar issues in the future. 