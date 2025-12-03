# API Gateway Request/Response Mappings for CineDB

This document provides instructions for configuring proper request/response mappings in API Gateway for the CineDB application, especially for handling multipart/form-data correctly.

## Binary Content Types Configuration

First, ensure API Gateway is configured to handle binary content types such as multipart/form-data:

```bash
# Get the API ID
API_ID=u8cf224qu3

# Add multipart/form-data to binary media types
aws apigateway update-rest-api \
  --rest-api-id $API_ID \
  --patch-operations op=add,path=/binaryMediaTypes/multipart~1form-data

# Deploy the changes to take effect
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

## Request Mapping Templates

For Lambda integrations that need to handle multipart/form-data (for file uploads), configure the following request mapping template:

### POST /movies (Add Movie)

1. Go to API Gateway Console
2. Select your API (CineDB-API)
3. Navigate to Resources > POST /movies > Integration Request
4. Under "Integration Request", configure:
   - Integration Type: Lambda Function
   - Use Lambda Proxy integration: **No** (unchecked)
   - Content Handling: **Pass Through**
   - Lambda Function: add-movie
   - Request Templates: Add a mapping template for `multipart/form-data`:

```json
{
    "body": "$input.body",
    "headers": {
        #foreach($header in $input.params().header.keySet())
        "$header": "$util.escapeJavaScript($input.params().header.get($header))"
        #if($foreach.hasNext),#end
        #end
    },
    "isBase64Encoded": true
}
```

This passes the body as-is and makes sure all headers are included, especially the `Content-Type` with boundary information.

### PUT /movies/{id} (Update Movie)

Similar to the POST endpoint, for the PUT endpoint:

1. Navigate to Resources > PUT /movies/{id} > Integration Request
2. Configure the same settings as for POST /movies
3. Add the same mapping template for `multipart/form-data`

## Response Mapping Templates

Configure response mapping templates to ensure consistent JSON responses:

### Common Response Template (for all endpoints)

For all Lambda integrations, configure:

1. Navigate to the Integration Response section for each endpoint
2. For each status code (e.g., 200, 400, 500), add a response mapping template for `application/json`:

```json
#set($inputRoot = $input.path('$'))
$input.json("$")
```

This passes the Lambda response directly without modification.

## Method Response Configuration

Ensure the Method Response is configured correctly for each endpoint:

1. For each endpoint, configure Method Response 
2. Add the appropriate response models for each status code:
   - 200: application/json
   - 400: application/json
   - 500: application/json

## CORS Configuration

For all endpoints, ensure CORS is configured correctly:

1. For non-OPTIONS methods, add these headers to the Method Response:
   - Access-Control-Allow-Origin
   - Access-Control-Allow-Methods
   - Access-Control-Allow-Headers

2. Add response mapping templates in the Integration Response to set these headers:

```json
#set($origin = $input.params().header.get("Origin"))
#if($origin == "")
  #set($origin = "*")
#end

{
  "Access-Control-Allow-Origin": "$origin",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key"
}
```

## Testing the Configuration

After applying these changes, test the endpoints using Postman:

1. Test file upload with POST /movies
2. Test file upload with PUT /movies/{id}
3. Verify that all headers are correctly passed
4. Verify that binary content is correctly handled

## Troubleshooting

If you encounter issues:

1. **413 Request Entity Too Large**: Increase the payload size limit in API Gateway
   ```bash
   aws apigateway update-stage \
     --rest-api-id $API_ID \
     --stage-name prod \
     --patch-operations op=replace,path=/variables/maximumPayloadSize,value=10485760
   ```

2. **Binary content not handled correctly**: Verify binary media types are configured, and Content Handling is set to "Pass Through"

3. **CORS issues**: Check both Method Response and Integration Response headers