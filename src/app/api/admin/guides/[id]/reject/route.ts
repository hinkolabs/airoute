import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

// POST: Reject guide (status = rejected)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminSupabase();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    
    const { data, error } = await supabase
      .from("guides")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Log the rejection
    await supabase.from("admin_guide_publish_logs").insert({
      guide_id: id,
      publish_mode: "auto",
      note: body.note || "Rejected via admin panel",
    });

    return NextResponse.json({ ok: true, guide: data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
