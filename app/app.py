from flask import Blueprint, render_template, request, redirect, url_for, flash
import boto3
import re
import uuid
import json
import os
import requests

main = Blueprint('main', __name__)

# Initialize the DynamoDB and S3 clients
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')
s3_client = boto3.client('s3')

# Your S3 bucket name
S3_BUCKET = 'cinedb-bucket-2024'

# Regular expression to parse the key from the full URL
url_pattern = re.compile(r'https://[^/]+/([^?]+)')

def get_instance_metadata():
    metadata_url = 'http://169.254.169.254/latest/meta-data/'
    instance_id = requests.get(metadata_url + 'instance-id').text
    availability_zone = requests.get(metadata_url + 'placement/availability-zone').text
    return instance_id, availability_zone

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
                print(movie['poster'])  # Print the generated URL to the console for verification
            else:
                print(f"Failed to parse URL: {movie['poster']}")
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        movies = []
        print("Table not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
        movies = []

    instance_id, availability_zone = get_instance_metadata()

    return render_template('index.html', movies=movies, instance_id=instance_id, availability_zone=availability_zone)

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
            return redirect(url_for('main.index'))
        except Exception as e:
            flash(f"An error occurred: {e}", 'danger')
    
    return render_template('add_movie.html')
