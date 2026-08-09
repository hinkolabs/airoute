import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireSessionAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";
import { searchProductMatchesOn1688 } from "@/lib/shorts-sourcing/providers/match/scraper-by-image";
import { CREDIT_COSTS } from "@/lib/credit-costs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "workspace-assets";

// Best-effort credit logging, same rationale as analyze-image.ts — admin-only
// feature for now, insufficient credits never blocks the admin's own workflow.
async function tryConsumeCredits(request: NextRequest, workspaceId: string) {
  try {
    await fetch(new URL("/api/credits/consume", request.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        workspace_id: workspaceId,
        feature_key: "shorts_sourcing_product_match",
        amount: CREDIT_COSTS.shorts_sourcing_product_match,
        description: "숏츠 소싱: 1688 제품 매칭",
      }),
    });
  } catch (err) {
    console.warn("[shorts-sourcing/match-product] credit consume skipped:", err);
  }
}

// POST /api/shorts-sourcing/match-product
// Body: { session_id }
// Reverse-image-searches the session's uploaded screenshot against 1688 so the
// admin can confirm the exact product before generating Douyin/Xiaohongshu
// search keywords from it (see /api/shorts-sourcing/matches/[matchId] PATCH).
export async function POST(request: NextRequest) {
  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;

  const body = await request.json().catch(() => ({}));
  const { session_id } = body as { session_id?: string };

  if (!session_id) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const access = await requireSessionAccess(ctx, session_id);
  if (isErrorResponse(access)) return access;
  const { workspaceId } = access;

  const { data: session, error: sessionError } = await ctx.admin
    .from("shorts_sourcing_sessions")
    .select("image_storage_path")
    .eq("id", session_id)
    .maybeSingle();

  if (sessionError || !session?.image_storage_path) {
    return NextResponse.json({ error: "session_image_not_found" }, { status: 404 });
  }

  const { data: urlData } = ctx.admin.storage.from(BUCKET).getPublicUrl(session.image_storage_path);
  const imageUrl = urlData.publicUrl;

  let matches;
  try {
    matches = await searchProductMatchesOn1688(imageUrl);
  } catch (err) {
    console.error("[shorts-sourcing/match-product] search failed:", err);
    return NextResponse.json(
      { error: "match_search_failed", message: "1688 제품 매칭에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }

  if (matches.length === 0) {
    return NextResponse.json({ ok: true, matches: [] });
  }

  const rows = matches.map((m) => ({
    session_id,
    workspace_id: workspaceId,
    provider: m.provider,
    product_id: m.product_id,
    title: m.title,
    description: m.description,
    image_url: m.image_url,
    images: m.images,
    product_url: m.product_url,
    price_min: m.price_min,
    price_max: m.price_max,
    currency: m.currency,
    shop_name: m.shop_name,
    shop_url: m.shop_url,
    rating: m.rating,
    sold_count: m.sold_count,
    image_rank: m.image_rank,
    tags: m.tags,
  }));

  const { data: inserted, error: insertError } = await ctx.admin
    .from("shorts_product_matches")
    .upsert(rows, { onConflict: "session_id,provider,product_id" })
    .select("*")
    .order("image_rank", { ascending: true, nullsFirst: false });

  if (insertError) {
    console.error("[shorts-sourcing/match-product] insert failed:", insertError.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  await tryConsumeCredits(request, workspaceId);

  return NextResponse.json({ ok: true, matches: inserted ?? [] });
}
