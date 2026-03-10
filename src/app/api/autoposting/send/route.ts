import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendAutopostingEmail } from "@/lib/autoposting/email-sender";
import { getDemoMode } from "@/lib/flags";

export const dynamic = "force-dynamic";

// POST /api/autoposting/send
// Body: { workspace_id, item_id, recipient_email }
// Sends auto-posting content to the user's email and records the run.
export async function POST(request: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, item_id, recipient_email } = body;

    if (!workspace_id || !item_id || !recipient_email) {
      return NextResponse.json(
        { error: "workspace_id, item_id, and recipient_email are required" },
        { status: 400 }
      );
    }

    // Verify membership
    const { data: membershipRow } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membershipRow) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    const adminSupabase = createAdminSupabase();

    // Fetch the item content
    const { data: item, error: itemError } = await adminSupabase
      .from("monthly_items")
      .select("topic, blog_content, sns_content, image_urls, pool_id, workspace_id")
      .eq("id", item_id)
      .eq("workspace_id", workspace_id)
      .maybeSingle();

    if (itemError || !item) {
      return NextResponse.json({ error: "item_not_found" }, { status: 404 });
    }

    if (!item.blog_content || !item.sns_content) {
      return NextResponse.json(
        { error: "item_content_not_ready", message: "아이템 콘텐츠가 아직 생성되지 않았습니다" },
        { status: 422 }
      );
    }

    // Fetch brand name from manager settings
    const { data: managerSettings } = await adminSupabase
      .from("workspace_manager_settings")
      .select("brand_name")
      .eq("workspace_id", workspace_id)
      .maybeSingle();

    const brandName = managerSettings?.brand_name ?? "AIRoute";

    // Send email via Resend
    const result = await sendAutopostingEmail({
      to: recipient_email,
      brand_name: brandName,
      topic: item.topic,
      blog_content: item.blog_content,
      sns_content: item.sns_content,
      image_urls: item.image_urls ?? [],
    });

    // Record the run
    const { error: runError } = await adminSupabase.from("posting_runs").insert({
      workspace_id,
      user_id: user.id,
      channel: "email",
      recipient_email,
      sent_at: result.success ? new Date().toISOString() : null,
      status: result.success ? "sent" : "failed",
      error_message: result.error ?? null,
      metadata: { item_id, message_id: result.messageId ?? null },
    });

    if (runError) {
      console.error("[API] Failed to insert posting_run:", runError);
    }

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error ?? "email_send_failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message_id: result.messageId,
    });
  } catch (error: any) {
    console.error("[API] POST /api/autoposting/send error:", error?.message);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
