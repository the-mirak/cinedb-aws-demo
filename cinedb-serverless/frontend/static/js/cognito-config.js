// Cognito Configuration
// Automatically generated from CloudFormation deployment
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_AYRw9Yu3Y',
    ClientId: '6vhljif2dsp7v8946mg1v58bvk',
    Region: 'us-east-1'
};

// Initialize Cognito objects
const poolData = {
    UserPoolId: COGNITO_CONFIG.UserPoolId,
    ClientId: COGNITO_CONFIG.ClientId
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

