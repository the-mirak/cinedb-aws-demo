#!/bin/bash

# Update the system and install necessary packages
yum update -y
sleep 5
yum install -y git python3 python3-pip

# Clone the repository
REPO_URL="https://github.com/the-mirak/cinedb-aws-demo.git"
TARGET_DIR="/home/ec2-user/cinedb"
sleep 5
git clone --branch v2 $REPO_URL $TARGET_DIR

# Check if the clone was successful
if [ ! -d "$TARGET_DIR" ]; then
  echo "Directory $TARGET_DIR does not exist. Git clone might have failed."
  exit 1
fi

# Change directory to the application folder
cd $TARGET_DIR

# Create a .env file with necessary environment variables
INSTANCE_ID=$(curl http://169.254.169.254/latest/meta-data/instance-id)
AVAILABILITY_ZONE=$(curl http://169.254.169.254/latest/meta-data/placement/availability-zone)

sleep 5

# Create the .env file with the environment variables
cat <<EOF > app/.env
S3_BUCKET=cinedb-bucket-2024
DYNAMODB_TABLE=cinedb
AWS_REGION=us-west-2
FLASK_SECRET_NAME=flask_ddb_sk
INSTANCE_ID=$INSTANCE_ID
AVAILABILITY_ZONE=$AVAILABILITY_ZONE
EOF

echo "Environment variables have been written to app/.env"
echo "Instance ID: $INSTANCE_ID"
echo "Availability Zone: $AVAILABILITY_ZONE"


# Set correct permissions for the templates directory
chmod -R 755 app/templates

# Install dependencies
pip3 install -r requirements.txt

# Install gunicorn globally
pip3 install gunicorn

# Make run.sh executable
chmod +x run.sh

# Get the path to gunicorn
GUNICORN_PATH=$(which gunicorn)

# Create a systemd service to run the Flask application
cat <<EOF > /etc/systemd/system/cinedb-app.service
[Unit]
Description=CineDB Flask Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=$TARGET_DIR
ExecStart=$GUNICORN_PATH -b 0.0.0.0:8080 app:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd to apply the new service
systemctl daemon-reload

# Enable the service to start on boot
systemctl enable cinedb-app.service

# Start the Flask application service
systemctl start cinedb-app.service


