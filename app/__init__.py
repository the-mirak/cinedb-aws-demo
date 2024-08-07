from flask import Flask
import boto3
from botocore.exceptions import ClientError
import json
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

def get_secret():
    secret_name = os.getenv('FLASK_SECRET_NAME')  # Get the secret name from the environment variable
    region_name = os.getenv('AWS_REGION', 'us-west-2')  # Get the AWS region from the environment variable

    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        raise e

    secret = get_secret_value_response['SecretString']
    secret_dict = json.loads(secret)
    return secret_dict['SECRET_KEY']

def create_app():
    app = Flask(__name__, template_folder='templates', static_folder='static')

    # Fetch the secret key from AWS Secrets Manager
    app.config['SECRET_KEY'] = get_secret()

    # Load other configuration from environment variables
    app.config['S3_BUCKET'] = os.getenv('S3_BUCKET')
    app.config['DYNAMODB_TABLE'] = os.getenv('DYNAMODB_TABLE')

    from .app import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app

app = create_app()
