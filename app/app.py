from flask import Blueprint, render_template
import boto3

main = Blueprint('main', __name__)

# Initialize the DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-west-2')

@main.route('/')
def index():
    table = dynamodb.Table('CineDB')
    response = table.scan()
    movies = response['Items']

    return render_template('index.html', movies=movies)
