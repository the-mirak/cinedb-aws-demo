# CineDB - S3 Deployment Guide

This guide covers deploying your React SPA to AWS S3 with CloudFront.

## Prerequisites

- AWS Account with S3 and CloudFront access
- AWS CLI configured
- AWS Cognito User Pool set up

## Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your AWS Cognito details in `.env`:
```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=your-client-id-here
```

## Step 2: Build for Production

```bash
npm install
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Step 3: Create S3 Bucket

```bash
# Create bucket
aws s3 mb s3://your-cinedb-bucket-name

# Enable static website hosting
aws s3 website s3://your-cinedb-bucket-name \
  --index-document index.html \
  --error-document index.html
```

**Important**: Set `error-document` to `index.html` for client-side routing to work!

## Step 4: Configure Bucket Policy

Create a bucket policy to allow public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-cinedb-bucket-name/*"
    }
  ]
}
```

Apply the policy:
```bash
aws s3api put-bucket-policy \
  --bucket your-cinedb-bucket-name \
  --policy file://bucket-policy.json
```

## Step 5: Upload Built Files

```bash
# Upload all files from dist/
aws s3 sync dist/ s3://your-cinedb-bucket-name/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://your-cinedb-bucket-name/ \
  --cache-control "no-cache, no-store, must-revalidate"
```

## Step 6: Set up CloudFront (Recommended)

1. Create CloudFront distribution pointing to your S3 bucket
2. Configure custom error responses:
   - Error Code: 403, 404
   - Response Page Path: `/index.html`
   - HTTP Response Code: 200

This ensures client-side routing works correctly.

## Step 7: Update Cognito Callback URLs

In AWS Cognito Console:

1. Go to your User Pool → App Integration → App Client Settings
2. Add your CloudFront URL or S3 website URL to:
   - Allowed Callback URLs
   - Allowed Sign-out URLs

Example:
```
https://your-cloudfront-domain.cloudfront.net
https://your-bucket.s3-website-us-east-1.amazonaws.com
```

## Deployment Script (Optional)

Create `deploy.sh`:

```bash
#!/bin/bash
BUCKET_NAME="your-cinedb-bucket-name"

echo "Building application..."
npm run build

echo "Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

aws s3 cp dist/index.html s3://$BUCKET_NAME/ \
  --cache-control "no-cache, no-store, must-revalidate"

echo "Deployment complete!"
echo "Site URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Troubleshooting

### 404 Errors on Refresh
- Ensure error document is set to `index.html` in S3 website configuration
- If using CloudFront, configure custom error responses

### Cognito Redirect Errors
- Verify callback URLs in Cognito match your deployed domain
- Check browser console for CORS errors

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Rebuild after changing `.env` file
- Verify variables are correctly loaded in `src/config/cognito.ts`

## Security Notes

- ✅ Cognito credentials (Pool ID, Client ID) are public identifiers - safe in client code
- ✅ Never commit `.env` files to version control
- ✅ Use HTTPS in production (CloudFront provides free SSL)
- ✅ Enable CloudFront logging for monitoring

## Cost Optimization

- Enable S3 versioning for rollbacks
- Set up CloudFront cache invalidation only when needed
- Use S3 lifecycle policies for old versions
- Consider S3 Transfer Acceleration for large uploads

## Next Steps

After deployment:
1. Test authentication flow end-to-end
2. Verify all routes work correctly
3. Test on mobile devices
4. Set up monitoring with CloudWatch
5. Configure custom domain (optional)
