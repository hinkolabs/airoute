import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { generateAutopostingPreview } from "@/lib/autoposting/generate-content";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ITEMS_PER_POOL = 15;

// GET /api/cron/monthly-generate
// Called by Vercel Cron on the 1st of each month at 01:00 UTC
// Generates a full monthly pool (15 items) for each active workspace
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const yearMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  console.log(`[cron/monthly-generate] Starting for ${yearMonth}`);

  // Fetch all workspaces with active subscriptions
  const { data: activeSubs, error: subsError } = await admin
    .from("workspace_subscriptions")
    .select("workspace_id")
    .eq("status", "active");

  if (subsError) {
    console.error("[cron/monthly-generate] Failed to fetch subscriptions:", subsError.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  // Also include company-type workspaces (bypass subscription requirement)
  const { data: companyWorkspaces } = await admin
    .from("workspaces")
    .select("id")
    .eq("type", "company");

  const activeIds = new Set([
    ...(activeSubs ?? []).map((s) => s.workspace_id),
    ...(companyWorkspaces ?? []).map((w) => w.id),
  ]);

  if (activeIds.size === 0) {
    console.log("[cron/monthly-generate] No active workspaces found.");
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const results: { workspace_id: string; status: "ok" | "skipped" | "error"; message?: string }[] = [];

  for (const workspaceId of activeIds) {
    try {
      await generateMonthlyPool(admin, workspaceId, yearMonth);
      results.push({ workspace_id: workspaceId, status: "ok" });
    } catch (err: any) {
      console.error(`[cron/monthly-generate] Error for workspace ${workspaceId}:`, err?.message);
      results.push({ workspace_id: workspaceId, status: "error", message: err?.message });
    }
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log(`[cron/monthly-generate] Done: ${ok} ok, ${errors} errors`);

  return NextResponse.json({ ok: true, yearMonth, processed: ok, errors, results });
}

async function generateMonthlyPool(
  admin: ReturnType<typeof createAdminSupabase>,
  workspaceId: string,
  yearMonth: string
) {
  // Fetch manager settings for generation context
  const { data: managerSettings } = await admin
    .from("workspace_manager_settings")
    .select("brand_name, company_profile")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  // Upsert pool
  const { data: pool, error: poolError } = await admin
    .from("monthly_item_pools")
    .upsert(
      { workspace_id: workspaceId, year_month: yearMonth, status: "draft" },
      { onConflict: "workspace_id,year_month", ignoreDuplicates: true }
    )
    .select("id, item_count")
    .single();

  if (poolError || !pool) {
    throw new Error(`Pool upsert failed: ${poolError?.message}`);
  }

  // Skip if pool already has items
  if (pool.item_count >= ITEMS_PER_POOL) {
    console.log(`[cron/monthly-generate] Workspace ${workspaceId} already has ${pool.item_count} items, skipping.`);
    return;
  }

  const remaining = ITEMS_PER_POOL - pool.item_count;
  let generated = 0;

  for (let i = 0; i < remaining; i++) {
    try {
      const preview = await generateAutopostingPreview({
        brand_name: managerSettings?.brand_name ?? undefined,
        company_profile: managerSettings?.company_profile ?? undefined,
        content_purpose: "branding",
        brand_intro: managerSettings?.company_profile ?? "소상공인 브랜드",
        brand_strengths: ["품질", "신뢰", "서비스"],
        target_age: "all",
        target_persona: ["일반 고객"],
        channels: ["email", "sns"],
      });

      const { error: itemError } = await admin.from("monthly_items").insert({
        pool_id: pool.id,
        workspace_id: workspaceId,
        position: pool.item_count + generated + 1,
        topic: preview.topic,
        blog_content: preview.blog_content,
        sns_content: preview.sns_content,
        status: "ready",
        generated_at: new Date().toISOString(),
      });

      if (itemError) {
        console.error(`[cron/monthly-generate] Item insert error (ws: ${workspaceId}):`, itemError.message);
      } else {
        generated++;
      }
    } catch (err: any) {
      console.error(`[cron/monthly-generate] Item generation error (ws: ${workspaceId}):`, err?.message);
    }
  }

  // Update pool item_count and mark active
  await admin
    .from("monthly_item_pools")
    .update({
      item_count: pool.item_count + generated,
      status: generated > 0 ? "active" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", pool.id);

  console.log(`[cron/monthly-generate] Workspace ${workspaceId}: generated ${generated}/${remaining} items`);
}
