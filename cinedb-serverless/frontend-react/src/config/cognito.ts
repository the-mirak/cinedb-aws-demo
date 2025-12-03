// AWS Cognito Configuration
// These are public identifiers - safe to include in client-side code

export const cognitoConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

// Check if Cognito is configured
export const isCognitoConfigured = () => {
  return !!(cognitoConfig.userPoolId && cognitoConfig.userPoolWebClientId);
};

// Validate configuration
export const validateCognitoConfig = () => {
  if (!isCognitoConfigured()) {
    console.warn(
      '⚠️ AWS Cognito not configured. Authentication features disabled.\n' +
      'To enable auth, create a .env file with:\n' +
      '  VITE_AWS_REGION=us-east-1\n' +
      '  VITE_COGNITO_USER_POOL_ID=your-pool-id\n' +
      '  VITE_COGNITO_CLIENT_ID=your-client-id'
    );
    return false;
  }
  return true;
};
