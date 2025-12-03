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
DEFAULT_EXPIRATION = int(os.environ.get('DEFAULT_EXPIRATION', '3600'))  # Default: 1 hour

# Initialize AWS clients using the specified region
s3_client = boto3.client('s3', region_name=AWS_REGION)

# Regex pattern to extract the S3 key from a full URL
url_pattern = re.compile(r'https?://[^/]+\.amazonaws\.com/([^?]+)')

def generate_presigned_url(key, expiration=DEFAULT_EXPIRATION):
    """
    Generate a presigned URL for an S3 object
    
    Args:
        key (str): The S3 object key
        expiration (int): The URL expiration time in seconds (default: 1 hour)
        
    Returns:
        str: The presigned URL or None if an error occurs
    """
    try:
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': key
            },
            ExpiresIn=expiration
        )
        
        # Handle any backslash issues
        if presigned_url.endswith('\\'):
            presigned_url = presigned_url[:-1]
            
        presigned_url = presigned_url.replace('\\\\', '\\')
        
        return presigned_url
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return None

def lambda_handler(event, context):
    """
    Lambda handler function to generate a presigned URL for an S3 object
    
    Args:
        event (dict): The event data passed to the function. Expected to contain:
                     - pathParameters.key: The S3 object key or full URL
                     - OR queryStringParameters.key: The S3 object key or full URL
                     - OPTIONAL: queryStringParameters.expiration: URL expiration time in seconds
        context (LambdaContext): The runtime information of the Lambda function
        
    Returns:
        dict: API Gateway response object with status code, headers, and body
    """
    try:
        # Extract key and expiration from the event
        key = None
        expiration = DEFAULT_EXPIRATION
        
        # Check if the key is in path parameters (API Gateway REST API)
        if event.get('pathParameters') and 'key' in event['pathParameters']:
            key = event['pathParameters']['key']
        
        # Check if the key is in query string parameters (API Gateway HTTP API or direct invoke)
        elif event.get('queryStringParameters'):
            if 'key' in event['queryStringParameters']:
                key = event['queryStringParameters']['key']
            
            # Check for custom expiration time
            if 'expiration' in event['queryStringParameters']:
                try:
                    expiration = int(event['queryStringParameters']['expiration'])
                    # Set limits for expiration time (minimum: 60 seconds, maximum: 7 days)
                    expiration = max(60, min(expiration, 604800))
                except ValueError:
                    # If not a valid integer, use default
                    pass
            
        # Check if it's in the body (for direct invocations)
        elif event.get('body'):
            try:
                if isinstance(event['body'], str):
                    body = json.loads(event['body'])
                else:
                    body = event['body']
                    
                if 'key' in body:
                    key = body['key']
                
                if 'expiration' in body:
                    try:
                        expiration = int(body['expiration'])
                        # Set limits for expiration time
                        expiration = max(60, min(expiration, 604800))
                    except (ValueError, TypeError):
                        # If not a valid integer, use default
                        pass
            except:
                pass
        
        # If no key was found, return an error
        if not key:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'S3 object key is required'
                })
            }
        
        # If key is a full URL, extract the actual key
        match = url_pattern.match(key)
        if match:
            key = match.group(1)
        
        # Generate the presigned URL
        presigned_url = generate_presigned_url(key, expiration)
        
        if not presigned_url:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to generate presigned URL'
                })
            }
        
        # Return the presigned URL
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps({
                'presignedUrl': presigned_url,
                'expiration': expiration,
                'key': key
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