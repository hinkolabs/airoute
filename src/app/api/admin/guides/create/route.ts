import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = createAdminSupabase();
    const slug = `draft-${Date.now()}`;

    const { data, error } = await supabase
      .from("guides")
      .insert({
        slug,
        title: "",
        excerpt: "",
        content: "",
        status: "draft",
        lang: "en", // Default to EN
        taxonomy: "general", // Default taxonomy
        published_source: "manual",
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
