from flask import Flask
import boto3
from botocore.exceptions import ClientError
import json

def get_secret():
    secret_name = "flask_ddb_sk"  
    region_name = "us-west-2" 


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

    app.config['SECRET_KEY'] = get_secret()

    from .app import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app

app = create_app()
