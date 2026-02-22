import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminSupabase();

    const { data, error } = await supabase
      .from("tools")
      .select(
        `id, name, slug, description, category_id, badge, is_active, created_at, updated_at,
         tools_i18n(locale, name, description, task_category, best_for, why_pick, detail_content)`
      )
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (error) {
      // Fallback: extended columns might not exist yet
      const { data: fallback, error: fallbackErr } = await supabase
        .from("tools")
        .select(
          `id, name, slug, description, category_id, badge, is_active, created_at, updated_at,
           tools_i18n(locale, name, description)`
        )
        .order("updated_at", { ascending: false, nullsFirst: false });

      if (fallbackErr) {
        return NextResponse.json(
          { ok: false, error: fallbackErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, tools: fallback || [] });
    }

    return NextResponse.json({ ok: true, tools: data || [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
