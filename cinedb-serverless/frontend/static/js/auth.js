// Authentication helper functions
// This is a placeholder for future Cognito integration

// Auth state
let authToken = null;
let currentUser = null;
let demoMode = localStorage.getItem('demoMode') === 'true';

// Check if demo mode is enabled
function isDemoMode() {
    return demoMode;
}

// Enable/disable demo mode
function setDemoMode(enabled) {
    demoMode = enabled;
    localStorage.setItem('demoMode', enabled);
    
    // If enabling demo mode, also "log in" automatically
    // BUT only if user hasn't explicitly logged out in this session
    const hasLoggedOut = sessionStorage.getItem('explicitly_logged_out') === 'true';
    if (enabled && !isAuthenticated() && !hasLoggedOut) {
        authToken = 'demo-mode-token';
        currentUser = 'demo-user';
        sessionStorage.setItem('authToken', authToken);
        sessionStorage.setItem('currentUser', currentUser);
    }
}

// Check if we're authenticated
function isAuthenticated() {
    // In the future, this will check with Cognito
    // For now, just check if we have a token in session storage
    const token = sessionStorage.getItem('authToken');
    if (token) {
        authToken = token;
        currentUser = sessionStorage.getItem('currentUser');
        return true;
    }
    
    return false;
}

// Login function - supports both demo mode and Cognito
function login(username, password) {
    return new Promise((resolve, reject) => {
        // If in demo mode, use existing demo logic
        if (demoMode) {
            authToken = 'demo-mode-token';
            currentUser = username || 'demo-user';
            
            // Store in session storage
            sessionStorage.setItem('authToken', authToken);
            sessionStorage.setItem('currentUser', currentUser);
            
            // Clear logout flag - user is now explicitly logged in
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
                
                // Clear logout flag - user is now explicitly logged in
                sessionStorage.removeItem('explicitly_logged_out');
                
                resolve({ success: true, user: username });
            },
            onFailure: function(err) {
                reject(err);
            },
            newPasswordRequired: function(userAttributes, requiredAttributes) {
                // Handle new password required scenario
                reject(new Error('New password required. Please contact administrator.'));
            }
        });
    });
}

// Logout function - supports both demo mode and Cognito
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
    
    // Set a flag to prevent auto-login in demo mode after explicit logout
    // This flag persists in the current browser session/tab
    sessionStorage.setItem('explicitly_logged_out', 'true');
    
    // Note: we don't turn off demo mode on logout
    // Demo mode settings persist, but user must explicitly log in again
}

// Get auth token for API calls
function getAuthToken() {
    return authToken;
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Function to protect admin pages
function protectAdminPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    }
}

// Register new user with Cognito
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
                userConfirmed: result.userConfirmed,
                username: email
            });
        });
    });
}

// Confirm user registration with verification code
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

// Resend confirmation code
function resendConfirmationCode(username) {
    return new Promise((resolve, reject) => {
        const userData = {
            Username: username,
            Pool: userPool
        };
        
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        cognitoUser.resendConfirmationCode(function(err, result) {
            if (err) {
                reject(err);
                return;
            }
            resolve({ success: true, result: result });
        });
    });
} 