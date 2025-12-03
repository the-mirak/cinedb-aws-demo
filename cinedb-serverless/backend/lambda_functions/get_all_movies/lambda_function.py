import json
import boto3
import os
import re
import decimal
from botocore.exceptions import ClientError

# Custom JSON encoder to handle Decimal objects returned by DynamoDB
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            # Convert Decimal to int if it has no decimal component
            if o % 1 == 0:
                return int(o)
            # Otherwise convert to float
            return float(o)
        # Let the base class default method handle other types
        return super(DecimalEncoder, self).default(o)

# Environment variables with default values
# These can be overridden in the Lambda function configuration
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'cinedb')
S3_BUCKET = os.environ.get('S3_BUCKET', 'cinedb-bucket-2025')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize AWS clients using the specified region
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(DYNAMODB_TABLE)
s3_client = boto3.client('s3', region_name=AWS_REGION)

# Regex pattern to extract the S3 key from a full URL
# Example: https://bucket-name.s3.region.amazonaws.com/filename.jpg -> filename.jpg
url_pattern = re.compile(r'https?://[^/]+\.amazonaws\.com/([^?]+)')

def generate_presigned_url(movie):
    """
    Generate a presigned URL for the movie poster if it exists
    
    This function:
    1. Checks if the movie has a poster URL
    2. Extracts the S3 key from the full URL
    3. Generates a temporary access URL valid for 1 hour
    4. Adds the URL to the movie object as 'poster_url'
    
    Args:
        movie (dict): A movie record from DynamoDB
        
    Returns:
        dict: The movie object with an additional 'poster_url' field if applicable
    """
    if 'poster' in movie and movie['poster']:
        try:
            # Extract the key from the full URL if it's a full URL
            match = url_pattern.match(movie['poster'])
            if match:
                key = match.group(1)
            else:
                # If it's not a full URL, assume it's just the key
                key = movie['poster']
            
            # Generate a presigned URL with 1-hour expiration
            # This allows temporary access to the private S3 object
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': key
                },
                ExpiresIn=3600  # Keep to 1 hour (3600 seconds)
            )
            
            # Remove any trailing backslash characters that might be added
            # This is essential to make the URL usable with proper expiration
            if url.endswith('\\'):
                url = url[:-1]
                
            # Ensure all backslashes are properly handled (this fixes AWS URL issues)
            url = url.replace('\\\\', '\\')
            
            movie['poster_url'] = url
        except Exception as e:
            # If there's an error generating the URL, keep the original poster URL
            # This ensures the function doesn't fail if S3 access issues occur
            movie['poster_url'] = movie['poster']
            print(f"Error generating presigned URL: {str(e)}")
    
    return movie

def lambda_handler(event, context):
    """
    Lambda handler function - entry point for the Lambda function
    
    Process:
    1. Retrieves all movies from DynamoDB using scan operation
    2. Handles pagination if there are more items than the scan limit
    3. Generates presigned URLs for each movie's poster image
    4. Returns the movies as a JSON response with CORS headers
    
    Args:
        event (dict): The event data passed to the function
        context (LambdaContext): The runtime information of the Lambda function
        
    Returns:
        dict: API Gateway response object with status code, headers, and body
    """
    try:
        # Get all movies from DynamoDB using scan operation
        # Initial scan retrieves the first batch of items (up to 1MB)
        response = table.scan()
        movies = response.get('Items', [])
        
        # Process any pagination (if there are more items)
        # DynamoDB scan has a 1MB limit per operation, so we need to handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            movies.extend(response.get('Items', []))
        
        # Create a "clean" version of each movie for the API
        api_movies = []
        for movie in movies:
            # Generate the URL first
            generate_presigned_url(movie)
            
            # Create a new object with just the fields we need
            api_movie = {
                'id': movie['id'],
                'title': movie['title'],
                'year': movie.get('year', None),
                'duration': movie.get('duration', None),
                'synopsis': movie.get('synopsis', ''),
                'rating': movie.get('rating', 0),
                'poster': movie.get('poster_url', '')  # Use the presigned URL directly
            }
            api_movies.append(api_movie)
        
        # Return the clean objects
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',  # Allow access from any origin
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'movies': api_movies}, cls=DecimalEncoder)
        }
    
    except ClientError as e:
        # Handle specific DynamoDB errors (e.g., table not found, permission issues)
        # Return a 500 status code with error details
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f"DynamoDB error: {str(e)}"
            }, cls=DecimalEncoder)
        }
    
    except Exception as e:
        # Handle any other unexpected errors
        # This is a catch-all for any other exceptions that might occur
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f"An unexpected error occurred: {str(e)}"
            }, cls=DecimalEncoder)
        }