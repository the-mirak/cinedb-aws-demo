FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and other config files
COPY frontend/package.json frontend/tailwind.config.js ./

# Install dependencies
RUN npm install

# Copy source files
COPY frontend/src ./src
COPY frontend/static ./static
COPY frontend/*.html ./

# Build Tailwind CSS
RUN npm run build:css

FROM nginx:alpine

# Copy built files from the build stage
COPY --from=build /app/static /usr/share/nginx/html/static
COPY --from=build /app/*.html /usr/share/nginx/html/

# Copy nginx configuration
RUN mkdir -p /etc/nginx/templates
COPY <<EOF /etc/nginx/templates/default.conf.template
server {
    listen       80;
    server_name  localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }

    # Enable CORS
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;

    # Error handling
    error_page   500 502 503 504  /error.html;
    
    # Handle 404 errors with the error page
    error_page   404  /error.html;
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 