#!/bin/bash

# Update the system and install necessary packages
yum update -y
yum install -y git python3 python3-pip

# Clone the repository
REPO_URL="https://github.com/the-mirak/cinedb-aws-demo.git"
TARGET_DIR="/home/ec2-user/cinedb"
git clone $REPO_URL $TARGET_DIR

# Check if the clone was successful
if [ ! -d "$TARGET_DIR" ]; then
  echo "Directory $TARGET_DIR does not exist. Git clone might have failed."
  exit 1
fi

# Change directory to the application folder
cd $TARGET_DIR

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


