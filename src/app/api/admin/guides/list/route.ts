import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const supabase = createAdminSupabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // draft | review | approved | rejected | null(all)

    let query = supabase
      .from("guides")
      .select("id, slug, title, excerpt, status, guide_type, primary_intent, lang, taxonomy, created_at, published_at")
      .order("created_at", { ascending: false });

    if (status && ["draft", "review", "approved", "rejected"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ items: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
