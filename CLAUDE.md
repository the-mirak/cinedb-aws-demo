# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CineDB is a movie database application demonstrating two AWS deployment patterns:
1. **Traditional Flask app** (`app/`) - EC2-hosted with DynamoDB and S3
2. **Serverless refactor** (`cinedb-serverless/`) - Lambda, API Gateway, S3, Cognito

## Common Development Commands

### Flask Application (Traditional)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run locally (requires AWS credentials and DynamoDB/S3 setup)
cd app && python app.py

# Production deployment
./run.sh  # Uses gunicorn
```

### Serverless Application
```bash
# Frontend development
cd cinedb-serverless
./build-tailwind.sh           # Build Tailwind CSS
./start-local-dev.sh          # Run frontend with mock API

# Mock API only
./run-mock-api.sh            # Start Express.js mock server

# Deploy frontend to S3
./deploy-frontend.sh <bucket-name> [region]
```

### Frontend Build System
```bash
cd cinedb-serverless/frontend
npm install                   # Install Tailwind dependencies
npm run build:css            # Build production CSS
npm run watch:css            # Watch mode for development
```

## Architecture Overview

### Flask Application Structure
- `app/app.py` - Main Flask application with CRUD operations
- `app/templates/` - Jinja2 templates for server-side rendering
- `app/static/` - CSS and static assets
- Uses boto3 for AWS SDK integration
- DynamoDB for data storage, S3 for movie poster images

### Serverless Application Structure
- `cinedb-serverless/frontend/` - Static HTML/CSS/JS files
- `cinedb-serverless/backend/lambda_functions/` - Individual Lambda functions
  - `get_all_movies/` - List all movies with presigned S3 URLs
  - `get_movie_by_id/` - Fetch single movie details
  - `add_movie/` - Create new movie (admin only)
  - `update_movie/` - Modify existing movie (admin only)
  - `delete_movie/` - Remove movie (admin only)
  - `generate_presigned_url/` - S3 presigned URL generation
- `cinedb-serverless/mock-api/` - Express.js mock server for frontend testing

### AWS Infrastructure
- **CloudFormation Templates** (`CfnTemplates/`):
  - `FullAppCfn.yaml` - Complete infrastructure deployment
  - `prereqCfn.yaml` - Prerequisites (DynamoDB, S3, Secrets Manager)
  - `CfnVPC.yaml` - VPC and networking components
- **Lambda Generator** (`lambda/MovieGen.zip`) - Populates sample data

## Key Implementation Details

### Authentication
- Flask app: Basic admin section (no auth implemented)
- Serverless: Designed for AWS Cognito integration

### S3 Integration
- Movie posters stored in S3 with presigned URLs for secure access
- Frontend deployment via S3 static website hosting
- CORS configuration for cross-origin requests

### DynamoDB Schema
```
Table: cinedb
Primary Key: id (String)
Attributes: title, rating, synopsis, poster (S3 URL)
```

### Environment Variables
Required for both applications:
- `S3_BUCKET` - Movie poster storage bucket
- `DYNAMODB_TABLE` - Movie data table name
- `AWS_REGION` - AWS deployment region
- `SECRET_KEY` - Flask secret (stored in AWS Secrets Manager)

## Development Workflow

### Local Development
1. Use `cinedb-serverless/start-local-dev.sh` for frontend development
2. Mock API provides realistic data without AWS dependencies
3. Tailwind CSS requires build step for styling changes

### Testing Lambda Functions
- Each function has test payloads in respective directories
- Use AWS CLI or SAM CLI for local testing:
```bash
sam local invoke FunctionName --event test-event.json
```

### Deployment
- Traditional: EC2 with user-data script (`user-data.sh`)
- Serverless: Manual AWS resource creation or CloudFormation
- Frontend: S3 deployment via `deploy-frontend.sh`

## Important Files

- `prd.md` - Detailed project requirements document
- `tutorial.md` - Step-by-step serverless conversion guide  
- `s3-bucket-policy.json` - S3 bucket policy template
- `requirements.txt` - Python dependencies for Flask app