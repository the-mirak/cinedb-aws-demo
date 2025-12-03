#!/bin/bash
# Script to test the CineDB API

# Set the API endpoint
API_URL="https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install it to format JSON output."
    echo "Install with: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    exit 1
fi

# Test 1: Get all movies
echo -e "\n\033[1;36m=== Testing GET /movies ===\033[0m"
echo "Request: curl -X GET $API_URL/movies"
response=$(curl -s -X GET $API_URL/movies)
echo "Response:"
echo $response | jq

# Test 2: Get movie by ID
echo -e "\n\033[1;36m=== Testing GET /movies/{id} ===\033[0m"
movie_id="1"  # Adjust as needed
echo "Request: curl -X GET $API_URL/movies/$movie_id"
response=$(curl -s -X GET "$API_URL/movies/$movie_id")
echo "Response:"
echo $response | jq

# Test 3: Generate presigned URL
echo -e "\n\033[1;36m=== Testing GET /presigned/{key} ===\033[0m"
key="CelestialNomads.png"  # Adjust as needed
echo "Request: curl -X GET $API_URL/presigned/$key"
response=$(curl -s -X GET "$API_URL/presigned/$key")
echo "Response:"
echo $response | jq

# Test 4: Add a new movie
echo -e "\n\033[1;36m=== Testing POST /movies ===\033[0m"
echo "Note: This test is commented out by default as it requires a local image file."
echo "To test, uncomment the code below and adjust the image path."
echo "Request example:"
echo "curl -X POST \\"
echo "  $API_URL/movies \\"
echo "  -H \"Content-Type: multipart/form-data\" \\"
echo "  -F \"title=Test Movie\" \\"
echo "  -F \"synopsis=A test movie added via the API.\" \\"
echo "  -F \"rating=8.5\" \\"
echo "  -F \"director=Test Director\" \\"
echo "  -F \"poster=@/path/to/test_image.jpg\""

# Uncomment to test
# echo "Running request..."
# response=$(curl -s -X POST \
#   $API_URL/movies \
#   -H "Content-Type: multipart/form-data" \
#   -F "title=Test Movie" \
#   -F "synopsis=A test movie added via the API." \
#   -F "rating=8.5" \
#   -F "director=Test Director" \
#   -F "poster=@/path/to/test_image.jpg")
# echo "Response:"
# echo $response | jq

# Test 5: Update a movie
echo -e "\n\033[1;36m=== Testing PUT /movies/{id} ===\033[0m"
echo "Note: This test is commented out by default as it requires a specific movie ID."
echo "To test, uncomment the code below and replace YOUR_MOVIE_ID with an actual ID."
echo "Request example:"
echo "curl -X PUT \\"
echo "  $API_URL/movies/YOUR_MOVIE_ID \\"
echo "  -H \"Content-Type: multipart/form-data\" \\"
echo "  -F \"title=Updated Test Movie\" \\"
echo "  -F \"synopsis=An updated test movie.\" \\"
echo "  -F \"rating=9.0\""

# Uncomment to test
# echo "Running request..."
# movie_id="YOUR_MOVIE_ID"  # Replace with an actual ID
# response=$(curl -s -X PUT \
#   "$API_URL/movies/$movie_id" \
#   -H "Content-Type: multipart/form-data" \
#   -F "title=Updated Test Movie" \
#   -F "synopsis=An updated test movie." \
#   -F "rating=9.0")
# echo "Response:"
# echo $response | jq

# Test 6: Delete a movie
echo -e "\n\033[1;36m=== Testing DELETE /movies/{id} ===\033[0m"
echo "Note: This test is commented out by default as it permanently deletes a movie."
echo "To test, uncomment the code below and replace YOUR_MOVIE_ID with an actual ID."
echo "Request example:"
echo "curl -X DELETE $API_URL/movies/YOUR_MOVIE_ID"

# Uncomment to test
# echo "Running request..."
# movie_id="YOUR_MOVIE_ID"  # Replace with an actual ID
# response=$(curl -s -X DELETE "$API_URL/movies/$movie_id")
# echo "Response:"
# echo $response | jq

echo -e "\n\033[1;32m=== API testing complete! ===\033[0m" 