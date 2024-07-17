#!/bin/bash

# Update the system and install necessary packages
yum update -y
yum install -y git python3 python3-pip nginx

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

# Configure Nginx as a reverse proxy
cat <<EOF > /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format  main  '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                      '\$status \$body_bytes_sent "\$http_referer" '
                      '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    upstream flask {
        server 127.0.0.1:8080;
    }

    server {
        listen 80 default_server;
        listen [::]:80 default_server;

        server_name _;

        location / {
            proxy_pass http://flask;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

# Restart Nginx to apply the new configuration
systemctl enable nginx
systemctl restart nginx

# Open port 80 in the firewall (if using firewalld)
if command -v firewall-cmd > /dev/null; then
  firewall-cmd --permanent --add-port=80/tcp
  firewall-cmd --reload
fi
