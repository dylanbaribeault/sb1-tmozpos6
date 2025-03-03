import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { 
  signUp, 
  signIn as authSignIn, 
  signOut as authSignOut,
  resetPassword as authResetPassword,
  updatePassword as authUpdatePassword,
  refreshSession as authRefreshSession
} from '../services/authService';
import { 
  AuthContextType, 
  SignUpCredentials, 
  SignInCredentials, 
  ResetPasswordParams, 
  UpdatePasswordParams 
} from '../types/auth';

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  signUp: async () => ({ error: null, data: { user: null } }),
  signIn: async () => ({ error: null, data: { user: null } }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null, data: {} }),
  updatePassword: async () => ({ error: null, data: { user: null } }),
  refreshSession: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        
        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log(`Auth state changed: ${event}`);
            setSession(session);
            setUser(session?.user || null);
            
            // Handle auth events
            switch (event) {
              case 'SIGNED_IN':
                router.replace('/(app)');
                break;
              case 'SIGNED_OUT':
                router.replace('/(auth)/sign-in');
                break;
              case 'USER_UPDATED':
                // Handle user update if needed
                break;
              case 'PASSWORD_RECOVERY':
                router.replace('/(auth)/reset-password');
                break;
            }
          }
        );
        
        // Clean up the subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Sign up handler
  const handleSignUp = async (credentials: SignUpCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signUp(credentials);
      
      if (result.error) {
        setError(result.error.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during sign up';
      setError(errorMessage);
      return { 
        error: { message: errorMessage } as AuthError, 
        data: { user: null } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in handler
  const handleSignIn = async (credentials: SignInCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authSignIn(credentials);
      
      if (result.error) {
        setError(result.error.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during sign in';
      setError(errorMessage);
      return { 
        error: { message: errorMessage } as AuthError, 
        data: { user: null } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authSignOut();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during sign out';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password handler
  const handleResetPassword = async (params: ResetPasswordParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authResetPassword(params);
      
      if (result.error) {
        setError(result.error.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during password reset';
      setError(errorMessage);
      return { 
        error: { message: errorMessage } as AuthError, 
        data: {} 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Update password handler
  const handleUpdatePassword = async (params: UpdatePasswordParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await authUpdatePassword(params);
      
      if (result.error) {
        setError(result.error.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during password update';
      setError(errorMessage);
      return { 
        error: { message: errorMessage } as AuthError, 
        data: { user: null } 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh session handler
  const handleRefreshSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const refreshedSession = await authRefreshSession();
      setSession(refreshedSession);
      setUser(refreshedSession?.user || null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during session refresh';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth context value
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    refreshSession: handleRefreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};