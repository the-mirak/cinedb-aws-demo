#!/bin/bash

# Activate the virtual environment if you have one, otherwise ensure the packages are installed globally
# source /home/ec2-user/your_virtualenv/bin/activate

export FLASK_APP=app
export FLASK_ENV=production

exec gunicorn -b 0.0.0.0:8080 app:app
