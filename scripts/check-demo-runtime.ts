/**
 * Runtime DEMO_MODE + /kr/workspace reachability check
 *
 * Usage:
 *   npm run check:demo:runtime -- https://airoute.com
 *   npm run check:demo:runtime -- http://localhost:3000
 *
 * Checks:
 *   A) GET /api/debug/demo  — prints DEMO_MODE, VERCEL_ENV, hasCookie
 *   B) GET /kr/workspace    — prints HTTP status code only
 *
 * Exit code:
 *   0 — all requests completed (regardless of values — this is diagnostic only)
 *   1 — missing baseUrl arg or network error
 */

const TIMEOUT_MS = 8_000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function main(): Promise<void> {
  const baseUrl = (process.argv[2] ?? process.env.CHECK_URL)?.trim();

  if (!baseUrl) {
    console.error(
      "Missing baseUrl.\nExample: npm run check:demo:runtime -- https://airoute.com"
    );
    process.exit(1);
  }

  const base = baseUrl.replace(/\/$/, "");

  // ── A) GET /api/debug/demo ─────────────────────────────────────────────────
  const demoUrl = `${base}/api/debug/demo`;
  console.log(`\n[check] ${demoUrl}`);
  try {
    const res = await fetchWithTimeout(demoUrl);
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      console.log(`  [demo] HTTP ${res.status} — response not JSON`);
    }
    const { DEMO_MODE, hasCookie, VERCEL_ENV, NODE_ENV } = body as {
      DEMO_MODE?: boolean;
      hasCookie?: boolean;
      VERCEL_ENV?: string;
      NODE_ENV?: string;
    };
    console.log(
      `  [demo] DEMO_MODE=${DEMO_MODE}, hasCookie=${hasCookie}, VERCEL_ENV=${VERCEL_ENV ?? "undefined"}, NODE_ENV=${NODE_ENV ?? "undefined"}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  [demo] NETWORK_ERROR: ${msg}`);
    process.exit(1);
  }

  // ── B) GET /kr/workspace (status code only) ────────────────────────────────
  const wsUrl = `${base}/kr/workspace`;
  console.log(`\n[check] ${wsUrl}`);
  try {
    const res = await fetchWithTimeout(wsUrl, { redirect: "follow" });
    console.log(`  [kr/workspace] ${res.status}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  [kr/workspace] NETWORK_ERROR: ${msg}`);
    process.exit(1);
  }

  console.log("");
}

main();
