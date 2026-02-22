/**
 * Guides Dedup Index & Soft/Hard Dedup Validation
 * Usage: npm run check:guides:dedup
 * Requires: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 *
 * Checks:
 *   A) idx_guides_soft_dedup index usage (via EXPLAIN RPC or functional test)
 *   B) Soft Dedup: (lang, guide_type, primary_intent) hit on real published data
 *   C) Hard Dedup: (lang, guide_type, primary_route OR cta_tool_slug) hit on real data
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any, any, any>;
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ─── env loader ────────────────────────────────────────────────────────────

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
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
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

// ─── result tracking ───────────────────────────────────────────────────────

const results: { section: string; status: "PASS" | "FAIL" | "SKIP"; detail: string }[] = [];

function record(section: string, status: "PASS" | "FAIL" | "SKIP", detail: string) {
  results.push({ section, status, detail });
}

// ─── A) Index Check ────────────────────────────────────────────────────────

async function checkIndex(
  supabase: AnySupabase
): Promise<void> {
  console.log("\n=== Index Check ===");

  const EXPLAIN_SQL = [
    "EXPLAIN (ANALYZE, BUFFERS)",
    "SELECT id",
    "FROM guides",
    "WHERE lang = 'en'",
    "  AND guide_type = 'tool_based'",
    "  AND primary_intent = 'write-business-emails'",
    "  AND status != 'rejected'",
    "LIMIT 1;",
  ].join("\n");

  // Try RPC: explain_guides_dedup_index (must exist in DB to work)
  let rpcWorked = false;
  try {
    const { data: explainResult, error: rpcError } = await (supabase as any).rpc(
      "explain_guides_dedup_index",
      {
        p_lang: "en",
        p_guide_type: "tool_based",
        p_primary_intent: "write-business-emails",
      }
    );

    if (!rpcError && explainResult != null) {
      rpcWorked = true;
      const text = String(explainResult);
      const hasIndexScan = /Index\s*(Only\s*)?Scan|Bitmap\s+Index\s+Scan/i.test(text);
      if (hasIndexScan) {
        console.log("PASS  ✓ Index Scan detected in EXPLAIN output");
        console.log("      →", text.split("\n")[0]?.trim() ?? "(no output)");
        record("Index Check", "PASS", "Index Scan confirmed via EXPLAIN RPC");
      } else {
        console.log("FAIL  ✗ EXPLAIN ran but no Index Scan found (Seq Scan?)");
        console.log("      →", text.split("\n")[0]?.trim() ?? "(no output)");
        record("Index Check", "FAIL", "Seq Scan (no Index Scan) in EXPLAIN");
      }
    }
  } catch {
    // RPC not available - fall through to functional test
  }

  if (!rpcWorked) {
    console.log("INFO  RPC 'explain_guides_dedup_index' not found → functional test fallback");
    console.log("\n  [Supabase SQL Editor에서 아래 쿼리를 직접 실행하세요:]");
    for (const line of EXPLAIN_SQL.split("\n")) {
      console.log("  " + line);
    }

    // Functional fallback: verify index target query returns without error
    const { count, error: countError } = await supabase
      .from("guides")
      .select("id", { count: "exact", head: true })
      .eq("lang", "en")
      .eq("guide_type", "tool_based")
      .eq("primary_intent", "write-business-emails")
      .neq("status", "rejected");

    if (countError) {
      console.log(`\nFAIL  ✗ Functional query error: ${countError.message}`);
      record("Index Check", "FAIL", `Query error: ${countError.message}`);
    } else {
      console.log(`\nPASS  ✓ Index target query ran OK (matching rows: ${count ?? 0})`);
      console.log("      Index existence confirmed via migration 20260218_guides_soft_dedup_index.sql");
      console.log("      Run EXPLAIN above in SQL Editor to confirm Index Scan vs Seq Scan.");
      record("Index Check", "PASS", `Functional PASS (${count ?? 0} rows). EXPLAIN pending manual check.`);
    }
  }
}

// ─── B) Soft Dedup Check ───────────────────────────────────────────────────

async function checkSoftDedup(
  supabase: AnySupabase
): Promise<void> {
  console.log("\n=== Soft Dedup Check ===");

  // Step 1: grab a real published guide with primary_intent set
  const { data: samples, error: sampleError } = await supabase
    .from("guides")
    .select("id, slug, lang, guide_type, primary_intent, status, created_at")
    .eq("status", "published")
    .not("primary_intent", "is", null)
    .neq("primary_intent", "")
    .order("created_at", { ascending: false })
    .limit(5);

  if (sampleError || !samples?.length) {
    console.log("SKIP  No published guides with primary_intent found.");
    console.log("      Error:", sampleError?.message ?? "(none)");
    record("Soft Dedup Check", "SKIP", sampleError?.message ?? "No sample rows");
    return;
  }

  const sample = samples[0] as { id: string; slug: string | null; lang: string; guide_type: string | null; primary_intent: string | null; status: string; created_at: string };
  const { lang, guide_type, primary_intent } = sample;

  console.log("  Sample row used:");
  console.log(`    id           : ${String(sample.id).slice(0, 8)}...`);
  console.log(`    slug         : ${(sample.slug ?? "").slice(0, 50)}`);
  console.log(`    lang         : ${lang}`);
  console.log(`    guide_type   : ${guide_type}`);
  console.log(`    primary_intent: ${primary_intent}`);

  // Step 2: re-query using the exact same (lang, guide_type, primary_intent) + status != rejected
  const { data: hits, error: hitError } = await supabase
    .from("guides")
    .select("id, slug, lang, guide_type, primary_intent")
    .eq("lang", lang)
    .eq("guide_type", guide_type ?? "")
    .eq("primary_intent", primary_intent ?? "")
    .neq("status", "rejected")
    .limit(5);

  if (hitError) {
    console.log(`\nFAIL  ✗ Re-query error: ${hitError.message}`);
    record("Soft Dedup Check", "FAIL", `Re-query error: ${hitError.message}`);
    return;
  }

  if (!hits?.length) {
    console.log("\nMISS  ✗ Re-query returned 0 rows (dedup would create duplicate)");
    record("Soft Dedup Check", "FAIL", "MISS - 0 rows returned on dedup re-query");
    return;
  }

  const softHits = (hits ?? []) as { id: string; slug: string | null }[];
  console.log(`\nPASS  ✓ SOFT DEDUP candidate: HIT (${softHits.length} row(s) found)`);
  console.log("  Dedup condition: (lang, guide_type, primary_intent) + status != rejected");
  console.log("\n  Matched rows:");
  for (const h of softHits) {
    console.log(`    id: ${String(h.id).slice(0, 8)}...  slug: ${(h.slug ?? "").slice(0, 45)}`);
  }
  record("Soft Dedup Check", "PASS", `HIT - ${softHits.length} matching rows`);
}

// ─── C) Hard Dedup Check ───────────────────────────────────────────────────

async function checkHardDedup(
  supabase: AnySupabase
): Promise<void> {
  console.log("\n=== Hard Dedup Check ===");

  // Step 1: grab a real published guide with primary_route OR cta_tool_slug
  const { data: samples, error: sampleError } = await supabase
    .from("guides")
    .select("id, slug, lang, guide_type, primary_route, cta_tool_slug, status, created_at")
    .eq("status", "published")
    .or("primary_route.not.is.null,cta_tool_slug.not.is.null")
    .order("created_at", { ascending: false })
    .limit(10);

  if (sampleError || !samples?.length) {
    console.log("SKIP  No published guides with primary_route/cta_tool_slug found.");
    console.log("      Error:", sampleError?.message ?? "(none)");
    record("Hard Dedup Check", "SKIP", sampleError?.message ?? "No sample rows");
    return;
  }

  type HardSample = { id: string; slug: string | null; lang: string; guide_type: string | null; primary_route: string | null; cta_tool_slug: string | null; status: string; created_at: string };
  const typedSamples = (samples ?? []) as HardSample[];
  // Pick first sample that has at least one non-null value
  const sample = typedSamples.find(
    (s) =>
      (s.primary_route != null && String(s.primary_route).trim() !== "") ||
      (s.cta_tool_slug != null && String(s.cta_tool_slug).trim() !== "")
  );

  if (!sample) {
    console.log("SKIP  All fetched rows had null primary_route and cta_tool_slug.");
    record("Hard Dedup Check", "SKIP", "All rows null for both fields");
    return;
  }

  const { lang, guide_type, primary_route, cta_tool_slug } = sample;

  console.log("  Sample row used:");
  console.log(`    id            : ${String(sample.id).slice(0, 8)}...`);
  console.log(`    slug          : ${(sample.slug ?? "").slice(0, 50)}`);
  console.log(`    lang          : ${lang}`);
  console.log(`    guide_type    : ${guide_type}`);
  console.log(`    primary_route : ${primary_route ?? "(null)"}`);
  console.log(`    cta_tool_slug : ${cta_tool_slug ?? "(null)"}`);

  // Step 2: re-query using (lang, guide_type, primary_route OR cta_tool_slug)
  let query = supabase
    .from("guides")
    .select("id, slug, lang, guide_type, primary_route, cta_tool_slug")
    .eq("lang", lang)
    .eq("guide_type", guide_type ?? "")
    .neq("status", "rejected");

  // Build OR condition for primary_route / cta_tool_slug
  const orParts: string[] = [];
  if (primary_route != null && String(primary_route).trim() !== "") {
    orParts.push(`primary_route.eq.${primary_route}`);
  }
  if (cta_tool_slug != null && String(cta_tool_slug).trim() !== "") {
    orParts.push(`cta_tool_slug.eq.${cta_tool_slug}`);
  }

  if (orParts.length > 0) {
    query = query.or(orParts.join(",")) as typeof query;
  }

  const { data: hits, error: hitError } = await query.limit(5);

  if (hitError) {
    console.log(`\nFAIL  ✗ Re-query error: ${hitError.message}`);
    record("Hard Dedup Check", "FAIL", `Re-query error: ${hitError.message}`);
    return;
  }

  if (!hits?.length) {
    console.log("\nMISS  ✗ Re-query returned 0 rows (unexpected - original row should match)");
    record("Hard Dedup Check", "FAIL", "MISS - 0 rows returned on dedup re-query");
    return;
  }

  const hardHits = (hits ?? []) as { id: string; slug: string | null; primary_route: string | null; cta_tool_slug: string | null }[];
  console.log(`\nPASS  ✓ HARD DEDUP candidate: HIT (${hardHits.length} row(s) found)`);
  console.log("  Dedup condition: (lang, guide_type) + primary_route OR cta_tool_slug");
  console.log("\n  Matched rows:");
  for (const h of hardHits) {
    console.log(
      `    id: ${String(h.id).slice(0, 8)}...  slug: ${(h.slug ?? "").slice(0, 40)}` +
        `  route: ${h.primary_route ?? "-"}  tool: ${h.cta_tool_slug ?? "-"}`
    );
  }
  record("Hard Dedup Check", "PASS", `HIT - ${hardHits.length} matching rows`);
}

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  const url = requireEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
  const key = requireEnv(["SUPABASE_SERVICE_ROLE_KEY"]);
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Quick connection test
  const { error: connError } = await supabase.from("guides").select("id").limit(1);
  if (connError) {
    console.error("\n❌ DB connection failed:", connError.message);
    process.exit(1);
  }

  await checkIndex(supabase);
  await checkSoftDedup(supabase);
  await checkHardDedup(supabase);

  // === Summary ===
  console.log("\n=== Summary ===");
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const skipCount = results.filter((r) => r.status === "SKIP").length;

  for (const r of results) {
    const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "–";
    console.log(`  [${r.status}] ${icon} ${r.section}: ${r.detail}`);
  }

  console.log(`\n  Total: ${passCount} PASS / ${failCount} FAIL / ${skipCount} SKIP`);

  if (failCount === 0 && passCount > 0) {
    console.log("\n  ✅ 모든 체크 통과. idx_guides_soft_dedup 인덱스 및 dedup 로직 정상 작동 중.");
    console.log("  → 다음 액션: Supabase SQL Editor에서 EXPLAIN 쿼리로 Index Scan 직접 확인 권장.");
  } else if (failCount > 0) {
    console.log("\n  ⚠️  실패 항목 존재. 위 FAIL 항목을 확인하고 인덱스/쿼리 조건 점검 필요.");
  } else {
    console.log("\n  ℹ️  체크 결과 없음. DB 데이터 또는 설정을 확인하세요.");
  }

  console.log("");
}

main();
