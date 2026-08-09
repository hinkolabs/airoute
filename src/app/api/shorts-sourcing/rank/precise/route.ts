import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireSessionAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";
import { dedupeSourceItems } from "@/lib/shorts-sourcing/dedupe";
import { computeBaseScores, computeVisualScores, applyPreciseScores } from "@/lib/shorts-sourcing/ranking";
import { SourceItem, SHORTS_SEARCH_LIMITS } from "@/lib/shorts-sourcing/types";
import { CREDIT_COSTS } from "@/lib/credit-costs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "workspace-assets";

async function tryConsumeCredits(request: NextRequest, workspaceId: string) {
  try {
    await fetch(new URL("/api/credits/consume", request.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") ?? "" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        feature_key: "shorts_sourcing_precise_rank",
        amount: CREDIT_COSTS.shorts_sourcing_precise_rank,
        description: "숏츠 소싱: AI 정밀 정렬",
      }),
    });
  } catch (err) {
    console.warn("[shorts-sourcing/rank/precise] credit consume skipped:", err);
  }
}

// POST /api/shorts-sourcing/rank/precise
// Body: { session_id }
// Compares the top-N (base score) candidates' thumbnails against the original
// product photo with a vision model. Only ever runs on an explicit button click.
export async function POST(request: NextRequest) {
  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;

  const body = await request.json().catch(() => ({}));
  const sessionId = body.session_id as string | undefined;
  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const access = await requireSessionAccess(ctx, sessionId);
  if (isErrorResponse(access)) return access;

  if (process.env.OPENAI_ENABLED !== "true" || !process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "vision_unavailable", message: "AI 정밀 정렬을 사용할 수 없습니다. 관리자에게 문의해주세요." },
      { status: 503 }
    );
  }

  const [{ data: session }, { data: items }, { data: keywordRows }] = await Promise.all([
    ctx.admin.from("shorts_sourcing_sessions").select("image_storage_path").eq("id", sessionId).single(),
    ctx.admin
      .from("shorts_source_items")
      .select(
        "id, platform, platform_post_id, canonical_url, title, author_name, thumbnail_url, preview_media_url, media_url, duration_seconds, like_count, comment_count, share_count, published_at, matched_keywords, text_score, visual_score, engagement_score, recency_score, final_score"
      )
      .eq("session_id", sessionId),
    ctx.admin.from("shorts_sourcing_keywords").select("keyword").eq("session_id", sessionId).eq("is_selected", true),
  ]);

  if (!session?.image_storage_path) {
    return NextResponse.json({ error: "session_image_missing" }, { status: 404 });
  }

  const productImageUrl = ctx.admin.storage.from(BUCKET).getPublicUrl(session.image_storage_path).data.publicUrl;

  const deduped = dedupeSourceItems((items ?? []) as unknown as SourceItem[]);
  const selectedKeywords = (keywordRows ?? []).map((k) => k.keyword);
  const baseScored = computeBaseScores(deduped, selectedKeywords);

  const topN = [...baseScored]
    .sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0))
    .slice(0, SHORTS_SEARCH_LIMITS.preciseRankTopN)
    .filter((item) => item.id && item.thumbnail_url);

  if (topN.length === 0) {
    return NextResponse.json({ error: "no_candidates_with_thumbnail" }, { status: 422 });
  }

  const visualScores = await computeVisualScores(
    productImageUrl,
    topN.map((item) => ({ id: item.id as string, thumbnailUrl: item.thumbnail_url as string }))
  );

  const preciseScored = applyPreciseScores(topN, visualScores);

  await Promise.all(
    preciseScored.map((item) =>
      ctx.admin
        .from("shorts_source_items")
        .update({ visual_score: item.visual_score, final_score: item.final_score })
        .eq("id", item.id as string)
    )
  );

  await tryConsumeCredits(request, access.workspaceId);

  return NextResponse.json({ ok: true, ranked_count: preciseScored.length });
}
