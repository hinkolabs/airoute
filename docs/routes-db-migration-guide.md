# Routes DB Migration Guide

## 목적

Route를 하드코딩(`src/lib/routes.ts`)에서 Supabase DB로 이동하여:
- Best3 정렬을 DB에서 관리
- Route-Tool 매핑을 확장 가능하게 만듦
- Route를 핵심 전환 자산으로 고정

---

## Step 1: 현재 DB 상태 확인

Supabase SQL Editor에서 실행:

```sql
-- 1) Route 관련 테이블이 있는지 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'
  AND (
    table_name ILIKE '%route%' OR
    table_name ILIKE '%best%' OR
    table_name ILIKE '%pick%'
  )
ORDER BY table_name;
```

**Expected output:**
- `favorites_routes` (user-saved routes, 이미 존재)
- `routes` (없으면 생성 필요)
- `route_tools` (없으면 생성 필요)

---

## Step 2: tools.id 타입 확인

```sql
-- tools.id가 UUID인지 TEXT인지 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='tools' AND column_name='id';
```

**Expected:**
- `uuid` → FK 설정 가능
- `text` → `route_tools.tool_id`도 TEXT로 유지

---

## Step 3: Routes 테이블 생성

`supabase/migrations/20251218_routes.sql` 파일을 Supabase SQL Editor에서 실행:

1. Supabase Dashboard → SQL Editor 열기
2. `20251218_routes.sql` 내용 복사/붙여넣기
3. Run 클릭

**생성되는 테이블:**
- `routes`: route 마스터 데이터 (slug, title, description, icon, featured 등)
- `route_tools`: route ↔ tool 매핑 (position, is_best3, step 정보)

**생성되는 인덱스:**
- `idx_routes_slug`
- `idx_routes_featured`
- `idx_route_tools_route`
- `idx_route_tools_best3`
- `idx_route_tools_tool`

---

## Step 4: 데이터 마이그레이션 (src/lib/routes.ts → DB)

현재 `src/lib/routes.ts`의 10개 route를 DB에 INSERT해야 합니다.

### Option A: Seed API 사용 (권장)

```bash
# Seed script 작성 후 실행
npm run seed:routes
```

### Option B: SQL로 직접 INSERT

```sql
-- Example for 1 route
INSERT INTO public.routes (slug, title, description, icon, featured, tags, guide_bullets)
VALUES (
  'turn-long-videos-into-shorts',
  'Turn long videos into Shorts',
  'Auto-detect viral moments, add captions, and export Shorts in minutes.',
  '✂️',
  true,
  ARRAY['video', 'shorts', 'content-repurpose', 'social-media'],
  ARRAY[
    'Focus on a single, strong hook in the first 3 seconds',
    'Use dynamic captions for 100% of your Shorts',
    'Experiment with different AI-generated clips'
  ]
)
RETURNING id;

-- Then insert route_tools (assuming route_id from above)
INSERT INTO public.route_tools (route_id, tool_id, position, is_best3, step_title, step_why, step_cta_label, step_prompt_example)
VALUES
  ('<route_id>', 'opus-clip', 1, true, 'Auto-Detect Viral Moments', 'AI finds the best clips automatically', 'Try Opus Clip', 'Upload long video → AI detects highlights'),
  ('<route_id>', 'filmora', 2, true, 'Polish & Add Effects', 'Quick edits with AI captions', 'Try Filmora', 'Import clip → Add AI captions'),
  ('<route_id>', 'chatgpt', 3, true, 'Generate Hooks & Titles', 'Create scroll-stopping hooks', 'Try ChatGPT', 'Generate 5 viral hooks');
```

---

## Step 5: Best3 쿼리 테스트

```sql
-- Route slug로 Best3 툴 조회
SELECT
  r.slug as route_slug,
  r.title as route_title,
  t.id as tool_id,
  t.name as tool_name,
  t.website_url,
  t.image,
  t.affiliate_url,
  rt.position,
  rt.is_best3,
  rt.step_title,
  rt.step_why,
  rt.step_cta_label
FROM routes r
JOIN route_tools rt ON rt.route_id = r.id
JOIN tools t ON t.id = rt.tool_id
WHERE r.slug = 'turn-long-videos-into-shorts'
  AND rt.is_best3 = true
ORDER BY rt.position ASC
LIMIT 3;
```

**Expected:** 3 rows (Opus Clip, Filmora, ChatGPT)

---

## Step 6: 코드 수정

### 6-1. `/routes/[slug]` 페이지를 DB에서 조회하도록 변경

```typescript
// Before: src/lib/routes.ts
const route = ROUTES.find(r => r.slug === params.slug);

// After: Supabase query
const { data: route } = await supabase
  .from('routes')
  .select(`
    *,
    route_tools (
      position,
      is_best3,
      step_title,
      step_why,
      step_cta_label,
      step_prompt_example,
      tools:tool_id (
        id, name, slug, website_url, image, affiliate_url
      )
    )
  `)
  .eq('slug', params.slug)
  .single();
```

### 6-2. `/routes` 목록 페이지도 DB 조회

```typescript
const { data: routes } = await supabase
  .from('routes')
  .select('slug, title, description, icon, featured, tags')
  .order('featured', { ascending: false })
  .order('created_at', { ascending: false });
```

---

## 체크리스트

- [ ] `routes` 테이블 생성 확인
- [ ] `route_tools` 테이블 생성 확인
- [ ] `tools.id` 타입 확인 및 FK 설정 (uuid인 경우)
- [ ] 기존 10개 route 데이터 INSERT
- [ ] Best3 쿼리 테스트 성공
- [ ] `/routes/[slug]` 페이지 DB 조회로 변경
- [ ] `/routes` 목록 페이지 DB 조회로 변경
- [ ] `src/lib/routes.ts` 제거 또는 deprecated 표시

---

## 주의사항

1. **tools.id가 TEXT인 경우**:
   - `route_tools.tool_id`를 TEXT로 유지
   - FK constraint 추가하지 말 것 (type mismatch)

2. **tools.id가 UUID인 경우**:
   - Migration SQL 하단 주석 참고하여 FK 추가

3. **RLS Policy**:
   - 현재는 모든 사용자가 routes를 읽을 수 있음 (public read)
   - Write는 authenticated users만 가능 (seeding용)
   - Production에서는 admin role로 제한 권장

4. **Performance**:
   - Best3 쿼리는 `idx_route_tools_best3` 인덱스를 사용
   - Slug 조회는 `idx_routes_slug` 인덱스를 사용

---

## 다음 단계 (고도화)

1. **Route Categories**: `routes.category_id` 추가
2. **Route Analytics**: `route_views`, `route_conversions` 테이블
3. **Route Versioning**: `route_versions` 테이블 (A/B 테스트용)
4. **Tool Alternatives**: `route_tools.is_alternative` 플래그 추가









