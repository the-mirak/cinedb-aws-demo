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
MOVIE_ID = "abd657d0-b9f3-4e74-8369-0bb2e361ed02"
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
