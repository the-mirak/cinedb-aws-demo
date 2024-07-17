#!/bin/bash

# Update the system and install necessary packages
yum update -y
yum install -y git nodejs

# Clone the repository (replace with your actual repository URL)
git clone https://github.com/the-mirak/cinedb-aws-demo.git /home/ec2-user/cinedb
# Change directory to the application folder
cd /home/ec2-user/cinedb-app

# Install dependencies
npm install

# Build the application
npm run build

# Install serve to serve the build files
npm install -g serve

# Create a systemd service to run the application
cat <<EOF > /etc/systemd/system/cinedb-app.service
[Unit]
Description=CineDB React Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/cinedb-app
ExecStart=/usr/bin/serve -s build -l 80
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd, enable and start the service
systemctl daemon-reload
systemctl enable cinedb-app.service
systemctl start cinedb-app.service
