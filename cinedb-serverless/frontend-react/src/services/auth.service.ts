import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { cognitoConfig, isCognitoConfigured } from '@/config/cognito';

// Initialize Cognito User Pool only if configured
let userPool: CognitoUserPool | null = null;

if (isCognitoConfigured()) {
  userPool = new CognitoUserPool({
    UserPoolId: cognitoConfig.userPoolId,
    ClientId: cognitoConfig.userPoolWebClientId,
  });
}

export interface SignUpParams {
  email: string;
  password: string;
  name?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthUser {
  email: string;
  emailVerified: boolean;
  sub: string;
  name?: string;
  groups?: string[];
  isAdmin?: boolean;
}

class AuthService {
  // Check if auth is available
  private isAvailable(): boolean {
    if (!userPool) {
      console.warn('Authentication not available - Cognito not configured');
      return false;
    }
    return true;
  }

  // Sign Up
  async signUp({ email, password, name }: SignUpParams): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      throw new Error('Authentication not configured. Please set up AWS Cognito credentials.');
    }

    return new Promise((resolve, reject) => {
      const attributeList: CognitoUserAttribute[] = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ];

      if (name) {
        attributeList.push(
          new CognitoUserAttribute({
            Name: 'name',
            Value: name,
          })
        );
      }

      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          console.error('Sign up error:', err);
          reject(err);
          return;
        }

        resolve({
          success: true,
          message: result?.userConfirmed
            ? 'Account created successfully!'
            : 'Please check your email to verify your account.',
        });
      });
    });
  }

  // Sign In
  async signIn({ email, password }: SignInParams): Promise<CognitoUserSession> {
    if (!this.isAvailable()) {
      throw new Error('Authentication not configured. Please set up AWS Cognito credentials.');
    }

    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          resolve(session);
        },
        onFailure: (err) => {
          console.error('Sign in error:', err);
          reject(err);
        },
        newPasswordRequired: () => {
          reject(new Error('New password required'));
        },
      });
    });
  }

  // Sign Out
  signOut(): void {
    if (!this.isAvailable()) return;
    
    const cognitoUser = userPool!.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
  }

  // Get Current User
  getCurrentUser(): CognitoUser | null {
    if (!this.isAvailable()) return null;
    return userPool!.getCurrentUser();
  }

  // Get Current Session
  async getCurrentSession(): Promise<CognitoUserSession | null> {
    if (!this.isAvailable()) return null;

    return new Promise((resolve) => {
      const cognitoUser = this.getCurrentUser();
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve(null);
          return;
        }
        resolve(session);
      });
    });
  }

  // Get User Attributes
  async getUserAttributes(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      const cognitoUser = this.getCurrentUser();
      if (!cognitoUser) {
        resolve(null);
        return;
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          resolve(null);
          return;
        }

        cognitoUser.getUserAttributes((err, attributes) => {
          if (err || !attributes) {
            resolve(null);
            return;
          }

          const userAttributes: Record<string, string> = {};
          attributes.forEach((attr) => {
            userAttributes[attr.Name] = attr.Value;
          });

          // Extract groups from ID token
          const idToken = session.getIdToken();
          const groups = idToken.payload['cognito:groups'] as string[] | undefined;
          const isAdmin = groups?.includes('admin') || false;

          resolve({
            email: userAttributes.email,
            emailVerified: userAttributes.email_verified === 'true',
            sub: userAttributes.sub,
            name: userAttributes.name,
            groups: groups || [],
            isAdmin,
          });
        });
      });
    });
  }

  // Verify Email
  async verifyEmail(code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.getCurrentUser();
      if (!cognitoUser) {
        reject(new Error('No user found'));
        return;
      }

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  // Resend Verification Code
  async resendVerificationCode(): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = this.getCurrentUser();
      if (!cognitoUser) {
        reject(new Error('No user found'));
        return;
      }

      cognitoUser.resendConfirmationCode((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  // Forgot Password
  async forgotPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.forgotPassword({
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  // Reset Password
  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          resolve();
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }
}

export const authService = new AuthService();
