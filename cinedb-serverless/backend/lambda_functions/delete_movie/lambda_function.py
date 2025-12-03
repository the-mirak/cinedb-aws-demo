import json
import boto3
import os
import re
from botocore.exceptions import ClientError

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

def lambda_handler(event, context):
    """
    Lambda handler function to delete a movie and its associated poster image
    
    Args:
        event (dict): The event data passed to the function. Expected to contain:
                     - pathParameters.id: The ID of the movie to delete
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
        
        # First, get the movie to retrieve its poster URL
        try:
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
            
            # Get the movie item and extract the poster URL
            movie = response['Item']
            poster_url = movie.get('poster', None)
            
            # Delete the movie from DynamoDB
            table.delete_item(Key={'id': movie_id})
            
            # If there's a poster, delete it from S3
            if poster_url:
                try:
                    # Extract the key from the full URL
                    match = url_pattern.match(poster_url)
                    if match:
                        s3_key = match.group(1)
                        
                        # Delete the object from S3
                        s3_client.delete_object(
                            Bucket=S3_BUCKET,
                            Key=s3_key
                        )
                except Exception as e:
                    # Log the error but don't fail the entire operation
                    print(f"Error deleting poster from S3: {str(e)}")
            
            # Return success response
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({
                    'message': f'Movie with ID {movie_id} has been deleted successfully',
                    'id': movie_id
                })
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
                })
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
            })
        }