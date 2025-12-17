"""
CineDB Flask Application

RECENT CHANGES - S3 PreSignURL Date Format Issue Fix:
- Added proper datetime imports with timezone support
- Implemented configurable expiration times with validation
- Enhanced error handling with timestamped logging
- Added bounds checking for expiration values (60 seconds to 7 days)
- Improved date formatting for debugging and monitoring
- Added UTC timezone awareness for consistent URL generation
- Implemented graceful error handling to maintain application stability

Configuration:
- DEFAULT_EXPIRATION: Default URL expiration time (default: 3600 seconds / 1 hour)
- MIN_EXPIRATION: Minimum allowed expiration time (default: 60 seconds)
- MAX_EXPIRATION: Maximum allowed expiration time (default: 604800 seconds / 7 days)
"""

from flask import Flask, Blueprint, render_template, request, redirect, url_for, flash, jsonify
import boto3
import re
import uuid
import json
import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from . import get_secret  # Import the get_secret function

load_dotenv()

app = Flask(__name__)
app.secret_key = get_secret()  # Fetch the secret key from AWS Secrets Manager
main = Blueprint('main', __name__)

# Load environment variables
S3_BUCKET = os.getenv('S3_BUCKET')
DYNAMODB_TABLE = os.getenv('DYNAMODB_TABLE')
AWS_REGION = os.getenv('AWS_REGION')
INSTANCE_ID = os.getenv('INSTANCE_ID')
AVAILABILITY_ZONE = os.getenv('AVAILABILITY_ZONE')

# S3 PreSignURL configuration with proper date format handling
DEFAULT_EXPIRATION = int(os.getenv('DEFAULT_EXPIRATION', '3600'))  # Default: 1 hour
MIN_EXPIRATION = int(os.getenv('MIN_EXPIRATION', '60'))  # Minimum: 1 minute
MAX_EXPIRATION = int(os.getenv('MAX_EXPIRATION', '604800'))  # Maximum: 7 days

# Initialize the DynamoDB and S3 clients with environment variable for region
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
s3_client = boto3.client('s3', region_name=AWS_REGION)

# Regular expression to parse the key from the full URL
url_pattern = re.compile(r'https://[^/]+/([^?]+)')

def validate_expiration_time(expiration):
    """
    Validate and normalize expiration time with proper date format handling
    
    Args:
        expiration (int or str): Expiration time in seconds
        
    Returns:
        int: Validated expiration time within acceptable bounds
    """
    try:
        exp_int = int(expiration)
        # Ensure expiration is within acceptable bounds
        return max(MIN_EXPIRATION, min(exp_int, MAX_EXPIRATION))
    except (ValueError, TypeError):
        # Log validation failure with timestamp
        current_time = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
        print(f"[{current_time}] Invalid expiration time '{expiration}', using default: {DEFAULT_EXPIRATION}")
        return DEFAULT_EXPIRATION

def generate_presigned_url(movie, expiration=None):
    """
    Generate a presigned URL for an S3 object with proper date format handling
    
    Args:
        movie (dict): Movie object containing poster URL
        expiration (int, optional): URL expiration time in seconds. 
                                   If None, uses DEFAULT_EXPIRATION
    
    Returns:
        None: Modifies the movie object in place, updating the poster URL
    """
    # Skip processing if no poster URL exists
    if not movie.get('poster'):
        current_time = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
        print(f"[{current_time}] No poster URL found for movie: {movie.get('title', 'Unknown')}")
        return
    
    # Validate and set expiration time
    if expiration is None:
        expiration = DEFAULT_EXPIRATION
    else:
        expiration = validate_expiration_time(expiration)
    
    # Calculate expiration datetime for logging (UTC timezone)
    expiration_datetime = datetime.now(timezone.utc) + timedelta(seconds=expiration)
    
    try:
        match = url_pattern.match(movie['poster'])
        if match:
            key = match.group(1)
            
            # Generate presigned URL with validated expiration
            presigned_url = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET, 'Key': key},
                ExpiresIn=expiration
            )
            
            # Update movie poster with presigned URL
            movie['poster'] = presigned_url
            
            # Enhanced logging with proper date formatting
            print(f"Generated presigned URL for key '{key}' - "
                  f"Expires: {expiration_datetime.strftime('%Y-%m-%d %H:%M:%S UTC')} "
                  f"({expiration} seconds from now)")
            print(f"Presigned URL: {presigned_url}")
            
        else:
            # Log parsing failure with timestamp
            current_time = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
            print(f"[{current_time}] Failed to parse URL: {movie['poster']}")
            
    except Exception as e:
        # Enhanced error handling with proper date formatting
        current_time = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
        print(f"[{current_time}] Error generating presigned URL for movie poster: {str(e)}")
        print(f"[{current_time}] Original poster URL: {movie.get('poster', 'N/A')}")
        print(f"[{current_time}] Requested expiration: {expiration} seconds")
        
        # Keep original URL on error to maintain functionality
        # This ensures the application doesn't break if S3 is temporarily unavailable

@main.route('/')
def index():
    table = dynamodb.Table(DYNAMODB_TABLE)
    try:
        response = table.scan()
        movies = response.get('Items', [])
        # Generate signed URLs for the images
        for movie in movies:
            generate_presigned_url(movie)
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        movies = []
        print("Table not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
        movies = []
    return render_template('index.html', movies=movies, instance_id=INSTANCE_ID, availability_zone=AVAILABILITY_ZONE)

@main.route('/admin')
def admin_dashboard():
    table = dynamodb.Table(DYNAMODB_TABLE)
    try:
        response = table.scan()
        movies = response.get('Items', [])
        # Generate signed URLs for the images
        for movie in movies:
            generate_presigned_url(movie)
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        movies = []
        print("Table not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
        movies = []
    return render_template('admin.html', movies=movies, instance_id=INSTANCE_ID, availability_zone=AVAILABILITY_ZONE)


@main.route('/edit/<movie_id>', methods=['GET', 'POST'])
def edit_movie(movie_id):
    table = dynamodb.Table(DYNAMODB_TABLE)
    if request.method == 'POST':
        title = request.form['title']
        rating = request.form['rating']
        synopsis = request.form['synopsis']
        poster_url = None

        if 'poster' in request.files:
            file = request.files['poster']
            if file.filename != '':
                filename = f"{movie_id}_{file.filename}"
                file_path = os.path.join('/tmp', filename)
                file.save(file_path)
                try:
                    s3_client.upload_file(file_path, S3_BUCKET, filename)
                    poster_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{filename}"
                except Exception as e:
                    flash(f"An error occurred while uploading to S3: {e}", 'danger')
                    return redirect(request.url)

        update_expression = 'SET title = :title, rating = :rating, synopsis = :synopsis'
        expression_attribute_values = {
            ':title': title,
            ':rating': rating,
            ':synopsis': synopsis
        }

        if poster_url:
            update_expression += ', poster = :poster'
            expression_attribute_values[':poster'] = poster_url

        try:
            table.update_item(
                Key={'id': movie_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values
            )
            flash('Movie updated successfully!', 'success')
            return redirect(url_for('main.admin_dashboard'))
        except Exception as e:
            flash(f"An error occurred: {e}", 'danger')
    else:
        try:
            response = table.get_item(Key={'id': movie_id})
            movie = response['Item']
        except Exception as e:
            flash(f"An error occurred: {e}", 'danger')
            return redirect(url_for('main.admin_dashboard'))

    return render_template('edit_movie.html', movie=movie, instance_id=INSTANCE_ID, availability_zone=AVAILABILITY_ZONE)

@main.route('/add', methods=['GET', 'POST'])
def add_movie():
    table = dynamodb.Table(DYNAMODB_TABLE)
    if request.method == 'POST':
        movie_id = str(uuid.uuid4())
        title = request.form['title']
        rating = request.form['rating']
        synopsis = request.form['synopsis']
        
        poster_url = None
        
        if 'poster' in request.files:
            file = request.files['poster']
            if file and file.filename != '':
                filename = f"{movie_id}_{file.filename}"
                file_path = os.path.join('/tmp', filename)
                file.save(file_path)
                
                try:
                    s3_client.upload_file(file_path, S3_BUCKET, filename)
                    poster_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{filename}"
                except Exception as e:
                    flash(f"An error occurred while uploading to S3: {e}", 'danger')
                    return redirect(request.url)
        
        item = {
            'id': movie_id,
            'title': title,
            'rating': rating,
            'synopsis': synopsis
        }
        
        if poster_url:
            item['poster'] = poster_url
        
        try:
            table.put_item(Item=item)
            flash('Movie added successfully!', 'success')
            return redirect(url_for('main.admin_dashboard'))
        except Exception as e:
            flash(f"An error occurred: {e}", 'danger')
    
    return render_template('add_movie.html')

@main.route('/delete/<movie_id>', methods=['POST'])
def delete_movie(movie_id):
    table = dynamodb.Table(DYNAMODB_TABLE)
    try:
        table.delete_item(Key={'id': movie_id})
        flash('Movie deleted successfully!', 'success')
    except Exception as e:
        flash(f"An error occurred: {e}", 'danger')
    return redirect(url_for('main.admin_dashboard'))

# Health check endpoint
@main.route('/healthz', methods=['GET'])
def health_check():
    return jsonify(status='healthy'), 200

# Register the blueprint
app.register_blueprint(main)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
