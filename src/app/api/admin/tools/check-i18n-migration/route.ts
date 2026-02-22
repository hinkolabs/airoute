import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminSupabase();

    // Try selecting extended columns - if they don't exist, query will error
    const { error } = await supabase
      .from("tools_i18n")
      .select("task_category, best_for, why_pick, detail_content")
      .limit(1);

    const migrated = !error;

    return NextResponse.json({
      ok: true,
      migrated,
      error: error?.message ?? null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, migrated: false, error: msg });
  }
}
