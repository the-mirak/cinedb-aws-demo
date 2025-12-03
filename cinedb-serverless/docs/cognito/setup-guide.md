# Cognito Authentication Setup Guide

## Overview

This guide covers the complete setup of AWS Cognito authentication for the CineDB application, including CloudFormation deployment, configuration, and integration with the existing demo mode.

## Architecture

The CineDB application now supports two authentication modes:

1. **Demo Mode**: Bypasses authentication for testing/demonstration purposes
2. **Cognito Mode**: Full AWS Cognito authentication with user registration and JWT tokens

### Components

- **Cognito User Pool**: Manages user accounts and authentication
- **Cognito App Client**: Allows the frontend to interact with the User Pool
- **API Gateway Authorizer**: Validates JWT tokens for protected endpoints
- **Frontend**: Custom UI for login/registration with Cognito SDK integration

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS SSO session active (`aws sso login`)
- Existing API Gateway REST API deployed
- S3 bucket for frontend hosting
- CloudFront distribution for content delivery

## Deployment Steps

### Step 1: Deploy Cognito Resources

The Cognito resources are defined in a CloudFormation template and can be deployed with a single script:

```bash
cd /home/mirak/cinedb-aws-demo/cinedb-serverless/sam
./deploy-cognito.sh
```

This script will:
1. Deploy the CloudFormation stack (`cinedb-cognito-stack`)
2. Create the Cognito User Pool
3. Create the Cognito App Client
4. Create the API Gateway Authorizer
5. Display the User Pool ID, Client ID, and Authorizer ID

**Expected Output:**
```
USER_POOL_ID=us-east-1_AYRw9Yu3Y
CLIENT_ID=6vhljif2dsp7v8946mg1v58bvk
AUTHORIZER_ID=l3l1j3
USER_POOL_ARN=arn:aws:cognito-idp:us-east-1:472443946497:userpool/us-east-1_AYRw9Yu3Y
```

**Save these values** - they're already configured in the frontend but you'll need them for reference.

### Step 2: Apply Cognito Authorization to API Gateway

Protect the write operations (POST, PUT, DELETE) with Cognito authentication:

```bash
cd /home/mirak/cinedb-aws-demo/cinedb-serverless/docs/api-gateway
./apply-cognito-auth.sh
```

This script will:
1. Retrieve the Cognito Authorizer ID from CloudFormation
2. Apply the authorizer to protected endpoints:
   - POST /movies (add movie)
   - PUT /movies/{id} (update movie)
   - DELETE /movies/{id} (delete movie)
3. Create a new API Gateway deployment

**Note:** GET endpoints remain unprotected (public read access).

### Step 3: Verify Frontend Configuration

The frontend files have already been configured with Cognito integration:

**cognito-config.js** (already configured):
```javascript
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_AYRw9Yu3Y',
    ClientId: '6vhljif2dsp7v8946mg1v58bvk',
    Region: 'us-east-1'
};
```

All HTML files include:
- Cognito JavaScript SDK
- cognito-config.js
- Updated auth.js with Cognito support

## Configuration Details

### Cognito User Pool Settings

**Password Policy:**
- Minimum length: 8 characters
- Requires uppercase letter
- Requires lowercase letter
- Requires number
- Requires symbol

**Email Configuration:**
- Auto-verified attribute: email
- Username attribute: email (users log in with email)
- Email sending: Cognito default (50 emails/day limit)

**Security:**
- Advanced security mode: AUDIT (logs suspicious activity)
- Account recovery: Email verification

**Token Validity:**
- Access Token: 60 minutes
- ID Token: 60 minutes
- Refresh Token: 30 days

### API Gateway Authorization

**Protected Endpoints:**
- POST /movies - Requires Cognito JWT token
- PUT /movies/{id} - Requires Cognito JWT token
- DELETE /movies/{id} - Requires Cognito JWT token

**Unprotected Endpoints:**
- GET /movies - Public access
- GET /movies/{id} - Public access
- GET /presigned-url/{key} - Public access

**Authorization Header Format:**
- Header name: `Authorization`
- Value: JWT token (no "Bearer" prefix)
- Example: `Authorization: eyJraWQiOiJxxx...`

## Demo Mode vs Cognito Authentication

### Demo Mode Behavior

When demo mode is enabled:
- Toggle switch on login page
- No authentication required
- Uses mock token: `demo-mode-token`
- Stored in: `localStorage.demoMode = 'true'`
- API requests: **No Authorization header sent**
- API Gateway: Requests pass through (no authorizer check)

### Cognito Mode Behavior

When demo mode is disabled:
- Standard login/registration forms
- Full Cognito authentication
- Uses real JWT tokens from Cognito
- Stored in: `sessionStorage.authToken`
- API requests: **Authorization header with JWT token**
- API Gateway: Validates token with Cognito authorizer

### Coexistence

Both modes work simultaneously:
- Demo mode users can access admin features without Cognito
- Cognito users get full authentication with JWT tokens
- Logout in either mode clears session properly
- `explicitly_logged_out` flag prevents auto-re-login

## User Management

### Creating Admin Users via AWS Console

1. Open AWS Cognito Console
2. Navigate to User Pools → cinedb-user-pool
3. Go to "Users" tab
4. Click "Create user"
5. Enter:
   - Email address
   - Temporary password
   - Mark email as verified
6. User will be prompted to change password on first login

### Creating Admin Users via AWS CLI

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_AYRw9Yu3Y \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --region us-east-1
```

### Self-Registration (Enabled)

Users can register themselves via the web interface:
1. Click "Don't have an account? Register" on login page
2. Enter email and password (must meet password policy)
3. Receive verification code via email
4. Enter code to verify email
5. Login with credentials

## Frontend Integration

### Authentication Flow

**Login Flow:**
```
1. User enters email/password
2. JavaScript calls login(email, password)
3. Cognito SDK authenticates user
4. Receives ID token, access token, refresh token
5. Stores tokens in sessionStorage
6. Redirects to admin page
```

**Registration Flow:**
```
1. User clicks "Register"
2. Enters email, password, confirm password
3. JavaScript calls register(email, password, confirmPassword)
4. Cognito sends verification code to email
5. User enters code
6. JavaScript calls confirmRegistration(username, code)
7. Email verified, user can log in
```

**Protected Request Flow:**
```
1. User performs admin action (add/edit/delete movie)
2. Frontend calls API with Authorization header
3. API Gateway validates JWT token with Cognito
4. If valid: Request proceeds to Lambda
5. If invalid: Returns 401 Unauthorized
```

### Token Storage

**sessionStorage** (cleared on browser/tab close):
- `authToken` - Cognito ID token (JWT)
- `accessToken` - Cognito access token
- `currentUser` - User's email
- `explicitly_logged_out` - Logout flag

**localStorage** (persists across sessions):
- `demoMode` - Demo mode toggle state

## Troubleshooting

### Issue: "User pool client does not exist"

**Cause:** Cognito config not updated or CloudFormation stack not deployed

**Solution:**
```bash
cd /home/mirak/cinedb-aws-demo/cinedb-serverless/sam
./deploy-cognito.sh
# Update frontend/static/js/cognito-config.js with new IDs
```

### Issue: API returns 401 Unauthorized

**Possible Causes:**
1. Token expired (>60 minutes old)
2. Wrong token format (includes "Bearer" prefix)
3. API Gateway authorizer not applied
4. Demo mode enabled (no token sent)

**Solution:**
- Log out and log in again (refreshes token)
- Check browser console for Authorization header
- Verify API Gateway deployment: `./apply-cognito-auth.sh`
- Disable demo mode to use Cognito

### Issue: Email not received

**Cause:** Cognito default email limit (50/day) exceeded

**Solution:**
1. Verify email in AWS Console manually
2. Configure Cognito with SES for higher limits
3. Use "Resend code" button in confirmation form

### Issue: Demo mode not working after Cognito deployment

**Cause:** API Gateway now requires authorization

**Solution:** Demo mode should still work - it bypasses the authorizer by not sending an Authorization header. If it doesn't:
1. Check if demo mode toggle is enabled
2. Verify `isDemoMode()` returns true
3. Check browser console for errors

## Security Considerations

### Production Recommendations

1. **Email Configuration**: Use Amazon SES instead of Cognito default
   - Higher email sending limits
   - Better deliverability
   - Custom email templates

2. **Custom Domain**: Configure Cognito with custom domain
   - Better branding
   - Consistent user experience

3. **MFA**: Enable multi-factor authentication
   - SMS or TOTP authenticator
   - Add to User Pool settings

4. **Advanced Security**: Upgrade from AUDIT to ENFORCED
   - Blocks suspicious sign-ins
   - Adds adaptive authentication

5. **Disable Self-Registration**: If admin-only access needed
   - Remove registration form from frontend
   - Create users via AWS Console/CLI only

6. **API Rate Limiting**: Add usage plans to API Gateway
   - Prevents abuse
   - Throttling and quotas

### Token Security

- Tokens stored in sessionStorage (not localStorage)
- Tokens cleared on logout
- Tokens expire after 60 minutes
- HTTPS enforced via CloudFront
- CORS configured for specific origins

## Monitoring and Logs

### CloudWatch Logs

**Cognito Sign-in Events:**
- Log Group: `/aws/cognito/userpools/us-east-1_AYRw9Yu3Y`
- Events: Sign-ins, sign-ups, password changes

**API Gateway Logs:**
- Log Group: `/aws/api-gateway/cinedb-api`
- Events: Authorization successes/failures

**Lambda Execution Logs:**
- Log Groups: `/aws/lambda/add-movie`, `/aws/lambda/update-movie`, etc.
- Events: Function executions, errors

### Metrics to Monitor

- Cognito: Sign-in success rate, failed authentications
- API Gateway: 4xx errors (authorization failures), latency
- Lambda: Invocations, errors, duration

## Rollback Procedure

If you need to remove Cognito authentication:

```bash
# Remove API Gateway authorization
aws apigateway update-method \
  --rest-api-id u8cf224qu3 \
  --resource-id w9krmo \
  --http-method POST \
  --patch-operations op=replace,path=/authorizationType,value=NONE \
  --region us-east-1

# Repeat for PUT and DELETE methods

# Delete CloudFormation stack
aws cloudformation delete-stack \
  --stack-name cinedb-cognito-stack \
  --region us-east-1

# Revert frontend to demo-only mode (remove Cognito SDK references)
```

## Additional Resources

- [AWS Cognito User Pools Documentation](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [Cognito JavaScript SDK](https://github.com/aws-amplify/amplify-js/tree/main/packages/amazon-cognito-identity-js)
- [API Gateway Cognito Authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)

## Next Steps

1. Review the testing checklist (`testing-checklist.md`)
2. Test demo mode functionality
3. Test Cognito registration and login
4. Test protected API endpoints
5. Create admin users
6. Configure production settings (SES, MFA, custom domain)

