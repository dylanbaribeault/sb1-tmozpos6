import { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdatePasswordParams {
  password: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: AuthError | null; data: { user: User | null } }>;
  signIn: (credentials: SignInCredentials) => Promise<{ error: AuthError | null; data: { user: User | null } }>;
  signOut: () => Promise<void>;
  resetPassword: (params: ResetPasswordParams) => Promise<{ error: AuthError | null; data: {} }>;
  updatePassword: (params: UpdatePasswordParams) => Promise<{ error: AuthError | null; data: { user: User | null } }>;
  refreshSession: () => Promise<void>;
}