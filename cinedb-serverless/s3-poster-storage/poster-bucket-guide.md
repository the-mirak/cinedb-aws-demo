# Setting Up S3 for Movie Poster Storage

This guide walks through creating and configuring a dedicated S3 bucket for storing CineDB movie poster images.

## Step 1: Create the Poster Storage Bucket

First, create a dedicated S3 bucket for movie poster images:

```bash
# Create the bucket (replace with your preferred region)
aws s3 mb s3://cinedb-movie-posters --region us-east-1

# Enable versioning for recovery of overwritten or deleted posters
aws s3api put-bucket-versioning \
  --bucket cinedb-movie-posters \
  --versioning-configuration Status=Enabled
```

## Step 2: Configure CORS for Poster Access

Set up CORS to allow your frontend application to access the poster images:

```bash
# Create a CORS configuration file
cat > poster-cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Apply the CORS configuration
aws s3api put-bucket-cors \
  --bucket cinedb-bucket-2024 \
  --cors-configuration file://poster-cors.json
```

Replace `YOUR_CLOUDFRONT_DOMAIN` with your actual CloudFront distribution domain. This CORS configuration allows your frontend to:
- Retrieve images (GET)
- Upload new posters (PUT, POST)
- Delete posters (DELETE)
- Check if posters exist (HEAD)

## Step 3: Set Up Lifecycle Policies

Configure lifecycle policies to manage storage costs:

```bash
# Create a lifecycle policy configuration
cat > poster-lifecycle.json << EOF
{
  "Rules": [
    {
      "ID": "DeleteOldVersions",
      "Status": "Enabled",
      "Filter": {},
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    },
    {
      "ID": "TransitionToIA",
      "Status": "Enabled",
      "Filter": {},
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        }
      ]
    }
  ]
}
EOF

# Apply the lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket cinedb-movie-posters \
  --lifecycle-configuration file://poster-lifecycle.json
```

This configuration:
- Deletes old versions of poster images after 30 days
- Transitions infrequently accessed posters to the cheaper STANDARD_IA storage class after 90 days

## Step 4: Configure Bucket Permissions

Set appropriate permissions to secure your poster images:

```bash
# Create a bucket policy file
cat > poster-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity E5OEVYK1FLF68"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cinedb-bucket-2024/*"
    },
    {
      "Sid": "AllowAppWrite",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::472443946497:role/CineDBAppRole"
      },
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::cinedb-bucket-2024/*"
    }
  ]
}
EOF

# Apply the bucket policy
aws s3api put-bucket-policy \
  --bucket cinedb-bucket-2024 \
  --policy file://poster-policy.json
```

Replace:
- `YOUR_OAI_ID` with your CloudFront Origin Access Identity
- `YOUR_ACCOUNT_ID` with your AWS account ID
- `CineDBAppRole` with the IAM role your application uses

## Step 5: Set Up Public Access Block

Block public access to ensure posters are only accessible through authorized channels:

```bash
# Block all public access
aws s3api put-public-access-block \
  --bucket cinedb-movie-posters \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

This ensures that posters can only be accessed through:
- Your CloudFront distribution
- Your application with proper IAM credentials

## Step 6: Add CloudFront Distribution for Posters (Optional)

For better performance and caching, add the poster bucket as an origin to your CloudFront distribution:

```bash
# This requires updating your existing distribution or creating a new one
# See the CloudFront tutorial for detailed instructions on updating distributions
```

## Step 7: Testing the Poster Bucket

Test uploading and accessing a poster image:

```bash
# Upload a test poster
aws s3 cp ./test-poster.jpg s3://cinedb-movie-posters/test-poster.jpg

# Verify the poster exists
aws s3api head-object --bucket cinedb-movie-posters --key test-poster.jpg

# Access the poster through CloudFront (if configured)
curl https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net/test-poster.jpg
```

## Step 8: Integration with CineDB Frontend

Update your frontend code to use this bucket for poster storage:

```javascript
// Example JavaScript for uploading a poster
async function uploadPoster(file, movieId) {
  const filename = `${movieId}-poster.jpg`;
  const s3Params = {
    Bucket: 'cinedb-movie-posters',
    Key: filename,
    Body: file,
    ContentType: file.type
  };
  
  // Using AWS SDK v3
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const s3Client = new S3Client({ region: 'us-east-1' });
  
  try {
    await s3Client.send(new PutObjectCommand(s3Params));
    return `https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net/${filename}`;
  } catch (error) {
    console.error('Error uploading poster:', error);
    throw error;
  }
}
```

## Benefits of This Setup

1. **Separation of Concerns**: Keeps poster images separate from website files
2. **Cost Optimization**: Lifecycle policies reduce storage costs
3. **Security**: Restricted access ensures posters are only accessible through proper channels
4. **Performance**: CloudFront integration provides global caching
5. **Durability**: Versioning helps recover deleted or overwritten posters

Your CineDB application now has a dedicated, secure, and optimized storage solution for movie poster images. 