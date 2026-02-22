/**
 * Guides Quality Gate + Auto Publish 헬스 체크
 * Usage: npm run check:guides:quality
 * Requires: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY in .env.local
 * SELECT ONLY — DB를 절대 수정하지 않음
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── .env.local 로드 ──────────────────────────────────────────────────────────
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

// ── KST "오늘" 날짜 범위 계산 ───────────────────────────────────────────────
function getKstTodayRange(): { start: string; end: string; label: string } {
  const now = new Date();
  // KST = UTC+9
  const kstOffsetMs = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffsetMs);

  const year = kstNow.getUTCFullYear();
  const month = String(kstNow.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstNow.getUTCDate()).padStart(2, "0");

  // KST 00:00 → UTC 전날 15:00
  const kstMidnightStart = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  const kstMidnightEnd = new Date(`${year}-${month}-${day}T23:59:59+09:00`);

  return {
    start: kstMidnightStart.toISOString(),
    end: kstMidnightEnd.toISOString(),
    label: `${year}-${month}-${day} (KST)`,
  };
}

// ── 출력 헬퍼 ────────────────────────────────────────────────────────────────
const PASS = "✅ PASS";
const FAIL = "❌ FAIL";

function section(title: string) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`=== ${title} ===`);
  console.log("=".repeat(50));
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  const url = requireEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
  const key = requireEnv(["SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 연결 테스트
  const { error: connError } = await supabase.from("guides").select("id").limit(1);
  if (connError) {
    console.error("\n❌ DB connection failed:", connError.message);
    process.exit(1);
  }

  const results: { check: string; status: string }[] = [];

  // ═══════════════════════════════════════════════════════════════
  // 1) Schema Check
  // ═══════════════════════════════════════════════════════════════
  section("Schema Check");

  // 필수 컬럼 존재 여부: information_schema.columns
  const { data: colRows, error: colErr } = await supabase
    .rpc("check_guides_quality_columns" as never)
    .select()
    .limit(1)
    // rpc가 없으면 fallback: 컬럼 존재를 guides에서 직접 SELECT 시도
    .then(async () => {
      // information_schema는 rpc 없이 직접 쿼리 불가 → guides에서 컬럼 포함 SELECT 시도
      return await supabase
        .from("guides")
        .select("quality_score, auto_publish_eligible")
        .limit(1);
    });

  const schemaColOk = !colErr;
  if (!schemaColOk) {
    console.log(`${FAIL} — quality_score 또는 auto_publish_eligible 컬럼 없음`);
    console.log(`       Error: ${colErr?.message}`);
  } else {
    console.log(`${PASS} — quality_score, auto_publish_eligible 컬럼 존재`);
  }
  results.push({ check: "Schema: required columns", status: schemaColOk ? "PASS" : "FAIL" });

  // 인덱스 존재 여부: 우선순위 A → B → WARN fallback
  const EXPLAIN_SQL = `EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM guides
WHERE lang='en' AND status='review' AND auto_publish_eligible=true
ORDER BY created_at ASC
LIMIT 10;`;

  let schemaIdxStatus: "PASS" | "FAIL" | "WARN" = "WARN";

  // ── Priority A: pg_catalog.pg_indexes ──────────────────────────────────────
  const { data: idxDataA, error: idxErrA } = await (
    (supabase as unknown as { schema: (s: string) => typeof supabase }).schema("pg_catalog")
  )
    .from("pg_indexes" as never)
    .select("indexname")
    .eq("schemaname" as never, "public")
    .eq("tablename" as never, "guides")
    .eq("indexname" as never, "idx_guides_auto_publish")
    .limit(1);

  if (!idxErrA) {
    const found = Array.isArray(idxDataA) && idxDataA.length > 0;
    if (found) {
      console.log(`${PASS} — idx_guides_auto_publish 인덱스 존재 (via pg_catalog.pg_indexes)`);
      schemaIdxStatus = "PASS";
    } else {
      console.log(`${FAIL} — idx_guides_auto_publish 인덱스 없음 (pg_catalog.pg_indexes)`);
      schemaIdxStatus = "FAIL";
    }
  } else {
    // ── Priority B: pg_catalog.pg_stat_user_indexes (JOIN 없이 동등 결과) ──
    console.log(`  ℹ️  pg_catalog.pg_indexes 접근 실패 (${idxErrA.message}) → B 시도`);

    const { data: idxDataB, error: idxErrB } = await (
      (supabase as unknown as { schema: (s: string) => typeof supabase }).schema("pg_catalog")
    )
      .from("pg_stat_user_indexes" as never)
      .select("indexrelname")
      .eq("relname" as never, "guides")
      .eq("indexrelname" as never, "idx_guides_auto_publish")
      .limit(1);

    if (!idxErrB) {
      const found = Array.isArray(idxDataB) && idxDataB.length > 0;
      if (found) {
        console.log(`${PASS} — idx_guides_auto_publish 인덱스 존재 (via pg_catalog.pg_stat_user_indexes)`);
        schemaIdxStatus = "PASS";
      } else {
        console.log(`${FAIL} — idx_guides_auto_publish 인덱스 없음 (pg_stat_user_indexes)`);
        schemaIdxStatus = "FAIL";
      }
    } else {
      // ── Fallback C: WARN + EXPLAIN 쿼리 출력 ─────────────────────────────
      console.log(`⚠️  WARN (cannot verify by catalog) — pg_indexes/pg_stat_user_indexes 모두 접근 불가`);
      console.log(`  pg_stat_user_indexes error: ${idxErrB.message}`);
      console.log(`\n  인덱스 사용 여부를 수동으로 확인하려면 SQL Editor에서 아래 쿼리를 실행하세요:`);
      console.log(`\n${EXPLAIN_SQL}`);
      schemaIdxStatus = "WARN";
    }
  }

  results.push({
    check: "Schema: idx_guides_auto_publish",
    status:
      schemaIdxStatus === "PASS"
        ? "PASS"
        : schemaIdxStatus === "FAIL"
        ? "FAIL"
        : "WARN (cannot verify by catalog)",
  });

  // ═══════════════════════════════════════════════════════════════
  // 2) Latest 50 Guides (any status) — INFO
  // ═══════════════════════════════════════════════════════════════
  section("Latest 50 Guides (any status)");

  if (!schemaColOk) {
    console.log(`  ⚠️  Schema 오류로 스킵`);
  } else {
    const { data: latest50, error: latest50Err } = await supabase
      .from("guides")
      .select("id, lang, status, quality_score, auto_publish_eligible, created_at, published_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (latest50Err) {
      console.log(`  ⚠️  쿼리 오류: ${latest50Err.message}`);
    } else {
      const rows = latest50 ?? [];

      // by status
      const statusCounts: Record<string, number> = {};
      for (const r of rows) {
        const s = (r.status as string) ?? "unknown";
        statusCounts[s] = (statusCounts[s] ?? 0) + 1;
      }
      const statusLine = ["published", "review", "draft", "approved", "rejected"]
        .map((s) => `${s}:${statusCounts[s] ?? 0}`)
        .join("  ");

      // by lang
      const enCount50 = rows.filter((r) => r.lang === "en").length;
      const krCount50 = rows.filter((r) => r.lang === "kr").length;

      const eligibleCount50 = rows.filter((r) => r.auto_publish_eligible === true).length;
      const nullScore50 = rows.filter((r) => r.quality_score == null).length;

      console.log(`  total(last 50)         : ${rows.length}`);
      console.log(`  by status              : ${statusLine}`);
      console.log(`  by lang                : en:${enCount50}  kr:${krCount50}`);
      console.log(`  eligible=true          : ${eligibleCount50}`);
      console.log(`  quality_score NULL     : ${nullScore50}`);

      console.log(`\n  ── newest 5 rows ─────────────────────────────────────────────`);
      const newest5 = rows.slice(0, 5);
      for (const r of newest5) {
        const score = r.quality_score != null ? String(r.quality_score).padStart(3) : "N/A";
        const elig = r.auto_publish_eligible === true ? "✓" : "✗";
        const createdAt = r.created_at ? (r.created_at as string).slice(0, 19).replace("T", " ") : "—";
        const publishedAt = r.published_at ? (r.published_at as string).slice(0, 19).replace("T", " ") : "—";
        console.log(
          `  id:${String(r.id).slice(0, 8)}…  lang:${String(r.lang).padEnd(2)}  status:${String(r.status).padEnd(10)}  score:${score}  elig:${elig}  created:${createdAt}  published:${publishedAt}`
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3) Quality Distribution (review 최근 50개)
  // ═══════════════════════════════════════════════════════════════
  section("Quality Distribution (review, last 50)");

  if (!schemaColOk) {
    console.log(`${FAIL} — Schema 오류로 스킵`);
    results.push({ check: "Quality Distribution", status: "FAIL (schema missing)" });
  } else {
    const { data: reviewRows, error: reviewErr } = await supabase
      .from("guides")
      .select("id, quality_score, auto_publish_eligible")
      .eq("status", "review")
      .order("created_at", { ascending: false })
      .limit(50);

    if (reviewErr) {
      console.log(`${FAIL} — 쿼리 오류: ${reviewErr.message}`);
      results.push({ check: "Quality Distribution", status: "FAIL (query error)" });
    } else {
      const rows = reviewRows ?? [];
      const total = rows.length;

      const nullScoreCount = rows.filter((r) => r.quality_score == null).length;
      const scores = rows
        .map((r) => r.quality_score as number | null)
        .filter((s): s is number => s !== null);

      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;
      const minScore = scores.length ? Math.min(...scores) : null;
      const maxScore = scores.length ? Math.max(...scores) : null;

      const eligibleCount = rows.filter((r) => r.auto_publish_eligible === true).length;

      // 이상치: score >= 80인데 eligible=false
      const anomalyHighScore = rows.filter(
        (r) => typeof r.quality_score === "number" && r.quality_score >= 80 && !r.auto_publish_eligible
      ).length;

      // 이상치: score < 80인데 eligible=true
      const anomalyLowScore = rows.filter(
        (r) => typeof r.quality_score === "number" && r.quality_score < 80 && r.auto_publish_eligible
      ).length;

      const hasAnomalies = anomalyHighScore > 0 || anomalyLowScore > 0;

      console.log(`  total(review, last 50) : ${total}`);
      console.log(`  quality_score NULL     : ${nullScoreCount}`);
      console.log(`  score avg / min / max  : ${avgScore ?? "N/A"} / ${minScore ?? "N/A"} / ${maxScore ?? "N/A"}`);
      console.log(`  auto_publish_eligible  : ${eligibleCount}`);
      console.log(`  anomaly (>=80 & !elig) : ${anomalyHighScore}`);
      console.log(`  anomaly (<80 & elig)   : ${anomalyLowScore}`);

      if (hasAnomalies) {
        console.log(`\n${FAIL} — 이상치 감지됨 (score vs eligible 불일치)`);
        results.push({ check: "Quality Distribution", status: "FAIL (anomaly detected)" });
      } else {
        console.log(`\n${PASS} — score/eligible 일관성 정상`);
        results.push({ check: "Quality Distribution", status: "PASS" });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4) Auto Publish Candidate Query (copy/paste for EXPLAIN)
  // ═══════════════════════════════════════════════════════════════
  section("Auto Publish Candidate Query (copy/paste)");

  const candidateQueryEN = `-- EN auto publish candidates (copy/paste into SQL Editor → EXPLAIN ANALYZE)
SELECT id
FROM guides
WHERE lang = 'en'
  AND status = 'review'
  AND auto_publish_eligible = true
ORDER BY created_at ASC
LIMIT 10;`;

  const candidateQueryKR = `-- KR auto publish candidates
SELECT id
FROM guides
WHERE lang = 'kr'
  AND status = 'review'
  AND auto_publish_eligible = true
ORDER BY created_at ASC
LIMIT 10;`;

  console.log(candidateQueryEN);
  console.log("");
  console.log(candidateQueryKR);

  // 실제 후보 수 확인 (정보용)
  const { data: enCandidates } = await supabase
    .from("guides")
    .select("id", { count: "exact", head: true })
    .eq("lang", "en")
    .eq("status", "review")
    .eq("auto_publish_eligible", true);

  const { data: krCandidates } = await supabase
    .from("guides")
    .select("id", { count: "exact", head: true })
    .eq("lang", "kr")
    .eq("status", "review")
    .eq("auto_publish_eligible", true);

  // count는 head:true + count:"exact" 방식으로 가져옴
  const { count: enCount } = await supabase
    .from("guides")
    .select("*", { count: "exact", head: true })
    .eq("lang", "en")
    .eq("status", "review")
    .eq("auto_publish_eligible", true);

  const { count: krCount } = await supabase
    .from("guides")
    .select("*", { count: "exact", head: true })
    .eq("lang", "kr")
    .eq("status", "review")
    .eq("auto_publish_eligible", true);

  console.log(`\n  현재 eligible 후보 수 — en: ${enCount ?? "?"}, kr: ${krCount ?? "?"}`);
  results.push({ check: "Candidate Query", status: "INFO (query provided)" });

  void enCandidates;
  void krCandidates;

  // ═══════════════════════════════════════════════════════════════
  // 5) Published Quota Sanity (KST Today)
  // ═══════════════════════════════════════════════════════════════
  section("Published Quota Sanity (KST Today)");

  const DAILY_LIMIT = 2;
  const kstRange = getKstTodayRange();
  console.log(`  기준 날짜: ${kstRange.label}`);
  console.log(`  UTC range: ${kstRange.start} ~ ${kstRange.end}`);

  const { data: todayPublished, error: quotaErr } = await supabase
    .from("guides")
    .select("id, lang, published_at")
    .eq("status", "published")
    .gte("published_at", kstRange.start)
    .lte("published_at", kstRange.end);

  if (quotaErr) {
    console.log(`${FAIL} — 쿼리 오류: ${quotaErr.message}`);
    results.push({ check: "Published Quota Sanity", status: "FAIL (query error)" });
  } else {
    const rows = todayPublished ?? [];
    const enToday = rows.filter((r) => r.lang === "en").length;
    const krToday = rows.filter((r) => r.lang === "kr").length;

    console.log(`  오늘 published — en: ${enToday}, kr: ${krToday} (limit: ${DAILY_LIMIT}/lang)`);

    const enOver = enToday > DAILY_LIMIT;
    const krOver = krToday > DAILY_LIMIT;

    if (enOver || krOver) {
      const details: string[] = [];
      if (enOver) details.push(`en=${enToday} > ${DAILY_LIMIT}`);
      if (krOver) details.push(`kr=${krToday} > ${DAILY_LIMIT}`);
      console.log(`${FAIL} — 일일 한도 초과: ${details.join(", ")}`);
      results.push({ check: "Published Quota Sanity", status: `FAIL (${details.join(", ")})` });
    } else {
      console.log(`${PASS} — 일일 한도 이내`);
      results.push({ check: "Published Quota Sanity", status: "PASS" });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════
  section("Summary");

  const failCount = results.filter((r) => r.status.startsWith("FAIL")).length;
  const passCount = results.filter((r) => r.status.startsWith("PASS")).length;

  console.table(results);

  if (failCount === 0) {
    console.log(`\n✅ 전체 ${passCount}개 체크 모두 통과 — Quality Gate 정상 운영 중`);
    console.log(`   다음 액션: 정기 배포 전 재실행 권장 (npm run check:guides:quality)`);
  } else {
    console.log(`\n❌ ${failCount}개 FAIL 감지 — 배포 전 반드시 수정 필요`);
    console.log(`   다음 액션: FAIL 항목 확인 후 migration 또는 cron 로직 점검`);
  }

  console.log("");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
