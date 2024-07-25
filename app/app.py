from flask import Flask, Blueprint, render_template, request, redirect, url_for, flash, jsonify
import boto3
import re
import uuid
import json
import os
from dotenv import load_dotenv
from . import get_secret  # Import the get_secret function

load_dotenv()

app = Flask(__name__)
app.secret_key = get_secret()  # Fetch the secret key from AWS Secrets Manager
main = Blueprint('main', __name__)

# Initialize the DynamoDB and S3 clients
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
s3_client = boto3.client('s3')

# Your S3 bucket name and DynamoDB table name
S3_BUCKET = os.getenv('S3_BUCKET')
DYNAMODB_TABLE = os.getenv('DYNAMODB_TABLE')
AWS_REGION = os.getenv('AWS_REGION')

# Regular expression to parse the key from the full URL
url_pattern = re.compile(r'https://[^/]+/([^?]+)')

def generate_presigned_url(movie):
    match = url_pattern.match(movie['poster'])
    if match:
        key = match.group(1)
        movie['poster'] = s3_client.generate_presigned_url('get_object',
                                                           Params={'Bucket': S3_BUCKET, 'Key': key},
                                                           ExpiresIn=3600)  # URL expires in 1 hour
        print(movie['poster'])  # Print the generated URL to the console for verification
    else:
        print(f"Failed to parse URL: {movie['poster']}")

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

    return render_template('index.html', movies=movies)

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

    return render_template('admin.html', movies=movies)

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
                    poster_url = f"https://{S3_BUCKET}.s3.{os.getenv('AWS_REGION', 'us-west-2')}.amazonaws.com/{filename}"
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
    
    return render_template('edit_movie.html', movie=movie)

@main.route('/add', methods=['GET', 'POST'])
def add_movie():
    table = dynamodb.Table(DYNAMODB_TABLE)
    if request.method == 'POST':
        movie_id = str(uuid.uuid4())
        title = request.form['title']
        rating = request.form['rating']
        synopsis = request.form['synopsis']
        
        # Handle file upload
        if 'poster' not in request.files:
            flash('No file part', 'danger')
            return redirect(request.url)
        
        file = request.files['poster']
        
        if file.filename == '':
            flash('No selected file', 'danger')
            return redirect(request.url)
        
        if file:
            filename = f"{movie_id}_{file.filename}"
            file_path = os.path.join('/tmp', filename)
            file.save(file_path)
            
            # Upload to S3
            try:
                s3_client.upload_file(file_path, S3_BUCKET, filename)
                poster_url = f"https://{S3_BUCKET}.s3.{os.getenv('AWS_REGION', 'us-west-2')}.amazonaws.com/{filename}"
            except Exception as e:
                flash(f"An error occurred while uploading to S3: {e}", 'danger')
                return redirect(request.url)
        
        # Add movie to DynamoDB
        try:
            table.put_item(
                Item={
                    'id': movie_id,
                    'title': title,
                    'rating': rating,
                    'synopsis': synopsis,
                    'poster': poster_url
                }
            )
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
