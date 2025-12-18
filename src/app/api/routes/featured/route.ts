import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/routes/featured
 * Returns featured routes for home page
 * - Ordered by: manual_order asc (nulls last), then created_at desc
 * - No authentication required (public data)
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from("routes")
      .select("id, slug, title, description, icon, featured, tags, guide_bullets, manual_order, created_at")
      .eq("featured", true)
      .order("manual_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[/api/routes/featured] Supabase error:", error);
      return NextResponse.json({ routes: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ routes: data ?? [] });
  } catch (error) {
    console.error("[/api/routes/featured] Unexpected error:", error);
    return NextResponse.json({ routes: [], error: "Internal server error" }, { status: 500 });
  }
}

