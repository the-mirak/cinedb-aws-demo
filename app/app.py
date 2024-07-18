from flask import Blueprint, render_template, request, redirect, url_for, flash
import boto3
import re
import uuid
import json
import os

main = Blueprint('main', __name__)

# Initialize the DynamoDB and S3 clients
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
s3_client = boto3.client('s3')

# Your S3 bucket name
S3_BUCKET = 'cinedb-bucket-2024'

# Regular expression to parse the key from the full URL
url_pattern = re.compile(r'https://[^/]+/([^?]+)')

@main.route('/')
def index():
    table = dynamodb.Table('cinedb')
    try:
        response = table.scan()
        movies = response.get('Items', [])
        # Generate signed URLs for the images
        for movie in movies:
            match = url_pattern.match(movie['poster'])
            if match:
                key = match.group(1)
                movie['poster'] = s3_client.generate_presigned_url('get_object',
                                                                   Params={'Bucket': S3_BUCKET, 'Key': key},
                                                                   ExpiresIn=3600)  # URL expires in 1 hour
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        movies = []
        print("Table not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
        movies = []

    return render_template('index.html', movies=movies, instance_id=get_instance_id(), availability_zone=get_availability_zone())

@main.route('/add', methods=['GET', 'POST'])
def add_movie():
    table = dynamodb.Table('cinedb')
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
            return redirect(url_for('main.admin'))  # Redirect to admin page after adding a movie
        except Exception as e:
            flash(f"An error occurred: {e}", 'danger')
    
    return render_template('add_movie.html')

@main.route('/admin', methods=['GET'])
def admin():
    table = dynamodb.Table('cinedb')
    try:
        response = table.scan()
        movies = response.get('Items', [])
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        movies = []
        print("Table not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
        movies = []
    
    return render_template('admin.html', movies=movies, instance_id=get_instance_id(), availability_zone=get_availability_zone())

@main.route('/delete/<movie_id>', methods=['POST'])
def delete_movie(movie_id):
    table = dynamodb.Table('cinedb')
    try:
        table.delete_item(
            Key={
                'id': movie_id
            }
        )
        flash('Movie deleted successfully!', 'success')
    except Exception as e:
        flash(f"An error occurred: {e}", 'danger')
    
    return redirect(url_for('main.admin'))

@main.route('/edit/<movie_id>', methods=['GET', 'POST'])
def edit_movie(movie_id):
    table = dynamodb.Table('cinedb')
    if request.method == 'POST':
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
        
        # Update movie in DynamoDB
        try:
            table.update_item(
                Key={'id': movie_id},
                UpdateExpression='SET title = :title, rating = :rating, synopsis = :synopsis, poster = :poster',
                ExpressionAttributeValues={
                    ':title': title,
                    ':rating': rating,
                    ':synopsis': synopsis,
                    ':poster': poster_url
                }
            )
            flash('Movie updated successfully!', 'success')
            return redirect(url_for('main.admin'))  # Redirect to admin page after editing a movie
        except Exception as e:
            flash(f"An error occurred: {e}", 'danger')
    
    # Fetch the movie details for pre-filling the form
    try:
        response = table.get_item(Key={'id': movie_id})
        movie = response['Item']
    except Exception as e:
        flash(f"An error occurred: {e}", 'danger')
        return redirect(url_for('main.admin'))
    
    return render_template('edit_movie.html', movie=movie)

def get_instance_id():
    try:
        with open("/var/lib/cloud/data/instance-id") as f:
            instance_id = f.read().strip()
        return instance_id
    except Exception:
        return "Unknown"

def get_availability_zone():
    try:
        with open("/var/lib/cloud/data/availability-zone") as f:
            availability_zone = f.read().strip()
        return availability_zone
    except Exception:
        return "Unknown"
