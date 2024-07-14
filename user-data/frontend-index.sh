#!/bin/bash
sudo yum update -y
sudo yum install -y nodejs npm git
git clone https://github.com/the-mirak/cinedb-aws-demo.git
cd cinedb/frontend-index
npm install
echo "REACT_APP_API_URL=http://internal-cinedb-b-929325188.us-west-2.elb.amazonaws.com" > .env
npm run build
sudo amazon-linux-extras install -y nginx1
sudo systemctl start nginx
sudo systemctl enable nginx
sudo cp -r build/* /usr/share/nginx/html/