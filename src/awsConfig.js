import AWS from 'aws-sdk';

AWS.config.update({
    region: 'us-east-1', // Update to your region
    credentials: new AWS.EC2MetadataCredentials({
        httpOptions: { timeout: 5000 },
        maxRetries: 10,
        retryDelayOptions: { base: 200 }
    })
});

export const dynamoDb = new AWS.DynamoDB.DocumentClient();
export const s3 = new AWS.S3();
