#!/bin/bash

# Update the system and install necessary packages
yum update -y
yum install -y git python3 python3-pip

# Clone the repository (replace with your actual repository URL)
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

# Install dependencies
pip3 install -r requirements.txt

# Make run.sh executable
chmod +x run.sh

# Create a systemd service to run the Flask application
cat <<EOF > /etc/systemd/system/cinedb-app.service
[Unit]
Description=CineDB Flask Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=$TARGET_DIR
ExecStart=$TARGET_DIR/run.sh
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

# Open port 80 in the firewall (if using firewalld)
if command -v firewall-cmd > /dev/null; then
  firewall-cmd --permanent --add-port=80/tcp
  firewall-ccmd --reload
fi
