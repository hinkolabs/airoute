// ============================================================
// DEPRECATED: Use @/lib/supabase/browser or @/lib/supabase/server
// ============================================================
//
// This file is kept for legacy imports only.
// DO NOT create new Supabase client instances here.
//
// For client components: import { getBrowserSupabaseClient } from '@/lib/supabase/browser'
// For server components: import { createClient } from '@/lib/supabase/server'
//
// Creating multiple clients causes "Multiple GoTrueClient instances detected" warnings.
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Legacy export for backward compatibility (read-only operations)
// WARNING: This creates a separate client instance. Avoid using in new code.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No auth operations with this client
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});


















