<!-- 8f8676ea-dc6d-47a4-b057-81ff99719e31 a899677e-26cc-499e-8c59-9fb3be89720f -->
# Cognito Authentication Implementation Plan

## Overview

Implement AWS Cognito authentication with CloudFormation provisioning, custom UI, self-registration, and demo mode coexistence. Protect all admin pages and API write operations.

## Phase 1: CloudFormation Template for Cognito Resources

### 1.1 Create SAM/CloudFormation Template

**File**: `sam/template.yaml`

Create a new CloudFormation template defining:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  CineDBUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: cinedb-user-pool
      AutoVerifiedAttributes:
        - email
      UsernameAttributes:
        - email
      Schema:
        - Name: email
          Required: true
          Mutable: false
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireUppercase: true
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: true
      AccountRecoverySetting:
        RecoveryMechanisms:
          - Name: verified_email
            Priority: 1
      EmailConfiguration:
        EmailSendingAccount: COGNITO_DEFAULT
      UserPoolAddOns:
        AdvancedSecurityMode: AUDIT

  CineDBUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: cinedb-web-client
      UserPoolId: !Ref CineDBUserPool
      ExplicitAuthFlows:
        - ALLOW_USER_PASSWORD_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH
        - ALLOW_USER_SRP_AUTH
      PreventUserExistenceErrors: ENABLED
      RefreshTokenValidity: 30
      AccessTokenValidity: 60
      IdTokenValidity: 60
      TokenValidityUnits:
        RefreshToken: days
        AccessToken: minutes
        IdToken: minutes

  CognitoAuthorizer:
    Type: AWS::ApiGateway::Authorizer
    Properties:
      Name: CineDBCognitoAuthorizer
      Type: COGNITO_USER_POOLS
      IdentitySource: method.request.header.Authorization
      RestApiId: u8cf224qu3
      ProviderARNs:
        - !GetAtt CineDBUserPool.Arn

Outputs:
  UserPoolId:
    Description: Cognito User Pool ID
    Value: !Ref CineDBUserPool
    Export:
      Name: CineDB-UserPoolId
  
  UserPoolClientId:
    Description: Cognito User Pool Client ID
    Value: !Ref CineDBUserPoolClient
    Export:
      Name: CineDB-UserPoolClientId
  
  CognitoAuthorizerId:
    Description: API Gateway Cognito Authorizer ID
    Value: !Ref CognitoAuthorizer
    Export:
      Name: CineDB-CognitoAuthorizerId
```

### 1.2 Create Deployment Script

**File**: `sam/deploy-cognito.sh`

```bash
#!/bin/bash
set -e

echo "Deploying Cognito resources..."

aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name cinedb-cognito-stack \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

echo "Retrieving outputs..."
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text)

AUTHORIZER_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoAuthorizerId`].OutputValue' \
  --output text)

echo "USER_POOL_ID=$USER_POOL_ID"
echo "CLIENT_ID=$CLIENT_ID"
echo "AUTHORIZER_ID=$AUTHORIZER_ID"
```

## Phase 2: Frontend Integration

### 2.1 Add Cognito JavaScript SDK

**File**: `frontend/index.html`, `frontend/admin.html`, `frontend/login.html`, `frontend/add_movie.html`, `frontend/edit_movie.html`

Add before `auth.js` script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/amazon-cognito-identity-js@6.3.12/dist/amazon-cognito-identity.min.js"></script>
```

### 2.2 Create Cognito Configuration File

**File**: `frontend/static/js/cognito-config.js`

```javascript
// Cognito Configuration
// Replace these values after deploying CloudFormation stack
const COGNITO_CONFIG = {
    UserPoolId: 'REPLACE_WITH_USER_POOL_ID',
    ClientId: 'REPLACE_WITH_CLIENT_ID',
    Region: 'us-east-1'
};

// Initialize Cognito objects
const poolData = {
    UserPoolId: COGNITO_CONFIG.UserPoolId,
    ClientId: COGNITO_CONFIG.ClientId
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
```

Include this file in all HTML pages before `auth.js`.

### 2.3 Update auth.js for Cognito Integration

**File**: `frontend/static/js/auth.js`

Update the `login()` function to support both demo mode and Cognito:

```javascript
function login(username, password) {
    return new Promise((resolve, reject) => {
        // If in demo mode, use existing demo logic
        if (demoMode) {
            authToken = 'demo-mode-token';
            currentUser = username || 'demo-user';
            sessionStorage.setItem('authToken', authToken);
            sessionStorage.setItem('currentUser', currentUser);
            sessionStorage.removeItem('explicitly_logged_out');
            resolve({ success: true, user: currentUser });
            return;
        }
        
        // Cognito authentication
        const authenticationData = {
            Username: username,
            Password: password,
        };
        
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        
        const userData = {
            Username: username,
            Pool: userPool
        };
        
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                const idToken = result.getIdToken().getJwtToken();
                const accessToken = result.getAccessToken().getJwtToken();
                
                // Store tokens
                authToken = idToken;
                currentUser = username;
                sessionStorage.setItem('authToken', idToken);
                sessionStorage.setItem('accessToken', accessToken);
                sessionStorage.setItem('currentUser', username);
                sessionStorage.removeItem('explicitly_logged_out');
                
                resolve({ success: true, user: username });
            },
            onFailure: function(err) {
                reject(err);
            }
        });
    });
}
```

Add Cognito logout:

```javascript
function logout() {
    authToken = null;
    currentUser = null;
    
    // Logout from Cognito if not in demo mode
    if (!demoMode) {
        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
        }
    }
    
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('currentUser');
    sessionStorage.setItem('explicitly_logged_out', 'true');
}
```

Add registration function:

```javascript
function register(email, password, confirmPassword) {
    return new Promise((resolve, reject) => {
        if (password !== confirmPassword) {
            reject(new Error('Passwords do not match'));
            return;
        }
        
        const attributeList = [
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: 'email',
                Value: email
            })
        ];
        
        userPool.signUp(email, password, attributeList, null, function(err, result) {
            if (err) {
                reject(err);
                return;
            }
            resolve({ 
                success: true, 
                user: result.user,
                userConfirmed: result.userConfirmed 
            });
        });
    });
}

function confirmRegistration(username, code) {
    return new Promise((resolve, reject) => {
        const userData = {
            Username: username,
            Pool: userPool
        };
        
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        cognitoUser.confirmRegistration(code, true, function(err, result) {
            if (err) {
                reject(err);
                return;
            }
            resolve({ success: true, result: result });
        });
    });
}
```

### 2.4 Update login.html UI

**File**: `frontend/login.html`

Add registration form section after the login form:

```html
<!-- Registration Form (hidden by default) -->
<div id="register-container" class="hidden space-y-6">
    <form id="register-form" class="space-y-6">
        <div>
            <label for="register-email" class="block text-sm font-medium text-neutral-300">Email</label>
            <input type="email" id="register-email" name="email" required 
                   class="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500">
        </div>
        
        <div>
            <label for="register-password" class="block text-sm font-medium text-neutral-300">Password</label>
            <input type="password" id="register-password" name="password" required 
                   class="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500">
            <p class="text-xs text-neutral-400 mt-1">Min 8 chars, uppercase, lowercase, number, symbol</p>
        </div>
        
        <div>
            <label for="register-confirm-password" class="block text-sm font-medium text-neutral-300">Confirm Password</label>
            <input type="password" id="register-confirm-password" name="confirmPassword" required 
                   class="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500">
        </div>
        
        <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors">
            Register
        </button>
    </form>
</div>

<!-- Confirmation Form (hidden by default) -->
<div id="confirm-container" class="hidden space-y-6">
    <div class="bg-amber-900/30 border border-amber-600/30 text-amber-200 p-4 rounded-md mb-4">
        <p>Check your email for a verification code</p>
    </div>
    
    <form id="confirm-form" class="space-y-6">
        <input type="hidden" id="confirm-username" />
        
        <div>
            <label for="confirm-code" class="block text-sm font-medium text-neutral-300">Verification Code</label>
            <input type="text" id="confirm-code" name="code" required 
                   class="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500">
        </div>
        
        <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors">
            Verify Email
        </button>
    </form>
</div>

<div class="mt-6 text-center">
    <button id="toggle-register" class="text-sm text-amber-400 hover:text-amber-300">
        Don't have an account? Register
    </button>
</div>
```

Add JavaScript to toggle between login/register:

```javascript
document.getElementById('toggle-register').addEventListener('click', function() {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const isLoginVisible = !loginContainer.classList.contains('hidden');
    
    if (isLoginVisible) {
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        this.textContent = 'Already have an account? Login';
    } else {
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        this.textContent = "Don't have an account? Register";
    }
});

// Handle registration
document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    register(email, password, confirmPassword)
        .then(result => {
            document.getElementById('register-container').classList.add('hidden');
            document.getElementById('confirm-container').classList.remove('hidden');
            document.getElementById('confirm-username').value = email;
        })
        .catch(error => {
            alert('Registration failed: ' + error.message);
        });
});

// Handle confirmation
document.getElementById('confirm-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('confirm-username').value;
    const code = document.getElementById('confirm-code').value;
    
    confirmRegistration(username, code)
        .then(result => {
            alert('Email verified! You can now log in.');
            window.location.reload();
        })
        .catch(error => {
            alert('Verification failed: ' + error.message);
        });
});
```

## Phase 3: API Gateway Authorization

### 3.1 Apply Cognito Authorizer to Protected Endpoints

**File**: `docs/api-gateway/apply-cognito-auth.sh`

Create script to apply the Cognito authorizer to write operations:

```bash
#!/bin/bash
source api-gateway-config.sh

# Get the Cognito Authorizer ID from CloudFormation
AUTHORIZER_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`CognitoAuthorizerId`].OutputValue' \
  --output text)

echo "Applying Cognito authorizer (ID: $AUTHORIZER_ID) to protected endpoints..."

# POST /movies (add movie)
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $MOVIES_RESOURCE_ID \
  --http-method POST \
  --patch-operations op=replace,path=/authorizationType,value=COGNITO_USER_POOLS op=replace,path=/authorizerId,value=$AUTHORIZER_ID \
  --region $REGION

# PUT /movies/{id} (update movie)
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $MOVIE_ID_RESOURCE_ID \
  --http-method PUT \
  --patch-operations op=replace,path=/authorizationType,value=COGNITO_USER_POOLS op=replace,path=/authorizerId,value=$AUTHORIZER_ID \
  --region $REGION

# DELETE /movies/{id} (delete movie)
aws apigateway update-method \
  --rest-api-id $API_ID \
  --resource-id $MOVIE_ID_RESOURCE_ID \
  --http-method DELETE \
  --patch-operations op=replace,path=/authorizationType,value=COGNITO_USER_POOLS op=replace,path=/authorizerId,value=$AUTHORIZER_ID \
  --region $REGION

echo "Creating new deployment..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION

echo "Cognito authorization applied successfully!"
```

### 3.2 Update API Client to Send Authorization Headers

**File**: `frontend/static/js/api-client.js`

Modify API calls to include JWT token in Authorization header:

```javascript
// Update addMovie function
async function addMovie(movieData, posterFile) {
    const formData = new FormData();
    // ... (existing code)
    
    const headers = {};
    
    // Add Authorization header if authenticated and not in demo mode
    const token = sessionStorage.getItem('authToken');
    if (token && !isDemoMode()) {
        headers['Authorization'] = token;
    }
    
    const response = await fetch(`${API_BASE_URL}/movies`, {
        method: 'POST',
        headers: headers,
        body: formData
    });
    // ... (rest of function)
}

// Update updateMovie function
async function updateMovie(movieData, posterFile) {
    // Similar pattern for PUT request
    const headers = {};
    const token = sessionStorage.getItem('authToken');
    if (token && !isDemoMode()) {
        headers['Authorization'] = token;
    }
    // ... (rest of implementation)
}

// Update deleteMovie function
async function deleteMovie(movieId) {
    const headers = {};
    const token = sessionStorage.getItem('authToken');
    if (token && !isDemoMode()) {
        headers['Authorization'] = token;
    }
    
    const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
        method: 'DELETE',
        headers: headers
    });
    // ... (rest of function)
}
```

## Phase 4: Documentation and Testing

### 4.1 Create Cognito Setup Documentation

**File**: `docs/cognito/setup-guide.md`

Document:

- CloudFormation deployment steps
- How to retrieve User Pool ID and Client ID
- How to update cognito-config.js with correct values
- How to create initial admin users
- Self-registration workflow
- Password reset workflow
- Demo mode vs Cognito authentication differences

### 4.2 Create Testing Checklist

**File**: `docs/cognito/testing-checklist.md`

Test scenarios:

1. Demo mode still works (existing functionality)
2. User registration with email verification
3. User login with Cognito credentials
4. Protected API endpoints reject unauthenticated requests
5. Authenticated requests succeed with valid JWT
6. Token refresh on expiration
7. Logout clears Cognito session
8. Admin pages redirect to login when not authenticated
9. Password reset flow
10. Concurrent demo mode and Cognito users

## Phase 5: Configuration File Updates

### 5.1 Update Environment Configuration

**File**: `docs/cognito/cognito-config-template.sh`

```bash
# After deploying CloudFormation, run this to get your configuration
export USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text)

export CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name cinedb-cognito-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
  --output text)

echo "Update frontend/static/js/cognito-config.js with:"
echo "UserPoolId: $USER_POOL_ID"
echo "ClientId: $CLIENT_ID"
```

## Implementation Order

1. Create CloudFormation template (Phase 1.1)
2. Deploy Cognito resources (Phase 1.2)
3. Retrieve User Pool ID and Client ID from outputs
4. Add Cognito SDK to HTML files (Phase 2.1)
5. Create cognito-config.js with actual IDs (Phase 2.2)
6. Update auth.js with Cognito integration (Phase 2.3)
7. Update login.html with registration UI (Phase 2.4)
8. Apply Cognito authorizer to API Gateway (Phase 3.1)
9. Update api-client.js to send tokens (Phase 3.2)
10. Test demo mode still works
11. Test registration and login flows
12. Test protected API endpoints
13. Create documentation (Phase 4)

## Key Considerations

- Demo mode and Cognito coexist: `isDemoMode()` check determines which auth path to use
- JWT tokens stored in sessionStorage, separate from demo mode tokens
- All admin pages (admin.html, add_movie.html, edit_movie.html) remain protected by `protectAdminPage()`
- API Gateway authorizer only validates Cognito tokens, demo mode bypasses API protection
- Self-registration enabled with email verification required
- Password policy enforced: min 8 chars, uppercase, lowercase, number, symbol
- Tokens expire after 60 minutes, refresh token valid for 30 days

### To-dos

- [ ] Create CloudFormation template with Cognito User Pool, App Client, and API Gateway Authorizer
- [ ] Create deployment script and deploy Cognito stack
- [ ] Retrieve User Pool ID and Client ID from CloudFormation outputs
- [ ] Add Cognito JavaScript SDK to all HTML pages
- [ ] Create cognito-config.js with actual User Pool and Client IDs
- [ ] Update auth.js with Cognito login, logout, register, and confirm functions
- [ ] Update login.html with registration and confirmation UI
- [ ] Add toggle between login and registration forms
- [ ] Create script to apply Cognito authorizer to API Gateway endpoints
- [ ] Apply authorizer to POST /movies, PUT /movies/{id}, DELETE /movies/{id}
- [ ] Update api-client.js to send Authorization headers with JWT tokens
- [ ] Deploy updated frontend files to S3
- [ ] Test demo mode still works
- [ ] Test user registration and email verification
- [ ] Test Cognito login and protected API access
- [ ] Create setup and testing documentation