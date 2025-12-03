import base64
import json

# Create a multipart form data payload
boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
body = ""

# Add title field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"title\"\r\n\r\n"
body += "Test Movie Title\r\n"

# Add synopsis field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"synopsis\"\r\n\r\n"
body += "This is a test movie synopsis.\r\n"

# Add rating field
body += f"--{boundary}\r\n"
body += "Content-Disposition: form-data; name=\"rating\"\r\n\r\n"
body += "8.5\r\n"

# Close boundary
body += f"--{boundary}--\r\n"

# Create the test event
event = {
    "httpMethod": "POST",
    "headers": {
        "content-type": f"multipart/form-data; boundary={boundary}"
    },
    "body": base64.b64encode(body.encode()).decode(),
    "isBase64Encoded": True
}

# Write to file
with open("test-multipart.json", "w") as f:
    json.dump(event, f, indent=2)

print("Test payload created: test-multipart.json")
