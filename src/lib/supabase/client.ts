import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for client components
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient can only be used in browser');
  }
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

