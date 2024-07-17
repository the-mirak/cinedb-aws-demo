from flask import Blueprint, render_template
import boto3
import re

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
                print(movie['poster'])  # Print the generated URL to the console for verification
            else:
                print(f"Failed to parse URL: {movie['poster']}")
    except dynamodb.meta.client.exceptions.ResourceNotFoundException:
        movies = []
        print("Table not found.")
    except Exception as e:
        print(f"An error occurred: {e}")
        movies = []

    return render_template('index.html', movies=movies)
