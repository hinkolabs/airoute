import { NextRequest, NextResponse } from "next/server";
import { requireUser, requireSessionAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";
import { startSourcingSearch } from "@/lib/shorts-sourcing/search-orchestrator";
import { ShortsPlatform, SHORTS_SEARCH_LIMITS } from "@/lib/shorts-sourcing/types";
import { CREDIT_COSTS } from "@/lib/credit-costs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Each click fetches this many MORE results per keyword than the previous round
// (capped at SHORTS_SEARCH_LIMITS.maxResultsPerKeyword).
const LOAD_MORE_STEP = 20;

async function tryConsumeCredits(request: NextRequest, workspaceId: string, jobsStarted: number) {
  if (jobsStarted <= 0) return;
  try {
    await fetch(new URL("/api/credits/consume", request.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") ?? "" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        feature_key: "shorts_sourcing_search_job",
        amount: CREDIT_COSTS.shorts_sourcing_search_job * jobsStarted,
        description: `숏츠 소싱: 추가 검색 작업 ${jobsStarted}건`,
      }),
    });
  } catch (err) {
    console.warn("[shorts-sourcing/load-more] credit consume skipped:", err);
  }
}

// POST /api/shorts-sourcing/session/:sessionId/load-more
// No body — re-runs the session's own last search (same selected keywords + same
// platforms it was ever searched on) at a higher limit_per_keyword than before.
// Cache key includes limit_per_keyword (see normalize.ts:buildSearchCacheKey), so
// this always misses cache and triggers a fresh Apify run; new items land via
// upsert on (session_id, platform, platform_post_id) — already-seen videos are
// just overwritten in place, never duplicated.
export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;
  const { sessionId } = await params;

  const access = await requireSessionAccess(ctx, sessionId);
  if (isErrorResponse(access)) return access;
  const { workspaceId } = access;

  const webhookSecret = process.env.SHORTS_SOURCING_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "webhook_secret_missing", message: "검색 기능을 사용할 수 없습니다. 관리자에게 문의해주세요." },
      { status: 503 }
    );
  }

  const [{ data: keywordRows }, { data: jobRows }] = await Promise.all([
    ctx.admin.from("shorts_sourcing_keywords").select("keyword").eq("session_id", sessionId).eq("is_selected", true),
    ctx.admin.from("shorts_sourcing_jobs").select("platform, limit_per_keyword").eq("session_id", sessionId),
  ]);

  const keywords = Array.from(new Set((keywordRows ?? []).map((k) => k.keyword.trim()).filter(Boolean)));
  if (keywords.length === 0) {
    return NextResponse.json(
      { error: "no_keywords_selected", message: "선택된 검색어가 없습니다." },
      { status: 422 }
    );
  }

  const platforms = Array.from(new Set((jobRows ?? []).map((j) => j.platform))) as ShortsPlatform[];
  if (platforms.length === 0) {
    return NextResponse.json(
      { error: "no_prior_search", message: "이전에 검색한 기록이 없어 더 찾기를 진행할 수 없습니다." },
      { status: 422 }
    );
  }

  const currentMax = (jobRows ?? []).reduce((max, j) => Math.max(max, j.limit_per_keyword ?? 0), 0);
  const nextLimit = Math.min(SHORTS_SEARCH_LIMITS.maxResultsPerKeyword, currentMax + LOAD_MORE_STEP);

  if (nextLimit <= currentMax) {
    return NextResponse.json(
      { error: "max_results_reached", message: "이미 검색어당 최대 결과 수까지 찾았습니다." },
      { status: 422 }
    );
  }

  const webhookOrigin = new URL(request.url).origin;

  const result = await startSourcingSearch({
    admin: ctx.admin,
    sessionId,
    workspaceId,
    keywords,
    platforms,
    limitPerKeyword: nextLimit,
    webhookOrigin,
    webhookSecret,
  });

  await tryConsumeCredits(request, workspaceId, result.jobsStarted);

  return NextResponse.json({
    ok: true,
    next_limit_per_keyword: nextLimit,
    max_limit_per_keyword: SHORTS_SEARCH_LIMITS.maxResultsPerKeyword,
    cached_items_inserted: result.cachedItemsInserted,
    jobs_started: result.jobsStarted,
    jobs_failed_to_start: result.jobsFailedToStart,
  });
}
