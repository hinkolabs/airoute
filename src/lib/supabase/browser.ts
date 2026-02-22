'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Browser-only Supabase client using @supabase/ssr
// Single client instance shared across all client components
// Uses cookie-based authentication (compatible with server-side)
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use globalThis to survive HMR/module reloads
declare global {
  var __airoute_supabase__: SupabaseClient | undefined;
}

/**
 * Get browser Supabase client singleton
 * 
 * This creates ONE client instance for the entire app to prevent
 * "Multiple GoTrueClient instances" warning.
 * 
 * MUST only be called from 'use client' components.
 * 
 * Uses @supabase/ssr which stores session in cookies (not localStorage)
 * This allows server-side API routes to access the same session.
 */
export function getBrowserSupabaseClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserSupabaseClient must only be called in browser environment');
  }

  if (!globalThis.__airoute_supabase__) {
    globalThis.__airoute_supabase__ = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey
    );
  }
  
  return globalThis.__airoute_supabase__;
}
