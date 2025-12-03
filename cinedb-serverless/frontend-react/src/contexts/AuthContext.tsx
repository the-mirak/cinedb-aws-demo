import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthUser } from '@/services/auth.service';
import { CognitoUserSession } from 'amazon-cognito-identity-js';

interface AuthContextType {
  user: AuthUser | null;
  session: CognitoUserSession | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  setDemoUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<CognitoUserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      // Check if demo mode is active
      const isDemoMode = localStorage.getItem('isDemoMode') === 'true';
      if (isDemoMode) {
        const demoUser: AuthUser = {
          email: 'admin@demo.com',
          emailVerified: true,
          sub: 'demo-user-id',
          name: 'Demo Admin',
          groups: ['Admins'],
          isAdmin: true,
        };
        setUser(demoUser);
        setSession({} as CognitoUserSession);
        return;
      }

      const currentSession = await authService.getCurrentSession();
      if (currentSession) {
        setSession(currentSession);
        const userAttributes = await authService.getUserAttributes();
        setUser(userAttributes);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setSession(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const session = await authService.signIn({ email, password });
      setSession(session);
      await refreshUser();
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const result = await authService.signUp({ email, password, name });
      return result;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signOut = () => {
    authService.signOut();
    localStorage.removeItem('isDemoMode'); // Clear demo mode flag
    localStorage.removeItem('demoToken'); // Clear demo token
    setUser(null);
    setSession(null);
  };

  const setDemoUser = () => {
    const demoUser: AuthUser = {
      email: 'admin@demo.com',
      emailVerified: true,
      sub: 'demo-user-id',
      name: 'Demo Admin',
      groups: ['Admins'],
      isAdmin: true,
    };
    
    // Generate a fake demo token (constant string for backend to recognize)
    const DEMO_TOKEN = 'CINEDB_DEMO_MODE_TOKEN_2024';
    
    localStorage.setItem('isDemoMode', 'true'); // Persist demo mode
    localStorage.setItem('demoToken', DEMO_TOKEN); // Store fake token
    setUser(demoUser);
    // Set a mock session object
    setSession({} as CognitoUserSession);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin: user?.isAdmin || false,
        signIn,
        signUp,
        signOut,
        refreshUser,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
