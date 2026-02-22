'use client';

import { useContext } from 'react';
import { AuthContext } from './auth-provider';
import type { AuthStatus } from '@/lib/limits';

type OptionalAuthResult = {
  user: { id: string } | null;
  loading: boolean;
  authStatus: AuthStatus;
  signInWithGoogle?: () => Promise<void>;
  signOut?: () => Promise<void>;
};

/**
 * Optional auth hook that safely reads AuthContext.
 * Returns safe defaults when AuthProvider is not available (e.g., on marketing pages).
 * 
 * Use this instead of useAuth() on public/marketing pages that should work
 * both with and without authentication context.
 */
export function useAuthOptional(): OptionalAuthResult {
  const context = useContext(AuthContext);
  
  // If context is undefined, we're outside AuthProvider - return safe defaults
  if (context === undefined) {
    return {
      user: null,
      loading: false,
      authStatus: 'guest',
      // Don't provide sign in/out functions when no provider exists
    };
  }
  
  // If context exists, return the actual auth state
  return context;
}
