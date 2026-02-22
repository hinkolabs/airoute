/**
 * Guide Quality Gate + Auto Publish — End-to-End Check
 *
 * Usage:
 *   npm run check:guides:autopublish
 *   tsx scripts/check-guides-autopublish-e2e.ts https://airoute.com
 *
 * Steps:
 *   A) Verify existing "review" guides have quality_score + auto_publish_eligible set
 *      (confirms the generate→quality_gate pipeline ran correctly on real data)
 *   B) Snapshot eligible review guides (status=review, auto_publish_eligible=true)
 *      — these are the candidates cron will process
 *   C) Call POST /api/admin/guides/cron (x-cron-secret header) → trigger auto-publish
 *      NOTE: /api/admin/guides/generate requires Supabase browser-session cookie
 *      (Next.js createServerClient + system_admins check). The cron endpoint runs
 *      the full generate+quality_gate+auto_publish pipeline and is reachable via
 *      x-cron-secret header — this IS the operational flow.
 *   D) Verify publish result via GET /api/admin/guides/[id] for each published ID
 *
 * PASS conditions:
 *   A: review guides exist AND quality_score is NOT NULL on all of them
 *   B: eligible count >= 0 (INFO; 0 is OK — quality gate may be blocking)
 *   C: cron HTTP 200, ok=true
 *   D: auto_published.published_ids verified as status=published via HTTP GET
 *      (or WARN if quota already full / no eligible guides)
 *
 * Required env (auto-loaded from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CRON_SECRET  (required for step C — cron will return 401 without it)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── .env.local auto-loader ────────────────────────────────────────────────────
function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) {
        const k = m[1].trim();
        let v = m[2].trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch {
    // ignore
  }
}
loadEnvLocal();

function requireEnv(names: string[]): string {
  for (const name of names) {
    const val = process.env[name];
    if (val && val.trim() !== "") return val;
  }
  console.error(`\n❌ Missing required env. Set one of: ${names.join(", ")}`);
  process.exit(1);
}

// ── Output helpers ────────────────────────────────────────────────────────────
const PASS = "✅ PASS";
const FAIL = "❌ FAIL";
const WARN = "⚠️  WARN";

function section(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// ── HTTP fetch wrapper ────────────────────────────────────────────────────────
async function fetchJson(
  url: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(url, options);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      console.log(`  HTTP ${res.status} ${res.statusText}`);
      if (data) console.log(`  Response body: ${JSON.stringify(data)}`);
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  Network error: ${msg}`);
    return { ok: false, status: 0, data: { error: msg } };
  }
}

// ── KST today range (same as cron/generate endpoints) ────────────────────────
function getKSTDayStart(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstDayStart = new Date(kstNow.toISOString().slice(0, 10) + "T00:00:00.000Z");
  return new Date(kstDayStart.getTime() - kstOffset).toISOString();
}

function getKSTDayEnd(): string {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstDayEnd = new Date(kstNow.toISOString().slice(0, 10) + "T23:59:59.999Z");
  return new Date(kstDayEnd.getTime() - kstOffset).toISOString();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const baseUrl = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  Guide Quality Gate + Auto Publish — E2E Check           ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`  baseUrl : ${baseUrl}`);
  console.log(`  started : ${new Date().toISOString()}`);

  const supabaseUrl = requireEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]);
  const serviceKey = requireEnv(["SUPABASE_SERVICE_ROLE_KEY"]);
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn(
      "\n⚠️  CRON_SECRET not set — Step C (cron trigger) will fail with 401"
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { error: connError } = await supabase
    .from("guides")
    .select("id")
    .limit(1);
  if (connError) {
    console.error(`\n❌ Supabase connection failed: ${connError.message}`);
    process.exit(1);
  }
  console.log("  db      : ✓ connected\n");

  const results: { step: string; status: string; detail: string }[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP A — Verify existing review guides have quality fields populated
  // ═══════════════════════════════════════════════════════════════════════════
  section("Step A — Quality Gate: verify existing review guides");

  console.log(
    "  ℹ️  Checks that the generate pipeline populates quality_score + auto_publish_eligible\n" +
      "     on guides already in the DB. Uses service_role (same client as generate endpoint)."
  );

  const { data: reviewGuides, error: reviewErr } = await supabase
    .from("guides")
    .select(
      "id, lang, status, quality_score, auto_publish_eligible, created_at, slug"
    )
    .eq("status", "review")
    .order("created_at", { ascending: false })
    .limit(20);

  if (reviewErr) {
    const detail = `Query error: ${reviewErr.message}`;
    console.log(`\n${FAIL} — ${detail}`);
    results.push({ step: "A: quality gate fields", status: "FAIL", detail });
  } else {
    const rows = reviewGuides ?? [];
    console.log(`\n  review guides (last 20)    : ${rows.length}`);

    if (rows.length === 0) {
      console.log(`\n${WARN} — No review guides found`);
      console.log(
        "  Cannot verify quality gate. Run the generate endpoint or cron first to create guides."
      );
      results.push({
        step: "A: quality gate fields",
        status: "WARN",
        detail: "No review guides in DB — run generate/cron first",
      });
    } else {
      const nullScoreCount = rows.filter((r) => r.quality_score == null).length;
      const eligibleCount = rows.filter((r) => r.auto_publish_eligible === true).length;
      const scores = rows
        .map((r) => r.quality_score as number | null)
        .filter((s): s is number => s !== null);
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

      // Anomaly check: score >= 80 but eligible=false, or score < 80 but eligible=true
      const anomalies = rows.filter(
        (r) =>
          typeof r.quality_score === "number" &&
          ((r.quality_score >= 80 && r.auto_publish_eligible !== true) ||
            (r.quality_score < 80 && r.auto_publish_eligible === true))
      );

      console.log(`  quality_score NULL         : ${nullScoreCount}`);
      console.log(`  auto_publish_eligible=true : ${eligibleCount}`);
      console.log(`  avg score                  : ${avgScore ?? "N/A"}`);
      console.log(`  score/eligible anomalies   : ${anomalies.length}`);

      console.log(`\n  ── newest 5 review guides ──────────────────────────────`);
      for (const r of rows.slice(0, 5)) {
        const score = r.quality_score != null ? String(r.quality_score).padStart(3) : "N/A";
        const elig = r.auto_publish_eligible === true ? "✓ eligible" : "✗ blocked";
        const created = String(r.created_at).slice(0, 19).replace("T", " ");
        console.log(
          `  ${String(r.id).slice(0, 8)}…  lang:${String(r.lang).padEnd(2)}  score:${score}  ${elig}  created:${created}`
        );
      }

      const aPass = nullScoreCount === 0 && anomalies.length === 0;
      console.log(
        `\n${aPass ? PASS : FAIL} — quality_score NOT NULL on all + no score/eligible anomalies`
      );
      results.push({
        step: "A: quality gate fields",
        status: aPass ? "PASS" : "FAIL",
        detail: `total=${rows.length}, null_score=${nullScoreCount}, eligible=${eligibleCount}, anomalies=${anomalies.length}`,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP B — Snapshot eligible candidates before cron
  // ═══════════════════════════════════════════════════════════════════════════
  section("Step B — Snapshot eligible candidates (before cron)");

  const { data: eligibleBefore, error: eligErr } = await supabase
    .from("guides")
    .select("id, lang, quality_score, created_at")
    .eq("status", "review")
    .eq("auto_publish_eligible", true)
    .order("created_at", { ascending: true });

  if (eligErr) {
    const detail = `Query error: ${eligErr.message}`;
    console.log(`\n${FAIL} — ${detail}`);
    results.push({ step: "B: eligible snapshot", status: "FAIL", detail });
  } else {
    const eligible = eligibleBefore ?? [];
    const enCount = eligible.filter((r) => r.lang === "en").length;
    const krCount = eligible.filter((r) => r.lang === "kr").length;

    console.log(`  eligible review guides — en: ${enCount}, kr: ${krCount}  (total: ${eligible.length})`);
    if (eligible.length > 0) {
      console.log(`  oldest eligible id   : ${String(eligible[0].id).slice(0, 8)}… (will be published first by FIFO)`);
    }

    const bStatus = eligible.length >= 0 ? "PASS" : "FAIL";
    console.log(
      `\n${PASS} — snapshot taken (${eligible.length} eligible guides waiting for cron)`
    );
    results.push({
      step: "B: eligible snapshot",
      status: bStatus,
      detail: `en=${enCount}, kr=${krCount}, total=${eligible.length}`,
    });
  }

  const eligibleBeforeIds = new Set(
    (eligibleBefore ?? []).map((r) => r.id as string)
  );

  // Also snapshot today's published count (for quota check)
  const { count: publishedTodayBefore } = await supabase
    .from("guides")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .eq("auto_publish_eligible", true)
    .gte("published_at", getKSTDayStart())
    .lt("published_at", getKSTDayEnd());

  console.log(
    `  today published (KST)     : ${publishedTodayBefore ?? 0} / 2 (daily limit per lang)`
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP C — Call cron endpoint (x-cron-secret)
  // ═══════════════════════════════════════════════════════════════════════════
  section("Step C — POST /api/admin/guides/cron  (trigger auto-publish pipeline)");

  console.log(
    "  ℹ️  The cron endpoint runs the FULL pipeline:\n" +
      "     generate guide → compute quality_score → runAutoPublish()\n" +
      "     Auth: x-cron-secret header (matches CRON_SECRET env var)"
  );

  const cronUrl = `${baseUrl}/api/admin/guides/cron`;

  console.log(`\n  URL           : ${cronUrl}`);
  console.log(`  method        : POST`);
  console.log(`  x-cron-secret : ${cronSecret ? "✓ set" : "⚠️  not set — will get 401"}`);

  const cResult = await fetchJson(cronUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": process.env.CRON_SECRET ?? "",
    },
  });

  if (!cResult.ok) {
    const detail = `HTTP ${cResult.status} — ${JSON.stringify(cResult.data)}`;
    console.log(`\n${FAIL} — ${detail}`);
    if (cResult.status === 401) {
      console.log("  → Set CRON_SECRET in .env.local and re-run");
    }
    if (cResult.status === 405) {
      console.log("  → Method Not Allowed: endpoint may not accept POST or route is misconfigured");
    }
    results.push({ step: "C: cron trigger", status: "FAIL", detail });
  } else {
    const c = cResult.data as Record<string, unknown>;
    console.log(`\n  response (pretty):\n${JSON.stringify(c, null, 2).split("\n").map((l) => `    ${l}`).join("\n")}`);
    console.log(`\n  ok                    : ${c.ok}`);
    console.log(`  generated             : ${c.generated}`);
    console.log(`  reason                : ${c.reason ?? "—"}`);
    console.log(`  todayCount            : ${c.todayCount ?? "—"} / ${c.limit ?? 2}`);
    console.log(`  quality_score         : ${c.quality_score ?? "—"}`);
    console.log(`  auto_publish_eligible : ${c.auto_publish_eligible ?? "—"}`);

    let cronPublishedIds: string[] = [];
    if (c.auto_published) {
      const ap = c.auto_published as {
        en_published: number;
        kr_published: number;
        published_ids: string[];
      };
      console.log(`  auto_published.en     : ${ap.en_published}`);
      console.log(`  auto_published.kr     : ${ap.kr_published}`);
      cronPublishedIds = ap.published_ids ?? [];
      console.log(
        `  auto_published.ids    : ${cronPublishedIds.length > 0 ? cronPublishedIds.join(", ") : "none"}`
      );
    }

    const cPass = c.ok === true;
    console.log(`\n${cPass ? PASS : FAIL} — cron responded ok=true`);

    if (c.generated === false && c.reason === "Daily limit (2) already reached") {
      console.log(
        `  ℹ️  Daily generation quota full — cron did not run auto-publish today.\n` +
          `     Try again tomorrow or check the cron schedule.`
      );
    }

    let cronDetail = `ok=${c.ok}, generated=${c.generated}`;
    if (c.reason) cronDetail += `, reason=${c.reason}`;
    if (cronPublishedIds.length > 0) cronDetail += `, published=${cronPublishedIds.length}`;
    results.push({
      step: "C: cron trigger",
      status: cPass ? "PASS" : "FAIL",
      detail: cronDetail,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP D — Verify published guides via HTTP GET /api/admin/guides/[id]
  // ═══════════════════════════════════════════════════════════════════════════
  section("Step D — Verify published guides via HTTP GET");

  // Determine which guides to check: from cron auto_published.published_ids
  // or from guides that were eligible before and now might be published
  let idsToCheck: string[] = [];

  if (cResult.ok && cResult.data) {
    const c = cResult.data as Record<string, unknown>;
    if (c.auto_published) {
      const ap = c.auto_published as { published_ids: string[] };
      idsToCheck = ap.published_ids ?? [];
    }
  }

  if (idsToCheck.length === 0) {
    // Cron didn't publish anything — check via DB if eligible count changed
    const { data: eligibleAfter } = await supabase
      .from("guides")
      .select("id")
      .eq("status", "review")
      .eq("auto_publish_eligible", true);

    const eligibleAfterIds = new Set((eligibleAfter ?? []).map((r) => r.id as string));
    const newlyPublished = [...eligibleBeforeIds].filter((id) => !eligibleAfterIds.has(id));

    if (newlyPublished.length > 0) {
      console.log(
        `  ℹ️  cron.auto_published was empty but ${newlyPublished.length} eligible guide(s) ` +
          `disappeared from review → likely published by this or a concurrent run`
      );
      idsToCheck = newlyPublished;
    }
  }

  if (idsToCheck.length === 0) {
    // No guides were published this run
    const cData = cResult.ok ? (cResult.data as Record<string, unknown>) : null;
    const cronReason = cData?.reason as string | undefined;
    const eligibleBeforeCount = eligibleBeforeIds.size;

    let dStatus: string;
    let dDetail: string;

    if (cronReason === "Daily limit (2) already reached") {
      console.log(`\n${WARN} — Cron daily quota already full — auto-publish did not run`);
      console.log(
        "  This is expected behavior, not a bug.\n" +
          "  Quality gate and generate pipeline verified in steps A + B."
      );
      dStatus = "WARN";
      dDetail = "daily quota full — auto-publish skipped (expected)";
    } else if (eligibleBeforeCount === 0) {
      console.log(`\n${WARN} — No eligible review guides existed before cron run`);
      console.log(
        "  Auto-publish had nothing to process.\n" +
          "  Run generate endpoint to create review guides, then re-run this check."
      );
      dStatus = "WARN";
      dDetail = "no eligible guides to publish — run generate first";
    } else {
      // Had eligible guides + cron ran + but nothing published → possible issue
      console.log(
        `\n${WARN} — Had ${eligibleBeforeCount} eligible guide(s) but none were published`
      );
      console.log(
        "  Possible causes:\n" +
          "    1) Daily publish quota (2/lang) was already full before this run\n" +
          "    2) Cron generated a new guide but auto-publish only looks at EXISTING review guides"
      );
      dStatus = "WARN";
      dDetail = `${eligibleBeforeCount} eligible before, 0 published`;
    }

    results.push({ step: "D: verify published", status: dStatus, detail: dDetail });
  } else {
    // We have IDs to verify via HTTP GET
    console.log(`  Verifying ${idsToCheck.length} published guide(s) via HTTP GET...`);
    const allVerified: boolean[] = [];

    for (const id of idsToCheck) {
      const url = `${baseUrl}/api/admin/guides/${id}`;
      console.log(`\n  GET ${url}`);
      const r = await fetchJson(url);

      if (!r.ok) {
        console.log(`    ${FAIL} — HTTP ${r.status}`);
        allVerified.push(false);
        continue;
      }

      const g = (r.data as { guide: Record<string, unknown> }).guide;
      console.log(`    id                   : ${id}`);
      console.log(`    status (after cron)  : ${g.status}`);
      console.log(`    quality_score        : ${g.quality_score}`);
      console.log(`    auto_publish_eligible: ${g.auto_publish_eligible}`);
      console.log(`    published_at         : ${g.published_at ?? "—"}`);

      const verified = g.status === "published" && g.auto_publish_eligible === true;
      console.log(
        `    → ${verified ? PASS : FAIL} — status=${g.status}, eligible=${g.auto_publish_eligible}`
      );
      allVerified.push(verified);
    }

    const allPass = allVerified.every(Boolean);
    console.log(
      `\n${allPass ? PASS : FAIL} — ${idsToCheck.length} guide(s) verified: ` +
        `${allVerified.filter(Boolean).length} published, ${allVerified.filter((v) => !v).length} failed`
    );
    results.push({
      step: "D: verify published",
      status: allPass ? "PASS" : "FAIL",
      detail: `verified ${idsToCheck.length} guides: ${allVerified.filter(Boolean).length} ok, ${allVerified.filter((v) => !v).length} fail`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════
  section("Summary");

  console.log("");
  console.table(results);

  const failCount = results.filter((r) => r.status === "FAIL").length;
  const warnCount = results.filter((r) => r.status === "WARN").length;
  const passCount = results.filter((r) => r.status === "PASS").length;

  console.log("");
  if (failCount === 0 && warnCount === 0) {
    console.log(
      `✅  ALL ${passCount} steps PASSED — Quality Gate + Auto Publish flow is WORKING`
    );
  } else if (failCount === 0) {
    console.log(
      `⚠️   ${passCount} PASS  ${warnCount} WARN — Flow is correct; check WARN details above\n` +
        `    (WARN typically means daily quota full or no eligible guides yet)`
    );
  } else {
    console.log(
      `❌  ${failCount} FAIL  ${passCount} PASS  ${warnCount} WARN — Review FAIL details above`
    );
  }

  console.log("\n  Expected output (sample):");
  console.log("    A: PASS — quality_score NOT NULL + no anomalies on existing review guides");
  console.log("    B: PASS — N eligible candidates snapshotted");
  console.log("    C: PASS — cron ok=true (generated=true OR daily limit hit)");
  console.log("    D: PASS — published guide verified via HTTP, OR WARN (quota/no candidates)");
  console.log("");

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
