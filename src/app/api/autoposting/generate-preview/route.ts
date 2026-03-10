import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { generateAutopostingPreview } from "@/lib/autoposting/generate-content";
import { getDemoMode } from "@/lib/flags";

export const dynamic = "force-dynamic";

// POST /api/autoposting/generate-preview
// Body: { workspace_id, settings: AutopostingSettings }
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
    const { workspace_id, settings } = body;

    if (!workspace_id || !settings) {
      return NextResponse.json(
        { error: "workspace_id and settings are required" },
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

    // Verify active subscription (paid feature)
    const { data: subRow } = await supabase
      .from("workspace_subscriptions")
      .select("status, current_period_end")
      .eq("workspace_id", workspace_id)
      .maybeSingle();

    const isActive =
      subRow?.status === "active" ||
      (subRow?.status === "cancelled" &&
        subRow?.current_period_end != null &&
        new Date(subRow.current_period_end) > new Date());

    // Fetch workspace type for company bypass
    const { data: wsRow } = await supabase
      .from("workspaces")
      .select("type")
      .eq("id", workspace_id)
      .single();

    const isCompany = wsRow?.type === "company";

    if (!isActive && !isCompany) {
      return NextResponse.json(
        { error: "subscription_required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 402 }
      );
    }

    // Generate content with OpenAI
    const preview = await generateAutopostingPreview(settings);

    // Save to DB using service role (bypasses RLS)
    const admin = createAdminSupabase();
    const yearMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    // Upsert pool for this workspace+month
    const { data: pool, error: poolError } = await admin
      .from("monthly_item_pools")
      .upsert(
        { workspace_id, year_month: yearMonth, status: "draft" },
        { onConflict: "workspace_id,year_month", ignoreDuplicates: false }
      )
      .select("id, item_count")
      .single();

    if (poolError || !pool) {
      console.error("[generate-preview] pool upsert error:", poolError?.message);
      // Return preview even if DB save fails
      return NextResponse.json({ ok: true, preview, saved_item_id: null });
    }

    // Insert monthly_item
    const { data: savedItem, error: itemError } = await admin
      .from("monthly_items")
      .insert({
        pool_id: pool.id,
        workspace_id,
        position: pool.item_count + 1,
        topic: preview.topic,
        blog_content: preview.blog_content,
        sns_content: preview.sns_content,
        status: "ready",
        generated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (itemError || !savedItem) {
      console.error("[generate-preview] item insert error:", itemError?.message);
      return NextResponse.json({ ok: true, preview, saved_item_id: null });
    }

    // Increment pool item_count
    await admin
      .from("monthly_item_pools")
      .update({ item_count: pool.item_count + 1, updated_at: new Date().toISOString() })
      .eq("id", pool.id);

    return NextResponse.json({ ok: true, preview, saved_item_id: savedItem.id });
  } catch (error: any) {
    console.error("[API] POST /api/autoposting/generate-preview error:", error?.message);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
