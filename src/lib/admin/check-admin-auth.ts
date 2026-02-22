import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin auth check that supports both:
 * 1. Legacy cookie: airoute_admin=<ADMIN_KEY>
 * 2. Supabase auth + system_admins table
 *
 * Returns { ok: true } if authorized, { ok: false, status: 401|403 } if not.
 */
export async function checkAdminAuth(): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  // 1. Legacy cookie check
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("airoute_admin")?.value;
    const adminKey = process.env.ADMIN_KEY;
    if (adminKey && adminCookie === adminKey) {
      return { ok: true };
    }
  } catch {
    // ignore cookie read error, fall through to Supabase check
  }

  // 2. Supabase auth + system_admins check
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }

    const { data: adminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return { ok: false, status: 403, error: "Not a system admin" };
    }

    return { ok: true };
  } catch {
    return { ok: false, status: 401, error: "Auth failed" };
  }
}
