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
url_pattern = re.compile(r'https?://[^/]+\.amazonaws\.com/([^?]+)')

def generate_presigned_url(movie):
    """
    Generate a presigned URL for the movie poster if it exists
    
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
            url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': key
                },
                ExpiresIn=3600  # 1 hour
            )
            
            # Handle any backslash issues
            if url.endswith('\\'):
                url = url[:-1]
                
            url = url.replace('\\\\', '\\')
            
            movie['poster_url'] = url
        except Exception as e:
            movie['poster_url'] = movie['poster']
            print(f"Error generating presigned URL: {str(e)}")
    
    return movie

def lambda_handler(event, context):
    """
    Lambda handler function to retrieve a single movie by ID
    
    Args:
        event (dict): The event data passed to the function. Expected to contain:
                     - pathParameters.id: The ID of the movie to retrieve
                     - OR queryStringParameters.id: The ID of the movie
        context (LambdaContext): The runtime information of the Lambda function
        
    Returns:
        dict: API Gateway response object with status code, headers, and body
    """
    try:
        # Extract movie ID from the event
        movie_id = None
        
        # Check if the ID is in path parameters (API Gateway REST API)
        if event.get('pathParameters') and 'id' in event['pathParameters']:
            movie_id = event['pathParameters']['id']
        
        # Check if the ID is in query string parameters (API Gateway HTTP API or direct invoke)
        elif event.get('queryStringParameters') and 'id' in event['queryStringParameters']:
            movie_id = event['queryStringParameters']['id']
            
        # Check if it's in the body (for direct invocations)
        elif event.get('body'):
            try:
                if isinstance(event['body'], str):
                    body = json.loads(event['body'])
                else:
                    body = event['body']
                    
                if 'id' in body:
                    movie_id = body['id']
            except:
                pass
        
        # If no ID was found, return an error
        if not movie_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Movie ID is required'
                })
            }
        
        # Get the movie from DynamoDB
        response = table.get_item(Key={'id': movie_id})
        
        # Check if the movie was found
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Movie with ID {movie_id} not found'
                })
            }
        
        # Get the movie item
        movie = response['Item']
        
        # Generate presigned URL for the poster
        generate_presigned_url(movie)
        
        # Create a clean response object
        api_movie = {
            'id': movie['id'],
            'title': movie['title'],
            'year': movie.get('year', None),
            'synopsis': movie.get('synopsis', ''),
            'rating': movie.get('rating', 0),
            'duration': movie.get('duration', None),
            'director': movie.get('director', ''),
            'genre': movie.get('genre', ''),
            'cast': movie.get('cast', ''),
            'poster_url': movie.get('poster_url', ''),  # Use the presigned URL with correct field name
            'createdAt': movie.get('createdAt', ''),
            'updatedAt': movie.get('updatedAt', '')
        }
        
        # Return the movie details
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps(api_movie, cls=DecimalEncoder)
        }
    
    except ClientError as e:
        # Handle DynamoDB specific errors
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