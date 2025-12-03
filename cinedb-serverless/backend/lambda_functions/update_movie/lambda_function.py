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
            
            if filename and filename != '':
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

def upload_file_to_s3(file_data, movie_id, key_prefix=""):
    """
    Upload a file to S3 and return the URL
    
    Args:
        file_data (dict): The file data containing content, filename, and content_type
        movie_id (str): The ID of the movie to update
        key_prefix (str): Optional prefix for the S3 key
        
    Returns:
        str: The URL of the uploaded file
    """
    # Generate an S3 key using movie ID and preserving the file extension
    file_extension = os.path.splitext(file_data['filename'])[1]
    s3_key = f"{key_prefix}{movie_id}{file_extension}"
    
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
    Lambda handler function for updating an existing movie
    
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
                    'Access-Control-Allow-Methods': 'PUT,POST,OPTIONS'
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
        
        # Extract movie ID from path parameters or form data
        movie_id = None
        
        # Check if the ID is in path parameters (API Gateway REST API)
        if event.get('pathParameters') and 'id' in event['pathParameters']:
            movie_id = event['pathParameters']['id']
        # Check if it's in the form data
        elif 'id' in form_data['fields']:
            movie_id = form_data['fields']['id']
        
        # If no ID was found, return an error
        if not movie_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Movie ID is required'})
            }
        
        # Check if the movie exists
        try:
            response = table.get_item(Key={'id': movie_id})
            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Movie with ID {movie_id} not found'})
                }
            existing_movie = response['Item']
        except ClientError as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Error checking movie existence: {str(e)}'})
            }
        
        # Prepare update expression and attributes
        update_expression_parts = []
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        # Handle text fields (title, synopsis, rating)
        if 'title' in form_data['fields'] and form_data['fields']['title']:
            update_expression_parts.append('title = :title')
            expression_attribute_values[':title'] = form_data['fields']['title']
        
        if 'synopsis' in form_data['fields'] and form_data['fields']['synopsis']:
            update_expression_parts.append('synopsis = :synopsis')
            expression_attribute_values[':synopsis'] = form_data['fields']['synopsis']
        
        if 'rating' in form_data['fields'] and form_data['fields']['rating']:
            update_expression_parts.append('rating = :rating')
            expression_attribute_values[':rating'] = Decimal(form_data['fields']['rating'])
        
        # Add support for director field
        if 'director' in form_data['fields'] and form_data['fields']['director']:
            update_expression_parts.append('director = :director')
            expression_attribute_values[':director'] = form_data['fields']['director']
        
        # Add support for genre field
        if 'genre' in form_data['fields'] and form_data['fields']['genre']:
            update_expression_parts.append('genre = :genre')
            expression_attribute_values[':genre'] = form_data['fields']['genre']
        
        # Add support for year field
        if 'year' in form_data['fields'] and form_data['fields']['year']:
            update_expression_parts.append('#year = :year')
            expression_attribute_names['#year'] = 'year'
            expression_attribute_values[':year'] = int(form_data['fields']['year'])
        
        # Add support for duration field
        if 'duration' in form_data['fields'] and form_data['fields']['duration']:
            update_expression_parts.append('#duration = :duration')
            expression_attribute_names['#duration'] = 'duration'
            expression_attribute_values[':duration'] = int(form_data['fields']['duration'])
        
        # Add support for cast field (assuming it's a comma-separated string that will be converted to a list)
        if 'cast' in form_data['fields'] and form_data['fields']['cast']:
            update_expression_parts.append('#cast_attr = :cast')
            expression_attribute_names['#cast_attr'] = 'cast'
            # If cast is sent as a comma-separated string, split it into a list
            cast_value = form_data['fields']['cast']
            if isinstance(cast_value, str):
                cast_value = [actor.strip() for actor in cast_value.split(',') if actor.strip()]
            expression_attribute_values[':cast'] = cast_value
        
        # Handle poster URL if provided (no file upload)
        if 'poster_url' in form_data['fields'] and form_data['fields']['poster_url']:
            update_expression_parts.append('poster = :poster')
            expression_attribute_values[':poster'] = form_data['fields']['poster_url']
        
        # Handle poster image update if provided
        if 'poster' in form_data['files']:
            try:
                poster_url = upload_file_to_s3(form_data['files']['poster'], movie_id)
                update_expression_parts.append('poster = :poster')
                expression_attribute_values[':poster'] = poster_url
            except Exception as e:
                print(f"Error uploading image: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Error uploading image: {str(e)}'})
                }
        
        # If no fields to update, return early
        if not update_expression_parts:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No fields to update'})
            }
        
        # Add updatedAt timestamp
        update_expression_parts.append('updatedAt = :updatedAt')
        expression_attribute_values[':updatedAt'] = datetime.now().isoformat()
        
        # Construct the final update expression
        update_expression = 'SET ' + ', '.join(update_expression_parts)
        
        # Add ExpressionAttributeNames if needed (for reserved words like 'year')
        update_params = {
            'Key': {'id': movie_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_attribute_values,
            'ReturnValues': 'ALL_NEW'
        }
        
        if 'expression_attribute_names' in locals() and expression_attribute_names:
            update_params['ExpressionAttributeNames'] = expression_attribute_names
        
        # Update the item in DynamoDB
        try:
            response = table.update_item(**update_params)
            updated_movie = response.get('Attributes', {})
        except ClientError as e:
            print(f"Error updating movie: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Error updating movie: {str(e)}'})
            }
        
        # Return success response with updated movie
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Movie updated successfully',
                'movie': updated_movie
            }, default=lambda o: str(o) if isinstance(o, Decimal) else o)
        }
    
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'An unexpected error occurred: {str(e)}'})
        } 