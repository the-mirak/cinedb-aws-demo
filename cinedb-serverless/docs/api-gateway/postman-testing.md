# Testing CineDB API with Postman

This guide provides detailed examples for testing the CineDB API using Postman.

## API Base URL

```
https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod
```

## Setting Up Postman for CineDB API

1. **Create a new collection**
   - Click "Collections" in the sidebar, then "+" to create a new collection
   - Name it "CineDB API"

2. **Set up environment variables**
   - Click "Environments" in the sidebar, then "+" to create a new environment
   - Name it "CineDB"
   - Add a variable named `api_url` with value `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod`
   - Click "Save"

## Detailed Request Examples

Below are detailed examples for each endpoint with exact request configuration:

### GET /movies - List All Movies

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

### GET /movies/{id} - Get Movie By ID

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

### POST /movies - Add New Movie

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

### PUT /movies/{id} - Update Movie

**Request**:
- Method: PUT
- URL: `https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies/abd657d0-b9f3-4e74-8369-0bb2e361ed02`
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

### DELETE /movies/{id} - Delete Movie

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

### GET /presigned/{key} - Generate Presigned URL

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

## Tips for Successful Testing in Postman

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

## Using Postman Tests to Automate Workflow

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