import json
import boto3
import os
import uuid
import base64
import re
from io import BytesIO
from datetime import datetime
from decimal import Decimal
from botocore.exceptions import ClientError

# Environment variables with default values
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'cinedb')
S3_BUCKET = os.environ.get('S3_BUCKET', 'cinedb-bucket-2025')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(DYNAMODB_TABLE)
s3_client = boto3.client('s3', region_name=AWS_REGION)

def parse_multipart_data(content_type, body):
    """
    Parse multipart form data from API Gateway binary content
    
    Args:
        content_type (str): The Content-Type header with boundary information
        body (str/bytes): The request body containing multipart form data
        
    Returns:
        dict: A dictionary of form fields and files
    """
    # Extract boundary from content type
    boundary_match = re.search(r'boundary=([^;]+)', content_type)
    if not boundary_match:
        raise ValueError("No boundary found in Content-Type")
    
    boundary = boundary_match.group(1)
    
    # Ensure body is bytes
    if isinstance(body, str):
        if body.startswith("'") and body.endswith("'"):
            body = body[1:-1]  # Remove surrounding quotes if present
        
        # Check if body is base64 encoded
        try:
            body = base64.b64decode(body)
        except Exception:
            body = body.encode('utf-8')
    
    # Split body by boundary
    parts = body.split(f'--{boundary}'.encode('utf-8'))
    
    # Parse each part
    result = {'fields': {}, 'files': {}}
    
    for part in parts:
        if b'\r\n\r\n' not in part:
            continue
        
        # Split headers and content
        headers_raw, content = part.split(b'\r\n\r\n', 1)
        headers = {}
        
        # Parse headers
        for header_line in headers_raw.split(b'\r\n'):
            if b':' in header_line:
                header_name, header_value = header_line.split(b':', 1)
                headers[header_name.strip().decode('utf-8').lower()] = header_value.strip().decode('utf-8')
        
        # Remove trailing boundary if present
        if content.endswith(b'\r\n'):
            content = content[:-2]
        
        # Check Content-Disposition for field name and filename
        if 'content-disposition' in headers:
            cd_parts = headers['content-disposition'].split(';')
            
            # Get field name
            field_name = None
            for part in cd_parts:
                if 'name=' in part:
                    field_name = part.split('=', 1)[1].strip('"\'')
                    break
            
            if not field_name:
                continue
            
            # Check if this is a file
            filename = None
            for part in cd_parts:
                if 'filename=' in part:
                    filename = part.split('=', 1)[1].strip('"\'')
                    break
            
            if filename:
                # This is a file
                content_type = headers.get('content-type', 'application/octet-stream')
                result['files'][field_name] = {
                    'filename': filename,
                    'content_type': content_type,
                    'content': content
                }
            else:
                # This is a regular field
                result['fields'][field_name] = content.decode('utf-8')
    
    return result

def upload_file_to_s3(file_data, key_prefix=""):
    """
    Upload a file to S3 and return the URL
    
    Args:
        file_data (dict): The file data containing content, filename, and content_type
        key_prefix (str): Optional prefix for the S3 key
        
    Returns:
        str: The URL of the uploaded file
    """
    # Generate a unique S3 key
    file_extension = os.path.splitext(file_data['filename'])[1]
    s3_key = f"{key_prefix}{str(uuid.uuid4())}{file_extension}"
    
    # Upload the file
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=file_data['content'],
        ContentType=file_data['content_type']
    )
    
    # Return the S3 URL
    return f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"

def lambda_handler(event, context):
    """
    Lambda handler function for adding a new movie
    
    Args:
        event (dict): The event data passed to the function
        context (object): The runtime information
        
    Returns:
        dict: Response object with status code, headers, and body
    """
    try:
        # Handle CORS preflight requests
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': ''
            }
        
        # Parse request data
        content_type = event.get('headers', {}).get('content-type', '') or event.get('headers', {}).get('Content-Type', '')
        
        # Handle JSON requests (for testing and simple submissions)
        if 'application/json' in content_type:
            try:
                body = event.get('body', '{}')
                if isinstance(body, str):
                    json_data = json.loads(body)
                else:
                    json_data = body
                
                form_data = {'fields': json_data, 'files': {}}
            except json.JSONDecodeError:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid JSON in request body'})
                }
        
        # Handle multipart form data (for file uploads)
        elif 'multipart/form-data' in content_type:
            # Get the body - might be in different formats depending on API Gateway configuration
            body = event.get('body', '')
            
            # Check if body is base64 encoded (API Gateway setting)
            if event.get('isBase64Encoded', False):
                body = base64.b64decode(body)
            
            # Parse the multipart form data
            form_data = parse_multipart_data(content_type, body)
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Content-Type must be application/json or multipart/form-data'})
            }
        
        # Validate required fields
        required_fields = ['title', 'year']
        for field in required_fields:
            if field not in form_data['fields']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Prepare movie data
        movie_data = {
            'id': str(uuid.uuid4()),
            'title': form_data['fields']['title'],
            'year': int(form_data['fields']['year']),
            'createdAt': datetime.now().isoformat()
        }
        
        # Add optional fields
        if 'synopsis' in form_data['fields'] and form_data['fields']['synopsis']:
            movie_data['synopsis'] = form_data['fields']['synopsis']
        
        if 'rating' in form_data['fields'] and form_data['fields']['rating']:
            movie_data['rating'] = Decimal(form_data['fields']['rating'])
        
        if 'duration' in form_data['fields'] and form_data['fields']['duration']:
            movie_data['duration'] = int(form_data['fields']['duration'])
        
        if 'director' in form_data['fields'] and form_data['fields']['director']:
            movie_data['director'] = form_data['fields']['director']
        
        if 'genre' in form_data['fields'] and form_data['fields']['genre']:
            movie_data['genre'] = form_data['fields']['genre']
        
        if 'cast' in form_data['fields'] and form_data['fields']['cast']:
            movie_data['cast'] = form_data['fields']['cast']
        
        # Handle poster URL if provided (no file upload)
        if 'poster_url' in form_data['fields'] and form_data['fields']['poster_url']:
            movie_data['poster'] = form_data['fields']['poster_url']
        
        # Upload poster image if provided
        if 'poster' in form_data['files']:
            try:
                poster_url = upload_file_to_s3(form_data['files']['poster'])
                movie_data['poster'] = poster_url
            except Exception as e:
                print(f"Error uploading image: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Error uploading image: {str(e)}'})
                }
        
        # Save movie to DynamoDB
        try:
            table.put_item(Item=movie_data)
        except ClientError as e:
            print(f"Error saving to DynamoDB: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Error saving movie: {str(e)}'})
            }
        
        # Return success response
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Movie added successfully',
                'movie': movie_data
            }, default=lambda o: str(o) if isinstance(o, Decimal) else o)
        }
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'An unexpected error occurred: {str(e)}'})
        } 