# CineDB API Testing Guide

This guide provides examples for testing all the endpoints of the CineDB API.

## API Base URL

```
https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod
```

## GET /movies - List All Movies

### Request

```bash
curl -X GET https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies
```

### Expected Response

```json
[
  {
    "id": "1",
    "title": "Celestial Nomads",
    "synopsis": "In a distant galaxy, a group of interstellar travelers embarks on a journey to find a new home, facing unknown dangers and forging new alliances along the way.",
    "rating": 9.3,
    "poster": "https://presigned-url-to-s3-bucket.com/CelestialNomads.png",
    "director": "Emma Rodriguez",
    "year": "2023",
    "duration": "142 min",
    "genre": "Sci-Fi, Adventure",
    "cast": "David Chen, Maria Lopez, James Wilson"
  },
  {
    "id": "2",
    "title": "The Silent Echo",
    "synopsis": "A psychological thriller about a detective who discovers that the murder she's investigating has eerie similarities to her own past trauma.",
    "rating": 8.7,
    "poster": "https://presigned-url-to-s3-bucket.com/TheSilentEcho.png",
    "director": "Michael Zhang",
    "year": "2022",
    "duration": "118 min",
    "genre": "Thriller, Mystery",
    "cast": "Elena Kim, Robert Johnson, Sarah Miller"
  }
]
```

## GET /movies/{id} - Get Movie By ID

### Request

```bash
curl -X GET https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies/abd657d0-b9f3-4e74-8369-0bb2e361ed02
```

### Expected Response

```json
{
  "id": "1",
  "title": "Celestial Nomads",
  "synopsis": "In a distant galaxy, a group of interstellar travelers embarks on a journey to find a new home, facing unknown dangers and forging new alliances along the way.",
  "rating": 9.3,
  "poster": "https://presigned-url-to-s3-bucket.com/CelestialNomads.png",
  "director": "Emma Rodriguez",
  "year": "2023",
  "duration": "142 min",
  "genre": "Sci-Fi, Adventure",
  "cast": "David Chen, Maria Lopez, James Wilson"
}
```

## POST /movies - Add New Movie

### Request

```bash
curl -X POST \
  https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies \
  -H "Content-Type: multipart/form-data" \
  -F "title=The Quantum Paradox" \
  -F "synopsis=A brilliant physicist discovers a way to manipulate time, but each alteration creates unforeseen consequences in the present." \
  -F "rating=8.9" \
  -F "director=Thomas Wright" \
  -F "year=2024" \
  -F "duration=133 min" \
  -F "genre=Sci-Fi, Drama" \
  -F "cast=Jennifer Adams, Michael Chen, Olivia Rodriguez" \
  -F "poster=quantum_paradox.jpg"
```

### Expected Response

```json
{
  "id": "3a7b9c8d-1e2f-3g4h-5i6j-7k8l9m0n1o2p",
  "title": "The Quantum Paradox",
  "synopsis": "A brilliant physicist discovers a way to manipulate time, but each alteration creates unforeseen consequences in the present.",
  "rating": 8.9,
  "poster": "https://cinedb-bucket-2025.s3.amazonaws.com/3a7b9c8d-1e2f-3g4h-5i6j-7k8l9m0n1o2p_quantum_paradox.jpg",
  "director": "Thomas Wright",
  "year": "2024",
  "duration": "133 min",
  "genre": "Sci-Fi, Drama",
  "cast": "Jennifer Adams, Michael Chen, Olivia Rodriguez"
}
```

## PUT /movies/{id} - Update Movie

### Request

```bash
curl -X PUT \
  https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies/abd657d0-b9f3-4e74-8369-0bb2e361ed02 \
  -H "Content-Type: multipart/form-data" \
  -F "title=The Quantum Paradox" \
  -F "synopsis=A brilliant physicist discovers a way to manipulate time, but each alteration creates unforeseen consequences in the present and future." \
  -F "rating=9.1"
```

### Expected Response

```json
{
  "id": "3a7b9c8d-1e2f-3g4h-5i6j-7k8l9m0n1o2p",
  "title": "The Quantum Paradox",
  "synopsis": "A brilliant physicist discovers a way to manipulate time, but each alteration creates unforeseen consequences in the present and future.",
  "rating": 9.1,
  "poster": "https://cinedb-bucket-2025.s3.amazonaws.com/3a7b9c8d-1e2f-3g4h-5i6j-7k8l9m0n1o2p_quantum_paradox.jpg",
  "director": "Thomas Wright",
  "year": 2024,
  "cast": ["Jennifer Adams", "Michael Chen", "Olivia Rodriguez", "David Kim"]
}
```

## DELETE /movies/{id} - Delete Movie

### Request

```bash
curl -X DELETE \
  https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies/abd657d0-b9f3-4e74-8369-0bb2e361ed02
```

### Expected Response

```json
{
  "message": "Movie with ID 3a7b9c8d-1e2f-3g4h-5i6j-7k8l9m0n1o2p has been deleted successfully",
  "id": "3a7b9c8d-1e2f-3g4h-5i6j-7k8l9m0n1o2p"
}
```

## GET /presigned/{key} - Generate Presigned URL

### Request

```bash
curl -X GET \
  https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/presigned/CelestialNomads.png
```

### Request with Custom Expiration (in seconds)

```bash
curl -X GET \
  "https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/presigned/CelestialNomads.png?expiration=7200"
```

### Expected Response

```json
{
  "presignedUrl": "https://cinedb-bucket-2025.s3.amazonaws.com/CelestialNomads.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20230615%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230615T123456Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=fe5f80f...",
  "expiration": 3600,
  "key": "CelestialNomads.png"
}
```

## Testing with a Shell Script

Create a file called `test-api.sh` with the following content:

```bash
#!/bin/bash
# Script to test the CineDB API

# Set the API endpoint
API_URL="https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod"

# Test 1: Get all movies
echo "Testing GET /movies..."
curl -s -X GET $API_URL/movies | jq

# Test 2: Get movie by ID
echo "Testing GET /movies/{id}..."
curl -s -X GET "$API_URL/movies/1" | jq

# Test 3: Generate presigned URL
echo "Testing GET /presigned/{key}..."
curl -s -X GET "$API_URL/presigned/CelestialNomads.png" | jq

# Test 4: Add a new movie (sample using a local file)
echo "Testing POST /movies..."
echo "Note: This requires a local image file. Adjust the path as needed."
# Uncomment to test
# curl -X POST \
#   $API_URL/movies \
#   -H "Content-Type: multipart/form-data" \
#   -F "title=Test Movie" \
#   -F "synopsis=A test movie added via the API." \
#   -F "rating=8.5" \
#   -F "director=Test Director" \
#   -F "poster=@/path/to/test_image.jpg" | jq

# Note: Further tests require specific IDs from your database
# Adjust them as needed

# Test 5: Update a movie
# echo "Testing PUT /movies/{id}..."
# curl -X PUT \
#   "$API_URL/movies/YOUR_MOVIE_ID" \
#   -H "Content-Type: multipart/form-data" \
#   -F "title=Updated Test Movie" \
#   -F "synopsis=An updated test movie." \
#   -F "rating=9.0" \
#   -F "director=Test Director" \
#   -F "year=2023" \
#   -F "cast=Actor One, Actor Two" | jq

# Test 6: Delete a movie
# echo "Testing DELETE /movies/{id}..."
# curl -X DELETE "$API_URL/movies/YOUR_MOVIE_ID" | jq

echo "API testing complete!"
```

Make it executable and run it:

```bash
chmod +x test-api.sh
./test-api.sh
```

## Testing with Postman

[Postman](https://www.postman.com/) is a powerful API client that makes it easier to test APIs with a graphical interface. Follow these steps to test the CineDB API with Postman:

### Setting Up Postman for CineDB API

1. **Create a new collection**
   - Click "Collections" in the sidebar, then "+" to create a new collection
   - Name it "CineDB API"

2. **Set up environment variables**
   - Click "Environments" in the sidebar, then "+" to create a new environment
   - Name it "CineDB"
   - Add a variable named `api_url` with value `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod`
   - Click "Save"

### Detailed Request Examples

Below are detailed examples for each endpoint with exact request configuration:

#### GET /movies - List All Movies

**Request**:
- Method: GET
- URL: `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies`
- Headers: None required
- Body: None

**Example Response**:
```json
[
  {
    "id": "abd657d0-b9f3-4e74-8369-0bb2e361ed02",
    "title": "The Quantum Paradox",
    "synopsis": "A brilliant physicist discovers a way to manipulate time...",
    "rating": 9.1,
    "director": "Thomas Wright",
    "year": 2024,
    "cast": ["Jennifer Adams", "Michael Chen"],
    "poster": "https://cinedb-bucket-2025.s3.amazonaws.com/..."
  },
  // More movies...
]
```

#### GET /movies/{id} - Get Movie By ID

**Request**:
- Method: GET
- URL: `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies/abd657d0-b9f3-4e74-8369-0bb2e361ed02`
- Headers: None required
- Body: None

**Example Response**:
```json
{
  "id": "abd657d0-b9f3-4e74-8369-0bb2e361ed02",
  "title": "The Quantum Paradox",
  "synopsis": "A brilliant physicist discovers a way to manipulate time...",
  "rating": 9.1,
  "director": "Thomas Wright",
  "year": 2024,
  "cast": ["Jennifer Adams", "Michael Chen"],
  "poster": "https://cinedb-bucket-2025.s3.amazonaws.com/..."
}
```

#### POST /movies - Add New Movie

**Request**:
- Method: POST
- URL: `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies`
- Headers: Automatically set by Postman when using form-data
- Body: form-data

**Body Structure in Postman**:
1. Select "form-data" in the Body tab
2. Add these key-value pairs:

| Key       | Value Type | Value                                                       |
|-----------|------------|-------------------------------------------------------------|
| title     | Text       | Interstellar Journey                                        |
| synopsis  | Text       | A team of explorers travel through a wormhole in space...   |
| rating    | Text       | 8.7                                                         |
| director  | Text       | Christopher Johnson                                         |
| year      | Text       | 2025                                                        |
| cast      | Text       | Emma Stone, Ryan Reynolds, John Cho                         |
| poster    | File       | [Select a file from your computer]                          |

**Example Response**:
```json
{
  "message": "Movie added successfully",
  "movie": {
    "id": "c18d92e4-f5a7-4e26-8761-92b5ab24c1f7",
    "title": "Interstellar Journey",
    "synopsis": "A team of explorers travel through a wormhole in space...",
    "rating": 8.7,
    "director": "Christopher Johnson",
    "year": 2025,
    "cast": ["Emma Stone", "Ryan Reynolds", "John Cho"],
    "poster": "https://cinedb-bucket-2025.s3.amazonaws.com/c18d92e4-f5a7-4e26-8761-92b5ab24c1f7.jpg",
    "createdAt": "2025-04-22T14:30:25.123456"
  }
}
```

#### PUT /movies/{id} - Update Movie

**Request**:
- Method: PUT
- URL: `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies/1dccfd37-4920-49cf-b7cc-3e356139d5e9`
- Headers: Automatically set by Postman when using form-data
- Body: form-data

**Body Structure in Postman**:
1. Select "form-data" in the Body tab
2. Add these key-value pairs (only include fields you want to update):

| Key       | Value Type | Value                                                     |
|-----------|------------|-----------------------------------------------------------|
| title     | Text       | The Quantum Paradox: Extended Edition                     |
| synopsis  | Text       | A brilliant physicist discovers a way to manipulate time in unexpected ways...|
| rating    | Text       | 9.3                                                       |
| director  | Text       | Thomas Wright                                             |
| year      | Text       | 2024                                                      |
| cast      | Text       | Jennifer Adams, Michael Chen, Sarah Lopez                 |
| poster    | File       | [Select a file from your computer - optional]             |

**Example Response**:
```json
{
  "message": "Movie updated successfully",
  "movie": {
    "id": "abd657d0-b9f3-4e74-8369-0bb2e361ed02",
    "title": "The Quantum Paradox: Extended Edition",
    "synopsis": "A brilliant physicist discovers a way to manipulate time in unexpected ways...",
    "rating": 9.3,
    "director": "Thomas Wright",
    "year": 2024,
    "cast": ["Jennifer Adams", "Michael Chen", "Sarah Lopez"],
    "poster": "https://cinedb-bucket-2025.s3.amazonaws.com/abd657d0-b9f3-4e74-8369-0bb2e361ed02.jpg",
    "updatedAt": "2025-04-22T15:45:12.654321"
  }
}
```

#### DELETE /movies/{id} - Delete Movie

**Request**:
- Method: DELETE
- URL: `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies/abd657d0-b9f3-4e74-8369-0bb2e361ed02`
- Headers: None required
- Body: None

**Example Response**:
```json
{
  "message": "Movie with ID abd657d0-b9f3-4e74-8369-0bb2e361ed02 has been deleted successfully",
  "id": "abd657d0-b9f3-4e74-8369-0bb2e361ed02"
}
```

#### GET /presigned/{key} - Generate Presigned URL

**Request**:
- Method: GET
- URL: `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/presigned/abd657d0-b9f3-4e74-8369-0bb2e361ed02.jpg`
- Headers: None required
- Body: None

**Optional**: Add expiration parameter
- URL with parameter: `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/presigned/abd657d0-b9f3-4e74-8369-0bb2e361ed02.jpg?expiration=7200`

**Example Response**:
```json
{
  "presignedUrl": "https://cinedb-bucket-2025.s3.amazonaws.com/abd657d0-b9f3-4e74-8369-0bb2e361ed02.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20230615%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20230615T123456Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=fe5f80f...",
  "expiration": 3600,
  "key": "abd657d0-b9f3-4e74-8369-0bb2e361ed02.jpg"
}
```

### Tips for Successful Testing in Postman

1. **For multipart/form-data requests**:
   - Let Postman set the Content-Type header automatically
   - For file uploads, make sure to select "File" from the dropdown next to the key name
   - You can use the "Preview" option in Postman to see the request before sending

2. **For troubleshooting**:
   - Use the "Console" in Postman to view detailed request/response information
   - Check the "Headers" tab to verify correct Content-Type and boundaries

3. **If you encounter 403/502 errors**:
   - Make sure API Gateway is configured for binary content types (multipart/form-data)
   - Check that your Lambda function has proper permissions

### Using Postman Tests to Automate Workflow

You can use Postman's "Tests" tab to automate your testing workflow:

**Example: Automatically save movie ID from creation response**:
```javascript
// In the Tests tab of your POST /movies request
var jsonData = pm.response.json();
if (jsonData.movie && jsonData.movie.id) {
    pm.environment.set("movie_id", jsonData.movie.id);
    console.log("Saved movie ID: " + jsonData.movie.id);
}
```

Then use `{{movie_id}}` in subsequent requests:
- GET: `{{api_url}}/movies/{{movie_id}}`
- PUT: `{{api_url}}/movies/{{movie_id}}`
- DELETE: `{{api_url}}/movies/{{movie_id}}`

## Troubleshooting Common Issues

### IAM Permission Issues

#### DynamoDB Access Denied
If you encounter an error message like this:
```
{"error": "DynamoDB error: An error occurred (AccessDeniedException) when calling the Scan operation: User: arn:aws:sts::472443946497:assumed-role/lambda-dynamodb-s3-role/get-all-movies is not authorized to perform: dynamodb:Scan on resource: arn:aws:dynamodb:us-east-1:472443946497:table/cinedb because no identity-based policy allows the dynamodb:Scan action"}
```

Or like this:
```
{"error": "Error saving movie: An error occurred (AccessDeniedException) when calling the PutItem operation: User: arn:aws:sts::472443946497:assumed-role/cinedb-lambda-role/add-movie is not authorized to perform: dynamodb:PutItem on resource: arn:aws:dynamodb:us-east-1:472443946497:table/cinedb because no identity-based policy allows the dynamodb:PutItem action"}
```

This indicates that your Lambda function doesn't have permission to perform the operation on DynamoDB. To fix this:

1. Create a policy file with all necessary permissions (see `lambda-policy.json` in the docs directory)
2. **Important**: Check which IAM role the Lambda function is using (in the error message above, you can see roles like "lambda-dynamodb-s3-role" or "cinedb-lambda-role")
3. Attach the policy to the appropriate Lambda execution role:
   ```bash
   # For functions using lambda-dynamodb-s3-role
   aws iam put-role-policy --role-name lambda-dynamodb-s3-role --policy-name DynamoDBAndS3FullAccess --policy-document file://lambda-policy.json
   
   # For functions using cinedb-lambda-role
   aws iam put-role-policy --role-name cinedb-lambda-role --policy-name DynamoDBAndS3FullAccess --policy-document file://lambda-policy.json
   ```
4. For immediate effect, update your Lambda function configuration:
   ```bash
   aws lambda update-function-configuration --function-name FUNCTION_NAME --description "Updated to refresh IAM permissions" --region us-east-1
   ```

#### S3 Access Denied
If your Lambda function is unable to access S3 for retrieving or storing poster images, you'll need to ensure the IAM role has the appropriate S3 permissions including `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, and `s3:ListBucket`.

### 403 Forbidden
- This usually means that the Lambda function doesn't have permission to be invoked by API Gateway.
- Check that you've added the Lambda permissions correctly using the `aws lambda add-permission` command.
- Verify that the source ARN in the permission matches your API Gateway ARN pattern.

### 502 Bad Gateway
- This means there's an issue with your Lambda function execution.
- Check the CloudWatch logs for the Lambda function to see what's wrong.
- Common causes include:
  - Internal code errors in the Lambda function
  - Timeouts due to slow database operations
  - Memory or CPU constraints

### CORS Issues
- If you see CORS errors in the browser console, ensure that the OPTIONS method is correctly set up with the proper response headers.
- Verify that 'Access-Control-Allow-Origin' is set to '*' or your specific domain.
- For preflight requests with custom headers, ensure 'Access-Control-Allow-Headers' includes all required headers.

### Binary Content (Images) Issues
- For operations involving file uploads, ensure that your API Gateway is configured to handle binary content types.
- You may need to add 'multipart/form-data' to the binary media types list in your API settings.
- To add binary support to your API:
  ```bash
  aws apigateway update-rest-api \
    --rest-api-id $API_ID \
    --patch-operations op=add,path=/binaryMediaTypes/multipart~1form-data \
    --region $REGION
  ``` 