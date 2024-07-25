# CineDB AWS Demo

Welcome to the CineDB project! This project is a movie database web application built with Flask, AWS DynamoDB, and S3.

## Setup Instructions

### 1. Create AWS Resources

#### S3 Bucket
Create an S3 bucket to store movie poster images.

```sh
aws s3api create-bucket --bucket your-bucket-name --region us-west-2
```

### 2. DynamoDB Table
Create a DynamoDB table named cinedb.

```sh
aws dynamodb create-table \
    --table-name cinedb \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### 3. Secrets Manager
Store the Flask secret key in AWS Secrets Manager.

```sh
aws secretsmanager create-secret \
    --name flask_ddb_sk \
    --secret-string '{"SECRET_KEY":"your_secret_key"}'
```

### 4. Environment Variables
Create a .env file in the root of your project directory and add the following variables:
```
S3_BUCKET=your-bucket-name
DYNAMODB_TABLE=cinedb
AWS_REGION=us-west-2
FLASK_SECRET_NAME=flask_ddb_sk
```

### 5. Launching the application
To launch this application on an EC2 instance, use the following [user-data](./user-data.sh) script.


## Conclusion
Follow these steps to set up the CineDB project. Ensure all AWS resources are properly created and configured, and environment variables are set correctly in the .env file.

