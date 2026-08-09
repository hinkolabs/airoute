import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireSessionAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";
import { dedupeSourceItems } from "@/lib/shorts-sourcing/dedupe";
import { computeBaseScores } from "@/lib/shorts-sourcing/ranking";
import { SourceItem } from "@/lib/shorts-sourcing/types";

export const dynamic = "force-dynamic";

// GET /api/shorts-sourcing/session/:sessionId/status
// Polled by the results UI every few seconds while jobs are still running/pending.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;
  const { sessionId } = await params;

  const access = await requireSessionAccess(ctx, sessionId);
  if (isErrorResponse(access)) return access;

  const [{ data: session }, { data: jobs }, { data: items }, { data: favorites }, { data: keywordRows }] = await Promise.all([
    ctx.admin
      .from("shorts_sourcing_sessions")
      .select("id, product_name_ko, category_ko, analysis_json, created_at")
      .eq("id", sessionId)
      .maybeSingle(),
    ctx.admin
      .from("shorts_sourcing_jobs")
      .select("id, platform, keyword, status, error_message, result_count")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true }),
    ctx.admin
      .from("shorts_source_items")
      .select(
        "id, platform, platform_post_id, canonical_url, title, author_name, thumbnail_url, preview_media_url, media_url, duration_seconds, like_count, comment_count, share_count, published_at, matched_keywords, text_score, visual_score, engagement_score, recency_score, final_score"
      )
      .eq("session_id", sessionId),
    ctx.admin
      .from("shorts_favorites")
      .select("source_item_id")
      .eq("workspace_id", access.workspaceId),
    ctx.admin.from("shorts_sourcing_keywords").select("keyword").eq("session_id", sessionId).eq("is_selected", true),
  ]);

  const favoriteIds = new Set((favorites ?? []).map((f) => f.source_item_id));
  const selectedKeywords = (keywordRows ?? []).map((k) => k.keyword);

  const deduped = dedupeSourceItems((items ?? []) as unknown as SourceItem[]);
  // Items that already went through AI 정밀 정렬 keep their persisted visual_score/final_score;
  // computeBaseScores only fills in text/engagement/recency for items that don't have scores yet.
  const scored = computeBaseScores(deduped, selectedKeywords).map((item, idx) => {
    const original = deduped[idx];
    if (original.visual_score !== null && original.visual_score !== undefined) {
      return { ...item, visual_score: original.visual_score, final_score: original.final_score ?? item.final_score };
    }
    return item;
  });
  const sorted = [...scored].sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0));

  const withFavoriteFlag = sorted.map((item) => ({
    ...item,
    is_favorite: item.id ? favoriteIds.has(item.id) : false,
  }));

  const allJobsTerminal = (jobs ?? []).every((j) => j.status === "succeeded" || j.status === "failed");

  return NextResponse.json({
    ok: true,
    session,
    jobs: jobs ?? [],
    all_jobs_done: allJobsTerminal,
    items: withFavoriteFlag,
    counts: {
      total: withFavoriteFlag.length,
      douyin: withFavoriteFlag.filter((i) => i.platform === "douyin").length,
      xiaohongshu: withFavoriteFlag.filter((i) => i.platform === "xiaohongshu").length,
    },
  });
}
