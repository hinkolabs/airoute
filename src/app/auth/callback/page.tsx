'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser';
import { useDemoMode } from '@/app/_providers/demo-mode-provider';

const __DEV__ = process.env.NODE_ENV !== 'production';

export default function AuthCallbackPage() {
  const demoMode = useDemoMode();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);
  const hasRedirected = useRef(false);

  if (demoMode) {
    notFound();
  }

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;
    
    // Utility: ensure we always leave callback, even if router.replace fails
    const finishRedirect = (target: string) => {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      try {
        router.replace(target);
        router.refresh();
      } finally {
        // Hard fallback: force navigation if still on callback after 300ms
        setTimeout(() => {
          if (window.location.pathname.startsWith('/auth/callback')) {
            window.location.replace(target);
          }
        }, 300);
      }
    };
    
    const handleCallback = async () => {
      try {
        if (__DEV__) console.log('[AuthCallback] Starting callback handling');
        
        // Parse URL params
        const url = new URL(window.location.href);
        const sp = url.searchParams;
        const next = sp.get('next') || '/my';
        const error_q = sp.get('error') || '';
        const error_desc_q = sp.get('error_description') || '';
        
        // Clean next path: prevent open redirect, ensure path-only
        const cleanNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/my';
        
        // Detect if user came from KR page
        const isFromKR = cleanNext.startsWith('/kr');
        const fallbackLoginPath = isFromKR ? '/kr/login' : '/login';
        
        const supabase = getBrowserSupabaseClient();
        
        // A) Check for OAuth error first
        if (error_q) {
          console.warn('[AuthCallback] OAuth error:', error_q, error_desc_q);
          if (window.history.replaceState) {
            window.history.replaceState(null, '', '/auth/callback');
          }
          setError('Authentication failed');
          setTimeout(() => finishRedirect(fallbackLoginPath), 1500);
          return;
        }
        
        // B) Wait for onAuthStateChange to fire SIGNED_IN event
        // This is more reliable than polling getSession()
        if (__DEV__) console.log('[AuthCallback] Waiting for auth state change...');
        
        const authStatePromise = new Promise<boolean>((resolve) => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
            if (__DEV__) console.log('[AuthCallback] Auth event received:', event, { hasSession: !!session });
            if (event === 'SIGNED_IN' && session) {
              if (__DEV__) console.log('[AuthCallback] SIGNED_IN confirmed, will redirect');
              subscription.unsubscribe();
              resolve(true);
            }
          });
          
          // Timeout after 3 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            resolve(false);
          }, 3000);
        });
        
        const success = await authStatePromise;
        
        if (success) {
          if (__DEV__) console.log('[AuthCallback] Session established, redirecting to:', cleanNext);
          if (window.history.replaceState) {
            window.history.replaceState(null, '', '/auth/callback');
          }
          finishRedirect(cleanNext);
          return;
        }
        
        // C) Timeout - try getSession as fallback
        if (__DEV__) console.log('[AuthCallback] Timeout, checking session as fallback...');
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          if (__DEV__) console.log('[AuthCallback] Session found via fallback, redirecting to:', cleanNext);
          if (window.history.replaceState) {
            window.history.replaceState(null, '', '/auth/callback');
          }
          finishRedirect(cleanNext);
          return;
        }
        
        // D) No session after all attempts - error
        console.warn('[AuthCallback] No session established after callback');
        if (window.history.replaceState) {
          window.history.replaceState(null, '', '/auth/callback');
        }
        setError('Session error');
        setTimeout(() => finishRedirect('/login'), 1500);
        
      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        if (window.history.replaceState) {
          window.history.replaceState(null, '', '/auth/callback');
        }
        setError('Authentication error');
        setTimeout(() => finishRedirect('/login'), 1500);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        {error ? (
          <>
            <div className="mb-4 text-red-400">
              <p className="text-lg font-semibold">Authentication failed</p>
              <p className="mt-2 text-sm text-slate-400">{error}</p>
            </div>
            <p className="text-sm text-slate-500">Redirecting...</p>
          </>
        ) : (
          <>
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-primary mx-auto" />
            <p className="text-lg text-slate-300">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  );
}
