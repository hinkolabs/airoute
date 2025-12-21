import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

// GET: Fetch single guide by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;
    
    const { data, error } = await supabase
      .from("guides")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: error?.message || "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, guide: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// PUT: Update guide
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;
    const body = await req.json();
    
    // Allowed update fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "slug", "title", "excerpt", "content",
      "lang", "taxonomy",
      "cta_type", "cta_route_slug", "cta_tool_slug", "cta_partner",
      "guide_type", "primary_intent", "primary_route", "generation_version",
      "status"
    ];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Always update updated_at
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("guides")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, guide: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// DELETE: Delete guide (with related logs cleanup)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;
    
    // 1) Delete related generation logs first
    const { error: genLogError } = await supabase
      .from("admin_guide_generation_logs")
      .delete()
      .eq("guide_id", id);

    if (genLogError) {
      return NextResponse.json(
        { ok: false, error: `Failed to delete generation logs: ${genLogError.message}` },
        { status: 500 }
      );
    }

    // 2) Delete related publish logs
    const { error: pubLogError } = await supabase
      .from("admin_guide_publish_logs")
      .delete()
      .eq("guide_id", id);

    if (pubLogError) {
      return NextResponse.json(
        { ok: false, error: `Failed to delete publish logs: ${pubLogError.message}` },
        { status: 500 }
      );
    }

    // 3) Delete the guide itself
    const { error } = await supabase
      .from("guides")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
