import { NextRequest, NextResponse } from "next/server";
import { getDemoMode } from "@/lib/flags";
import { requireUser, requireSessionAccess, isErrorResponse } from "@/lib/shorts-sourcing/api-guard";
import { startSourcingSearch } from "@/lib/shorts-sourcing/search-orchestrator";
import { ShortsPlatform, SHORTS_PLATFORMS, SHORTS_SEARCH_LIMITS } from "@/lib/shorts-sourcing/types";
import { CREDIT_COSTS } from "@/lib/credit-costs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
        description: `숏츠 소싱: 검색 작업 ${jobsStarted}건`,
      }),
    });
  } catch (err) {
    console.warn("[shorts-sourcing/search] credit consume skipped:", err);
  }
}

// POST /api/shorts-sourcing/search
// Body: { session_id, keyword_ids: string[], platform: "all"|"douyin"|"xiaohongshu", limit_per_keyword }
// workspace_id is derived from the session itself (via requireSessionAccess) — no need to pass it.
export async function POST(request: NextRequest) {
  if (await getDemoMode()) return new NextResponse(null, { status: 404 });

  const ctx = await requireUser();
  if (isErrorResponse(ctx)) return ctx;

  const body = await request.json().catch(() => ({}));
  const { session_id, keyword_ids, platform, limit_per_keyword } = body as {
    session_id?: string;
    keyword_ids?: string[];
    platform?: "all" | ShortsPlatform;
    limit_per_keyword?: number;
  };

  if (!session_id || !Array.isArray(keyword_ids) || keyword_ids.length === 0) {
    return NextResponse.json({ error: "session_id, keyword_ids are required" }, { status: 400 });
  }

  if (keyword_ids.length > SHORTS_SEARCH_LIMITS.maxKeywordsPerSession) {
    return NextResponse.json(
      { error: "too_many_keywords", message: `검색어는 최대 ${SHORTS_SEARCH_LIMITS.maxKeywordsPerSession}개까지 선택할 수 있습니다.` },
      { status: 422 }
    );
  }

  const access = await requireSessionAccess(ctx, session_id);
  if (isErrorResponse(access)) return access;
  const workspace_id = access.workspaceId;

  const webhookSecret = process.env.SHORTS_SOURCING_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "webhook_secret_missing", message: "검색 기능을 사용할 수 없습니다. 관리자에게 문의해주세요." },
      { status: 503 }
    );
  }

  const { data: keywordRows, error: keywordsError } = await ctx.admin
    .from("shorts_sourcing_keywords")
    .select("id, keyword")
    .eq("session_id", session_id)
    .in("id", keyword_ids);

  if (keywordsError || !keywordRows || keywordRows.length === 0) {
    return NextResponse.json({ error: "keywords_not_found" }, { status: 404 });
  }

  const keywords = Array.from(new Set(keywordRows.map((k) => k.keyword.trim()).filter(Boolean)));
  const platforms: ShortsPlatform[] = platform === "all" || !platform ? [...SHORTS_PLATFORMS] : [platform];

  const limitPerKeyword = Math.max(
    5,
    Math.min(SHORTS_SEARCH_LIMITS.maxResultsPerKeyword, Math.round(limit_per_keyword ?? SHORTS_SEARCH_LIMITS.defaultResultsPerKeyword))
  );

  const webhookOrigin = new URL(request.url).origin;

  const result = await startSourcingSearch({
    admin: ctx.admin,
    sessionId: session_id,
    workspaceId: workspace_id,
    keywords,
    platforms,
    limitPerKeyword,
    webhookOrigin,
    webhookSecret,
  });

  await tryConsumeCredits(request, workspace_id, result.jobsStarted);

  return NextResponse.json({
    ok: true,
    cached_items_inserted: result.cachedItemsInserted,
    jobs_started: result.jobsStarted,
    jobs_failed_to_start: result.jobsFailedToStart,
  });
}
