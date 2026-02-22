# AIRoute v2.0 구현 계획서

> **Version:** v1.0  
> **Date:** 2026-02-21  
> **목표:** v1.0(신뢰 + SEO) → v2.0(자동화 수익화) 전환  
> **핵심 KPI:** 첫 유료 구독자 발생 → 월 반복 매출(MRR) 달성

---

## 0. v1.0 → v2.0 전환 기준

### v1.0 완료 체크리스트

| 영역 | 상태 | 비고 |
|------|------|------|
| Tools/Routes/Guides 공개 페이지 | ✅ 완료 | EN + KR |
| Admin CRUD (Routes/Tools/Guides) | ✅ 완료 | 생성/편집/삭제/번역 |
| AI Creator (통합 생성) | ✅ 완료 | Route+Guide+Tool |
| 가이드 자동 발행 (Cron) | ✅ 완료 | 품질 게이트 포함 |
| 인증 (Google/Email) | ✅ 완료 | 세션 관리 |
| Workspace 생성 (Personal/Team) | ✅ 완료 | Pay-before-create |
| Stripe 결제 (Checkout + Webhook) | ✅ 완료 | 구독 활성화 |
| 크레딧 시스템 (잔액/충전/소비) | ✅ 완료 | 테스트 모드 |
| 쿠폰 시스템 | ✅ 완료 | credits/subscription |
| 권한 시스템 (Entitlements) | ✅ 완료 | 역할 기반 |
| 이벤트 로깅 | ✅ 완료 | PII 미수집 |
| KPI 대시보드 (Admin) | ✅ 완료 | 월별 메트릭 |
| 즐겨찾기 (Guest/User) | ✅ 완료 | localStorage + DB |
| SEO (sitemap/robots/meta) | ✅ 완료 | - |
| i18n 파이프라인 | ✅ 완료 | OpenAI 번역 |

### v2.0에서 해결할 것

> **v2.0 = "결제한 사람이 실제로 쓸 수 있는 기능을 만든다"**

```
v1.0: 사람들이 와서 → 구경하고 → 가입하고 → 결제한다
v2.0: 결제한 사람이 → 설정하고 → 아이템이 생성되고 → 이메일이 발송된다
                     ↑                              ↑
               지금 여기까지 됨              여기부터 만들어야 함
```

---

## 1. v2.0 전체 로드맵

### 4개 Phase, 8주 계획

```
Phase 1 (Week 1-2): 기반 — DB + 설정 UI + 결제 완성
Phase 2 (Week 3-4): 핵심 — 아이템 생성 + 발송 파이프라인
Phase 3 (Week 5-6): 자동화 — n8n 연동 + 스케줄 실행
Phase 4 (Week 7-8): 안정화 — 리포트 + 모니터링 + 런칭
```

```
                    Week 1-2          Week 3-4          Week 5-6          Week 7-8
                  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
  DB 테이블 ──────┤ Phase 1   │    │           │    │           │    │           │
  설정 UI ────────┤ 기반      │    │           │    │           │    │           │
  결제 완성 ──────┤           │    │           │    │           │    │           │
  Credit 차등 ────┤           │    │           │    │           │    │           │
                  └─────┬─────┘    │           │    │           │    │           │
                        │          │           │    │           │    │           │
  아이템 생성 엔진 ─────┼─────────┤ Phase 2   │    │           │    │           │
  텍스트 규칙 ──────────┼─────────┤ 핵심      │    │           │    │           │
  이메일 발송 ──────────┼─────────┤           │    │           │    │           │
  이미지 처리 ──────────┼─────────┤           │    │           │    │           │
                        │         └─────┬─────┘    │           │    │           │
                        │               │          │           │    │           │
  n8n 워크플로우 ───────┼───────────────┼─────────┤ Phase 3   │    │           │
  스케줄 빌드 ──────────┼───────────────┼─────────┤ 자동화    │    │           │
  자동 실행 ────────────┼───────────────┼─────────┤           │    │           │
                        │               │         └─────┬─────┘    │           │
                        │               │               │          │           │
  인사이트 레터 ────────┼───────────────┼───────────────┼─────────┤ Phase 4   │
  모니터링/리포트 ──────┼───────────────┼───────────────┼─────────┤ 안정화    │
  토큰 보상 ────────────┼───────────────┼───────────────┼─────────┤           │
                        │               │               │         └───────────┘
```

---

## 2. Phase 1: 기반 (Week 1-2)

> **목표:** v2.0 자동화를 위한 DB + UI + 결제 인프라 완성

### 2.1 Auto Posting DB 마이그레이션

**우선순위:** P0 | **예상:** 1일

```sql
-- 1) 마케팅 브리프 (workspace_manager_settings로 대체 가능하면 생략)
-- → workspace_manager_settings에 이미 brand_name, company_profile 있으므로 생략

-- 2) 월간 아이템풀
CREATE TABLE monthly_item_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  year_month TEXT NOT NULL,           -- '2026-03'
  status TEXT NOT NULL DEFAULT 'draft', -- draft | ready | active | archived
  item_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, year_month)
);

-- 3) 개별 아이템 (15개/월)
CREATE TABLE monthly_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES monthly_item_pools(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  position INT NOT NULL,              -- 1~15
  topic TEXT NOT NULL,                -- 주제
  target_audience TEXT,               -- 타겟
  angle TEXT,                         -- 관점
  cta TEXT,                           -- CTA
  main_keyword TEXT,                  -- 메인 키워드
  secondary_keywords TEXT[],          -- 세컨드 키워드
  image_search_keyword TEXT,          -- 이미지 검색 키워드
  status TEXT DEFAULT 'pending',      -- pending | generating | ready | used | failed
  blog_content TEXT,                  -- 생성된 블로그 글
  sns_content TEXT,                   -- 생성된 SNS 글
  image_urls TEXT[],                  -- 이미지 URL (2장)
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4) 발송 스케줄 슬롯
CREATE TABLE posting_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  item_id UUID NOT NULL REFERENCES monthly_items(id),
  scheduled_at TIMESTAMPTZ NOT NULL,  -- 발송 예정 시각
  channel TEXT NOT NULL DEFAULT 'email',
  status TEXT DEFAULT 'scheduled',    -- scheduled | sending | sent | failed | skipped
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) 발송 실행 기록
CREATE TABLE posting_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES posting_slots(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID REFERENCES auth.users(id),  -- 수신자
  channel TEXT NOT NULL DEFAULT 'email',
  recipient_email TEXT,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',      -- pending | sent | delivered | bounced | failed
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE monthly_item_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_runs ENABLE ROW LEVEL SECURITY;

-- workspace member만 접근
CREATE POLICY "ws_member_read" ON monthly_item_pools
  FOR SELECT USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
-- (나머지 테이블도 동일 패턴)

-- 인덱스
CREATE INDEX idx_monthly_items_pool ON monthly_items(pool_id);
CREATE INDEX idx_posting_slots_workspace ON posting_slots(workspace_id, scheduled_at);
CREATE INDEX idx_posting_runs_slot ON posting_runs(slot_id);
```

**파일:** `supabase/migrations/20260222_autoposting_tables.sql`

### 2.2 전체 설정 / 개인 설정 분리 UI

**우선순위:** P1 | **예상:** 2일

**작업 내용:**

| 파일 | 작업 |
|------|------|
| `/kr/workspace/settings/page.tsx` | Placeholder → 실제 설정 화면으로 교체 |
| `/kr/workspace/settings/company/page.tsx` | 신규: 전체 설정 (owner만) |
| `/kr/workspace/settings/personal/page.tsx` | 신규: 개인 설정 (모든 유저) |

**전체 설정 UI:**
```
┌─────────────────────────────────┐
│ 회사 정보 (owner만 수정)         │
│ ┌─────────────────────────────┐ │
│ │ 브랜드명: [___________]     │ │
│ │ 로고: [업로드]              │ │
│ │ 회사 프로필: [textarea]     │ │
│ │ 금지어: [태그 입력]         │ │
│ │ 기본 톤: [드롭다운]         │ │
│ └─────────────────────────────┘ │
│ [저장]                          │
└─────────────────────────────────┘
```

**개인 설정 UI:**
```
┌─────────────────────────────────┐
│ 내 마케팅 설정                   │
│ ┌─────────────────────────────┐ │
│ │ 톤 프리셋: [드롭다운]       │ │
│ │ 톤 예시: [textarea]         │ │
│ │ 개인 키워드: [태그 입력]    │ │
│ │ 제외 키워드: [태그 입력]    │ │
│ │ 이미지 서명 문구: [input]   │ │  ← 신규 컬럼 필요
│ └─────────────────────────────┘ │
│ [저장]                          │
└─────────────────────────────────┘
```

**DB 추가:**
```sql
-- workspace_manager_settings에 기본 톤 추가
ALTER TABLE workspace_manager_settings ADD COLUMN IF NOT EXISTS default_tone TEXT;

-- user_marketing_settings에 이미지 서명 추가  
ALTER TABLE user_marketing_settings ADD COLUMN IF NOT EXISTS image_signature TEXT;
```

### 2.3 Credit 기능별 차등

**우선순위:** P1 | **예상:** 1일

**작업 내용:**

```typescript
// src/lib/billing/plan-features.ts (신규)
export const PLAN_FEATURES = {
  starter: {
    monthly_credits: 1000,
    custom_tone: false,
    ai_image: false,
    ai_recommend: false,
    verdict_daily_limit: 5,
    auto_posting: true,
    insight_letter: true,
  },
  pro: {
    monthly_credits: 5000,
    custom_tone: true,
    ai_image: true,
    ai_recommend: true,
    verdict_daily_limit: 20,
    auto_posting: true,
    insight_letter: true,
  },
} as const;
```

**Credit 월간 리셋 로직:**
```
방법 A: Vercel Cron (매월 1일 00:00)
  → /api/credits/monthly-reset
  → 각 활성 구독의 workspace_credits를 플랜 기본값으로 UPDATE
  → credit_ledger에 'monthly_reset' 기록

방법 B: n8n 워크플로우 (월초 실행)
  → 동일 로직
```

### 2.4 Stripe 구독 완전 연동

**우선순위:** P1 | **예상:** 1일

| 작업 | 현재 | 목표 |
|------|------|------|
| 구독 취소 | DB만 업데이트 | Stripe API 실제 취소 (`cancel_at_period_end`) |
| 해지 예약 | 즉시 취소 | `cancel_at_period_end=true` → 만료일까지 사용 |
| 업그레이드 | 미구현 | Stripe Subscription Update |
| 다운그레이드 | 미구현 | 다음 결제일부터 적용 |

```typescript
// /api/subscription/cancel 수정
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 즉시 취소가 아닌 해지 예약
await stripe.subscriptions.update(stripeSubscriptionId, {
  cancel_at_period_end: true,
});
```

### 2.5 Phase 1 산출물

| 산출물 | 파일 |
|--------|------|
| DB 마이그레이션 | `supabase/migrations/20260222_autoposting_tables.sql` |
| 설정 컬럼 추가 | `supabase/migrations/20260222_settings_columns.sql` |
| 전체 설정 UI | `/kr/workspace/settings/company/page.tsx` |
| 개인 설정 UI | `/kr/workspace/settings/personal/page.tsx` |
| 플랜 기능 정의 | `src/lib/billing/plan-features.ts` |
| Credit 월간 리셋 | `/api/credits/monthly-reset/route.ts` |
| Stripe 취소 수정 | `/api/subscription/cancel/route.ts` (수정) |

---

## 3. Phase 2: 핵심 — 아이템 생성 + 발송 (Week 3-4)

> **목표:** "결제 → 아이템 생성 → 이메일 발송"까지 end-to-end 완성

### 3.1 아이템 생성 엔진

**우선순위:** P0 | **예상:** 3일

**플로우:**
```
[월초 트리거] (Cron or n8n)
    │
    ├── 활성 구독 workspace 목록 조회
    │
    ├── 각 workspace에 대해:
    │   ├── monthly_item_pools INSERT (year_month, status=draft)
    │   │
    │   ├── workspace_manager_settings 조회 (회사 롤)
    │   ├── workspace_insight_letter_settings 조회 (키워드)
    │   │
    │   ├── OpenAI → 15개 아이템 주제 생성
    │   │   ├── 입력: 브랜드, 프로필, 키워드, 금지어
    │   │   └── 출력: topic, target, angle, cta, keywords × 15
    │   │
    │   ├── monthly_items INSERT × 15
    │   └── pool.status = 'ready'
    │
    └── 완료
```

**API:**

| Endpoint | Method | 역할 |
|----------|--------|------|
| `/api/autoposting/generate-pool` | POST | 월간 아이템풀 생성 (Admin/Cron) |
| `/api/autoposting/pool` | GET | 아이템풀 조회 |
| `/api/autoposting/items` | GET | 아이템 목록 |

**아이템 생성 프롬프트 (OpenAI):**
```
당신은 B2B 마케팅 콘텐츠 기획자입니다.

[회사 정보]
- 브랜드: {brand_name}
- 프로필: {company_profile}
- 업종: {industry}
- 타겟: {audience}
- 키워드: {seed_keywords}
- 금지어: {forbidden_claims}

이번 달({year_month}) 마케팅 아이템 15개를 생성하세요.
각 아이템은 다음을 포함:
1. topic: 주제 (한 줄)
2. target_audience: 타겟 독자
3. angle: 관점/접근법
4. cta: 행동 유도 문구
5. main_keyword: 메인 키워드 1개
6. secondary_keywords: 세컨드 키워드 2~3개
7. image_search_keyword: 이미지 검색용 영어 키워드

규칙:
- 15개 중 10개는 에버그린, 5개는 시즌/트렌드
- 중복 주제 금지
- 금지어 사용 금지
```

### 3.2 콘텐츠 생성 (블로그 + SNS)

**우선순위:** P0 | **예상:** 2일

**플로우:**
```
[아이템 생성 후 or 발송 전]
    │
    ├── monthly_items.status = 'generating'
    │
    ├── OpenAI → 블로그 콘텐츠 생성
    │   ├── 최소 1,200자
    │   ├── 메인 키워드 ≥ 5회
    │   ├── 세컨드 키워드 ≥ 2회
    │   └── H2/H3 구조
    │
    ├── OpenAI → SNS 콘텐츠 생성
    │   ├── 150~300자
    │   ├── 해시태그 5~12개
    │   └── 이모지 허용
    │
    ├── 텍스트 규칙 검증 (quality gate)
    │   ├── 글자수 체크
    │   ├── 키워드 빈도 체크
    │   └── 금지어 체크
    │
    ├── monthly_items UPDATE (blog_content, sns_content)
    └── status = 'ready'
```

**텍스트 규칙 엔진:**

```typescript
// src/lib/autoposting/text-rules.ts (신규)
export function validateBlogContent(content: string, item: MonthlyItem): ValidationResult {
  const errors: string[] = [];
  
  if (content.length < 1200) errors.push(`글자수 부족: ${content.length}/1200`);
  
  const mainCount = countKeyword(content, item.main_keyword);
  if (mainCount < 5) errors.push(`메인 키워드 부족: ${mainCount}/5`);
  
  for (const kw of item.secondary_keywords) {
    const count = countKeyword(content, kw);
    if (count < 2) errors.push(`세컨드 키워드 "${kw}" 부족: ${count}/2`);
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateSnsContent(content: string): ValidationResult {
  const text = content.replace(/#\S+/g, '').trim();
  const hashtags = (content.match(/#\S+/g) || []).length;
  
  const errors: string[] = [];
  if (text.length < 150 || text.length > 300) errors.push(`글자수: ${text.length} (150~300)`);
  if (hashtags < 5 || hashtags > 12) errors.push(`해시태그: ${hashtags}개 (5~12)`);
  
  return { valid: errors.length === 0, errors };
}
```

### 3.3 이미지 처리

**우선순위:** P1 | **예상:** 2일

```
[이미지 파이프라인]
    │
    ├── Unsplash API → image_search_keyword로 검색 → 2장 선택
    │
    ├── (Pro만) AI 이미지 생성 대안
    │
    └── 워터마크 합성
        ├── 하단 10~15% 띠배너
        ├── 좌측: workspace_manager_settings.logo_url
        └── 우측: user_marketing_settings.image_signature
```

**구현 방법:**
- Unsplash: `unsplash-js` 또는 REST API (무료 50req/hr)
- 워터마크: `sharp` 라이브러리 (Node.js 이미지 처리)
- 저장: Supabase Storage bucket (`autoposting-images`)

### 3.4 이메일 발송

**우선순위:** P0 | **예상:** 2일

**이메일 서비스 선택:**

| 서비스 | 무료 티어 | 가격 | 추천 |
|--------|----------|------|------|
| Resend | 3,000/월 | $20/10K | ✅ (Next.js 궁합) |
| SendGrid | 100/일 | $15/40K | |
| AWS SES | - | $0.10/1K | (설정 복잡) |

**이메일 템플릿 구조:**
```html
┌──────────────────────────────────┐
│ [로고]  AIRoute Auto Posting      │
├──────────────────────────────────┤
│                                   │
│  📝 이번 회차 블로그 콘텐츠       │
│  ─────────────────────────        │
│  {blog_content}                   │
│                                   │
│  📱 SNS용 콘텐츠                  │
│  ─────────────────────────        │
│  {sns_content}                    │
│                                   │
│  🖼 이미지                        │
│  [이미지1] [이미지2]              │
│                                   │
│  ─────────────────────────        │
│  {workspace_brand} | {user_sig}   │
│  AIRoute로 자동 생성됨            │
└──────────────────────────────────┘
```

**API:**

| Endpoint | Method | 역할 |
|----------|--------|------|
| `/api/autoposting/send` | POST | 이메일 발송 (slot 실행) |
| `/api/autoposting/preview` | POST | 발송 미리보기 |

### 3.5 Auto Posting UI 완성

**우선순위:** P0 | **예상:** 2일

```
/kr/workspace/marketing/auto-posting

┌─────────────────────────────────────────────┐
│ 자동 포스팅                    [이번 달 현황] │
│                                              │
│ ┌─ 탭 ─────────────────────────────────────┐ │
│ │ 아이템 | 발송 일정 | 히스토리 | 설정      │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [아이템 탭]                                  │
│ ┌──────────────────────────────────────────┐ │
│ │ 2026년 3월 아이템풀 (15/15)    [Ready]   │ │
│ │                                          │ │
│ │ #1  AI 마케팅 트렌드 2026   [Ready] ▸    │ │
│ │ #2  SEO 자동화 가이드        [Ready] ▸    │ │
│ │ #3  이메일 마케팅 전략       [Pending] ▸  │ │
│ │ ...                                      │ │
│ │ #15 연말 프로모션 준비       [Pending] ▸  │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [발송 일정 탭]                               │
│ ┌──────────────────────────────────────────┐ │
│ │  3/1(토)  #1 AI 마케팅 트렌드   ✅ Sent  │ │
│ │  3/3(월)  #2 SEO 자동화         🔵 예정  │ │
│ │  3/5(수)  #3 이메일 마케팅      🔵 예정  │ │
│ │  ...                                     │ │
│ └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 3.6 Phase 2 산출물

| 산출물 | 파일 |
|--------|------|
| 아이템 생성 엔진 | `src/lib/autoposting/generate-items.ts` |
| 콘텐츠 생성 | `src/lib/autoposting/generate-content.ts` |
| 텍스트 규칙 엔진 | `src/lib/autoposting/text-rules.ts` |
| 이미지 처리 | `src/lib/autoposting/image-processor.ts` |
| 이메일 발송 | `src/lib/autoposting/email-sender.ts` |
| 이메일 템플릿 | `src/lib/autoposting/email-template.ts` |
| 아이템풀 API | `/api/autoposting/generate-pool/route.ts` |
| 아이템 조회 API | `/api/autoposting/pool/route.ts` |
| 발송 API | `/api/autoposting/send/route.ts` |
| 미리보기 API | `/api/autoposting/preview/route.ts` |
| Auto Posting UI | `/kr/workspace/marketing/auto-posting/` (재작성) |

---

## 4. Phase 3: 자동화 — n8n 연동 (Week 5-6)

> **목표:** 사람 개입 없이 월초→일간→월말 자동 실행

### 4.1 n8n 워크플로우 설계

**워크플로우 1: 월초 아이템 생성 (매월 1일 00:00)**
```
[Schedule Trigger: 매월 1일]
  │
  ├── GET /api/autoposting/active-workspaces
  │   → 활성 구독 workspace 목록
  │
  ├── For each workspace:
  │   ├── POST /api/autoposting/generate-pool
  │   │   → 15개 아이템 주제 생성 (OpenAI)
  │   │
  │   ├── POST /api/autoposting/generate-content?pool_id=xxx
  │   │   → 각 아이템 블로그+SNS 생성 (OpenAI)
  │   │
  │   └── POST /api/autoposting/build-schedule?pool_id=xxx
  │       → 2일 1회 posting_slots 생성
  │
  └── POST /api/autoposting/notify-admin
      → Slack/이메일로 생성 결과 알림
```

**워크플로우 2: 일간 슬롯 실행 (매일 09:00)**
```
[Schedule Trigger: 매일 09:00]
  │
  ├── GET /api/autoposting/due-slots?date=today
  │   → 오늘 발송할 슬롯 목록
  │
  ├── For each slot:
  │   ├── GET /api/autoposting/items/{id}
  │   │   → 아이템 콘텐츠 조회
  │   │
  │   ├── POST /api/autoposting/send
  │   │   → 이메일 발송
  │   │
  │   └── UPDATE posting_slots.status = 'sent'
  │
  └── POST /api/autoposting/daily-report
      → 발송 결과 로깅
```

**워크플로우 3: 월말 정산 (매월 말일)**
```
[Schedule Trigger: 매월 말일]
  │
  ├── GET /api/autoposting/monthly-summary
  │   → 발송 성공/실패/미달 계산
  │
  ├── 발송 미달 workspace:
  │   └── POST /api/credits/compensate
  │       → 미달분 크레딧 보상
  │
  └── POST /api/autoposting/archive-pool
      → pool.status = 'archived'
```

### 4.2 n8n 연동 API (신규)

| Endpoint | Method | 역할 |
|----------|--------|------|
| `/api/autoposting/active-workspaces` | GET | 활성 구독 WS 목록 |
| `/api/autoposting/generate-pool` | POST | 아이템풀 생성 |
| `/api/autoposting/generate-content` | POST | 콘텐츠 생성 |
| `/api/autoposting/build-schedule` | POST | 스케줄 빌드 |
| `/api/autoposting/due-slots` | GET | 오늘 발송 슬롯 |
| `/api/autoposting/send` | POST | 이메일 발송 |
| `/api/autoposting/monthly-summary` | GET | 월간 요약 |
| `/api/autoposting/archive-pool` | POST | 풀 아카이브 |
| `/api/credits/monthly-reset` | POST | 크레딧 월간 리셋 |
| `/api/credits/compensate` | POST | 미달 보상 |

**인증:** 모든 n8n API는 `Authorization: Bearer {AUTOMATION_SECRET}` 사용

### 4.3 스케줄 빌드 로직

```typescript
// src/lib/autoposting/schedule-builder.ts
export function buildMonthlySchedule(
  poolId: string,
  items: MonthlyItem[],   // 15개
  startDate: Date,         // 매월 1일
): PostingSlot[] {
  const slots: PostingSlot[] = [];
  let currentDate = startDate;
  
  for (const item of items) {
    slots.push({
      pool_id: poolId,
      item_id: item.id,
      scheduled_at: setTime(currentDate, 9, 0), // 09:00
      channel: 'email',
      status: 'scheduled',
    });
    currentDate = addDays(currentDate, 2); // 2일 간격
  }
  
  return slots; // 15개 × 2일 = 30일 커버
}
```

### 4.4 Phase 3 산출물

| 산출물 | 파일/위치 |
|--------|----------|
| n8n 워크플로우 3개 | n8n 인스턴스 (JSON export) |
| 활성 WS API | `/api/autoposting/active-workspaces/route.ts` |
| 스케줄 빌드 API | `/api/autoposting/build-schedule/route.ts` |
| 오늘 슬롯 API | `/api/autoposting/due-slots/route.ts` |
| 월간 요약 API | `/api/autoposting/monthly-summary/route.ts` |
| 풀 아카이브 API | `/api/autoposting/archive-pool/route.ts` |
| 크레딧 보상 API | `/api/credits/compensate/route.ts` |
| 크레딧 리셋 API | `/api/credits/monthly-reset/route.ts` |
| 스케줄 빌더 | `src/lib/autoposting/schedule-builder.ts` |

---

## 5. Phase 4: 안정화 + 부가 기능 (Week 7-8)

> **목표:** 모니터링, 인사이트 레터, 런칭 준비

### 5.1 인사이트 레터 (주간 트렌드 리포트)

**우선순위:** P1 | **예상:** 3일

```
[매주 월요일 08:00] (n8n)
  │
  ├── Tavily API → 업종별 트렌드 검색
  │   └── workspace_insight_letter_settings.industry + seed_keywords
  │
  ├── OpenAI → 트렌드 요약 생성
  │   ├── Hot Keyword (3~5개)
  │   ├── Money Flow (환율/수요 변화)
  │   └── CTA: "이 주제로 바로 생성"
  │
  └── 이메일 발송 (workspace 멤버 전원)
```

**API:**

| Endpoint | Method | 역할 |
|----------|--------|------|
| `/api/insight-letter/generate` | POST | 트렌드 생성 (n8n) |
| `/api/insight-letter/send` | POST | 발송 (n8n) |
| `/api/insight-letter/history` | GET | 발송 내역 |

### 5.2 Admin 모니터링 대시보드 확장

**현재 있는 것:**
- KPI (구독/쿠폰/크레딧/자동발행)
- 이벤트 로그
- 크레딧 감사

**추가할 것:**

| 메트릭 | 설명 |
|--------|------|
| Auto Posting 발송률 | 이번 달 발송/예정 비율 |
| 이메일 도달률 | sent/delivered/bounced |
| 아이템 생성 성공률 | ready/failed 비율 |
| WS별 발송 현황 | 워크스페이스별 상세 |
| Credit 소진 예측 | 남은 Credit vs 예상 사용량 |

### 5.3 토큰 보상 시스템

```
월말 정산:
  ├── 예정 발송 15회 중 실패분 계산
  ├── 실패 1회 = 50 Credit 보상
  └── credit_ledger에 'compensation' 기록
```

### 5.4 런칭 체크리스트

| 항목 | 상태 |
|------|------|
| Auto Posting end-to-end 테스트 | ☐ |
| 이메일 발송 테스트 (실제 수신 확인) | ☐ |
| 텍스트 규칙 검증 (5개+ 샘플) | ☐ |
| 이미지 워터마크 테스트 | ☐ |
| n8n 월초/일간/월말 워크플로우 테스트 | ☐ |
| Stripe 구독 → 자동 시작 확인 | ☐ |
| 구독 취소 → 자동 중지 확인 | ☐ |
| Credit 월간 리셋 테스트 | ☐ |
| 에러 핸들링 (OpenAI 실패, 이메일 반송) | ☐ |
| Admin 모니터링 대시보드 | ☐ |
| 1인 내부 베타 (1주일 실사용) | ☐ |

---

## 6. 파일 구조 (v2.0 추가분)

```
src/
├── lib/
│   └── autoposting/                    ← 신규 디렉터리
│       ├── generate-items.ts           # 아이템 주제 생성 (OpenAI)
│       ├── generate-content.ts         # 블로그/SNS 콘텐츠 생성
│       ├── text-rules.ts              # 텍스트 규칙 검증
│       ├── image-processor.ts         # 이미지 검색 + 워터마크
│       ├── email-sender.ts            # 이메일 발송 (Resend)
│       ├── email-template.ts          # 이메일 HTML 템플릿
│       ├── schedule-builder.ts        # 2일 1회 스케줄 생성
│       └── types.ts                   # TypeScript 타입
├── app/
│   ├── api/
│   │   ├── autoposting/               ← 신규 디렉터리
│   │   │   ├── active-workspaces/route.ts
│   │   │   ├── generate-pool/route.ts
│   │   │   ├── generate-content/route.ts
│   │   │   ├── build-schedule/route.ts
│   │   │   ├── due-slots/route.ts
│   │   │   ├── send/route.ts
│   │   │   ├── preview/route.ts
│   │   │   ├── pool/route.ts
│   │   │   ├── items/route.ts
│   │   │   ├── monthly-summary/route.ts
│   │   │   ├── archive-pool/route.ts
│   │   │   └── daily-report/route.ts
│   │   ├── insight-letter/             ← 신규 디렉터리
│   │   │   ├── generate/route.ts
│   │   │   ├── send/route.ts
│   │   │   └── history/route.ts
│   │   └── credits/
│   │       ├── monthly-reset/route.ts  ← 신규
│   │       └── compensate/route.ts     ← 신규
│   └── (workspace)/kr/workspace/
│       ├── settings/
│       │   ├── company/page.tsx        ← 신규
│       │   └── personal/page.tsx       ← 신규
│       └── marketing/
│           └── auto-posting/page.tsx   ← 재작성
├── types/
│   └── db-autoposting.ts              ← 신규
└── supabase/
    └── migrations/
        ├── 20260222_autoposting_tables.sql  ← 신규
        └── 20260222_settings_columns.sql    ← 신규
```

---

## 7. 의존성 추가

```json
{
  "resend": "^4.x",           // 이메일 발송
  "sharp": "^0.33.x",         // 이미지 처리 (워터마크)
  "unsplash-js": "^7.x"       // Unsplash API (이미지 검색)
}
```

> `sharp`는 Vercel에서 네이티브 바이너리 이슈가 있을 수 있음 → `@vercel/og` 또는 Cloudinary 대안 검토

---

## 8. 비용 예측

### 월간 운영 비용 (workspace 100개 기준)

| 항목 | 계산 | 월 비용 |
|------|------|--------|
| OpenAI (아이템 생성) | 100 WS × 15 아이템 × ~2K 토큰 | ~$6 |
| OpenAI (콘텐츠 생성) | 100 WS × 15 × 2 (블로그+SNS) × ~4K 토큰 | ~$24 |
| Resend (이메일) | 100 WS × 15 발송 = 1,500/월 | 무료 (3K 이내) |
| Unsplash API | 100 WS × 30 이미지 = 3,000/월 | 무료 (50/hr) |
| Supabase Storage | ~5GB/월 (이미지) | 무료 (1GB) or $25 |
| n8n | 셀프호스팅 or Cloud | $0 ~ $20 |
| **합계** | | **~$55 ~ $75** |

### 손익 기준

```
워크스페이스 1개 월매출: ₩49,000 (Standard)
운영 비용/WS: ~₩750 (100 WS 기준)
마진: ~98%

손익분기: 워크스페이스 2~3개만 있어도 흑자
```

---

## 9. 리스크 & 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| OpenAI API 장애 | 중 | 아이템 생성 중단 | 재시도 큐 + 수동 트리거 |
| 이메일 반송률 높음 | 중 | 사용자 불만 | SPF/DKIM 설정, 반송 모니터링 |
| 워터마크 처리 Vercel 제한 | 중 | 이미지 미생성 | Cloudinary 대안 or Edge Function |
| n8n 다운타임 | 낮 | 발송 지연 | Vercel Cron 폴백 |
| 콘텐츠 품질 불만 | 중 | 해지 증가 | 품질 게이트 강화, 수동 편집 UI |

---

## 10. 성공 지표

### Phase 1 완료 기준
- [ ] 5개 DB 테이블 생성 + RLS 적용
- [ ] 설정 UI에서 전체/개인 설정 저장/조회 가능
- [ ] Credit 플랜별 차등 로직 동작
- [ ] Stripe 해지 예약 (cancel_at_period_end) 정상 동작

### Phase 2 완료 기준
- [ ] 수동으로 아이템풀 생성 → 15개 아이템 주제 생성됨
- [ ] 각 아이템에서 블로그(1200자+) + SNS(150~300자) 생성됨
- [ ] 텍스트 규칙 검증 통과
- [ ] 이메일 발송 → 실제 수신 확인
- [ ] Auto Posting UI에서 아이템/일정/히스토리 확인 가능

### Phase 3 완료 기준
- [ ] n8n 월초 워크플로우 → 자동 아이템풀 생성
- [ ] n8n 일간 워크플로우 → 자동 이메일 발송
- [ ] 2일 1회 발송 스케줄 정상 동작

### Phase 4 완료 기준
- [ ] 인사이트 레터 주간 발송 동작
- [ ] Admin 대시보드에서 발송 현황 확인
- [ ] 1주일 내부 베타 완료 (실제 이메일 수신)
- [ ] 첫 외부 유료 사용자 온보딩

---

> **v2.0 한 줄 요약:**  
> "결제한 순간부터 매월 15개 마케팅 콘텐츠가 자동으로 만들어지고, 2일마다 이메일로 배달된다."

---

> **문서 끝**  
> 최종 업데이트: 2026-02-21
