# Tutorial: Deploying CineDB Frontend with S3 and CloudFront

This guide walks through deploying the CineDB frontend to S3 and creating a CloudFront distribution for secure, global delivery.

## Step 1: Prepare and Upload Frontend to S3

```bash
# Create S3 bucket for frontend
aws s3 mb s3://cinedb-frontend-serverless

# Build your frontend if needed (tailwind processing)
cd frontend
npm run build

# Upload files to S3 (adjust path as needed)
aws s3 sync . s3://cinedb-frontend-serverless --exclude "node_modules/*" --exclude "cloudfront/*"  --exclude "src/*" --exclude "*.json" --exclude "*.config.js"
```

## Step 2: Create Origin Access Identity (OAI)

```bash
# Create OAI
aws cloudfront create-cloud-front-origin-access-identity --cloud-front-origin-access-identity-config CallerReference=cinedb-oai,Comment=OAI-for-cinedb
```

Take note of the `Id` and `S3CanonicalUserId` from the response.

## Step 3: Update S3 Bucket Policy

Create a bucket policy that grants access only to the CloudFront OAI:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity E5OEVYK1FLF68"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cinedb-frontend-serverless/*"
    }
  ]
}
```

Apply the policy:

```bash
aws s3api put-bucket-policy --bucket cinedb-frontend-serverless --policy file://bucket-policy.json
```

## Step 4: Create CloudFront Distribution

Create a CloudFront distribution configuration file (`cf-config.json`):

```json
{
  "CallerReference": "cinedb-frontend-serverless-distribution",
  "Comment": "CineDB Frontend Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "cinedb-s3-origin",
        "DomainName": "cinedb-frontend-serverless.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/E5OEVYK1FLF68"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "cinedb-s3-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "DefaultTTL": 86400,
    "MinTTL": 0,
    "MaxTTL": 31536000,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "CacheBehaviors": {
    "Quantity": 2,
    "Items": [
      {
        "PathPattern": "*.js",
        "TargetOriginId": "cinedb-s3-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "Compress": true,
        "DefaultTTL": 604800,
        "MinTTL": 0,
        "MaxTTL": 31536000,
        "ForwardedValues": {
          "QueryString": false,
          "Cookies": {
            "Forward": "none"
          }
        }
      },
      {
        "PathPattern": "*.css",
        "TargetOriginId": "cinedb-s3-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "Compress": true,
        "DefaultTTL": 604800,
        "MinTTL": 0,
        "MaxTTL": 31536000,
        "ForwardedValues": {
          "QueryString": false,
          "Cookies": {
            "Forward": "none"
          }
        }
      }
    ]
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 10
      }
    ]
  },
  "Enabled": true,
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
```

Create the distribution:

```bash
aws cloudfront create-distribution --distribution-config file://cf-config.json
```

## Step 5: Configure SPA Routing for CineDB

The configuration includes custom error responses to route 404 errors to index.html, supporting SPA routing.

## Step 6: Testing the Distribution

After creation (which may take 15-30 minutes to deploy):

1. Get your distribution domain name: 
   ```bash
   aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='CineDB Frontend Distribution'].DomainName" --output text
   ```

2. Access your application at the CloudFront URL: `https://dxxxxxxxx.cloudfront.net`

3. Test accessing direct routes to ensure proper SPA routing

## Step 7: Update API Endpoints (if needed)

If your CineDB backend API is hosted on API Gateway or elsewhere, you may need to update your frontend code to point to the correct API endpoints.

In your frontend's `static/js/api-client.js`, update the API URL:

```javascript
// Update this to your API Gateway URL
const API_URL = 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod';
```

## Step 8: Configure Cache Invalidation (for development)

When updating your frontend:

1. Upload new files to S3
2. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id EXXXXXXXXXXXXX --paths "/*"
   ```

## Step 9: Updating CloudFront for API Gateway Integration

When you're ready to connect your frontend to an API Gateway backend, you'll need to update your CloudFront distribution to properly handle CORS (Cross-Origin Resource Sharing) requests. Here's how:

### Get Current Configuration

First, retrieve your current CloudFront configuration:

```bash
# Get your distribution ID (if you don't have it)
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='CineDB Frontend Distribution'].Id" --output text

# Save the ID for use in subsequent commands
DISTRO_ID=YOUR_DISTRIBUTION_ID

# Retrieve the current configuration
aws cloudfront get-distribution-config --id $DISTRO_ID > current-config.json
```

### Modify the Configuration for CORS Support

Edit the `current-config.json` file:

1. **Important**: Note the `ETag` value at the top level of the JSON file 
2. **Remove** the `ETag` field from the JSON structure (but save its value)
3. Update the `DefaultCacheBehavior` section to support CORS headers:

```json
"DefaultCacheBehavior": {
  "AllowedMethods": {
    "Quantity": 7,
    "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
  },
  "CachedMethods": {
    "Quantity": 2,
    "Items": ["GET", "HEAD"]
  },
  "ForwardedValues": {
    "Headers": {
      "Quantity": 6,
      "Items": [
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "Authorization",
        "Content-Type",
        "Accept"
      ]
    },
    "QueryString": true,
    "Cookies": {
      "Forward": "none"
    }
  }
}
```

This configuration:
- Allows all HTTP methods including OPTIONS (required for CORS preflight)
- Forwards essential CORS-related headers to your origin
- Enables proper API requests with content type and authorization headers

### Apply the Updated Configuration

Use the AWS CLI to apply your changes:

```bash
# Apply the updated configuration, using the ETag you saved earlier
aws cloudfront update-distribution --id $DISTRO_ID --distribution-config file://current-config.json --if-match YOUR_ETAG_VALUE
```

### Wait for Deployment

CloudFront updates take time to propagate globally:

```bash
# Check the deployment status
aws cloudfront get-distribution --id $DISTRO_ID --query "Distribution.Status" --output text
```

Wait until the status changes from `InProgress` to `Deployed` (typically 15-30 minutes).

### Test CORS Configuration

After deployment is complete, test that your CloudFront distribution properly handles CORS:

1. Create a test API request in your frontend code
2. Open browser developer tools (F12) and monitor the Network tab
3. Verify that the OPTIONS preflight request succeeds
4. Check that your actual API requests work without CORS errors

If you encounter CORS errors, ensure:
- Your API Gateway has CORS enabled on its side
- All required headers are being forwarded by CloudFront
- Your browser requests include the correct headers

## Benefits of This Setup

1. **Security**: S3 bucket is private and only accessible through CloudFront
2. **Performance**: Global content delivery with edge caching
3. **Cost-efficient**: Reduced data transfer costs
4. **HTTPS**: Secure connections by default
5. **SPA Support**: Proper handling of client-side routing

You now have a secure, globally-distributed deployment of your CineDB frontend! 