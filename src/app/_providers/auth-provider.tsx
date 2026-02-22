'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser';
import { type AuthStatus } from '@/lib/limits';

const __DEV__ = process.env.NODE_ENV !== 'production';

export const EXPLICIT_SIGNOUT_MARKER = "airoute_explicit_signout_at";
const EXPLICIT_SIGNOUT_TTL = 10000;

export function markExplicitSignOut() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(EXPLICIT_SIGNOUT_MARKER, String(Date.now()));
  } catch (err) {
    if (__DEV__) console.warn('[AuthProvider] Unable to mark explicit sign out', err);
  }
}

function getExplicitSignOutTimestamp(): number | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(EXPLICIT_SIGNOUT_MARKER);
  if (!stored) return null;
  const value = Number(stored);
  return Number.isNaN(value) ? null : value;
}

export function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(localStorage)) {
      if (key === "supabase.auth.token" || key.startsWith("supabase.auth.token.")) {
        localStorage.removeItem(key);
        continue;
      }
      if (key.startsWith("sb-") && key.includes("-auth-token")) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    if (__DEV__) console.warn("[AuthProvider] Failed to clean Supabase storage keys", err);
  }
}

// Get anonymous_id from localStorage (same key as event-logger.ts)
function getAnonymousId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('airoute_anonymous_id');
  } catch {
    return null;
  }
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  authStatus: AuthStatus;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export AuthContext for optional usage
export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const lastUserIdRef = useRef<string | null>(null);
  const hasLoggedSignInRef = useRef(false);
  const hasAuthEventRef = useRef(false);
  const hasSessionRef = useRef(false);
  const authListenerInitialized = useRef(false);
  const lastRefreshKeyRef = useRef<string>(''); // Prevent duplicate refresh calls
  const isSigningOutRef = useRef(false); // Prevent duplicate signOut calls
  const lastSignOutAtRef = useRef(0); // Track last signOut time to prevent resurrection

  useEffect(() => {
    // Prevent double subscription in React StrictMode
    if (authListenerInitialized.current) {
      if (__DEV__) console.log('[AuthProvider] Already initialized, skipping');
      return;
    }
    authListenerInitialized.current = true;

    const supabase = getBrowserSupabaseClient();
    let isMounted = true; // Track if component is still mounted
    let authResolved = false; // Track if auth state has been resolved
    
    // DEV ONLY: Check for stale sessions and optionally clear
    if (__DEV__ && typeof window !== 'undefined') {
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('sb-')
      );
      if (supabaseKeys.length > 0) {
        console.log('[AuthProvider] Found Supabase storage keys:', supabaseKeys.length);
      }
    }

    // Safety timeout: avoid hanging spinner, but never downgrade once we already know auth
    const safetyTimeout = setTimeout(() => {
      if (!isMounted || authResolved) return;

      if (hasAuthEventRef.current || hasSessionRef.current) {
        if (__DEV__) {
          console.log('[AuthProvider] Auth initialization timeout fired after auth activity', {
            hasAuthEvent: hasAuthEventRef.current,
            hasSession: hasSessionRef.current,
          });
        }
        return;
      }

      if (__DEV__) {
        console.warn('[AuthProvider] Auth initialization timeout without auth events, keeping loading state');
      }
      // Do not change user/authStatus here; wait for deterministic state or explicit error handling.
    }, 5000);

    const explicitSignOutTimestamp = getExplicitSignOutTimestamp();
    const explicitSignOutRecent =
      explicitSignOutTimestamp !== null &&
      Date.now() - explicitSignOutTimestamp < EXPLICIT_SIGNOUT_TTL;
    let explicitSignOutCleanupTimer: ReturnType<typeof setTimeout> | null = null;

    if (
      explicitSignOutTimestamp !== null &&
      Date.now() - explicitSignOutTimestamp >= EXPLICIT_SIGNOUT_TTL &&
      typeof window !== "undefined"
    ) {
      sessionStorage.removeItem(EXPLICIT_SIGNOUT_MARKER);
    }

    // Get initial session
    if (__DEV__) console.log('[AuthProvider] Fetching initial session...');
    if (explicitSignOutRecent) {
      if (__DEV__) console.log('[AuthProvider] Skipping initial session due to explicit logout marker');
      if (isMounted) {
        authResolved = true;
        setUser(null);
        setAuthStatus('guest');
        setLoading(false);
      }
      clearTimeout(safetyTimeout);
      if (typeof window !== "undefined") {
        explicitSignOutCleanupTimer = setTimeout(() => {
          sessionStorage.removeItem(EXPLICIT_SIGNOUT_MARKER);
          explicitSignOutCleanupTimer = null;
        }, EXPLICIT_SIGNOUT_TTL) as ReturnType<typeof setTimeout>;
      }
    } else {
      supabase.auth.getSession()
        .then(({ data: { session } }: { data: { session: Session | null } }) => {
          if (!isMounted) {
            if (__DEV__) console.log('[AuthProvider] Component unmounted, skipping session setup');
            return;
          }

          const currentUser = session?.user ?? null;
          // If auth listener already handled state (SIGNED_IN/INITIAL_SESSION/etc),
          // do not let getSession() overwrite state.
          if (hasAuthEventRef.current || authResolved) {
            if (__DEV__) console.log('[AuthProvider] Initial session skipped - auth already resolved by listener');
            return;
          }

          hasSessionRef.current = !!session;
          if (__DEV__) console.log('[AuthProvider] Initial session fetched', { 
            userId: currentUser?.id ?? null,
            hasSession: !!session 
          });
          
          // Guard: Skip if recently signed out (prevent resurrection)
          // Reduced from 2000ms to 1000ms - only need to guard against immediate resurrection
          const timeSinceSignOut = Date.now() - lastSignOutAtRef.current;
          if (lastSignOutAtRef.current > 0 && timeSinceSignOut < 1000) {
            if (__DEV__) console.log('[AuthProvider] Skipping session restore - recently signed out', { timeSinceSignOut });
            // MUST set loading to false even when skipping!
            authResolved = true;
            setLoading(false);
            setAuthStatus('guest');
            return;
          }
          
          authResolved = true;
          setUser(currentUser);
          setAuthStatus(currentUser ? 'authed' : 'guest');
          
          if (currentUser?.id) {
            lastUserIdRef.current = currentUser.id;
            
            // Log sign in if session exists and not yet logged (fire-and-forget)
            if (!hasLoggedSignInRef.current) {
              hasLoggedSignInRef.current = true;
              const userId = currentUser.id;
              const provider = currentUser.app_metadata?.provider ?? 'unknown';
              const anonId = getAnonymousId();
              
              if (__DEV__) console.log('[auth-log] event=initial_session (fire-and-forget)', { userId, anonymousId: anonId, provider });
              
              // Fire-and-forget - don't await
              fetch('/api/events/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event_type: 'auth_sign_in',
                  target_type: 'auth',
                  target_slug: provider,
                  source: 'auth_state',
                  user_id: userId,
                  anonymous_id: anonId,
                  metadata: { provider },
                }),
              }).catch(err => {
                if (__DEV__) console.error('[auth-log] fetch error', err);
              });
            }
          }
        })
        .catch((err: any) => {
          if (!isMounted) {
            if (__DEV__) console.log('[AuthProvider] Component unmounted, skipping error handler');
            return;
          }
          console.error('[AuthProvider] getSession error:', err);
          // On error, still set loading to false so UI doesn't hang
          authResolved = true;
          setUser(null);
          setAuthStatus('guest');
        })
        .finally(() => {
          if (!isMounted) {
            if (__DEV__) console.log('[AuthProvider] Component unmounted, skipping finally');
            return;
          }
          // If listener already processed any auth event, do NOT touch state here.
          // This prevents race/hydration issues where getSession finally runs after SIGNED_IN.
          if (hasAuthEventRef.current) {
            if (__DEV__) console.log('[AuthProvider] Skipping finally() state update – auth handled by listener');
            clearTimeout(safetyTimeout);
            return;
          }

          // Listener did not run; finalize loading here.
          if (!authResolved) authResolved = true;
          if (__DEV__) console.log('[AuthProvider] Initial session load complete (no listener), setting loading=false');
          setLoading(false);
          clearTimeout(safetyTimeout);
        });
    }

    // Listen for auth changes and refresh server components
    if (__DEV__) console.log('[AuthProvider] Attaching onAuthStateChange listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (__DEV__) console.log('[AuthProvider] Auth event:', event, { 
          userId: session?.user?.id ?? null,
          hasSession: !!session 
        });
        hasAuthEventRef.current = true;
        hasSessionRef.current = !!session;
        authResolved = true;
        
        // Guard: Skip session restoration ONLY if recently signed out AND not INITIAL_SESSION
        // INITIAL_SESSION must ALWAYS be processed to handle page refresh properly
        const timeSinceSignOut = Date.now() - lastSignOutAtRef.current;
        if (event !== 'INITIAL_SESSION' && timeSinceSignOut < 1000) {
          if (__DEV__) console.log('[AuthProvider] Skipping event - recently signed out', { event, timeSinceSignOut });
          return;
        }
        
        // Update user state based on auth events
        const currentUser = session?.user ?? null;
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthStatus('guest');
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          // INITIAL_SESSION is critical for page refresh - always process it
          setUser(currentUser);
          setAuthStatus(currentUser ? 'authed' : 'guest');
          setLoading(false);
          if (__DEV__) console.log('[AuthProvider] Auth event processed, setting loading=false', { event });
        } else {
          // Other events: still update state
          setUser(currentUser);
          setAuthStatus(currentUser ? 'authed' : 'guest');
          setLoading(false);
        }

        // Track user_id for sign out logging
        if (currentUser?.id) {
          lastUserIdRef.current = currentUser.id;
        }

        // Only refresh on meaningful auth changes (not TOKEN_REFRESHED, INITIAL_SESSION, etc)
        const shouldRefresh = event === 'SIGNED_IN' || event === 'SIGNED_OUT';
        const refreshKey = `${event}:${currentUser?.id ?? 'guest'}`;
        
        if (shouldRefresh && lastRefreshKeyRef.current !== refreshKey) {
          if (__DEV__) console.log('[AuthProvider] Refreshing server components for event:', event);
          lastRefreshKeyRef.current = refreshKey;
          router.refresh();
        }

        // Log sign in event once per session
        if (!hasLoggedSignInRef.current) {
          const currentUserId = session?.user?.id ?? null;

          if (!currentUserId) {
            if (__DEV__) {
              console.log('[auth-log] skip SIGNED_IN: userId not ready');
            }
          } else {
            const provider = session?.user?.app_metadata?.provider ?? 'unknown';
            const anonId = getAnonymousId();

            if (__DEV__) {
              console.log('[auth-log] event=SIGNED_IN', { userId: currentUserId, anonymousId: anonId, provider });
            }

            try {
              if (__DEV__) {
                console.log('[auth-log] posting /api/events/log', { event_type: 'auth_sign_in', userId: currentUserId, provider });
              }

              const res = await fetch('/api/events/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event_type: 'auth_sign_in',
                  target_type: 'auth',
                  target_slug: provider,
                  source: 'auth_state',
                  user_id: currentUserId,
                  anonymous_id: anonId,
                  metadata: { provider },
                }),
              });
              if (!res.ok) {
                const txt = await res.text().catch(() => '');
                console.error('[auth-log] /api/events/log failed', res.status, txt);
              } else if (__DEV__) {
                console.log('[auth-log] /api/events/log ok');
              }
            } catch (err) {
              console.error('[auth-log] fetch error', err);
            } finally {
              hasLoggedSignInRef.current = true;
            }
          }
        }
        // Log sign out event (fire-and-forget)
        if (event === 'SIGNED_OUT' && lastUserIdRef.current) {
          const userId = lastUserIdRef.current;
          const anonId = getAnonymousId();
          
          if (__DEV__) console.log('[auth-log] event=SIGNED_OUT', { userId, anonymousId: anonId, provider: 'unknown' });
          
          try {
            if (__DEV__) console.log('[auth-log] posting /api/events/log', { event_type: 'auth_sign_out', userId });
            
            const res = await fetch('/api/events/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event_type: 'auth_sign_out',
                target_type: 'auth',
                target_slug: 'sign_out',
                source: 'auth_state',
                user_id: userId,
                anonymous_id: anonId,
                metadata: {},
              }),
            });
            if (!res.ok) {
              const txt = await res.text().catch(() => '');
              console.error('[auth-log] /api/events/log failed', res.status, txt);
            } else {
              if (__DEV__) console.log('[auth-log] /api/events/log ok');
            }
          } catch (err) {
            console.error('[auth-log] fetch error', err);
          }
          
          // Reset state after sign out
          hasLoggedSignInRef.current = false;
          lastUserIdRef.current = null;
        }
      }
    );

    return () => {
      if (__DEV__) console.log('[AuthProvider] Cleanup: unsubscribing and marking unmounted');
      isMounted = false;
      clearTimeout(safetyTimeout);
      if (explicitSignOutCleanupTimer) {
        clearTimeout(explicitSignOutCleanupTimer);
      }
      subscription.unsubscribe();
      authListenerInitialized.current = false; // Reset for potential remount
    };
  }, [router]);

  const signInWithGoogle = async () => {
    if (__DEV__) console.log('[AuthProvider] signInWithGoogle called');
    const supabase = getBrowserSupabaseClient();
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/my`,
        },
      });

      if (error) {
        console.error('[AuthProvider] Google OAuth error:', error.message);
        throw error;
      }
      
      if (__DEV__) console.log('[AuthProvider] Google OAuth initiated successfully');
    } catch (err) {
      console.error('[AuthProvider] signInWithGoogle failed:', err);
      throw err;
    }
  };

  const signOut = async () => {
    if (__DEV__) console.log('[AuthProvider] signOut start');
    markExplicitSignOut();
    
    // Check lock but don't return - must reach finally to reset state
    const alreadySigningOut = isSigningOutRef.current;
    if (alreadySigningOut) {
      if (__DEV__) console.log('[AuthProvider] signOut already in progress, will skip API but reset state');
    }
    
    isSigningOutRef.current = true;
    
    const supabase = getBrowserSupabaseClient();
    
    try {
      // Only call API if not already in progress
      if (!alreadySigningOut) {
        if (__DEV__) console.log('[AuthProvider] Calling supabase.auth.signOut()...');
        
        // Add timeout to prevent hanging (2 seconds is enough)
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 2000)
        );
        
        try {
          const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
          if (error) {
            console.warn('[AuthProvider] Client signOut API error (will proceed with local cleanup):', error);
          } else {
            if (__DEV__) console.log('[AuthProvider] Client signOut API ok');
          }
        } catch (timeoutErr) {
          // Timeout is not critical - we'll clean up locally anyway
          console.warn('[AuthProvider] signOut API timeout (proceeding with local cleanup)');
        }
      }
    } catch (err) {
      console.warn('[AuthProvider] signOut error (proceeding with local cleanup):', err);
    } finally {
      if (__DEV__) console.log('[AuthProvider] Entering finally block...');
      clearSupabaseAuthStorage();
      
      // Always execute cleanup - this is critical!
      lastSignOutAtRef.current = Date.now();
      
      setUser(null);
      setAuthStatus('guest');
      setLoading(false);
      
      // Detect if user is on KR page and redirect accordingly
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      const isKRPage = currentPath.startsWith('/kr');
      const redirectPath = isKRPage ? '/kr' : '/';
      
      if (__DEV__) console.log('[AuthProvider] State cleared, redirecting to:', redirectPath);
      router.replace(redirectPath);
      router.refresh();
      
      if (__DEV__) console.log('[AuthProvider] signOut complete - state cleared & redirected');
      
      // Reset lock after small delay
      setTimeout(() => {
        isSigningOutRef.current = false;
      }, 300);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authStatus, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

