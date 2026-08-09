/**
 * Thin wrapper around the Apify REST API for running Actors asynchronously and
 * reading their dataset results. Kept generic (not Douyin/Xiaohongshu specific) —
 * see douyin-apify.ts / xiaohongshu-apify.ts for the actual actors used.
 *
 * IMPORTANT: we never await an Actor run to completion inside a Next.js request.
 * We start the run with an ad-hoc webhook (Apify's built-in mechanism — no queue/
 * worker needed) and let /api/shorts-sourcing/webhook receive the result later.
 * See plan section 2 ("비용/실행 아키텍처") for why.
 */

const APIFY_API_BASE = "https://api.apify.com/v2";

function getApifyToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error("apify_token_missing");
  }
  return token;
}

export interface StartApifyRunResult {
  runId: string;
  defaultDatasetId: string;
}

/**
 * Starts an Actor run and registers an ad-hoc webhook that Apify calls when the
 * run reaches a terminal state (SUCCEEDED/FAILED/TIMED-OUT/ABORTED). Returns
 * immediately with the run id — does not wait for the Actor to finish.
 */
export async function startApifyRun(params: {
  actorId: string;
  input: Record<string, unknown>;
  webhookUrl: string;
}): Promise<StartApifyRunResult> {
  const token = getApifyToken();

  const webhooks = [
    {
      eventTypes: ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED", "ACTOR.RUN.TIMED_OUT", "ACTOR.RUN.ABORTED"],
      requestUrl: params.webhookUrl,
    },
  ];
  const webhooksParam = Buffer.from(JSON.stringify(webhooks)).toString("base64");

  const url = `${APIFY_API_BASE}/acts/${encodeURIComponent(params.actorId)}/runs?token=${encodeURIComponent(
    token
  )}&webhooks=${encodeURIComponent(webhooksParam)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params.input),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[apify-client] startApifyRun failed:", res.status, errBody);
    throw new Error("apify_run_start_failed");
  }

  const body = await res.json();
  const data = body?.data;
  if (!data?.id || !data?.defaultDatasetId) {
    throw new Error("apify_run_response_invalid");
  }

  return { runId: data.id, defaultDatasetId: data.defaultDatasetId };
}

/** Fetches all items from an Actor run's dataset (used from the webhook handler). */
export async function fetchApifyDatasetItems(datasetId: string): Promise<unknown[]> {
  const token = getApifyToken();
  const url = `${APIFY_API_BASE}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(
    token
  )}&clean=true`;

  const res = await fetch(url);
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[apify-client] fetchApifyDatasetItems failed:", res.status, errBody);
    throw new Error("apify_dataset_fetch_failed");
  }

  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

/**
 * Runs an Actor synchronously and returns its dataset items directly in one HTTP
 * call (Apify's `run-sync-get-dataset-items` endpoint) — no webhook/polling needed.
 * Only suitable for short-lived, single-shot runs (e.g. one reverse-image-search
 * call) since the request blocks until the Actor finishes or `timeoutSecs` elapses.
 */
export async function runApifyActorSyncGetDatasetItems(params: {
  actorId: string;
  input: Record<string, unknown>;
  timeoutSecs?: number;
}): Promise<unknown[]> {
  const token = getApifyToken();
  const timeoutSecs = params.timeoutSecs ?? 55; // stay under Next.js route's maxDuration=60

  const url = `${APIFY_API_BASE}/acts/${encodeURIComponent(
    params.actorId
  )}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${timeoutSecs}&clean=true`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params.input),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[apify-client] runApifyActorSyncGetDatasetItems failed:", res.status, errBody);
    throw new Error("apify_sync_run_failed");
  }

  const items = await res.json();
  return Array.isArray(items) ? items : [];
}
