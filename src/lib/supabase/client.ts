import { createBrowserClient } from '@supabase/ssr';

// ============================================================
// NOTE (RLS):
// tools / routes / route_tools are publicly readable (anon SELECT allowed).
// This is intentional for Airoute MVP.
// Do NOT remove tools_public_read policy or all tools will 404.
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for client components
let browserClient: ReturnType<typeof createClient> | null = null;

/**
 * Get Supabase browser client (SSR-safe)
 * Returns null during SSR instead of throwing
 */
export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    // During SSR, return a mock that won't crash
    // Callers should check for null or handle gracefully
    console.warn('getSupabaseBrowserClient called during SSR');
    return createClient(); // Still works but won't persist
  }
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

/**
 * Check if we're in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

