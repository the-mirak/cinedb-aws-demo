#!/bin/bash
sudo yum update -y
sudo yum install -y nodejs npm git
git clone https://github.com/the-mirak/cinedb-aws-demo.git cinedb
cd cinedb/frontend-admin
npm install
echo "REACT_APP_API_URL=http://internal-cinedb-b-929325188.us-west-2.elb.amazonaws.com"