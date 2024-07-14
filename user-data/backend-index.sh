#!/bin/bash
sudo yum update -y
sudo yum install -y nodejs npm git
git clone https://github.com/the-mirak/cinedb-aws-demo.git
cd cinedb/backend-index
npm install
echo "PORT=3000" > .env
echo "AWS_REGION=us-west-2" >> .env
echo "DYNAMODB_TABLE_NAME=cinedb" >> .env
npm install -g pm2
pm2 start src/index.js --name cinedb-index-api
pm2 startup
pm2 save