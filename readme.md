# CineDB AWS Demo

Welcome to the CineDB project! This project is a movie database web application built with Flask, AWS DynamoDB, and S3.

## Setup Instructions

If you want to **automate some parts of the deployment** you can skip to [here](#2-Automating-resource-creation)

### 1. Creating AWS Resources

#### S3 Bucket
Create an S3 bucket to store movie poster images.

```sh
aws s3api create-bucket --bucket your-bucket-name --region us-west-2
```

#### DynamoDB Table
Create a DynamoDB table named cinedb.

```sh
aws dynamodb create-table \
    --table-name cinedb \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

#### Secrets Manager
Store the Flask secret key in AWS Secrets Manager.

```sh
aws secretsmanager create-secret \
    --name flask_ddb_sk \
    --secret-string '{"SECRET_KEY":"your_secret_key"}'
```

### 2. Automating resource creation
If you need to automate the creation of a VPC with its subnets you can use [this Cfn template](./CfnTemplates/CfnVPC.yaml). 
You can also automate the resources creation by running [this Cfn template](./CfnTemplates/prereqCfn.yaml).

### 3. Launching the application
To launch this application on an EC2 instance, use the following [user-data](./user-data.sh) script.
Make sure to edit the environment variables to reflect the resources you have and the region you are in.


### 4. Populating the database
To populate the DynamoDB table, you can launch this [lambda function](./lambda/MovieGen.zip). Make sure to configure the proper permissions and to populate the `S3_BUCKET_NAME` and the `DYNAMODB_TABLE_NAME` environment variable.
Also, make sure to upload the [pictures](./lambda/Pictures/) to your s3 bucket. 

### 5. Full App Deployment
If you want to deploy the CineDB app with less hassle :) just click [here](https://console.aws.amazon.com/cloudformation/home#/stacks/quickcreate?templateURL=https://s3.amazonaws.com/appcomposer-8x8ubbcoecpbev91-ap-northeast-1/template-1723058158951.yaml&stackName=CineDBStack&param_VpcCidrBlock=10.0.0.0/16&param_DynamoDBTableName=cinedb&param_SecretName=flask_ddb_sk&param_InstanceType=t3.micro
), or you can load the [Cfn template](./CfnTemplates/FullAppCfn.yaml) yourself. 

## Conclusion
Follow these steps to set up the CineDB project. Ensure all AWS resources are properly created and configured, and environment variables are set correctly in the .env file.

