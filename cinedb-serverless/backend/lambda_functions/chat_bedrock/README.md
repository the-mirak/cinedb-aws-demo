# Chat Bedrock Lambda Function

AI-powered movie recommendation chatbot using AWS Bedrock (Claude 3.5 Haiku) with hybrid knowledge from DynamoDB and general AI knowledge.

## 🎯 Functionality

This Lambda function powers the CineDB chatbot with the following capabilities:

- **AI-Powered Recommendations**: Uses Claude 3.5 Haiku for intelligent movie suggestions
- **Hybrid Knowledge**: Combines DynamoDB movie database with Claude's general movie knowledge
- **Conversational**: Maintains conversation history for context-aware responses
- **Real-time**: Fast responses (~3-5 seconds) with streaming support
- **Cost-Effective**: Uses Claude 3.5 Haiku (~$0.25 per million input tokens)

### How It Works

1. Receives user message and conversation history from frontend
2. Fetches up to 50 movies from DynamoDB as context
3. Constructs system prompt with movie database context
4. Sends conversation to Claude 3.5 Haiku via Bedrock
5. Returns AI-generated response with usage metrics

## 📋 Prerequisites

- AWS CLI configured with appropriate credentials
- AWS Bedrock access enabled in your account
- Claude 3.5 Haiku model access (request in Bedrock console)
- DynamoDB table `cinedb` with movie data
- Python 3.11 runtime
- IAM role with necessary permissions

## 🚀 Deployment

### Quick Deploy (Update Existing Function)

```bash
./deploy.sh
```

### Full Setup (First Time)

#### 1. Create IAM Role

```bash
# Create trust policy
aws iam create-role \
  --role-name cinedb-chat-bedrock-role \
  --assume-role-policy-document file://trust-policy.json

# Attach basic Lambda execution policy
aws iam attach-role-policy \
  --role-name cinedb-chat-bedrock-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create and attach DynamoDB policy
aws iam put-role-policy \
  --role-name cinedb-chat-bedrock-role \
  --policy-name DynamoDBReadPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ],
        "Resource": "arn:aws:dynamodb:us-east-1:*:table/cinedb"
      }
    ]
  }'

# Attach Bedrock policy
aws iam put-role-policy \
  --role-name cinedb-chat-bedrock-role \
  --policy-name BedrockInvokePolicy \
  --policy-document file://bedrock-policy.json
```

**Important Note on Cross-Region Access**: The Bedrock policy allows access to all regions (`arn:aws:bedrock:*`) because the inference profile `us.anthropic.claude-3-5-haiku-20241022-v1:0` dynamically routes requests across multiple US regions (us-east-1, us-east-2, us-west-2, etc.) for load balancing, high availability, and capacity management. Even though the Lambda function runs in us-east-1, Bedrock may invoke the model in any US region based on current load and availability. Restricting to only us-east-1 would cause `AccessDeniedException` errors when AWS routes to other regions.

#### 2. Create Deployment Package

```bash
# Install dependencies
pip install -r requirements.txt -t ./package

# Create zip
cd package && zip -r ../chat_bedrock.zip . && cd ..

# Add Lambda function
zip -g chat_bedrock.zip lambda_function.py
```

#### 3. Create Lambda Function

```bash
aws lambda create-function \
  --function-name cinedb-chat-bedrock \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/cinedb-chat-bedrock-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://chat_bedrock.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables={DYNAMODB_TABLE=cinedb} \
  --region us-east-1
```

#### 4. Create API Gateway Endpoint

```bash
# Get your API Gateway ID (from existing movies API)
API_ID="your-api-gateway-id"

# Create resource
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /chat" \
  --target integrations/YOUR_INTEGRATION_ID
```

Or manually in AWS Console:
1. Go to API Gateway
2. Select your existing API
3. Create new route: `POST /chat`
4. Create Lambda integration
5. Deploy API

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DYNAMODB_TABLE` | `cinedb` | DynamoDB table name containing movies |

### Model Configuration

- **Model**: `us.anthropic.claude-3-5-haiku-20241022-v1:0` (inference profile)
  - The `us.` prefix indicates this is an **inference profile**, not a direct model endpoint
  - AWS dynamically routes requests to the best available region for optimal performance
  - This provides automatic load balancing, failover, and high availability
- **Temperature**: `0.7` (balanced creativity)
- **Max Tokens**: `1000` (limits response length)
- **Region**: `us-east-1` (but routes cross-region via inference profile)

**Why Inference Profiles vs Direct Models?**
- **Direct Model**: `anthropic.claude-3-5-haiku-20241022-v1:0` (single region, fixed endpoint)
- **Inference Profile**: `us.anthropic.claude-3-5-haiku-20241022-v1:0` (multi-region, dynamic routing)
- Using the inference profile provides better reliability and performance at no additional cost

### Bedrock Model Access

Enable Claude 3.5 Haiku in Bedrock console:

1. Go to AWS Bedrock Console
2. Navigate to "Model access"
3. Request access to "Anthropic Claude 3.5 Haiku"
4. Wait for approval (~instant for most accounts)

## 🧪 Testing

### Test Event (test-event.json)

```json
{
  "httpMethod": "POST",
  "body": "{\"message\": \"Recommend me a sci-fi movie\", \"history\": []}"
}
```

### Run Test

```bash
# Via AWS CLI
aws lambda invoke \
  --function-name cinedb-chat-bedrock \
  --payload file://test-event.json \
  --region us-east-1 \
  response.json

cat response.json | jq '.'
```

### Expected Response

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"message\": \"I recommend 'Celestial Nomads'...\", \"usage\": {...}}"
}
```

## 📊 API Reference

### Request Format

**Endpoint**: `POST /chat`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "message": "What's a good thriller movie?",
  "history": [
    {
      "role": "user",
      "content": "Hi"
    },
    {
      "role": "assistant",
      "content": "Hello! I can help you find great movies."
    }
  ]
}
```

### Response Format

**Success (200)**:
```json
{
  "message": "I recommend 'The Warrior' (2025), a thriller with a 9.5 rating...",
  "usage": {
    "inputTokens": 608,
    "outputTokens": 122
  }
}
```

**Error (400)**:
```json
{
  "error": "Message is required"
}
```

**Error (500)**:
```json
{
  "error": "Bedrock service error: ..."
}
```

## 🐛 Troubleshooting

### 1. 500 - AccessDeniedException from Bedrock

**Cause**: IAM role lacks Bedrock invoke permissions or model access not enabled

**Fix**: 
- Verify IAM policy includes `bedrock:InvokeModel` permission for ALL regions (`arn:aws:bedrock:*`)
- Enable model access in Bedrock console
- **Important**: Even if your Lambda is in us-east-1, Bedrock inference profiles route to multiple regions
- **Example Error**: `...not authorized to perform: bedrock:InvokeModel on resource: arn:aws:bedrock:us-east-2::...`
- **Check**: Run `aws bedrock list-foundation-models --region us-east-1`
- **Explanation**: The inference profile uses dynamic routing across us-east-1, us-east-2, us-west-2, etc.

### 2. Timeout Errors

**Cause**: Lambda timeout too short for Bedrock response

**Fix**: Increase timeout to 30 seconds
```bash
aws lambda update-function-configuration \
  --function-name cinedb-chat-bedrock \
  --timeout 30
```

### 3. DynamoDB Scan Errors

**Cause**: IAM role lacks DynamoDB read permissions

**Fix**: Attach DynamoDB policy (see setup above)

### 4. Empty Movie Context

**Cause**: DynamoDB table empty or wrong table name

**Fix**: 
- Verify table name in environment variables
- Check table has data: `aws dynamodb scan --table-name cinedb --limit 5`

### 5. JSON Serialization Errors with Decimals

**Cause**: DynamoDB returns Decimal types which aren't JSON serializable

**Fix**: Already handled with `decimal_to_number()` helper function

## 💰 Cost Optimization

### Current Configuration
- **Bedrock Claude 3.5 Haiku**: $0.25 per 1M input tokens, $1.25 per 1M output tokens
- **Lambda**: $0.0000166667 per GB-second (512MB = ~$0.0000083 per second)
- **DynamoDB Scan**: $0.25 per 1M reads (on-demand)
- **API Gateway**: $1.00 per 1M requests

### Cost per 1000 Conversations (Estimated)
- **Bedrock Input**: ~600 tokens × 1000 × $0.25/1M = **$0.15**
- **Bedrock Output**: ~120 tokens × 1000 × $1.25/1M = **$0.15**
- **Lambda Execution**: ~5 sec × 1000 × $0.0000083 = **$0.04**
- **DynamoDB Scans**: 1000 × $0.25/1M = **$0.0003**
- **API Gateway**: 1000 × $1/1M = **$0.001**
- **Total**: ~**$0.35 per 1000 conversations**

### Optimization Tips

1. **Reduce Movie Context**: Lower scan limit from 50 to 25 movies
2. **Cache Movie Data**: Store in Lambda environment for 15 minutes
3. **Use Reserved Capacity**: For predictable traffic, use provisioned throughput
4. **Compress Responses**: Enable API Gateway compression

## 🔐 Security

- ✅ CORS enabled for web access
- ✅ No authentication required (public chatbot)
- ✅ IAM role follows principle of least privilege
- ✅ No sensitive data in logs (conversation content logged)
- ⚠️ Rate limiting recommended for production (API Gateway)
- ⚠️ Consider adding AWS WAF for DDoS protection

## 🔗 Integration

### Frontend (React)

```typescript
const response = await fetch(`${API_URL}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: userMessage,
    history: conversationHistory
  })
});

const data = await response.json();
console.log(data.message); // AI response
```

See `frontend-react/src/components/ChatWidget.tsx` for full implementation.

## 📚 References

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude 3.5 Haiku Model Card](https://www.anthropic.com/claude)
- [Bedrock Inference Profiles](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

## 🚧 Future Enhancements

- [ ] Streaming responses with WebSocket API
- [ ] Multi-language support
- [ ] User preference memory (with DynamoDB)
- [ ] Movie poster recommendations
- [ ] Integration with TMDB API for latest movies
- [ ] Sentiment analysis for better recommendations
- [ ] A/B testing different prompts
- [ ] Conversation analytics dashboard

