/**
 * Search Orchestrator — the only place that decides "call the cache, or start an
 * Apify job". Called from POST /api/shorts-sourcing/search. Never awaits an Actor
 * run to completion; jobs finish later via the Apify webhook (see webhook route).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { ShortsPlatform, SourceItem, SHORTS_SEARCH_LIMITS } from "./types";
import { buildSearchCacheKey } from "./normalize";
import { getSearchProvider } from "./providers/search";
import { startApifyRun } from "./providers/search/apify-client";

export interface StartSearchParams {
  admin: SupabaseClient;
  sessionId: string;
  workspaceId: string;
  keywords: string[]; // already deduplicated, already filtered to is_selected
  platforms: ShortsPlatform[];
  limitPerKeyword: number;
  webhookOrigin: string; // e.g. https://app.example.com (from request.url)
  webhookSecret: string;
}

export interface StartSearchResult {
  cachedItemsInserted: number;
  jobsStarted: number;
  jobsFailedToStart: { platform: ShortsPlatform; keyword: string; reason: string }[];
}

export async function insertSourceItems(
  admin: SupabaseClient,
  items: SourceItem[],
  sessionId: string,
  workspaceId: string
): Promise<void> {
  if (items.length === 0) return;

  const rows = items.map((item) => ({
    session_id: sessionId,
    workspace_id: workspaceId,
    platform: item.platform,
    platform_post_id: item.platform_post_id,
    canonical_url: item.canonical_url,
    title: item.title,
    author_name: item.author_name,
    thumbnail_url: item.thumbnail_url,
    preview_media_url: item.preview_media_url,
    media_url: item.media_url,
    duration_seconds: item.duration_seconds,
    like_count: item.like_count,
    comment_count: item.comment_count,
    share_count: item.share_count,
    published_at: item.published_at,
    matched_keywords: item.matched_keywords,
  }));

  // platform_post_id is always populated (real id, or a canonical-URL-derived
  // fallback — see normalize.ts:fallbackPostId), so this can always upsert against
  // the plain unique index on (session_id, platform, platform_post_id).
  const { error } = await admin
    .from("shorts_source_items")
    .upsert(rows, { onConflict: "session_id,platform,platform_post_id" });
  if (error) console.error("[search-orchestrator] upsert failed:", error.message);
}

export async function startSourcingSearch(params: StartSearchParams): Promise<StartSearchResult> {
  const { admin, sessionId, workspaceId, keywords, platforms, limitPerKeyword, webhookOrigin, webhookSecret } = params;

  const result: StartSearchResult = { cachedItemsInserted: 0, jobsStarted: 0, jobsFailedToStart: [] };
  const now = new Date();

  for (const platform of platforms) {
    const provider = getSearchProvider(platform);

    for (const keyword of keywords) {
      const cacheKey = buildSearchCacheKey({
        platform,
        keyword,
        limitPerKeyword,
        providerVersion: provider.providerVersion,
      });

      const { data: cached } = await admin
        .from("shorts_search_cache")
        .select("response_json, expires_at")
        .eq("cache_key", cacheKey)
        .maybeSingle();

      const isFresh = cached && new Date(cached.expires_at) > now;

      if (isFresh) {
        const items = (cached!.response_json as SourceItem[]) ?? [];
        await insertSourceItems(admin, items, sessionId, workspaceId);
        result.cachedItemsInserted += items.length;
        continue;
      }

      // Cache miss: create a job row first so the UI can show "검색 중" even if
      // the Apify call itself fails right after this.
      const { data: job, error: jobInsertError } = await admin
        .from("shorts_sourcing_jobs")
        .insert({
          session_id: sessionId,
          workspace_id: workspaceId,
          platform,
          keyword,
          limit_per_keyword: limitPerKeyword,
          status: "pending",
        })
        .select("id")
        .single();

      if (jobInsertError || !job) {
        result.jobsFailedToStart.push({ platform, keyword, reason: "job_row_insert_failed" });
        continue;
      }

      try {
        const actorId = provider.actorId; // throws if env var missing
        const webhookUrl = `${webhookOrigin}/api/shorts-sourcing/webhook?job_id=${job.id}&secret=${encodeURIComponent(
          webhookSecret
        )}`;

        const { runId } = await startApifyRun({
          actorId,
          input: provider.buildRunInput(keyword, limitPerKeyword),
          webhookUrl,
        });

        await admin
          .from("shorts_sourcing_jobs")
          .update({ status: "running", apify_run_id: runId, apify_actor_id: actorId, started_at: now.toISOString() })
          .eq("id", job.id);

        result.jobsStarted += 1;
      } catch (err) {
        const reason = err instanceof Error ? err.message : "apify_start_failed";
        await admin
          .from("shorts_sourcing_jobs")
          .update({ status: "failed", error_message: reason, finished_at: now.toISOString() })
          .eq("id", job.id);
        result.jobsFailedToStart.push({ platform, keyword, reason });
      }
    }
  }

  return result;
}

export function clampLimitPerKeyword(limit: number): number {
  if (!Number.isFinite(limit)) return SHORTS_SEARCH_LIMITS.defaultResultsPerKeyword;
  return Math.max(5, Math.min(SHORTS_SEARCH_LIMITS.maxResultsPerKeyword, Math.round(limit)));
}
