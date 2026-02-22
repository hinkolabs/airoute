/**
 * Guides Quality Score Backfill SQL Generator
 * Usage: npm run print:guides:quality-backfill
 *
 * DB에 직접 접속하지 않습니다 — SQL만 출력합니다.
 * 출력된 SQL을 Supabase SQL Editor에 붙여넣어 실행하세요.
 *
 * quality-check.ts 의 computeGuideQualityScore 와 동일한 로직:
 *   [A] content_length     : length(content) > 3000         → +20
 *   [B] cta_present        : cta_type 있고 route/tool slug  → +20
 *   [C] primary_intent     : primary_intent 설정됨           → +20
 *   [D] route_or_tool_slug : cta/primary slug 중 하나 있음  → +20
 *   [E] h2_structure_ok    : content에 '## ' 패턴 2회 이상  → +20
 */

const SEP = "=".repeat(72);
const LINE = "-".repeat(72);

function section(title: string): void {
  console.log(`\n${SEP}`);
  console.log(`=== ${title}`);
  console.log(`${SEP}\n`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 공통 score 표현식
// H2 카운팅: regexp_count 미사용 (PG 12+ 호환)
//   - 줄 중간 ## : (length - length(replace(content, '\n## ', ''))) / 4
//   - 첫 줄  ## : CASE WHEN content LIKE '## %' THEN 1 ELSE 0 END
// ─────────────────────────────────────────────────────────────────────────────
const SCORE_EXPR = `(
    -- [A] content_length > 3000
    CASE WHEN length(content) > 3000 THEN 20 ELSE 0 END
    +
    -- [B] cta_present: cta_type 있고 route/tool slug 하나 이상
    CASE
      WHEN cta_type IS NOT NULL
       AND trim(cta_type) <> ''
       AND (cta_route_slug IS NOT NULL OR cta_tool_slug IS NOT NULL)
      THEN 20 ELSE 0
    END
    +
    -- [C] primary_intent_present
    CASE
      WHEN primary_intent IS NOT NULL
       AND trim(primary_intent) <> ''
      THEN 20 ELSE 0
    END
    +
    -- [D] route_or_tool_slug_present (CTA 또는 primary_route)
    CASE
      WHEN cta_route_slug IS NOT NULL
        OR cta_tool_slug  IS NOT NULL
        OR primary_route  IS NOT NULL
      THEN 20 ELSE 0
    END
    +
    -- [E] h2_structure_ok: '## ' 패턴 2회 이상 (regexp_count 없이)
    --     E'\\n## ' = newline + "## " → 길이 4
    CASE
      WHEN (
             (length(content) - length(replace(content, E'\\n## ', ''))) / 4
             + CASE WHEN content LIKE '## %' THEN 1 ELSE 0 END
           ) >= 2
      THEN 20 ELSE 0
    END
  )`;

// ─────────────────────────────────────────────────────────────────────────────
// SQL 0: 사전(BEFORE) 요약 — 백필 전 현황
// ─────────────────────────────────────────────────────────────────────────────
const SQL_0_BEFORE = `-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  [BEFORE]  백필 전 현황 요약                                         ║
-- ║  이 SELECT를 먼저 실행해서 현재 상태를 기록해 두세요.                ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- 0-A) 전체 요약 (total / null-count / eligible-count)
SELECT
  COUNT(*)                                                   AS total_guides,
  COUNT(*) FILTER (WHERE quality_score IS NULL)              AS null_score_count,
  COUNT(*) FILTER (WHERE auto_publish_eligible = true)       AS eligible_count,
  COUNT(*) FILTER (WHERE status = 'published')               AS published_count,
  COUNT(*) FILTER (WHERE status = 'review')                  AS review_count,
  COUNT(*) FILTER (WHERE status = 'draft')                   AS draft_count
FROM guides;

-- 0-B) lang별 분포
SELECT
  lang,
  COUNT(*)                                                   AS total,
  COUNT(*) FILTER (WHERE quality_score IS NULL)              AS null_score,
  COUNT(*) FILTER (WHERE auto_publish_eligible = true)       AS eligible,
  COUNT(*) FILTER (WHERE status = 'published')               AS published,
  COUNT(*) FILTER (WHERE status = 'review')                  AS review
FROM guides
GROUP BY lang
ORDER BY lang;`;

// ─────────────────────────────────────────────────────────────────────────────
// SQL 1: 백필 대상 규모 확인
// ─────────────────────────────────────────────────────────────────────────────
const SQL_1_SCOPE = `-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  [STEP 1]  백필 대상 규모 확인 SELECT                                ║
-- ║  quality_score IS NULL 인 rows를 lang / status 별로 집계             ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- 1-A) lang / status 분포
SELECT
  lang,
  status,
  COUNT(*) AS null_score_count
FROM guides
WHERE quality_score IS NULL
GROUP BY lang, status
ORDER BY lang, status;

-- 1-B) 전체 요약 (한눈에 확인)
SELECT
  COUNT(*)                                             AS total_null_score,
  COUNT(*) FILTER (WHERE lang = 'en')                  AS null_en,
  COUNT(*) FILTER (WHERE lang = 'kr')                  AS null_kr,
  COUNT(*) FILTER (WHERE status = 'published')         AS null_published,
  COUNT(*) FILTER (WHERE status = 'review')            AS null_review,
  COUNT(*) FILTER (WHERE status = 'draft')             AS null_draft
FROM guides
WHERE quality_score IS NULL;`;

// ─────────────────────────────────────────────────────────────────────────────
// SQL 2: 전체 UPDATE 템플릿 (CTE 기반, 재계산 없이 한 번만 표현식 평가)
// ─────────────────────────────────────────────────────────────────────────────
const SQL_2_UPDATE_TEMPLATE = `-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  [STEP 2]  백필 UPDATE 템플릿                                        ║
-- ║  ⚠️  실행 전 STEP 1 SELECT 로 대상 수를 반드시 확인하세요.            ║
-- ║  💡 BEGIN → 결과 확인 → ROLLBACK(검증) or COMMIT(적용) 권장          ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── BEGIN/ROLLBACK 패턴으로 먼저 드라이런 ────────────────────────────────────
-- BEGIN;
--   (아래 CTE UPDATE 붙여넣기)
-- SELECT COUNT(*), ROUND(AVG(quality_score), 1) AS avg_score
-- FROM guides WHERE quality_score IS NOT NULL;
-- ROLLBACK;   -- ← 검증 후 COMMIT; 으로 바꿔 실행

-- ── 전체 NULL 대상 CTE UPDATE ────────────────────────────────────────────────
WITH computed AS (
  SELECT
    id,
    ${SCORE_EXPR} AS new_score
  FROM guides
  WHERE quality_score IS NULL
)
UPDATE guides g
SET
  quality_score          = c.new_score,
  auto_publish_eligible  = (c.new_score >= 80)
  -- updated_at 갱신이 필요하면 아래 주석 해제:
  -- , updated_at = now()
FROM computed c
WHERE g.id = c.id;

-- ── [AFTER] 사후 요약 — UPDATE 실행 직후 반드시 실행하세요 ──────────────────

-- AFTER-A) 전체 요약 (total / null-count / eligible-count)
SELECT
  COUNT(*)                                                   AS total_guides,
  COUNT(*) FILTER (WHERE quality_score IS NULL)              AS null_score_count,
  COUNT(*) FILTER (WHERE auto_publish_eligible = true)       AS eligible_count,
  COUNT(*) FILTER (WHERE status = 'published')               AS published_count,
  COUNT(*) FILTER (WHERE status = 'review')                  AS review_count
FROM guides;

-- AFTER-B) lang별 분포 (BEFORE-B와 비교하세요)
SELECT
  lang,
  COUNT(*)                                                   AS total,
  COUNT(*) FILTER (WHERE quality_score IS NULL)              AS null_score,
  COUNT(*) FILTER (WHERE auto_publish_eligible = true)       AS eligible,
  ROUND(AVG(quality_score), 1)                               AS avg_score,
  MIN(quality_score)                                         AS min_score,
  MAX(quality_score)                                         AS max_score
FROM guides
GROUP BY lang
ORDER BY lang;

-- AFTER-C) lang / status 상세 분포
SELECT
  lang,
  status,
  COUNT(*)                                                  AS total,
  ROUND(AVG(quality_score), 1)                              AS avg_score,
  COUNT(*) FILTER (WHERE auto_publish_eligible = true)      AS eligible,
  COUNT(*) FILTER (WHERE quality_score IS NULL)             AS still_null
FROM guides
GROUP BY lang, status
ORDER BY lang, status;`;

// ─────────────────────────────────────────────────────────────────────────────
// SQL 3: 배치 처리 전략 (lang 별 500개씩)
// ─────────────────────────────────────────────────────────────────────────────
const SQL_3_BATCH_EN_OLDER_FIRST = `-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  [STEP 3-A]  배치 처리 — EN, older-first (created_at ASC), 500개    ║
-- ║  반복 실행할 때마다 가장 오래된 NULL 500개를 처리합니다.              ║
-- ╚══════════════════════════════════════════════════════════════════════╝

WITH batch AS (
  SELECT
    id,
    ${SCORE_EXPR} AS new_score
  FROM guides
  WHERE quality_score IS NULL
    AND lang = 'en'             -- ← 대상 lang 변경 가능
  ORDER BY created_at ASC       -- older-first (ASC) or newer-first (DESC)
  LIMIT 500
)
UPDATE guides g
SET
  quality_score         = b.new_score,
  auto_publish_eligible = (b.new_score >= 80)
FROM batch b
WHERE g.id = b.id;

-- 남은 EN NULL 수 확인:
SELECT COUNT(*) AS remaining_en_null
FROM guides
WHERE quality_score IS NULL AND lang = 'en';`;

const SQL_3_BATCH_KR_OLDER_FIRST = `-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  [STEP 3-B]  배치 처리 — KR, older-first (created_at ASC), 500개    ║
-- ╚══════════════════════════════════════════════════════════════════════╝

WITH batch AS (
  SELECT
    id,
    ${SCORE_EXPR} AS new_score
  FROM guides
  WHERE quality_score IS NULL
    AND lang = 'kr'
  ORDER BY created_at ASC
  LIMIT 500
)
UPDATE guides g
SET
  quality_score         = b.new_score,
  auto_publish_eligible = (b.new_score >= 80)
FROM batch b
WHERE g.id = b.id;

-- 남은 KR NULL 수 확인:
SELECT COUNT(*) AS remaining_kr_null
FROM guides
WHERE quality_score IS NULL AND lang = 'kr';`;

const SQL_3_BATCH_ANY_NEWER_FIRST = `-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  [STEP 3-C]  배치 처리 — 전체 lang, newer-first (최신 우선), 500개   ║
-- ║  최근 생성된 가이드부터 품질 점수를 먼저 채우고 싶을 때 사용합니다.   ║
-- ╚══════════════════════════════════════════════════════════════════════╝

WITH batch AS (
  SELECT
    id,
    ${SCORE_EXPR} AS new_score
  FROM guides
  WHERE quality_score IS NULL
  ORDER BY created_at DESC      -- newer-first
  LIMIT 500
)
UPDATE guides g
SET
  quality_score         = b.new_score,
  auto_publish_eligible = (b.new_score >= 80)
FROM batch b
WHERE g.id = b.id;

-- 전체 잔여 NULL 확인:
SELECT lang, COUNT(*) AS remaining_null
FROM guides
WHERE quality_score IS NULL
GROUP BY lang;`;

// ─────────────────────────────────────────────────────────────────────────────
// 드라이런 검증 쿼리 (점수 preview — UPDATE 없이)
// ─────────────────────────────────────────────────────────────────────────────
const SQL_DRY_RUN = `-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  [BONUS]  드라이런 — UPDATE 없이 점수 미리보기 (최근 20개)           ║
-- ╚══════════════════════════════════════════════════════════════════════╝

SELECT
  id,
  lang,
  status,
  left(content, 60)          AS content_preview,
  cta_type,
  cta_route_slug,
  cta_tool_slug,
  primary_intent,
  primary_route,
  ${SCORE_EXPR}              AS computed_score,
  (${SCORE_EXPR} >= 80)      AS would_be_eligible,
  quality_score              AS current_score,
  auto_publish_eligible      AS current_eligible
FROM guides
WHERE quality_score IS NULL
ORDER BY created_at DESC
LIMIT 20;`;

// ─────────────────────────────────────────────────────────────────────────────
// Main: 순서대로 출력
// ─────────────────────────────────────────────────────────────────────────────
function main(): void {
  console.log(SEP);
  console.log("  Guides Quality Score Backfill SQL Generator");
  console.log("  quality-check.ts 로직 → PostgreSQL SQL 변환");
  console.log(`  생성 시각: ${new Date().toISOString()}`);
  console.log(SEP);

  section("BEFORE — 백필 전 현황 요약 (먼저 실행)");
  console.log(SQL_0_BEFORE);

  section("STEP 1 — 백필 대상 규모 확인 (SELECT only)");
  console.log(SQL_1_SCOPE);

  section("STEP 2 — 전체 백필 UPDATE 템플릿 ★ 74건은 이 블록을 복사하세요");
  console.log(SQL_2_UPDATE_TEMPLATE);

  section("STEP 3 — 배치 처리 전략 (lang별 500개씩, 대용량용)");

  console.log("── 3-A) EN · older-first (500개씩) ──────────────────────────────────\n");
  console.log(SQL_3_BATCH_EN_OLDER_FIRST);

  console.log("\n" + LINE);
  console.log("── 3-B) KR · older-first (500개씩) ──────────────────────────────────\n");
  console.log(SQL_3_BATCH_KR_OLDER_FIRST);

  console.log("\n" + LINE);
  console.log("── 3-C) 전체 · newer-first (최신 우선, 500개씩) ─────────────────────\n");
  console.log(SQL_3_BATCH_ANY_NEWER_FIRST);

  section("BONUS — 드라이런 (점수 미리보기, UPDATE 없음)");
  console.log(SQL_DRY_RUN);

  section("실행 순서 가이드");
  console.log(`  1. Supabase SQL Editor 에서 [BEFORE] SELECT 실행 → 현황 기록
  2. STEP 1 SELECT 실행 → 백필 대상 수 파악
  3. BONUS 드라이런 SELECT 실행 → computed_score 분포 확인
  4. 대상이 500개 이하면 → STEP 2 전체 UPDATE 사용
     대상이 500개 초과면 → STEP 3 배치 (3-A / 3-B / 3-C) 반복 실행
  5. UPDATE 직후 [AFTER] SELECT (STEP 2 내 포함) 실행 → BEFORE와 비교
  6. BEFORE→AFTER 비교: null_score_count = 0 이면 성공
  7. npm run check:guides:quality 로 최종 검증

  ⚠️  주의사항:
  - RLS 우회를 위해 서비스키 연결에서 실행하거나 Supabase SQL Editor (admin) 사용
  - status(published/review/draft) 절대 변경 금지
  - updated_at / published_at / content 수정 금지
  - quality_score / auto_publish_eligible 만 업데이트됩니다
`);

  // ── 📋 복사 안내 (터미널 가장 아래에서 눈에 띄도록) ──────────────────────────
  const BOX = "█".repeat(72);
  console.log(`\n${BOX}`);
  console.log(`█${"  📋  Supabase SQL Editor에 복사할 블록 안내".padEnd(70)}█`);
  console.log(`${BOX}`);
  console.log(`
  ✅  74건(소량) → [STEP 2 — 전체 백필 UPDATE 템플릿] 블록 전체 복사

  순서:
    ① 이 터미널 출력에서 다음 구분선 사이 블록을 복사합니다:
       ────────────────────────────────────────────────────────────
       [STEP 2 — 전체 백필 UPDATE 템플릿 ★ 74건은 이 블록을 복사하세요]
       ────────────────────────────────────────────────────────────

    ② Supabase Dashboard → SQL Editor 에 붙여넣기

    ③ UPDATE 블록 실행 전, 먼저 [BEFORE] SELECT 블록을 실행해 현황 확인

    ④ UPDATE(CTE) 실행 → 성공 시 "N rows affected" 메시지 확인

    ⑤ AFTER SELECT (STEP 2 내 하단) 실행 → null_score_count = 0 확인

    ⑥ 터미널로 돌아와서:
       npm run check:guides:quality

  ⚠️  BEGIN; ... COMMIT; 패턴으로 실행하면 안전합니다.
      드라이런: COMMIT 대신 ROLLBACK; 으로 먼저 실행해 row count 확인 후 재실행.
`);
  console.log(`${BOX}\n`);
}

main();
