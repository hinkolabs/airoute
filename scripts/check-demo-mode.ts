/**
 * DEMO_MODE production check: verifies HTTP status of protected routes.
 * Usage (any OS): npm run check:demo https://airoute.com
 * Or: CHECK_URL=https://airoute.com npm run check:demo (Unix/Mac/Git Bash)
 * Requires Node 18+ (native fetch). Timeout: 5s per request.
 */

const TIMEOUT_MS = 5_000;

const urls = [
  "/login",
  "/signup",
  "/kr/login",
  "/kr/signup",
  "/kr/workspace",
  "/kr/workspace/billing",
  "/api/stripe/checkout",
  "/api/credits/balance",
];

async function checkUrl(baseUrl: string, path: string): Promise<{ status: number; ok: boolean }> {
  const url = new URL(path, baseUrl).href;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    return { status: res.status, ok: res.ok };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function main(): Promise<void> {
  const baseUrl = (process.argv[2] ?? process.env.CHECK_URL)?.trim();
  if (!baseUrl) {
    console.error("Missing URL. Example: npm run check:demo -- https://airoute.com");
    process.exit(1);
  }

  const base = baseUrl.replace(/\/$/, "");
  const results: { path: string; status: number; failed: boolean }[] = [];

  // DEMO_MODE: protected routes should be blocked (404/403) or coming-soon (200). 5xx or timeout = FAIL.
  const isPassStatus = (status: number) =>
    status === 200 || status === 301 || status === 302 || status === 403 || status === 404;

  for (const path of urls) {
    try {
      const { status } = await checkUrl(base, path);
      const failed = !isPassStatus(status);
      results.push({ path, status, failed });
      console.log(`[${status}] ${path}`);
    } catch (err) {
      results.push({ path, status: -1, failed: true });
      console.log(`[FAIL] ${path}`);
    }
  }

  const allPass = results.every((r) => !r.failed);
  console.log("");
  if (allPass) {
    console.log("All Protected Routes: PASS");
  } else {
    console.log("Some Routes FAILED");
    process.exit(1);
  }
}

main();
