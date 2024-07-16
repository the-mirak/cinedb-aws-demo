#!/bin/bash

# Update the system
sudo dnf update -y
# Install Node.js, npm, and git
sudo dnf install -y nodejs npm git
# Install Nginx
sudo dnf install -y nginx
# Clone the repository
git clone https://github.com/the-mirak/cinedb-aws-demo.git /home/ec2-user/cinedb
# Navigate to the frontend directory
cd /home/ec2-user/cinedb/frontend
# Install dependencies
npm install
# Set the API URL
echo "REACT_APP_API_URL=http://internal-cinedb-b-929325188.us-west-2.elb.amazonaws.com" > .env
# Build the React app
npm run build
# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
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

# Restart Nginx to apply changes
sudo systemctl restart nginx
# Set correct permissions
sudo chown -R ec2-user:ec2-user /home/ec2-user/cinedb