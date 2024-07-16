#!/bin/bash

# Update the system
yum update -y

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_14.x | bash -
yum install -y nodejs

# Install Git
yum install -y git

# Clone your repository (replace with your actual repository URL)
git clone https://github.com/the-mirak/cinedb-aws-demo.git /home/ec2-user/cinedb

# Navigate to the app directory
cd /home/ec2-user/cinedb

# Install dependencies
npm install

# Set AWS region environment variable
echo "export AWS_REGION=us-west-2" >> /home/ec2-user/.bash_profile

# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start server.js

# Save the PM2 process list and configure PM2 to start on system startup
pm2 save
pm2 startup systemd