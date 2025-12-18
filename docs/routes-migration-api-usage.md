# Routes Migration API 사용 가이드

## API Endpoint

```
GET /api/routes/migrate?action={action}
```

---

## Step 1: DB 상태 확인

현재 Supabase에 routes 테이블이 있는지, tools.id 타입이 무엇인지 확인합니다.

**브라우저에서 실행:**
```
http://localhost:3000/api/routes/migrate?action=check
```

**또는 터미널에서:**
```bash
curl http://localhost:3000/api/routes/migrate?action=check
```

**응답 예시:**
```json
{
  "status": "check_complete",
  "tables": {
    "routes": {
      "exists": false,
      "error": "relation \"routes\" does not exist"
    },
    "route_tools": {
      "exists": false,
      "error": "relation \"route_tools\" does not exist"
    }
  },
  "tools": {
    "sample_id": "abc123...",
    "sample_id_type": "string",
    "sample_name": "ChatGPT"
  },
  "next_step": "Tables missing. Use ?action=create to create them."
}
```

**확인사항:**
- `tables.routes.exists`: false → 테이블 생성 필요
- `tools.sample_id_type`: "string" 또는 "object" → tools.id가 TEXT or UUID

---

## Step 2: 테이블 생성

routes와 route_tools 테이블을 생성합니다.

**⚠️ 중요: 이 단계는 Supabase SQL Editor에서 실행해야 합니다.**

API는 DDL(CREATE TABLE) 권한이 없어서 SQL만 생성해줍니다.

**브라우저에서 실행:**
```
http://localhost:3000/api/routes/migrate?action=create
```

**응답:**
```json
{
  "status": "create_sql_generated",
  "message": "Run these SQL commands in Supabase SQL Editor:",
  "sql": {
    "routes": "CREATE TABLE IF NOT EXISTS...",
    "route_tools": "CREATE TABLE IF NOT EXISTS...",
    "indexes": "CREATE INDEX IF NOT EXISTS..."
  },
  "note": "API cannot execute DDL directly. Use SQL Editor."
}
```

**실행 방법:**
1. Supabase Dashboard → SQL Editor 열기
2. 응답의 `sql.routes`, `sql.route_tools`, `sql.indexes`를 복사
3. SQL Editor에 붙여넣고 Run

**또는 간단하게:**
Supabase SQL Editor에서 `supabase/migrations/20251218_routes.sql` 파일 내용을 실행하세요.

---

## Step 3: 데이터 시드

src/lib/routes.ts의 10개 route를 DB에 삽입합니다.

**브라우저에서 실행:**
```
http://localhost:3000/api/routes/migrate?action=seed
```

**응답 예시:**
```json
{
  "status": "seed_complete",
  "results": {
    "routes_inserted": 10,
    "route_tools_inserted": 30,
    "errors": []
  }
}
```

**에러가 있는 경우:**
```json
{
  "status": "seed_complete",
  "results": {
    "routes_inserted": 8,
    "route_tools_inserted": 24,
    "errors": [
      "Tool slug 'opus-clip' not found in tools table (route: turn-long-videos-into-shorts)",
      "Route 'make-slides-from-notes' already exists (skipped)"
    ]
  }
}
```

---

## 전체 실행 순서 (한 번에)

```bash
# 1. Dev 서버 실행
npm run dev

# 2. 새 터미널에서 확인
curl http://localhost:3000/api/routes/migrate?action=check

# 3. (만약 테이블이 없으면) Supabase SQL Editor에서 migration 실행
# → supabase/migrations/20251218_routes.sql

# 4. 데이터 시드
curl http://localhost:3000/api/routes/migrate?action=seed
```

---

## 문제 해결

### 1. "Tool slug not found" 에러

**원인:** tools 테이블에 해당 slug가 없음 (예: opus-clip, filmora)

**해결:**
```sql
-- Supabase에서 확인
SELECT slug, name FROM tools WHERE slug IN ('opus-clip', 'filmora', 'prowritingaid');

-- 없으면 추가
INSERT INTO tools (id, name, slug, website_url, affiliate_url, ...)
VALUES (...);
```

### 2. "Route already exists" 에러

**원인:** 이미 seed를 실행했음 (중복 방지)

**해결:** 정상 동작입니다. 기존 route는 건너뜁니다.

### 3. "relation does not exist" 에러

**원인:** Step 2 (테이블 생성)를 건너뛰었음

**해결:** Supabase SQL Editor에서 `20251218_routes.sql` 실행

---

## 검증

### 1. 테이블 확인
```sql
SELECT COUNT(*) FROM routes;  -- 10
SELECT COUNT(*) FROM route_tools;  -- 30 (10 routes × 3 steps)
```

### 2. Best3 쿼리 테스트
```sql
SELECT
  r.slug, r.title,
  t.name as tool_name,
  rt.position, rt.is_best3, rt.step_title
FROM routes r
JOIN route_tools rt ON rt.route_id = r.id
JOIN tools t ON t.id = rt.tool_id
WHERE r.slug = 'turn-long-videos-into-shorts'
  AND rt.is_best3 = true
ORDER BY rt.position ASC;
```

**Expected:** 3 rows (position 1, 2, 3)

### 3. Featured routes 조회
```sql
SELECT slug, title, featured
FROM routes
WHERE featured = true
ORDER BY created_at DESC;
```

---

## 다음 단계

테이블 생성과 시드가 완료되면:

1. **코드 수정**: `/routes/[slug]` 페이지를 DB 조회로 변경
2. **Best3 로직 변경**: `route_tools.is_best3 = true AND position <= 3` 사용
3. **src/lib/routes.ts 제거**: DB가 single source of truth로 변경

---

## API 코드 위치

`src/app/api/routes/migrate/route.ts`

