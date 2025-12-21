import { createClient } from "@supabase/supabase-js";

export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey || serviceKey.trim().length < 10) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY. Set it in Vercel Project Settings → Environment Variables (Production/Preview/Development).");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}


