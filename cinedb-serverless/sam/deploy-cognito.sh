#!/bin/bash
set -e

echo "========================================"
echo "  Deploying CineDB Cognito Resources   "
echo "========================================"
echo ""

# Change to the sam directory
cd "$(dirname "$0")"

echo "Deploying Cognito resources via CloudFormation..."
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name cinedb-cognito-stack \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

echo ""
echo "✅ CloudFormation stack deployed successfully!"
echo ""

echo "Retrieving outputs..."
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text \
  --region us-east-1)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text \
  --region us-east-1)

AUTHORIZER_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoAuthorizerId`].OutputValue' \
  --output text \
  --region us-east-1)

USER_POOL_ARN=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolArn`].OutputValue' \
  --output text \
  --region us-east-1)

echo ""
echo "========================================"
echo "       Deployment Outputs               "
echo "========================================"
echo "USER_POOL_ID=$USER_POOL_ID"
echo "CLIENT_ID=$CLIENT_ID"
echo "AUTHORIZER_ID=$AUTHORIZER_ID"
echo "USER_POOL_ARN=$USER_POOL_ARN"
echo ""
echo "Next steps:"
echo "1. Update frontend/static/js/cognito-config.js with USER_POOL_ID and CLIENT_ID"
echo "2. Run the apply-cognito-auth.sh script to protect API Gateway endpoints"
echo "========================================"

