import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;

    const { data, error } = await supabase
      .from("tools")
      .select(
        `id, name, slug, description, category_id, url, affiliate_url, badge, tags, is_active, created_at, updated_at,
         tools_i18n(locale, name, description, task_category, best_for, why_pick, detail_content)`
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, tool: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "name",
      "slug",
      "description",
      "category_id",
      "url",
      "affiliate_url",
      "badge",
      "tags",
      "is_active",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("tools")
      .update(updateData)
      .eq("id", id)
      .select("id, name, slug")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, tool: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;

    // Delete related i18n rows first
    await supabase.from("tools_i18n").delete().eq("tool_id", id);

    // Delete the tool
    const { error } = await supabase.from("tools").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
