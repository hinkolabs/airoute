import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { fetchApifyDatasetItems } from "@/lib/shorts-sourcing/providers/search/apify-client";
import { getSearchProvider } from "@/lib/shorts-sourcing/providers/search";
import { insertSourceItems } from "@/lib/shorts-sourcing/search-orchestrator";
import { buildSearchCacheKey } from "@/lib/shorts-sourcing/normalize";
import { ShortsPlatform, SourceItem, SHORTS_SEARCH_LIMITS } from "@/lib/shorts-sourcing/types";

export const dynamic = "force-dynamic";

// POST /api/shorts-sourcing/webhook?job_id=...&secret=...
// Called by Apify (ad-hoc webhook registered in search-orchestrator.ts) when an
// Actor run reaches a terminal state. Not authenticated via cookies — verified via
// a shared secret query param instead. Must be idempotent (Apify may retry delivery).
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("job_id");
  const secret = searchParams.get("secret");
  const expectedSecret = process.env.SHORTS_SOURCING_WEBHOOK_SECRET;

  if (!jobId || !expectedSecret || secret !== expectedSecret) {
    // Deliberately vague — never reveal whether the secret was close or the job existed.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabase();

  const { data: job } = await admin
    .from("shorts_sourcing_jobs")
    .select("id, session_id, workspace_id, platform, keyword, limit_per_keyword, status")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }

  // Idempotency guard: ignore duplicate webhook deliveries for an already-terminal job.
  if (job.status === "succeeded" || job.status === "failed") {
    return NextResponse.json({ ok: true, note: "already_processed" });
  }

  const body = await request.json().catch(() => null);
  const resource = body?.resource as { status?: string; defaultDatasetId?: string } | undefined;
  const runStatus = resource?.status;
  const now = new Date().toISOString();

  if (runStatus !== "SUCCEEDED") {
    await admin
      .from("shorts_sourcing_jobs")
      .update({ status: "failed", error_message: runStatus ?? "unknown_status", finished_at: now })
      .eq("id", jobId);
    return NextResponse.json({ ok: true });
  }

  const datasetId = resource?.defaultDatasetId;
  if (!datasetId) {
    await admin
      .from("shorts_sourcing_jobs")
      .update({ status: "failed", error_message: "missing_dataset_id", finished_at: now })
      .eq("id", jobId);
    return NextResponse.json({ ok: true });
  }

  try {
    const provider = getSearchProvider(job.platform as ShortsPlatform);
    const rawItems = await fetchApifyDatasetItems(datasetId);

    const normalized = rawItems
      .map((raw) => {
        try {
          return provider.normalize(raw, job.keyword);
        } catch (err) {
          console.warn("[shorts-sourcing/webhook] normalize() threw on one item, skipping:", err);
          return null;
        }
      })
      .filter((x): x is SourceItem => x !== null)
      .slice(0, SHORTS_SEARCH_LIMITS.maxResultsPerKeyword);

    await insertSourceItems(admin, normalized, job.session_id, job.workspace_id);

    const cacheKey = buildSearchCacheKey({
      platform: job.platform,
      keyword: job.keyword,
      limitPerKeyword: job.limit_per_keyword,
      providerVersion: provider.providerVersion,
    });
    const expiresAt = new Date(Date.now() + SHORTS_SEARCH_LIMITS.cacheTtlHours * 60 * 60 * 1000).toISOString();

    await admin.from("shorts_search_cache").upsert({
      cache_key: cacheKey,
      platform: job.platform,
      keyword: job.keyword,
      response_json: normalized,
      provider_version: provider.providerVersion,
      expires_at: expiresAt,
    });

    await admin
      .from("shorts_sourcing_jobs")
      .update({ status: "succeeded", result_count: normalized.length, finished_at: now })
      .eq("id", jobId);

    return NextResponse.json({ ok: true, items: normalized.length });
  } catch (err) {
    console.error("[shorts-sourcing/webhook] processing failed:", err);
    await admin
      .from("shorts_sourcing_jobs")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "webhook_processing_failed",
        finished_at: now,
      })
      .eq("id", jobId);
    // Still 200 — retries won't help since the failure is in our own processing, and
    // Apify would otherwise keep retrying the same payload indefinitely.
    return NextResponse.json({ ok: false });
  }
}
