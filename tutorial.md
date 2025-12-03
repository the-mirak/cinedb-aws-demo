# CineDB Serverless Refactoring Tutorial

This tutorial provides step-by-step instructions for the manual tasks required during the serverless refactoring of the CineDB application.

## Table of Contents
1. [Project Setup](#project-setup)
2. [Converting Flask Templates to Static Files](#converting-flask-templates-to-static-files)
3. [Setting Up AWS Infrastructure](#setting-up-aws-infrastructure)
4. [Creating Lambda Functions](#creating-lambda-functions)
5. [Configuring API Gateway](#configuring-api-gateway)
6. [Implementing Cognito Authentication](#implementing-cognito-authentication)
7. [Deploying with SAM](#deploying-with-sam)

## Project Setup

### Step 1: Create Project Structure
```bash
mkdir -p cinedb-serverless/{frontend,backend/functions,sam}
cd cinedb-serverless
```

### Step 2: Copy Existing Assets
```bash
cp -r /path/to/app/static frontend/
```

### Step 3: Set Up Environment
```bash
# Create a new .env file for local development
cat > .env << EOF
S3_BUCKET_WEB=cinedb-web
S3_BUCKET_API=cinedb-api
DYNAMODB_TABLE=cinedb
AWS_REGION=us-west-2
EOF
```

## Converting Flask Templates to Static Files

For each template in the Flask application, we need to convert it to a static HTML file with JavaScript for API interaction.

### Step 1: Convert index.html
1. Open `app/templates/index.html` and create a new file `frontend/index.html`
2. Replace server-side rendering with client-side code:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineDB - Movie Database</title>
    <link rel="stylesheet" href="static/css/styles.css">
</head>
<body>
    <header>
        <h1>CineDB Movie Database</h1>
        <nav>
            <a href="index.html">Home</a>
            <a href="admin.html" id="admin-link">Admin</a>
        </nav>
    </header>
    
    <main>
        <div id="movie-list" class="movie-container">
            <!-- Movies will be loaded dynamically here -->
            <div class="loading">Loading movies...</div>
        </div>
    </main>
    
    <footer>
        <p>&copy; 2023 CineDB</p>
    </footer>

    <!-- Add API client script -->
    <script src="static/js/api-client.js"></script>
    <script>
        // Fetch and display movies on page load
        document.addEventListener('DOMContentLoaded', function() {
            fetchMovies()
                .then(displayMovies)
                .catch(error => {
                    console.error('Error:', error);
                    document.querySelector('#movie-list').innerHTML = 
                        `<div class="error">Error loading movies: ${error.message}</div>`;
                });
        });

        // Function to display movies
        function displayMovies(movies) {
            const container = document.querySelector('#movie-list');
            if (!movies || movies.length === 0) {
                container.innerHTML = '<div class="no-movies">No movies found</div>';
                return;
            }
            
            container.innerHTML = movies.map(movie => `
                <div class="movie-card">
                    <img src="${movie.poster || 'static/images/no-poster.png'}" alt="${movie.title} poster">
                    <div class="movie-info">
                        <h2>${movie.title}</h2>
                        <div class="rating">Rating: ${movie.rating}/10</div>
                        <p>${movie.synopsis}</p>
                    </div>
                </div>
            `).join('');
        }
    </script>
</body>
</html>
```

### Step 2: Convert admin.html
Follow a similar process for admin.html, adding authentication checks using Cognito.

### Step 3: Create api-client.js
Create a new file `frontend/static/js/api-client.js` with the API interaction code:

```javascript
// API Endpoint - Replace with your deployed API Gateway URL
const API_ENDPOINT = 'https://your-api-id.execute-api.us-west-2.amazonaws.com/prod';

// Cognito configuration - Replace with your Cognito details
const COGNITO_CONFIG = {
    UserPoolId: 'us-west-2_yourUserPoolId',
    ClientId: 'your-app-client-id'
};

// Function to fetch all movies
async function fetchMovies() {
    const response = await fetch(`${API_ENDPOINT}/movies`);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

// Function to fetch a single movie
async function fetchMovie(id) {
    const response = await fetch(`${API_ENDPOINT}/movies/${id}`);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

// Function to add a new movie (requires authentication)
async function addMovie(movieData) {
    const token = await getAuthToken();
    
    const formData = new FormData();
    Object.keys(movieData).forEach(key => {
        formData.append(key, movieData[key]);
    });
    
    const response = await fetch(`${API_ENDPOINT}/movies`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

// Function to update a movie (requires authentication)
async function updateMovie(id, movieData) {
    const token = await getAuthToken();
    
    const formData = new FormData();
    Object.keys(movieData).forEach(key => {
        formData.append(key, movieData[key]);
    });
    
    const response = await fetch(`${API_ENDPOINT}/movies/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

// Function to delete a movie (requires authentication)
async function deleteMovie(id) {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_ENDPOINT}/movies/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return true;
}

// Authentication functions (will be implemented with AWS Amplify)
let authToken = null;

async function getAuthToken() {
    if (!authToken) {
        throw new Error('User not authenticated');
    }
    return authToken;
}
```

## Setting Up AWS Infrastructure

### Step 1: Create S3 Buckets
```bash
# Create web bucket
aws s3 mb s3://cinedb-web --region us-west-2

# Enable website hosting
aws s3 website s3://cinedb-web --index-document index.html --error-document error.html

# Create API bucket for movie posters
aws s3 mb s3://cinedb-api --region us-west-2

# Set CORS configuration for API bucket
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket cinedb-api --cors-configuration file://cors.json
```

### Step 2: Create DynamoDB Table
```bash
aws dynamodb create-table \
    --table-name cinedb \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-west-2
```

### Step 3: Create CloudFront Distribution
This is best done through the AWS console following these steps:

1. Go to CloudFront in AWS console
2. Create a new distribution
3. Choose the S3 website endpoint as the origin
4. Create a new Origin Access Identity
5. Set default root object to `index.html`
6. Enable HTTPS by choosing a default certificate
7. Create the distribution and note the domain name

### Step 4: Update S3 Bucket Policy
After creating the CloudFront distribution, update the S3 bucket policy to only allow access from CloudFront:

```bash
cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::cinedb-web/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
                }
            }
        }
    ]
}
EOF

# Replace ACCOUNT_ID and DISTRIBUTION_ID with your actual values
aws s3api put-bucket-policy --bucket cinedb-web --policy file://bucket-policy.json
```

## Creating Lambda Functions

### Step 1: Set Up Lambda Function Structure
Create a separate directory for each Lambda function:

```bash
mkdir -p backend/functions/{list-movies,get-movie,add-movie,update-movie,delete-movie,generate-url}
```

### Step 2: Create the List Movies Function
Create `backend/functions/list-movies/index.js`:

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const BUCKET_NAME = process.env.S3_BUCKET;
const URL_EXPIRATION = 3600; // 1 hour

// Regular expression to parse the key from the full URL
const urlPattern = /https:\/\/[^/]+\/([^?]+)/;

exports.handler = async (event) => {
    try {
        // Scan DynamoDB for all movies
        const params = {
            TableName: TABLE_NAME
        };
        
        const result = await dynamodb.scan(params).promise();
        const movies = result.Items;
        
        // Generate presigned URLs for each movie poster
        for (const movie of movies) {
            if (movie.poster) {
                const match = movie.poster.match(urlPattern);
                if (match) {
                    const key = match[1];
                    movie.poster = s3.getSignedUrl('getObject', {
                        Bucket: BUCKET_NAME,
                        Key: key,
                        Expires: URL_EXPIRATION
                    });
                }
            }
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(movies)
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Failed to retrieve movies' })
        };
    }
};
```

### Step 3: Create package.json Files
Create `backend/functions/list-movies/package.json`:

```json
{
  "name": "list-movies",
  "version": "1.0.0",
  "description": "Lambda function to list movies",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1048.0"
  }
}
```

Repeat similar steps for each Lambda function, adapting the code to match the functionality from the Flask application.

## Configuring API Gateway

API Gateway is best configured through the AWS console or SAM template, but here's a manual approach:

### Step 1: Create a New REST API
```bash
aws apigateway create-rest-api --name cinedb-api --region us-west-2
```

### Step 2: Create Resources and Methods
This requires multiple commands to set up the API structure. Here's a simplified example for the `/movies` endpoint:

```bash
# Get the API ID from the previous command output
API_ID=your-api-id

# Get the root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id $API_ID | jq -r '.items[0].id')

# Create /movies resource
MOVIES_RESOURCE_ID=$(aws apigateway create-resource --rest-api-id $API_ID --parent-id $ROOT_RESOURCE_ID --path-part movies | jq -r '.id')

# Create GET method for /movies
aws apigateway put-method --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method GET --authorization-type NONE

# Create integration with Lambda function
aws apigateway put-integration --rest-api-id $API_ID --resource-id $MOVIES_RESOURCE_ID --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-2:ACCOUNT_ID:function:list-movies/invocations
```

Repeat similar steps for each endpoint and method.

### Step 3: Deploy the API
```bash
# Create a deployment
aws apigateway create-deployment --rest-api-id $API_ID --stage-name prod

# Get the invoke URL
echo "API Endpoint: https://$API_ID.execute-api.us-west-2.amazonaws.com/prod"
```

## Implementing Cognito Authentication

### Step 1: Create User Pool
```bash
aws cognito-idp create-user-pool --pool-name cinedb-users --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false}}' --region us-west-2
```

### Step 2: Create App Client
```bash
# Get the User Pool ID from the previous command output
USER_POOL_ID=your-user-pool-id

aws cognito-idp create-user-pool-client --user-pool-id $USER_POOL_ID --client-name cinedb-app --no-generate-secret --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH --region us-west-2
```

### Step 3: Create a Test User
```bash
aws cognito-idp admin-create-user --user-pool-id $USER_POOL_ID --username admin --temporary-password Admin123! --region us-west-2

# Set permanent password
aws cognito-idp admin-set-user-password --user-pool-id $USER_POOL_ID --username admin --password "YourSecurePassword123!" --permanent --region us-west-2
```

### Step 4: Update Frontend Authentication
Modify `frontend/static/js/auth.js` to include Cognito integration:

```javascript
// Add AWS Amplify to your project using npm or include the script tag
// <script src="https://cdn.jsdelivr.net/npm/amazon-cognito-identity-js@5.2.10/dist/amazon-cognito-identity.min.js"></script>

// Initialize Cognito Auth
const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: COGNITO_CONFIG.UserPoolId,
    ClientId: COGNITO_CONFIG.ClientId
});

// Function to sign in
function signIn(username, password) {
    return new Promise((resolve, reject) => {
        const authenticationData = {
            Username: username,
            Password: password
        };
        
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        
        const userData = {
            Username: username,
            Pool: userPool
        };
        
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                authToken = result.getIdToken().getJwtToken();
                resolve(result);
            },
            onFailure: function(err) {
                reject(err);
            }
        });
    });
}

// Function to sign out
function signOut() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.signOut();
        authToken = null;
    }
}

// Function to check if user is authenticated
function isAuthenticated() {
    return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) {
            resolve(false);
            return;
        }
        
        cognitoUser.getSession(function(err, session) {
            if (err) {
                reject(err);
                return;
            }
            
            if (session.isValid()) {
                authToken = session.getIdToken().getJwtToken();
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}
```

## Deploying with SAM

### Step 1: Create SAM Template
Create `sam/template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: CineDB Serverless Application

Parameters:
  Environment:
    Type: String
    Default: dev
    Description: The deployment environment
    AllowedValues:
      - dev
      - prod

Globals:
  Function:
    Timeout: 30
    Runtime: nodejs14.x
    MemorySize: 256
    Environment:
      Variables:
        DYNAMODB_TABLE: !Ref MoviesTable
        S3_BUCKET: !Ref MoviePosters

Resources:
  # S3 Buckets
  WebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub cinedb-web-${Environment}
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: error.html

  MoviePosters:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub cinedb-api-${Environment}
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders:
              - '*'
            AllowedMethods:
              - GET
              - PUT
              - POST
              - DELETE
            AllowedOrigins:
              - '*'

  # DynamoDB Table
  MoviesTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub cinedb-${Environment}
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

  # Lambda Functions
  ListMoviesFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub cinedb-list-movies-${Environment}
      CodeUri: ../backend/functions/list-movies/
      Handler: index.handler
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref MoviesTable
        - S3ReadPolicy:
            BucketName: !Ref MoviePosters
      Events:
        ApiEvent:
          Type: Api
          Properties:
            RestApiId: !Ref CineDBApi
            Path: /movies
            Method: GET

  GetMovieFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub cinedb-get-movie-${Environment}
      CodeUri: ../backend/functions/get-movie/
      Handler: index.handler
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref MoviesTable
        - S3ReadPolicy:
            BucketName: !Ref MoviePosters
      Events:
        ApiEvent:
          Type: Api
          Properties:
            RestApiId: !Ref CineDBApi
            Path: /movies/{id}
            Method: GET

  AddMovieFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub cinedb-add-movie-${Environment}
      CodeUri: ../backend/functions/add-movie/
      Handler: index.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref MoviesTable
        - S3CrudPolicy:
            BucketName: !Ref MoviePosters
      Events:
        ApiEvent:
          Type: Api
          Properties:
            RestApiId: !Ref CineDBApi
            Path: /movies
            Method: POST
            Auth:
              Authorizer: CognitoAuthorizer

  # More functions...

  # API Gateway
  CineDBApi:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub cinedb-api-${Environment}
      StageName: !Ref Environment
      Cors:
        AllowMethods: "'*'"
        AllowHeaders: "'*'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt CognitoUserPool.Arn

  # Cognito
  CognitoUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub cinedb-users-${Environment}
      AutoVerifiedAttributes:
        - email
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: false
          RequireUppercase: true

  CognitoUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: !Sub cinedb-app-${Environment}
      GenerateSecret: false
      UserPoolId: !Ref CognitoUserPool
      ExplicitAuthFlows:
        - ALLOW_USER_PASSWORD_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH

Outputs:
  ApiUrl:
    Description: URL of the API Gateway
    Value: !Sub https://${CineDBApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}
  
  CognitoUserPoolId:
    Description: ID of the Cognito User Pool
    Value: !Ref CognitoUserPool
  
  CognitoAppClientId:
    Description: ID of the Cognito App Client
    Value: !Ref CognitoUserPoolClient
  
  WebsiteBucketName:
    Description: Name of the S3 bucket for the website
    Value: !Ref WebsiteBucket
```

### Step 2: Deploy with SAM
```bash
cd sam

# Package the SAM template
sam package --template-file template.yaml --output-template-file packaged.yaml --s3-bucket your-deployment-bucket

# Deploy the SAM template
sam deploy --template-file packaged.yaml --stack-name cinedb-serverless --capabilities CAPABILITY_IAM --parameter-overrides Environment=dev
```

### Step 3: Upload Frontend Files to S3
```bash
# Get the S3 bucket name from the SAM output
WEBSITE_BUCKET=$(aws cloudformation describe-stacks --stack-name cinedb-serverless --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" --output text)

# Upload frontend files
aws s3 sync ../frontend/ s3://$WEBSITE_BUCKET/ --delete
```

## Final Steps

### Update API Configuration
After deploying with SAM, update the API endpoint in the frontend code:

1. Get the API URL from the SAM output:
```bash
API_URL=$(aws cloudformation describe-stacks --stack-name cinedb-serverless --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
```

2. Update `frontend/static/js/api-client.js` with the new API endpoint and Cognito configuration.

3. Re-upload the updated frontend files to S3.

### Create Admin User
Create an admin user for the Cognito User Pool:

```bash
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name cinedb-serverless --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" --output text)

aws cognito-idp admin-create-user --user-pool-id $USER_POOL_ID --username admin --temporary-password Admin123! --region us-west-2

aws cognito-idp admin-set-user-password --user-pool-id $USER_POOL_ID --username admin --password "SecurePassword123!" --permanent --region us-west-2
```

### Test the Application
1. Access the frontend through the CloudFront URL
2. Verify that movies are displayed on the home page
3. Test the admin login functionality
4. Verify CRUD operations in the admin section 