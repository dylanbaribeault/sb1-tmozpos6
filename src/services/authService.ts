import { AuthError, User } from '@supabase/supabase-js';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { SignUpCredentials, SignInCredentials, ResetPasswordParams, UpdatePasswordParams } from '../types/auth';

/**
 * Register a new user with email and password
 * @param credentials - User registration credentials
 * @returns Promise with user data or error
 */
export const signUp = async (credentials: SignUpCredentials) => {
  try {
    const { email, password, fullName } = credentials;
    
    // Validate input
    if (!email || !password || !fullName) {
      throw new Error('Email, password, and full name are required');
    }
    
    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) throw error;
    
    // If registration is successful, create a profile record
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
          username: email.split('@')[0],
          notification_preferences: {
            email: true,
            push: true,
          },
        });
      
      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // We don't throw here because the user was created successfully
      }
    }
    
    return { error: null, data: { user: data.user } };
  } catch (error) {
    console.error('Sign up error:', error);
    return { 
      error: error as AuthError, 
      data: { user: null } 
    };
  }
};

/**
 * Sign in a user with email and password
 * @param credentials - User login credentials
 * @returns Promise with user data or error
 */
export const signIn = async (credentials: SignInCredentials) => {
  try {
    const { email, password } = credentials;
    
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    return { error: null, data: { user: data.user } };
  } catch (error) {
    console.error('Sign in error:', error);
    return { 
      error: error as AuthError, 
      data: { user: null } 
    };
  }
};

/**
 * Sign out the current user
 * @returns Promise<void>
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send a password reset email
 * @param params - Object containing the user's email
 * @returns Promise with success or error
 */
export const resetPassword = async (params: ResetPasswordParams) => {
  try {
    const { email } = params;
    
    // Validate input
    if (!email) {
      throw new Error('Email is required');
    }
    
    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'fieldshield://reset-password',
    });
    
    if (error) throw error;
    
    return { error: null, data: {} };
  } catch (error) {
    console.error('Reset password error:', error);
    return { 
      error: error as AuthError, 
      data: {} 
    };
  }
};

/**
 * Update user's password
 * @param params - Object containing the new password
 * @returns Promise with user data or error
 */
export const updatePassword = async (params: UpdatePasswordParams) => {
  try {
    const { password } = params;
    
    // Validate input
    if (!password) {
      throw new Error('New password is required');
    }
    
    // Update password
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) throw error;
    
    return { error: null, data: { user: data.user } };
  } catch (error) {
    console.error('Update password error:', error);
    return { 
      error: error as AuthError, 
      data: { user: null } 
    };
  }
};

/**
 * Get the current user session
 * @returns Promise with session data
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
};

/**
 * Get the current user
 * @returns Promise with user data
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Refresh the current session
 * @returns Promise with session data
 */
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Refresh session error:', error);
    return null;
  }
};