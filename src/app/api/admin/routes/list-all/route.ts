import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminSupabase();

    const { data, error } = await supabase
      .from("routes")
      .select(
        `id, slug, title, description, icon, featured, tags, guide_bullets, manual_order, status, created_at, updated_at,
         routes_i18n(locale, title, description)`
      )
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, routes: data || [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
