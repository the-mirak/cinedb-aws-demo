#!/bin/bash

# Update the system and clean DNF cache
sudo dnf clean all
sudo dnf update -y

# Enable additional repositories if needed
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --set-enabled amazonlinux-extras

# Refresh repository metadata
sudo dnf makecache

# Install Node.js, npm, git, and nginx
sudo dnf install -y nodejs npm git nginx

# Verify Node.js version
node --version

# Clone the repository
git clone https://github.com/the-mirak/cinedb-aws-demo.git /home/ec2-user/cinedb

# Navigate to the frontend directory
cd /home/ec2-user/cinedb/frontend-index

# Install dependencies
npm install

# Set the API URL
echo "REACT_APP_API_URL=http://internal-cinedb-b-929325188.us-west-2.elb.amazonaws.com" > .env

# Build the React app with legacy OpenSSL provider
export NODE_OPTIONS=--openssl-legacy-provider
npm run build

# Ensure Nginx directories exist
sudo mkdir -p /usr/share/nginx/html
sudo mkdir -p /etc/nginx/conf.d

# Copy the built files to Nginx's serve directory
sudo cp -r build/* /usr/share/nginx/html/

# Configure Nginx to serve the React app
sudo tee /etc/nginx/conf.d/cinedb.conf > /dev/null <<EOL
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOL

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Restart Nginx to apply changes
sudo systemctl restart nginx

# Set correct permissions
sudo chown -R ec2-user:ec2-user /home/ec2-user/cinedb

# Output Nginx status for debugging
sudo systemctl status nginx

# Output the contents of Nginx configuration for verification
echo "Nginx configuration:"
sudo cat /etc/nginx/conf.d/cinedb.conf

# Check if the build directory exists and list its contents
echo "Contents of build directory:"
ls -l /home/ec2-user/cinedb/frontend-index/build

# Output the end of cloud-init log for any errors
echo "Last 20 lines of cloud-init log:"
sudo tail -n 20 /var/log/cloud-init-output.log