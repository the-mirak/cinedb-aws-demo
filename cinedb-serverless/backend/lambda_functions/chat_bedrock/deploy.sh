#!/bin/bash

# Configuration
FUNCTION_NAME="cinedb-chat-bedrock"
ROLE_NAME="cinedb-chat-bedrock-role"
REGION="us-east-1"
DYNAMODB_TABLE="cinedb"

echo "🚀 Deploying Chat Bedrock Lambda Function..."

# Create deployment package
echo "📦 Creating deployment package..."
rm -f chat_bedrock.zip

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt -t ./package --quiet
    cd package
    zip -r ../chat_bedrock.zip . -q
    cd ..
    rm -rf package
fi

# Add Lambda function code
zip -g chat_bedrock.zip lambda_function.py -q

echo "✅ Deployment package created: chat_bedrock.zip"

# Check if Lambda function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &>/dev/null; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://chat_bedrock.zip \
        --region $REGION \
        --output json | jq -r '.FunctionName + " updated successfully"'
    
    # Update environment variables
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --environment "Variables={DYNAMODB_TABLE=$DYNAMODB_TABLE}" \
        --region $REGION \
        --output json | jq -r '"Environment updated"'
else
    echo "⚠️  Lambda function does not exist. Please create it first or run the full setup."
    echo "Refer to the README.md for setup instructions."
fi

echo ""
echo "✅ Deployment complete!"
echo "📝 Function: $FUNCTION_NAME"
echo "🌍 Region: $REGION"

