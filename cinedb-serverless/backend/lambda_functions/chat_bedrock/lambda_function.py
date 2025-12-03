import json
import boto3
import os
from decimal import Decimal
from botocore.exceptions import ClientError

# Initialize clients - explicitly use us-east-1
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE', 'cinedb')
MODEL_ID = 'us.anthropic.claude-3-5-haiku-20241022-v1:0'  # Using inference profile for on-demand throughput

def decimal_to_number(obj):
    """Convert Decimal to int/float for JSON serialization"""
    if isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

def get_movies_context():
    """Fetch movies from DynamoDB to provide as context"""
    table = dynamodb.Table(DYNAMODB_TABLE)
    response = table.scan(Limit=50)  # Limit to avoid token limits
    movies = response.get('Items', [])
    
    # Format movies for context
    movies_list = []
    for movie in movies:
        movies_list.append({
            'title': movie.get('title'),
            'year': movie.get('year'),
            'genre': movie.get('genre'),
            'rating': movie.get('rating'),
            'director': movie.get('director'),
            'synopsis': movie.get('synopsis')
        })
    return json.dumps(movies_list, default=decimal_to_number)

def lambda_handler(event, context):
    """
    Lambda handler for chatbot powered by AWS Bedrock (Claude 3.5 Haiku)
    """
    try:
        # CORS preflight request
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': ''
            }

        body = json.loads(event['body'])
        user_message = body.get('message', '')
        conversation_history = body.get('history', [])

        if not user_message:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Message is required'})
            }

        # Get movie context from DynamoDB
        movies_context = get_movies_context()

        # System prompt to guide Claude
        system_prompt = f"""You are a movie recommendation assistant for CineDB.
You have access to a database of movies. Here is the current movie data from the database:
{movies_context}

When recommending movies:
- Prioritize movies from the provided database if they match the user's request.
- If no suitable movies are found in the database, use your general movie knowledge.
- Always mention the movie's title, year, genre, and rating if available.
- Keep responses concise and helpful.
- Maintain a friendly and engaging tone.
- Do not mention that you are using a database, just provide recommendations naturally.
"""

        # Build conversation for Claude
        messages = []
        for msg in conversation_history:
            if msg['role'] in ['user', 'assistant']:
                messages.append({
                    'role': msg['role'],
                    'content': [{'text': msg['content']}]
                })
        messages.append({
            'role': 'user',
            'content': [{'text': user_message}]
        })

        # Invoke Bedrock
        response = bedrock.converse(
            modelId=MODEL_ID,
            messages=messages,
            system=[{'text': system_prompt}],
            inferenceConfig={
                'temperature': 0.7,
                'maxTokens': 1000
            }
        )

        assistant_response = response['output']['message']['content'][0]['text']

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': assistant_response,
                'usage': {
                    'inputTokens': response['usage']['inputTokens'],
                    'outputTokens': response['usage']['outputTokens']
                }
            })
        }

    except ClientError as e:
        print(f"Bedrock Client Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f"Bedrock service error: {str(e)}"})
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

