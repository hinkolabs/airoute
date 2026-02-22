# Routes i18n Translation System

영문 Routes 데이터를 자동으로 한국어로 번역하여 DB에 저장하는 Admin 시스템입니다.

## 개요

- **목적**: 기존 영문 routes 데이터를 OpenAI로 자동 번역하여 KR i18n 데이터 생성
- **번역 대상**:
  - `routes` 테이블: title, description, guide_bullets
  - `route_tools` 테이블: step_title, step_why, step_cta_label, step_prompt_example
- **저장 위치**:
  - `routes_i18n` 테이블 (locale='kr')
  - `route_tools_i18n` 테이블 (locale='kr')

## 사전 준비

### 1. 환경 변수 설정

`.env.local` 또는 Vercel 환경 변수에 추가:

```bash
OPENAI_ENABLED=true
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

### 2. Admin 인증

Admin API는 인증이 필요합니다. 

```typescript
// src/lib/admin-auth.ts
export async function requireAdminOrThrow() {
  // Admin 인증 로직
}
```

## 사용 방법

### Option 1: Admin UI 사용 (권장)

1. 브라우저에서 접속:
   ```
   http://localhost:3000/admin/routes/translate
   ```

2. **단일 루트 번역**:
   - Route slug 입력 (예: `turn-long-videos-into-shorts`)
   - "Translate This Route" 버튼 클릭

3. **전체 루트 번역**:
   - "Translate All Routes" 버튼 클릭
   - 아직 KR 번역이 없는 모든 routes를 자동 번역

### Option 2: API 직접 호출

```bash
# 전체 루트 번역
curl -X POST http://localhost:3000/api/admin/routes/translate-to-kr \
  -H "Content-Type: application/json" \
  -d '{}'

# 단일 루트 번역
curl -X POST http://localhost:3000/api/admin/routes/translate-to-kr \
  -H "Content-Type: application/json" \
  -d '{"routeSlug": "turn-long-videos-into-shorts"}'
```

## API 응답 예시

### 성공

```json
{
  "ok": true,
  "processed": 3,
  "results": [
    {
      "slug": "turn-long-videos-into-shorts",
      "routeTranslated": true,
      "stepsTranslated": 3
    },
    {
      "slug": "polish-shorts-and-reels",
      "routeTranslated": false,  // Already exists
      "stepsTranslated": 2
    }
  ]
}
```

### 에러

```json
{
  "ok": false,
  "error": "OpenAI is disabled. Set OPENAI_ENABLED=true"
}
```

## 번역 로직

### 1. Routes 번역

OpenAI에 전달되는 프롬프트:

```
Translate this route to Korean:

Title: Turn long videos into Shorts
Description: Auto-detect viral moments, add captions, and export Shorts in minutes.
Guide Bullets:
1. Hook viewers in first 3 seconds - use questions, bold claims, or visual surprises
2. Add captions to every Short - 85% watch without sound
3. Test multiple hooks by posting variations and comparing retention

Return JSON:
{
  "title": "긴 영상을 숏폼으로 변환하기",
  "description": "바이럴 순간을 자동 감지하고, 자막을 추가하며, 몇 분 안에 Shorts를 내보냅니다.",
  "guide_bullets": [...]
}
```

### 2. Route Tools (Steps) 번역

각 워크플로우 단계도 개별 번역:

```
Translate this workflow step to Korean:

Step Title: Auto-Detect Viral Moments
Why: AI finds the best clips automatically with virality scores
CTA Label: Try Opus Clip
Prompt Example: Upload long video → AI detects highlights → Review clips → Select best moments

Return JSON:
{
  "step_title": "바이럴 순간 자동 감지",
  "step_why": "AI가 바이럴 점수로 최고의 클립을 자동으로 찾아줍니다",
  "step_cta_label": "Opus Clip 사용해보기",
  "step_prompt_example": "긴 영상 업로드 → AI가 하이라이트 감지 → 클립 검토 → 최고의 순간 선택"
}
```

## 중요 사항

### 1. 중복 방지

- 이미 `routes_i18n`에 locale='kr' 데이터가 있으면 스킵
- 이미 `route_tools_i18n`에 locale='kr' 데이터가 있으면 스킵
- "Already exists" 메시지 표시

### 2. 번역 품질

OpenAI 시스템 프롬프트:

```
- Keep technical terms in English when appropriate (e.g., "AI", "Shorts", "Reels")
- Do NOT translate tool names (e.g., "ChatGPT", "Filmora", "Opus Clip")
- Make it beginner-friendly and clear
- Maintain the same tone and intent as the original
```

### 3. 비용 관리

- Model: `gpt-4o-mini` (저렴하고 빠름)
- Max tokens: 800 (route), 600 (step)
- Temperature: 0.5 (일관성 높임)

## 트러블슈팅

### 1. "OpenAI is disabled" 에러

```bash
# .env.local에 추가
OPENAI_ENABLED=true
```

### 2. "Missing OPENAI_API_KEY" 에러

```bash
# OpenAI API key 발급 후 추가
OPENAI_API_KEY=sk-proj-...
```

### 3. "Unauthorized" 에러

Admin 인증이 필요합니다. `/admin/login` 페이지에서 로그인하세요.

### 4. 번역 결과가 이상한 경우

- DB에서 해당 `routes_i18n` 행 삭제 후 재시도
- OpenAI model을 `gpt-4o`로 변경 (더 정확하지만 비쌈)

```bash
OPENAI_MODEL=gpt-4o
```

## DB 스키마

### routes_i18n

```sql
CREATE TABLE routes_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,  -- 'en' | 'kr'
  title TEXT NOT NULL,
  description TEXT,
  guide_bullets TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_id, locale)
);
```

### route_tools_i18n

```sql
CREATE TABLE route_tools_i18n (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_tool_id UUID NOT NULL REFERENCES route_tools(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,  -- 'en' | 'kr'
  step_title TEXT,
  step_why TEXT,
  step_cta_label TEXT,
  step_prompt_example TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_tool_id, locale)
);
```

## 다음 단계

번역 완료 후:

1. `/kr/routes` 페이지에서 한글 제목 확인
2. `/kr/routes/[slug]` 상세 페이지에서 한글 내용 확인
3. 필요시 DB에서 직접 수정하여 번역 품질 향상
4. 새로운 routes 추가 시 이 시스템으로 즉시 KR 번역 생성

## 파일 구조

```
src/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── routes/
│   │           └── translate-to-kr/
│   │               └── route.ts         # Translation API
│   └── admin/
│       └── routes/
│           └── translate/
│               └── page.tsx             # Admin UI
├── lib/
│   ├── admin-auth.ts                   # Admin authentication
│   └── db/
│       └── routes.ts                   # Routes data fetching with i18n
└── docs/
    └── routes-translation-guide.md     # This file
```
