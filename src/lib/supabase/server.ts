import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ============================================================
// NOTE (RLS):
// tools / routes / route_tools are publicly readable (anon SELECT allowed).
// This is intentional for Airoute MVP.
// Do NOT remove tools_public_read policy or all tools will 404.
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// NOTE: env vars are already validated as non-null above (using !)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

// Legacy export for backward compatibility (read-only, no auth)
export { supabaseServerClient } from "./server-legacy";





