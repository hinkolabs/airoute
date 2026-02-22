# AIRoute Technical Specification & Implementation Analysis

> **Version:** v1.2  
> **Date:** 2026-02-21  
> **기준 문서:** AIRoute Integrated Master Specification (SSOT v1.1)  
> **목적:** SSOT 대비 실제 코드베이스의 구현 현황을 매핑하고, Gap을 식별하는 기술 문서

---

## 목차

1. [시스템 아키텍처](#1-시스템-아키텍처)
2. [기술 스택](#2-기술-스택)
3. [디렉터리 구조 전체 맵](#3-디렉터리-구조-전체-맵)
4. [테마 & 디자인 시스템](#4-테마--디자인-시스템)
5. [라우팅 & URL 정책](#5-라우팅--url-정책)
6. [미들웨어](#6-미들웨어)
7. [인증 시스템](#7-인증-시스템)
8. [워크스페이스 시스템](#8-워크스페이스-시스템)
9. [권한 모델](#9-권한-모델)
10. [결제 & 구독 시스템](#10-결제--구독-시스템)
11. [크레딧 시스템](#11-크레딧-시스템)
12. [쿠폰 시스템](#12-쿠폰-시스템)
13. [Front (Public) 시스템](#13-front-public-시스템)
14. [Admin 시스템 (전체)](#14-admin-시스템-전체)
15. [AI Creator 시스템](#15-ai-creator-시스템)
16. [가이드 생성 파이프라인](#16-가이드-생성-파이프라인)
17. [Auto Posting 시스템](#17-auto-posting-시스템)
18. [주간 트렌드 리포트 (Insight Letter)](#18-주간-트렌드-리포트-insight-letter)
19. [전체 설정 vs 개인 설정](#19-전체-설정-vs-개인-설정)
20. [Marketing Studio 기능맵](#20-marketing-studio-기능맵)
21. [Productivity & Advisory](#21-productivity--advisory)
22. [데이터베이스 스키마 (전체)](#22-데이터베이스-스키마-전체)
23. [API 엔드포인트 전체 맵](#23-api-엔드포인트-전체-맵)
24. [이벤트 로깅 시스템](#24-이벤트-로깅-시스템)
25. [n8n 워크플로우](#25-n8n-워크플로우)
26. [SEO & 국제화](#26-seo--국제화)
27. [SSOT 대비 Gap 분석](#27-ssot-대비-gap-분석)
28. [다음 작업 우선순위](#28-다음-작업-우선순위)

---

## 1. 시스템 아키텍처

### 1.1 Two-Track 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                           AIROUTE                                │
│                                                                  │
│  ┌────────────────────────┐  ┌────────────────────────────────┐ │
│  │  FRONT (v1 - Public)    │  │  BACK (v2 - Workspace/SaaS)    │ │
│  │                         │  │                                 │ │
│  │  Tools 탐색              │  │  Marketing Studio               │ │
│  │  Routes 큐레이션         │  │   ├ Auto Posting                │ │
│  │  Guides 콘텐츠           │  │   ├ Insight Letter              │ │
│  │  Categories             │  │   ├ Snap                        │ │
│  │  SEO / Affiliate         │  │   ├ Shortform                   │ │
│  │  Guest 즐겨찾기          │  │   └ Manager Settings            │ │
│  │                         │  │  Business Assistant              │ │
│  │  Revenue:               │  │   ├ Meeting / PPT / Docs        │ │
│  │  Affiliate + Ads        │  │   └ Summary                     │ │
│  │                         │  │  AI Advisory                     │ │
│  │                         │  │   ├ Verdict (판정단)              │ │
│  │                         │  │   └ Panel                       │ │
│  │                         │  │  Billing + Credits + Coupons     │ │
│  │                         │  │                                 │ │
│  │                         │  │  Revenue:                       │ │
│  │                         │  │  구독 + Credit Top-up            │ │
│  └────────────────────────┘  └────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ADMIN (System-wide)                                        │  │
│  │  Dashboard + Guides CRUD + Routes CRUD + Tools CRUD         │  │
│  │  AI Creator + Translations + KPI + Events + Coupons         │  │
│  │  Homepage Theme + Demo Mode + Automation                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  INFRA: Next.js 16 + Supabase + Stripe + OpenAI + n8n      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 데이터 플로우

```
[Client]
  ├── SSR ─────→ [Server Components] → [Supabase DB (RLS)]
  ├── API ─────→ [API Routes] → [Supabase / Stripe / OpenAI]
  ├── Auth ────→ [Supabase Auth (Google/Kakao/Email OTP)]
  ├── Events ──→ [sendBeacon] → [/api/events/log] → [event_logs]
  └── Pay ─────→ [Stripe Checkout] → [Webhook] → [DB]

[Admin]
  ├── Guides ──→ [OpenAI] → [quality-check] → [auto-publish]
  ├── AI Creator → [OpenAI] → [Route+Guide+Tool] → [DB]
  └── Translate → [OpenAI] → [*_i18n tables]

[n8n]
  └── Cron/Webhook → [/api/admin/automation/run] → [DB]

[Vercel Cron]
  └── 매일 03:00, 14:00 → [/api/admin/guides/cron] → [generate + auto-publish]
```

---

## 2. 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Framework | Next.js (App Router) | 16.0.10 |
| Runtime | React | 19.2.0 |
| Language | TypeScript | ^5 (Strict) |
| Styling | Tailwind CSS | ^4 |
| Auth | Supabase Auth (`@supabase/ssr`) | ^0.8.0 |
| Database | Supabase (PostgreSQL) | ^2.86.2 |
| Payments | Stripe | ^20.1.0 |
| AI | OpenAI (gpt-4o / gpt-4o-mini) | ^6.15.0 |
| Markdown | react-markdown + remark-gfm | ^10.1.0 |
| Icons | Lucide React | latest |
| Deploy | Vercel | (Cron Jobs 포함) |
| Automation | n8n | 외부 (API 연동) |

### 2.1 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
OPENAI_ENABLED
ADMIN_KEY
AUTOMATION_SECRET
CRON_SECRET
NEXT_PUBLIC_DEMO_MODE
```

---

## 3. 디렉터리 구조 전체 맵

```
src/
├── app/
│   ├── (auth)/signup/                    # 회원가입 (SignupForm)
│   ├── (marketing)/                      # 공개 마케팅 페이지
│   │   ├── layout.tsx                    # Header 포함
│   │   ├── page.tsx                      # EN 홈
│   │   ├── login/, signup/               # EN 인증
│   │   └── kr/                           # KR 마케팅
│   │       ├── page.tsx                  # KR 홈
│   │       ├── _components/              # KR 히어로, Top Picks
│   │       ├── _data/kr-home.ts          # KR 정적 데이터
│   │       ├── (auth)/start|login|signup # KR 인증
│   │       ├── tools/                    # KR 도구
│   │       ├── routes/                   # KR 루트
│   │       └── guides/                   # KR 가이드
│   ├── (workspace)/                      # 워크스페이스 (인증 필요)
│   │   ├── layout.tsx                    # WorkspaceProvider
│   │   ├── workspace/                    # EN (Coming Soon)
│   │   └── kr/
│   │       ├── workspace/                # KR 워크스페이스 (활성)
│   │       │   ├── page.tsx              # 대시보드
│   │       │   ├── layout.tsx            # Sidebar + Header
│   │       │   ├── _components/          # 10개 컴포넌트
│   │       │   ├── billing/              # 결제 (4개 서브페이지)
│   │       │   ├── settings/             # 설정
│   │       │   ├── marketing/            # 마케팅 스튜디오 (11개 서브)
│   │       │   ├── productivity/         # 생산성 도구 (4개)
│   │       │   ├── advisory/             # AI 자문 (2개)
│   │       │   ├── inbox/, messages/     # 메시지
│   │       │   ├── auto-posting/         # 자동 포스팅
│   │       │   └── admin/                # WS 관리자 (3개 서브)
│   │       └── admin/ops/                # 운영 대시보드
│   ├── tools/                            # EN 도구 (공개)
│   ├── routes/                           # EN 루트 (공개)
│   ├── guides/                           # EN 가이드 (공개)
│   ├── categories/                       # 카테고리 (공개)
│   ├── admin/                            # 시스템 관리자
│   │   ├── page.tsx, layout.tsx          # 대시보드 + 레이아웃
│   │   ├── login/                        # 관리자 로그인
│   │   ├── guides/                       # 가이드 CRUD + 번역
│   │   ├── routes/                       # 루트 CRUD + 번역
│   │   ├── tools/                        # 도구 CRUD + 번역
│   │   ├── ai-creator/                   # AI 통합 생성기
│   │   └── routes-migrate/               # DB 마이그레이션 도구
│   ├── auth/                             # 콜백/로그아웃
│   ├── api/                              # API Routes (23절 참조)
│   ├── _components/                      # 공유 컴포넌트
│   ├── _providers/                       # Context Providers (3개)
│   ├── _design/                          # 디자인 시스템
│   └── _data/                            # 정적 데이터
├── components/
│   ├── layout/                           # Header, Footer, MobileBottomNav 등
│   ├── home/                             # 홈페이지 컴포넌트
│   ├── tools/                            # 도구 카드/그리드
│   ├── search/                           # 검색/필터
│   └── ui/                               # Button, Badge, Chip, Tabs
├── lib/
│   ├── supabase/                         # server.ts, browser.ts
│   ├── billing/                          # entitlements.ts, plans.ts
│   ├── workspace/                        # getActiveWorkspace.ts
│   ├── guides/                           # templates, quality-check, normalizer
│   ├── favorites/                        # Guest/User 통합
│   ├── hooks/                            # use-saved-routes
│   ├── db/                               # routes.ts
│   └── *.ts                              # utils, tools, categories 등
└── types/                                # TypeScript 타입 (6개 파일)
```

---

## 4. 테마 & 디자인 시스템

### 4.1 테마 아키텍처

```
ThemeProvider (src/app/_design/providers/theme-provider.tsx)
  ├── 상태: "day" | "night"
  ├── 저장: localStorage ("airoute-theme")
  ├── 기본값: "night"
  └── 적용: document.documentElement.dataset.theme
```

### 4.2 CSS 변수 (globals.css)

| 변수 | Night (기본) | Day |
|------|-------------|-----|
| `--background` | `#020617` | `#f9fafb` |
| `--foreground` | `#f8fafc` | `#111827` |
| `--primary` | `#10b981` (emerald) | `#2563eb` (blue) |
| `--primary-hover` | `#059669` | `#1d4ed8` |
| `--card` | `#1e293b` | `#ffffff` |
| `--border` | `#334155` | `#d1d5db` |
| `--muted-foreground` | `#94a3b8` | `#6b7280` |

### 4.3 Tailwind Config 커스텀 토큰

| 토큰 | 용도 |
|------|------|
| `navy` | Deep Navy 계열 |
| `mint` | Soft Mint 강조 |
| `senior` | Cream Yellow (Simple Mode) |
| `safe` / `safe-lg` / `safe-xl` | 모바일 안전 여백 |

### 4.4 컴포넌트 이원화 현황

| 컴포넌트 | Design System 경로 | Components 경로 | 비고 |
|----------|-------------------|-----------------|------|
| `Button` | `_design/components/ui/button.tsx` | `components/ui/button.tsx` | **중복** |
| `Chip` | `_design/components/ui/chip.tsx` | `components/ui/Chip.tsx` | **중복** |
| `PageShell` | `_design/components/ui/page-shell.tsx` | `components/layout/PageShell.tsx` | **중복** |
| `Badge` | - | `components/ui/Badge.tsx` | 단일 |
| `Tabs` | - | `components/ui/tabs.tsx` | 단일 |

### 4.5 다크모드 지원 현황

| 컴포넌트 | 다크모드 지원 | 비고 |
|----------|-------------|------|
| Header, Footer, MobileBottomNav | ✅ CSS 변수 | 완전 |
| HomePage, Hero, NormalModePage | ✅ CSS 변수 | 완전 |
| MyToolboxSection | ✅ CSS 변수 | 완전 |
| KR Hero, KR Top Picks | ✅ CSS 변수 | 완전 |
| BestForYouSection | ❌ 하드코딩 라이트 | `text-[#111827]` |
| BenefitServicesSection | ❌ 하드코딩 라이트 | `bg-white` |
| PopularToolsSection | ❌ 하드코딩 라이트 | `bg-white` |
| SimpleModeCtaSection | ❌ 하드코딩 라이트 | `bg-white` |
| AiStudioSection | ❌ 하드코딩 라이트 | `bg-white` |
| KRWorkspacePlaceholder | ❌ 하드코딩 라이트 | `bg-slate-50/60` |
| AppShell | ❌ 다크 전용 | `bg-slate-950` |

### 4.6 Homepage Theme 시스템

```
Admin Settings → app_settings 테이블
  ├── "default"    → NormalModePage
  ├── "v2"         → V2 레이아웃
  └── "v2-simple"  → Simple 레이아웃

API: GET/POST /api/admin/settings/homepage-theme
```

### 4.7 Demo Mode 시스템

```
app_settings.demo_mode (DB) → NEXT_PUBLIC_DEMO_MODE (env fallback)
  ├── true  → 인증 페이지 notFound(), 일부 기능 차단
  └── false → 정상 운영

API: GET/POST /api/admin/settings/demo-mode
```

---

## 5. 라우팅 & URL 정책

### 5.1 Route Groups

| 그룹 | 역할 | 인증 |
|------|------|------|
| `(marketing)` | 홈, 로그인, Tools/Routes/Guides | 불필요 |
| `(workspace)` | Workspace 전체 | 필요 |
| `(auth)` | 회원가입 | 불필요 |

### 5.2 URL 맵 (전체)

**EN Public:**
```
/                          홈페이지
/tools                     도구 목록
/tools/[slug]              도구 상세
/tools/best/[category]     카테고리별 Best
/tools/trending            트렌딩
/routes                    루트 목록
/routes/[slug]             루트 상세
/guides                    가이드 목록
/guides/[slug]             가이드 상세
/categories/[slug]         카테고리 상세
/my                        마이 페이지
/studio                    Studio (Coming Soon)
/login, /signup            인증
/privacy, /terms           법적
```

**KR Public:**
```
/kr                        KR 홈
/kr/tools, /kr/tools/[slug], /kr/tools/best/[category]
/kr/routes, /kr/routes/[slug]
/kr/guides, /kr/guides/[slug]
/kr/start, /kr/login, /kr/signup
```

**KR Workspace:**
```
/kr/workspace                     대시보드
/kr/workspace/billing             결제 관리
/kr/workspace/billing/success     결제 성공
/kr/workspace/billing/cancel      결제 취소
/kr/workspace/billing/history     결제 내역
/kr/workspace/settings            설정 (Placeholder)
/kr/workspace/marketing           마케팅 스튜디오
/kr/workspace/marketing/auto-posting
/kr/workspace/marketing/insight-letter
/kr/workspace/marketing/snap
/kr/workspace/marketing/shortform
/kr/workspace/marketing/manager-settings
/kr/workspace/marketing/cs-support
/kr/workspace/marketing/history
/kr/workspace/marketing/landing
/kr/workspace/productivity/meeting
/kr/workspace/productivity/ppt
/kr/workspace/productivity/docs
/kr/workspace/productivity/summary
/kr/workspace/advisory/verdict
/kr/workspace/advisory/panel
/kr/workspace/inbox
/kr/workspace/messages
/kr/workspace/admin/dashboard
/kr/workspace/admin/credits
/kr/workspace/admin/events
```

**Admin:**
```
/admin                    대시보드 (탭: Dashboard/Routes/Tools/Guides/Tests)
/admin/login              관리자 로그인
/admin/guides             가이드 관리
/admin/guides/[id]        가이드 편집
/admin/guides/translate   가이드 번역
/admin/routes             루트 관리
/admin/routes/[id]        루트 편집
/admin/routes/translate   루트 번역
/admin/tools              도구 관리
/admin/tools/[id]         도구 편집
/admin/ai-creator         AI Creator
/admin/routes-migrate     DB 마이그레이션 도구
```

---

## 6. 미들웨어

### `src/middleware.ts`

```
요청 →
  ├── "/" 접근 시: Geo(KR) → /kr 리다이렉트 (쿠키 오버라이드 가능)
  ├── 모든 요청: Supabase 세션 리프레시 (@supabase/ssr)
  └── /workspace 접근: 개발 모드 로깅
```

- `airoute-locale` 쿠키로 Geo 리다이렉트 오버라이드
- Supabase 세션은 `updateSession()` 함수에서 쿠키 기반 갱신

---

## 7. 인증 시스템

### 7.1 인증 방법

| 방법 | 상태 | 파일 |
|------|------|------|
| Google OAuth | ✅ 완료 | `auth-provider.tsx` |
| Email OTP (Magic Link) | ✅ 완료 | `SignupForm.tsx` |
| 카카오 OAuth | ⚠️ 코드 존재, KR에서만 표시 | `SignupForm.tsx` |

### 7.2 인증 플로우

```
[로그인/회원가입] → [Supabase Auth]
  ├── Google → OAuth redirect → /auth/callback → 세션 설정 → 리다이렉트
  ├── Kakao → OAuth redirect → /auth/callback → 세션 설정 → 리다이렉트
  └── Email → OTP 전송 → Magic Link → /auth/callback → 세션 설정

[로그아웃]
  └── auth-provider → supabase.auth.signOut() → 쿠키 정리 → 로그아웃 마커 설정
```

### 7.3 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/_providers/auth-provider.tsx` | 전역 인증 상태, Google OAuth, 이벤트 로깅 |
| `src/app/_providers/use-auth-optional.ts` | AuthProvider 없을 때 안전한 기본값 |
| `src/middleware.ts` | 세션 리프레시 |
| `src/lib/supabase/server.ts` | 서버 Supabase 클라이언트 |
| `src/lib/supabase/browser.ts` | 브라우저 Supabase 싱글톤 |
| `src/lib/admin-auth.ts` | Admin 인증 (쿠키 + system_admins) |
| `src/app/auth/callback/page.tsx` | OAuth 콜백 (오픈 리다이렉트 방지) |
| `src/app/auth/signout/route.ts` | 서버 로그아웃 API |

### 7.4 Admin 인증 (이중 체계)

```
1. Legacy: airoute_admin 쿠키 = ADMIN_KEY 환경변수
2. Modern: Supabase Auth + system_admins 테이블 조회
```

---

## 8. 워크스페이스 시스템

### 8.1 워크스페이스 타입

| DB `type` | UI 표기 | 생성 방식 |
|-----------|---------|----------|
| `personal` | 개인 | 회원가입 시 자동 (`ensurePersonalWorkspace`) |
| `company` | 팀 | Stripe 결제 완료 후 Webhook에서 생성 |

### 8.2 생성 플로우

**Personal:**
```
회원가입 → getActiveWorkspace() → ensurePersonalWorkspace()
  → INSERT workspaces (type=personal) + workspace_members (role=owner)
```

**Team:**
```
"워크스페이스 추가" → create-workspace-modal.tsx
  → 플랜/이름 입력 → /api/billing/team/checkout
  → Stripe Checkout (metadata: kind=team, workspace_name)
  → checkout.session.completed Webhook
  → INSERT workspaces (type=company) + workspace_members + workspace_subscriptions
  → /kr/workspace?team_created=1
```

### 8.3 워크스페이스 선택 우선순위

```
1. ?ws= 쿼리 파라미터
2. localStorage (airoute_active_ws_id)
3. 단일 personal workspace
4. 첫 번째 멤버십
```

### 8.4 대시보드 구조

```
┌───────────────────────────────────────────────────┐
│ Workspace Header (WS 선택 | 크레딧 잔액 | 프로필) │
├──────────┬────────────────────────────────────────┤
│          │  Status Cards (플랜/토큰/멤버)          │
│ Sidebar  │  Quick Actions (기능 바로가기)          │
│  ├ Marketing │  캠페인 요약                        │
│  ├ Business  │  최근 결과 (Recent Results)         │
│  ├ Advisory  │                                     │
│  ├ Inbox     │                                     │
│  └ Settings  │                                     │
└──────────┴────────────────────────────────────────┘
```

### 8.5 사이드바 메뉴 구조 (전체)

```
Marketing Studio
  ├── 자동 포스팅 (/marketing/auto-posting)
  ├── 인사이트 레터 (/marketing/insight-letter)
  ├── 매니저 설정 (/marketing/manager-settings)
  ├── 히스토리 (/marketing/history)
  ├── Snap (/marketing/snap)
  ├── 숏폼 (/marketing/shortform)
  └── CS 지원 (/marketing/cs-support)

Business Assistant
  ├── 회의록 요약 (/productivity/meeting)
  ├── PPT 생성 (/productivity/ppt)
  ├── 문서 요약 (/productivity/docs)
  └── 통합 요약 (/productivity/summary)

AI Advisory
  ├── 판정단 (/advisory/verdict)
  └── 패널 (/advisory/panel)

Inbox (/inbox)
Messages (/messages)

Settings
  ├── 설정 (/settings)
  ├── 인사이트 레터 설정 (/settings/insight-letter)
  └── 결제 (/billing)

[System Admin 전용]
  ├── 운영 대시보드 (/admin/dashboard)
  ├── 크레딧 감사 (/admin/credits)
  └── 이벤트 로그 (/admin/events)
```

### 8.6 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/_providers/workspace-provider.tsx` | WorkspaceContext (전역 상태, 전환, 구독/권한) |
| `src/lib/workspace/getActiveWorkspace.ts` | WS 조회/자동생성 (캐시 30초) |
| `src/app/(workspace)/kr/workspace/_components/workspace-sidebar.tsx` | 사이드바 (동적 메뉴, 권한 기반 잠금) |
| `src/app/(workspace)/kr/workspace/_components/workspace-header.tsx` | 헤더 (WS 선택, 크레딧, 프로필) |
| `src/app/(workspace)/kr/workspace/_components/create-workspace-modal.tsx` | 팀 WS 생성 모달 |
| `src/app/(workspace)/kr/workspace/_components/credit-topup-modal.tsx` | 크레딧 충전 모달 |
| `src/app/(workspace)/kr/workspace/_components/status-cards.tsx` | KPI 카드 (플랜/토큰/멤버) |
| `src/app/(workspace)/kr/workspace/_components/quick-actions.tsx` | 빠른 작업 (잠금 처리) |
| `src/app/(workspace)/kr/workspace/_components/recent-results.tsx` | 최근 결과 리스트 |
| `src/app/(workspace)/kr/workspace/_components/personal-pricing.tsx` | 개인 플랜 표시 |
| `src/app/(workspace)/kr/workspace/_components/placeholder-client.tsx` | Coming Soon / Lock 화면 |

---

## 9. 권한 모델

### 9.1 역할

| 역할 | DB | 권한 |
|------|-----|------|
| owner | `workspace_members.role` | 전체 설정/결제/아이템 |
| admin | `workspace_members.role` | 결제 관리 가능 |
| member | `workspace_members.role` | 읽기 + 개인 설정 |
| system_admin | `system_admins` 테이블 | 시스템 전체 관리 |

### 9.2 Entitlement 시스템

```typescript
// src/lib/billing/entitlements.ts
{
  can_use_workspace: boolean;      // 항상 true (인증 기반)
  can_use_paid_features: boolean;  // 활성 구독 필요
  can_create_workspace: boolean;   // Pro+ 필요
  can_manage_billing: boolean;     // owner/admin만
  is_paid_for_lock: boolean;       // company=true, personal=구독필요
}
```

### 9.3 UI 권한 표현

- 메뉴 잠금 안 함 (SSOT §12 준수)
- 페이지 내부에서 상태 분기
- 버튼 활성/비활성으로 표현
- Paid feature → `placeholder-client.tsx` (Lock 화면)

---

## 10. 결제 & 구독 시스템

### 10.1 플랜 정의

**Personal Plans (src/lib/billing/plans.ts):**

| Plan Key | 이름 | 월 가격 | 연 가격 |
|----------|------|--------|--------|
| `starter` | Standard | ₩49,000 | ₩490,000 |
| `pro` | Premium | ₩99,000 | ₩990,000 |

**Team Plans (Stripe Checkout):**

| Plan Key | 이름 | 월 가격 | 연 가격 |
|----------|------|--------|--------|
| `team_standard` | Standard | ₩149,000 | ₩1,490,000 |
| `team_premium` | Premium | ₩299,000 | ₩2,990,000 |

### 10.2 결제 플로우

```
[Billing Page] (/kr/workspace/billing)
  │
  ├── Personal: /api/stripe/checkout
  │   → Stripe Checkout Session
  │   → success: /kr/workspace/billing/success
  │   → cancel: /kr/workspace/billing/cancel
  │
  └── Team: /api/billing/team/checkout
      → Stripe Checkout Session (metadata: kind=team)
      → success: /kr/workspace/billing/success
      → cancel: /kr/workspace/billing/cancel

[Stripe Webhook] (/api/stripe/webhook)
  ├── checkout.session.completed
  │   ├── Personal: workspace_subscriptions UPSERT
  │   └── Team: workspace INSERT + subscription INSERT
  ├── customer.subscription.updated → status UPDATE
  └── customer.subscription.deleted → 취소 처리
```

### 10.3 구독 취소

```
/api/subscription/cancel (POST)
  → Owner/Admin만 가능
  → current_period_end = NOW (즉시 취소)
  ⚠️ Stripe API 직접 취소 미연동 (DB만 업데이트)
```

### 10.4 결제 UI 파일

| 파일 | 역할 | 상태 |
|------|------|------|
| `billing/page.tsx` | 서버: 인증/권한 → 클라이언트 전달 | ✅ 완료 |
| `billing/billing-client.tsx` | 플랜 선택, 취소 모달, 크레딧 탭 | ✅ 완료 |
| `billing/success/page.tsx` | 결제 완료 → 구독 폴링 → 리다이렉트 | ✅ 완료 |
| `billing/cancel/page.tsx` | 결제 취소 안내 | ✅ 완료 |
| `billing/history/page.tsx` | 크레딧/쿠폰 내역 | ✅ 완료 |
| `_components/billing/pricing-table-kr.tsx` | 가격표 (Toss/Stripe 선택) | ✅ 완료 |
| `/api/billing/toss/checkout` | 토스 결제 | ⚠️ 501 (미구현) |

---

## 11. 크레딧 시스템

### 11.1 API

| Endpoint | Method | 역할 | 상태 |
|----------|--------|------|------|
| `/api/credits/balance` | GET | 잔액 조회 (없으면 0 생성) | ✅ |
| `/api/credits/topup` | POST | 충전 (200/500/1000/5000P) | ✅ (테스트 모드) |
| `/api/credits/consume` | POST | 소비 (원자적, 잔액 부족 시 402) | ✅ |
| `/api/credits/history` | GET | 내역 (scope=me/admin, cursor 페이지네이션) | ✅ |

### 11.2 DB 테이블

- `workspace_credits`: 잔액 (workspace_id, balance)
- `credit_ledger`: 트랜잭션 로그 (workspace_id, user_id, action, amount, feature_key)

### 11.3 UI

- 헤더: 잔액 표시 (`workspace-header.tsx`)
- 충전 모달: `credit-topup-modal.tsx` (패키지 선택 + 쿠폰 입력)
- 내역: `billing/history/` (필터, CSV 다운로드)

---

## 12. 쿠폰 시스템

### 12.1 쿠폰 타입

| Kind | 효과 | 필드 |
|------|------|------|
| `credits` | 크레딧 충전 | `credits_amount` |
| `subscription` | 구독 연장 | `plan_key`, `months` |

### 12.2 API

| Endpoint | Method | 역할 | 상태 |
|----------|--------|------|------|
| `/api/admin/coupons/create` | POST | 쿠폰 생성 (Admin) | ✅ |
| `/api/coupons/redeem` | POST | 쿠폰 사용 (중복 방지) | ✅ |
| `/api/coupons/redemptions` | GET | 사용 내역 | ✅ |

---

## 13. Front (Public) 시스템

### 13.1 Tools

| 기능 | 파일 | 상태 |
|------|------|------|
| 목록 (DB + fallback) | `tools/page.tsx` | ✅ |
| 상세 (Rich Content, 프롬프트) | `tools/[slug]/page.tsx` + `tool-detail-content.tsx` | ✅ |
| 카테고리 Best 3 | `tools/best/[category]/page.tsx` | ✅ |
| 트렌딩 | `tools/trending/page.tsx` (하드코딩 슬러그) | ✅ |
| 즐겨찾기 | `lib/favorites/index.ts` | ✅ |
| i18n (EN/KR) | `tools_i18n` JOIN | ✅ |
| Affiliate 링크 | `AffiliateLinkButton.tsx` | ✅ |

### 13.2 Routes

| 기능 | 파일 | 상태 |
|------|------|------|
| 목록 (검색, 즐겨찾기) | `routes/page.tsx` (클라이언트) | ✅ |
| 상세 (Best3 도구, 단계, 관련 가이드) | `routes/[slug]/page.tsx` | ✅ |
| i18n (EN/KR) | `routes_i18n`, `route_tools_i18n` JOIN | ✅ |

### 13.3 Guides

| 기능 | 파일 | 상태 |
|------|------|------|
| 목록 (검색, 필터, 페이지네이션) | `guides/page.tsx` + `guides-list-client.tsx` | ✅ |
| 상세 (Markdown, CTA) | `guides/[slug]/page.tsx` | ✅ |
| Route 필터 | `?route=slug` | ✅ |
| i18n (EN/KR) | `lang` 컬럼 | ✅ |

### 13.4 즐겨찾기

```
Guest: localStorage → Tools 3개 / Routes 1개 제한
User:  Supabase DB → Tools 무제한 / Routes 3개 제한
전환:  mergeGuestFavorites() → localStorage → DB 마이그레이션
```

---

## 14. Admin 시스템 (전체)

### 14.1 Admin 대시보드

**파일:** `src/app/admin/admin-page-client.tsx`

**5개 탭:**

| 탭 | 내용 |
|----|------|
| Dashboard | 콘텐츠 통계 카드 (Routes/Tools/Guides 수 + KR 번역율) |
| Routes | 루트 관리 바로가기 |
| Tools | 도구 관리 바로가기 |
| Guides | 가이드 관리 바로가기 |
| Tests | 테스트 도구 |

**전역 설정:**
- Homepage Theme 선택 (default / v2 / v2-simple)
- Demo Mode 토글

**API 호출:**
- `GET /api/admin/dashboard-summary`
- `GET/POST /api/admin/settings/homepage-theme`
- `GET/POST /api/admin/settings/demo-mode`

### 14.2 Admin 인증

```
Admin Layout (src/app/admin/layout.tsx)
  ├── Check 1: airoute_admin 쿠키 → 통과
  └── Check 2: Supabase Auth → system_admins 테이블 조회 → 통과/리다이렉트
```

### 14.3 가이드 관리

**목록** (`/admin/guides`):
- 상태 탭: 전체/draft/review/approved/rejected
- 언어 필터: EN/KR
- 일일 할당량 표시
- 생성: 신규(수동) / AI(무료 템플릿) / OpenAI(유료)
- 삭제 지원

**편집** (`/admin/guides/[id]`):
- 모든 필드 편집 (slug, title, excerpt, content, lang, taxonomy, CTA 등)
- 워크플로우: Save / Approve / Reject / Urgent Publish / Delete

**번역** (`/admin/guides/translate`):
- EN→KR OpenAI 번역
- 단일/배치(최대 10개) 처리
- 강제 재번역 옵션

### 14.4 루트 관리

**목록** (`/admin/routes`):
- 검색/상태 필터
- KR 번역 상태 배지
- 빠른 생성 폼 (제목, slug, 아이콘, 설명)
- 편집/삭제 지원

**편집** (`/admin/routes/[id]`):
- 기본 정보: 제목, slug, 설명, 아이콘, 태그, guide_bullets, manual_order, 상태, featured
- 워크플로우 단계(route_tools): 추가/편집/재정렬/삭제
- 도구 선택 드롭다운 (전체 도구 목록)
- FK 제약 이슈 시 수정 SQL 자동 제공
- 소프트 삭제 (hidden) / 하드 삭제 (cascade)

**번역** (`/admin/routes/translate`):
- EN→KR 루트 + 워크플로우 단계 번역
- 단일/전체 처리

### 14.5 도구 관리

**목록** (`/admin/tools`):
- Step 1: `tools_i18n` DB 마이그레이션 상태 확인
- Step 2: KR 번역 (단일/배치)
- 빠른 생성 폼
- 검색/KR 상태 배지

**편집** (`/admin/tools/[id]`):
- 기본 정보: 이름, slug, 설명, URL, 배지, 활성 상태
- KR i18n 데이터 표시

### 14.6 Workspace Admin (KR)

| 페이지 | 파일 | 역할 | 상태 |
|--------|------|------|------|
| 운영 대시보드 | `/kr/workspace/admin/dashboard` | KPI 카드 (구독/쿠폰/크레딧/자동발행) | ✅ |
| 크레딧 감사 | `/kr/workspace/admin/credits` | 필터/테이블/CSV 다운로드 | ✅ |
| 이벤트 로그 | `/kr/workspace/admin/events` | 필터/테이블/메타데이터 모달 | ✅ |
| 운영 KPI | `/kr/admin/ops` | 월별 KPI (중복 파일) | ✅ |

---

## 15. AI Creator 시스템

### 15.1 개요

통합 AI 콘텐츠 생성 도구. 하나의 프롬프트로 Route + Guide + Tool을 한 번에 생성.

### 15.2 생성 플로우

```
[Input Phase]
  ├── 프롬프트 입력
  ├── 모드 선택: route (다중 도구) / tool (단일 도구)
  ├── 언어: en / kr / both
  └── 난이도: beginner / intermediate / advanced

[Analyzing Phase]
  └── POST /api/admin/ai-creator/analyze
      → OpenAI (gpt-4o) → 기존 DB 도구 매칭 → Preview JSON

[Preview Phase]
  ├── Route 정보 + 단계별 도구 (편집 가능)
  ├── Guide EN/KR 콘텐츠 (편집 가능)
  ├── Tool 정보 (새 도구 시)
  ├── 품질 점수 바
  └── 부분 재생성: POST /api/admin/ai-creator/regenerate

[Saving Phase]
  └── POST /api/admin/ai-creator/confirm
      → 새 도구 생성 → 루트 + 단계 INSERT → 가이드 INSERT → 품질 점수 계산

[Done Phase]
  └── 생성된 콘텐츠 링크 표시
```

### 15.3 API

| Endpoint | Method | 역할 |
|----------|--------|------|
| `/api/admin/ai-creator/analyze` | POST | AI 분석 (Preview 생성) |
| `/api/admin/ai-creator/confirm` | POST | Preview → DB 저장 |
| `/api/admin/ai-creator/regenerate` | POST | 부분 재생성 (guide_en, route_kr 등) |
| `/api/admin/ai-creator/suggest-topics` | POST | 트렌딩 주제 제안 (캐시) |
| `/api/admin/ai-creator/usage` | GET | OpenAI 사용 통계 (토큰/비용) |

### 15.4 사용량 추적

- `admin_openai_usage_logs` 테이블에 모든 호출 기록
- Usage API: 오늘/이번 달 토큰, 호출 수, USD 비용 예상

---

## 16. 가이드 생성 파이프라인

### 16.1 3가지 생성 방식

| 방식 | 비용 | 트리거 | API |
|------|------|--------|-----|
| 무료 템플릿 | 무료 | 수동 / Cron | `/api/admin/guides/generate` |
| OpenAI | 유료 | 수동 | `/api/admin/guides/generate-openai` |
| AI Creator | 유료 | 수동 | `/api/admin/ai-creator/analyze+confirm` |

### 16.2 무료 템플릿 레시피

```
레시피 타입:
  ├── route-based: Route의 단계를 기반으로 가이드 생성
  ├── tool-based: 특정 Tool의 기능을 설명하는 가이드
  └── theme: 테마별 가이드 (트렌드, 팁 등)

언어별 빌더:
  ├── buildFreeGuideEn() (src/lib/guides/free-templates/en.ts)
  └── buildFreeGuideKr() (src/lib/guides/free-templates/kr.ts)

중복 방지: 동일 recipe_key + variant 조합 최근 생성 확인
일일 제한: 2개/일 (KST)
```

### 16.3 품질 게이트

```typescript
// src/lib/guides/quality-check.ts
computeQualityScore(guide): 0~100

채점 기준:
  ├── 제목 길이/품질
  ├── 본문 길이 (최소 300자)
  ├── 마크다운 구조 (H2/H3)
  ├── CTA 설정
  └── 메타데이터 완성도

auto_publish_eligible: score >= 80
```

### 16.4 자동 발행 (Cron)

```
Vercel Cron (매일 03:00, 14:00)
  → /api/admin/guides/cron
  → 무료 템플릿으로 가이드 생성 (status: review)
  → 점수 80+ → auto_publish_eligible
  → 하루 최대 2개 자동 발행 (EN/KR 별도)
```

### 16.5 n8n 자동화

```
POST /api/admin/automation/run
  ├── Auth: Bearer AUTOMATION_SECRET
  ├── Body: { run_type, recipe_key, lang, input: { route_slug } }
  ├── dry_run 모드 지원
  └── 생성: status=review, published_source=n8n
```

---

## 17. Auto Posting 시스템

### 17.1 현재 구현 상태

| 항목 | 상태 | 위치 |
|------|------|------|
| UI 뼈대 (자동 포스팅 페이지) | ⚠️ Mock 데이터 | `/marketing/auto-posting/page.tsx` |
| Marketing 메인 (즉시발송/히스토리/설정) | ⚠️ Mock 데이터 | `/marketing/page.tsx` |
| 테스트 실행 API | ✅ 엔드포인트 존재 | `/api/workspace/autoposting/test-run` |
| 이벤트 로거 | ✅ 존재 | `lib/event-logger-autoposting.ts` |
| 월간 아이템풀 DB | ❌ 미구현 | 테이블 없음 |
| 발송 스케줄 DB | ❌ 미구현 | 테이블 없음 |
| 이메일 발송 로직 | ❌ 미구현 | - |
| 텍스트 규칙 엔진 | ❌ 미구현 | - |
| 이미지 워터마크 | ❌ 미구현 | - |

### 17.2 SSOT 기준 필요 DB 테이블 (미구현)

```
marketing_briefs       → 회사 롤 (정체성 데이터)
monthly_item_pools     → 월간 아이템풀 메타 (workspace, 기준일, 15개)
monthly_items          → 개별 아이템 (주제/타겟/관점/CTA/키워드/이미지 키워드)
posting_slots          → 발송 일정 슬롯 (2일 1회)
posting_runs           → 실제 발송 실행 기록
```

---

## 18. 주간 트렌드 리포트 (Insight Letter)

### 18.1 현재 구현 상태

| 항목 | 상태 |
|------|------|
| 설정 DB 테이블 | ✅ `workspace_insight_letter_settings` |
| 설정 API | ✅ `/api/workspaces/[id]/insight-letter-settings` |
| 설정 UI | ⚠️ 리다이렉트 → `/marketing/insights?tab=settings` |
| 인사이트 레터 개요 UI | ⚠️ 부분 |
| Tavily 연동 | ❌ 미구현 |
| 주간 발송 로직 | ❌ 미구현 |
| "이 주제로 바로 생성" CTA | ❌ 미구현 |

### 18.2 설정 테이블 구조

```sql
workspace_insight_letter_settings
  ├── workspace_id (UNIQUE FK)
  ├── industry, audience, region
  ├── offerings (TEXT[])
  ├── price_tier
  ├── primary_channels (TEXT[])
  ├── role, quarterly_goal, weekly_kpi
  ├── forbidden_claims (TEXT[])
  ├── seed_keywords (TEXT[])
  └── competitor_urls (TEXT[])
```

---

## 19. 전체 설정 vs 개인 설정

### 19.1 전체 설정 (회사 롤) — owner만 수정

| 항목 | DB 테이블 | DB 컬럼 | 상태 |
|------|-----------|---------|------|
| 브랜드명 | `workspace_manager_settings` | `brand_name` | ✅ |
| 로고 | `workspace_manager_settings` | `logo_url` | ✅ |
| 회사 프로필 | `workspace_manager_settings` | `company_profile` | ✅ |
| 첨부파일 | `workspace_manager_settings` | `attachments` (JSONB) | ✅ |
| 금지어 | `workspace_insight_letter_settings` | `forbidden_claims` | ✅ |
| 기본 톤 | — | — | ❌ 미구현 |

### 19.2 개인 설정 — 모든 유저

| 항목 | DB 테이블 | DB 컬럼 | 상태 |
|------|-----------|---------|------|
| 톤 프리셋 | `user_marketing_settings` | `tone_preset` | ✅ |
| 톤 예시 | `user_marketing_settings` | `tone_example` | ✅ |
| 개인 키워드 | `user_marketing_settings` | `personal_keywords` | ✅ |
| 제외 키워드 | `user_marketing_settings` | `exclude_keywords` | ✅ |
| 개인 노트 | `user_marketing_settings` | `personal_notes` | ✅ |
| 톤 프로필 JSON | `user_marketing_settings` | `tone_profile_json` | ✅ |
| 이미지 서명 문구 | — | — | ❌ 미구현 |

### 19.3 API

| Endpoint | Method | 역할 | 상태 |
|----------|--------|------|------|
| `/api/workspace/manager-settings` | GET/POST | 전체 설정 | ✅ |
| `/api/workspace/user-marketing-settings` | GET/POST | 개인 설정 | ✅ |
| `/api/workspace/tone-profile` | GET/POST | 톤 프로필 | ✅ |

---

## 20. Marketing Studio 기능맵

| 메뉴 | 경로 | 구현 상태 |
|------|------|----------|
| 자동 포스팅 | `/marketing/auto-posting` | ⚠️ Mock UI |
| 인사이트 레터 | `/marketing/insight-letter` | ⚠️ 부분 UI |
| 매니저 설정 | `/marketing/manager-settings` | ⚠️ 확인 필요 |
| 히스토리 | `/marketing/history` | ⚠️ 확인 필요 |
| Snap | `/marketing/snap` | ⚠️ 파일 존재 |
| 숏폼 | `/marketing/shortform` | ⚠️ 파일 존재 |
| CS 지원 | `/marketing/cs-support` | ⚠️ 파일 존재 |
| 랜딩 | `/marketing/landing` | ⚠️ 파일 존재 |
| Shorts | `/marketing/shorts` | ⚠️ 파일 존재 |

---

## 21. Productivity & Advisory

| 메뉴 | 경로 | 구현 상태 |
|------|------|----------|
| 회의록 요약 | `/productivity/meeting` | ⚠️ 클라이언트 존재 |
| PPT 생성 | `/productivity/ppt` | ⚠️ 클라이언트 존재 |
| 문서 요약 | `/productivity/docs` | ⚠️ 클라이언트 존재 |
| 통합 요약 | `/productivity/summary` | ⚠️ 파일 존재 |
| 판정단 | `/advisory/verdict` | ⚠️ 파일 존재 |
| 패널 | `/advisory/panel` | ⚠️ 파일 존재 |
| 인박스 | `/inbox` | ⚠️ 파일 존재 |
| 메시지 | `/messages` | ⚠️ 파일 존재 |

---

## 22. 데이터베이스 스키마 (전체)

### 22.1 Content 테이블

| 테이블 | 주요 컬럼 | 상태 |
|--------|----------|------|
| `tools` | id, name, slug, affiliate_url, desc_en, desc_ko, task_category, badge, is_active | ✅ |
| `tools_i18n` | tool_id, locale, name, description, task_category, best_for, why_pick, detail_content | ✅ |
| `routes` | id, slug, title, description, icon, featured, tags, guide_bullets, manual_order, status | ✅ |
| `route_tools` | route_id, tool_id, position, is_best3, step_title, step_why, step_cta_label, step_prompt_example | ✅ |
| `routes_i18n` | route_id, locale, title, description, guide_bullets, translation_status | ✅ |
| `route_tools_i18n` | route_tool_id, locale, step_title, step_why, step_cta_label, step_prompt_example | ✅ |
| `guides` | slug, title, excerpt, content, status, lang, taxonomy, guide_type, primary_intent, cta_*, quality_score, auto_publish_eligible | ✅ |
| `guides_public` | VIEW: approved만 | ✅ |

### 22.2 Workspace 테이블

| 테이블 | 주요 컬럼 | 상태 |
|--------|----------|------|
| `workspaces` | id, name, type(personal/company) | ✅ |
| `workspace_members` | workspace_id, user_id, role, display_name | ✅ |
| `workspace_subscriptions` | workspace_id, plan_key, billing_cycle, status, stripe_subscription_id, current_period_end | ✅ |
| `workspace_manager_settings` | workspace_id, brand_name, logo_url, company_profile, attachments | ✅ |
| `workspace_insight_letter_settings` | workspace_id, industry, audience, seed_keywords, forbidden_claims... | ✅ |
| `user_marketing_settings` | workspace_id, user_id, tone_preset, tone_profile_json, personal_keywords... | ✅ |

### 22.3 Billing 테이블

| 테이블 | 주요 컬럼 | 상태 |
|--------|----------|------|
| `plans` | plan_key, name_kr, name_en, stripe_price_id_monthly/yearly | ✅ |
| `workspace_credits` | workspace_id, balance | ✅ |
| `credit_ledger` | workspace_id, user_id, action, amount, feature_key | ✅ |
| `coupons` | code, kind, credits_amount, plan_key, months, max_redemptions, expires_at | ✅ |
| `coupon_redemptions` | coupon_id, workspace_id, redeemed_by | ✅ |

### 22.4 Favorites & User 테이블

| 테이블 | 주요 컬럼 | 상태 |
|--------|----------|------|
| `favorites_tools` | user_id(nullable), guest_id(nullable), tool_slug | ✅ |
| `favorites_routes` | user_id(nullable), guest_id(nullable), route_slug | ✅ |
| `saved_tools` | user_id, tool_id, folder_name, memo | ✅ |
| `saved_routes` | user_id, route_id | ✅ |

### 22.5 Admin & Logging 테이블

| 테이블 | 주요 컬럼 | 상태 |
|--------|----------|------|
| `system_admins` | user_id | ✅ |
| `app_settings` | key, value (homepage_theme, demo_mode) | ✅ |
| `event_logs` | event_type, target_type, target_slug, anonymous_id, metadata | ✅ |
| `admin_guide_generation_logs` | guide_id, recipe_key, mode, lang | ✅ |
| `admin_openai_usage_logs` | guide_id, action, model, tokens | ✅ |
| `admin_guide_publish_logs` | guide_id, publish_mode | ✅ |

### 22.6 SSOT 기준 미구현 테이블

| 테이블 | SSOT 정의 | 대체/상태 |
|--------|-----------|----------|
| `marketing_briefs` | 회사 롤 정체성 데이터 | `workspace_manager_settings`로 부분 대체 |
| `monthly_item_pools` | 월간 아이템풀 메타 | ❌ 미구현 |
| `monthly_items` | 개별 아이템 15개 | ❌ 미구현 |
| `posting_slots` | 발송 일정 슬롯 | ❌ 미구현 |
| `posting_runs` | 발송 실행 기록 | ❌ 미구현 |
| `token_ledger` | 토큰 원장 | `credit_ledger`로 대체 |
| `workspace_user_profiles` | 유저별 WS 프로필 | `user_marketing_settings`로 대체 |

### 22.7 RLS 정책

| 레벨 | 테이블 |
|------|--------|
| Public Read | routes, route_tools, *_i18n, tools, guides_public, plans |
| User Owned | favorites_*, saved_* |
| WS Member | workspace_*, user_marketing_settings |
| Admin Only | coupons, coupon_redemptions, system_admins |
| API Insert | event_logs |

---

## 23. API 엔드포인트 전체 맵

### 23.1 Public (인증 불필요)

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/tools` | 활성 도구 목록 |
| GET | `/api/tool/[id]` | 도구 상세 (prompts) |
| GET | `/api/routes/list?locale=` | Routes 목록 |
| GET | `/api/routes/featured` | Featured Routes |
| GET | `/api/guides/list` | Guides (페이지네이션, 필터) |
| POST | `/api/events/log` | 이벤트 로깅 |
| GET | `/api/locale?set=` | 로케일 설정 |

### 23.2 User (인증 필요)

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/my/saved-tools` | 저장된 도구 |

### 23.3 Workspace (인증 + 멤버십)

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/workspace/entitlement` | 권한 조회 |
| GET/POST | `/api/workspace/subscription` | 구독 관리 |
| GET/POST | `/api/workspace/manager-settings` | 전체 설정 |
| GET/POST | `/api/workspace/user-marketing-settings` | 개인 설정 |
| GET/POST | `/api/workspace/tone-profile` | 톤 프로필 |
| POST | `/api/workspace/autoposting/test-run` | 자동 포스팅 테스트 |
| GET/POST | `/api/workspaces/[id]/insight-letter-settings` | 인사이트 레터 설정 |

### 23.4 Billing

| Method | Path | 역할 |
|--------|------|------|
| POST | `/api/stripe/checkout` | Personal Stripe Checkout |
| POST | `/api/stripe/webhook` | Stripe Webhook |
| POST | `/api/billing/team/checkout` | Team Checkout |
| POST | `/api/billing/toss/checkout` | 토스 (501 미구현) |
| POST | `/api/subscription/cancel` | 구독 취소 |
| GET | `/api/credits/balance` | 크레딧 잔액 |
| POST | `/api/credits/topup` | 크레딧 충전 |
| POST | `/api/credits/consume` | 크레딧 소비 |
| GET | `/api/credits/history` | 크레딧 내역 |
| POST | `/api/coupons/redeem` | 쿠폰 사용 |
| GET | `/api/coupons/redemptions` | 쿠폰 내역 |

### 23.5 Admin

| Method | Path | 역할 |
|--------|------|------|
| POST | `/api/admin/auth` | Admin 인증 |
| GET | `/api/admin/dashboard-summary` | 대시보드 통계 |
| GET | `/api/admin/metrics` | 월별 KPI |
| POST | `/api/admin/kpi` | KPI 계산 |
| GET | `/api/admin/event-logs` | 이벤트 로그 |
| GET/POST | `/api/admin/settings/homepage-theme` | 홈페이지 테마 |
| GET/POST | `/api/admin/settings/demo-mode` | 데모 모드 |
| **Guides** | | |
| GET | `/api/admin/guides/list` | 가이드 목록 |
| POST | `/api/admin/guides/create` | 가이드 생성 (수동) |
| POST | `/api/admin/guides/generate` | 가이드 생성 (무료) |
| POST | `/api/admin/guides/generate-openai` | 가이드 생성 (OpenAI) |
| GET | `/api/admin/guides/quota` | 일일 할당량 |
| GET/POST | `/api/admin/guides/cron` | 크론 자동 생성/발행 |
| POST | `/api/admin/guides/translate-to-kr` | 가이드 KR 번역 |
| GET/PUT/DELETE | `/api/admin/guides/[id]` | 가이드 CRUD |
| POST | `/api/admin/guides/[id]/approve` | 가이드 승인 |
| POST | `/api/admin/guides/[id]/reject` | 가이드 거부 |
| POST | `/api/admin/guides/[id]/publish-now` | 긴급 발행 |
| **Routes** | | |
| GET | `/api/admin/routes/list-all` | 루트 목록 |
| POST | `/api/admin/routes/create` | 루트 생성 |
| GET/PUT/DELETE | `/api/admin/routes/[id]` | 루트 CRUD |
| POST | `/api/admin/routes/translate-to-kr` | 루트 KR 번역 |
| GET | `/api/admin/routes/check-i18n` | i18n 요약 |
| GET | `/api/admin/routes/debug-i18n` | i18n 디버그 |
| **Tools** | | |
| GET | `/api/admin/tools/list-all` | 도구 목록 |
| POST | `/api/admin/tools/create` | 도구 생성 |
| GET/PUT/DELETE | `/api/admin/tools/[id]` | 도구 CRUD |
| POST | `/api/admin/tools/translate-to-kr` | 도구 KR 번역 |
| GET | `/api/admin/tools/check-i18n-migration` | 마이그레이션 체크 |
| **AI Creator** | | |
| POST | `/api/admin/ai-creator/analyze` | AI 분석 |
| POST | `/api/admin/ai-creator/confirm` | 저장 |
| POST | `/api/admin/ai-creator/regenerate` | 부분 재생성 |
| POST | `/api/admin/ai-creator/suggest-topics` | 주제 제안 |
| GET | `/api/admin/ai-creator/usage` | 사용 통계 |
| **Automation** | | |
| POST | `/api/admin/automation/run` | n8n 트리거 |
| POST | `/api/admin/coupons/create` | 쿠폰 생성 |

### 23.6 Debug

| Method | Path | 역할 |
|--------|------|------|
| GET | `/api/debug/favorites` | 즐겨찾기 디버그 |
| POST | `/api/debug/sync-favorites` | 즐겨찾기 동기화 |
| POST | `/api/debug/demo` | 데모 모드 |

---

## 24. 이벤트 로깅 시스템

### 24.1 클라이언트 로깅

```typescript
// src/lib/event-logger.ts
logEventToDB({
  event_type,      // route_outbound_click, tool_click, guide_view 등
  target_type,     // route, tool, guide
  target_slug,
  source,          // detail, home, search
  metadata         // 추가 정보 (JSONB)
})

전송: navigator.sendBeacon → fetch(keepalive) 폴백
식별: localStorage anonymous_id
PII: 수집 없음
```

### 24.2 서버 로깅

```typescript
// src/lib/event-logger-autoposting.ts
자동 포스팅 전용 이벤트 로거
DB: event_logs 테이블 직접 INSERT
```

### 24.3 Admin 조회

- `/api/admin/event-logs` (GET): 필터링 (날짜, 이벤트 타입, 타겟, 사용자)
- `/kr/workspace/admin/events`: UI (테이블, 메타데이터 모달)

---

## 25. n8n 워크플로우

### 25.1 현재 연결점

| 항목 | 상태 | 위치 |
|------|------|------|
| 자동화 트리거 API | ✅ | `/api/admin/automation/run` |
| Bearer 토큰 인증 | ✅ | `AUTOMATION_SECRET` |
| 가이드 생성 (route-based) | ✅ | dry_run 지원 |
| 포스팅 테스트 API | ✅ | `/api/workspace/autoposting/test-run` |
| 이벤트 로거 | ✅ | `event-logger-autoposting.ts` |

### 25.2 SSOT 기준 미구현 워크플로우

| 주기 | 워크플로우 | 상태 |
|------|-----------|------|
| 월초 | 아이템 생성 (15개) | ❌ |
| 월초 | 스케줄 빌드 (2일 1회) | ❌ |
| 일간 | 슬롯 실행 | ❌ |
| 일간 | 이메일 발송 | ❌ |
| 월말 | 발송 미달 계산 | ❌ |
| 월말 | 토큰 보상 | ❌ |

---

## 26. SEO & 국제화

### 26.1 SEO

| 항목 | 구현 | 파일 |
|------|------|------|
| robots.txt | ✅ | `src/app/robots.ts` |
| sitemap.xml | ✅ (동적: tools, guides) | `src/app/sitemap.ts` |
| Metadata (title, description) | ✅ 모든 페이지 | 각 page.tsx |
| OpenGraph | ✅ | 각 page.tsx |
| hreflang | ⚠️ 부분 | 일부 페이지만 |

### 26.2 국제화 (i18n)

| 레이어 | 구현 | 테이블 |
|--------|------|--------|
| Tools | ✅ | `tools_i18n` (locale 기반) |
| Routes | ✅ | `routes_i18n`, `route_tools_i18n` |
| Guides | ✅ | `guides.lang` (en/kr) |
| UI 문자열 | ⚠️ 하드코딩 | 컴포넌트 내 직접 |

### 26.3 지원 로케일

```
현재: en (default), kr
계획: ja (routes_i18n 스키마에 이미 포함)
URL: /kr (한국), / (글로벌), /ko 사용 금지
```

---

## 27. SSOT 대비 Gap 분석

### 27.1 전체 구현 현황

| SSOT 섹션 | 구현율 | 상태 |
|-----------|--------|------|
| §0 한 줄 정의 | 100% | ✅ Front/Back Two-Track 구현 |
| §1 브랜드 포지셔닝 | 90% | ✅ 구현 (톤 분리) |
| §2 핵심 상품 정의 | 30% | ⚠️ 슬로건/타겟 코드 미반영 |
| §3 워크스페이스 구조 | 90% | ✅ Personal/Company, pay-before-create |
| §4 권한 모델 | 85% | ⚠️ admin 역할 추가 존재 (SSOT는 2개만) |
| §5 Auto Posting | 5% | ❌ Mock UI만, DB/로직 전무 |
| §6 주간 트렌드 리포트 | 15% | ⚠️ 설정 DB+API만, 발송 미구현 |
| §7 전체/개인 설정 | 80% | ✅ 핵심 테이블+API, 이미지 서명 누락 |
| §8 플랜 정의 | 65% | ⚠️ 가격 O, Credit 기능별 차등 미구현 |
| §9 해지/환불 | 45% | ⚠️ 취소 UI O, Stripe 미연동, 위약금 미구현 |
| §10 DB 설계 | 55% | ⚠️ posting 관련 5개 테이블 누락 |
| §11 n8n 워크플로우 | 10% | ⚠️ API 존재, 실제 WF 미구현 |
| §12 UI 원칙 | 85% | ✅ 메뉴 잠금 안 함, 상태 분기 |
| §13 URL 정책 | 95% | ✅ /kr 사용 |
| §14 헌법 조항 | 90% | ✅ 설정/실행 분리 구조 |

### 27.2 SSOT 미정의 + 코드에 추가 구현된 기능

| 기능 | 상태 | 비고 |
|------|------|------|
| AI Creator (통합 생성) | ✅ 완전 구현 | SSOT 미정의, 코드에서 추가 |
| 가이드 품질 게이트 | ✅ 완전 구현 | quality_score + auto_publish |
| Cron 자동 발행 | ✅ 완전 구현 | Vercel Cron |
| Homepage Theme 관리 | ✅ 완전 구현 | Admin 설정 |
| Demo Mode | ✅ 완전 구현 | Admin 설정 |
| 크레딧 감사 (Admin) | ✅ 완전 구현 | 필터/CSV |
| 이벤트 로그 뷰어 (Admin) | ✅ 완전 구현 | 필터/모달 |
| 운영 KPI 대시보드 | ✅ 완전 구현 | 월별 메트릭 |
| i18n 번역 파이프라인 | ✅ 완전 구현 | Routes/Tools/Guides |
| Admin 루트/도구 CRUD | ✅ 완전 구현 | 생성/편집/삭제/번역 |
| DB 마이그레이션 도구 | ✅ 완전 구현 | routes-migrate |
| Productivity 도구 (회의/PPT/문서) | ⚠️ UI 뼈대 | SSOT 미정의 |
| Advisory (판정단/패널) | ⚠️ UI 뼈대 | SSOT §8.1 "판정단" 언급 |
| Snap / Shortform / CS Support | ⚠️ 파일 존재 | SSOT 미정의 |

### 27.3 Critical Gaps

#### Gap 1: Auto Posting 핵심 로직 (SSOT §5)
- **누락:** 5개 DB 테이블 (monthly_item_pools, monthly_items, posting_slots, posting_runs, marketing_briefs)
- **누락:** 아이템 생성 로직, 이메일 발송, 텍스트 규칙 엔진, 이미지 워터마크
- **영향:** SSOT 핵심 수익 기능
- **우선순위:** P0

#### Gap 2: n8n 워크플로우 실행 (SSOT §11)
- **누락:** 월초/일간/월말 워크플로우
- **현황:** API 엔드포인트만 존재
- **우선순위:** P0

#### Gap 3: Credit 기능별 차등 (SSOT §8.1)
- **누락:** Standard vs Premium: AI 이미지/AI 추천/판정단 횟수 차등
- **누락:** 매월 Credit 자동 리셋
- **우선순위:** P1

#### Gap 4: Stripe 구독 완전 연동 (SSOT §9)
- **누락:** Stripe API 직접 구독 취소 (현재 DB만)
- **누락:** 업그레이드/다운그레이드
- **누락:** 위약금 10% 자동 계산
- **우선순위:** P1

### 27.4 다크모드 통일 Gap

6개 홈페이지 섹션 컴포넌트가 하드코딩 라이트 스타일:
- `BestForYouSection`, `BenefitServicesSection`, `PopularToolsSection`
- `SimpleModeCtaSection`, `AiStudioSection`, `KRWorkspacePlaceholder`

### 27.5 컴포넌트 중복 Gap

`Button`, `Chip`, `PageShell`이 Design System과 Components에 이중 존재.

---

## 28. 다음 작업 우선순위

### SSOT §15 + Gap 분석 반영

| 순서 | 작업 | 근거 | 심각도 |
|------|------|------|--------|
| 1 | Auto Posting DB 마이그레이션 (5개 테이블) | SSOT §5, §10 | P0 |
| 2 | Auto Posting UI 뼈대 완성 | SSOT §5 | P0 |
| 3 | 전체 설정 / 개인 설정 분리 화면 | SSOT §7 | P1 |
| 4 | 월간 아이템 리스트 read-only UI | SSOT §5.2 | P0 |
| 5 | Credit 기능별 차등 로직 | SSOT §8.1 | P1 |
| 6 | Stripe 구독 취소 실제 연동 | SSOT §9 | P1 |
| 7 | n8n 워크플로우 설계 + 연결 | SSOT §11 | P0 |
| 8 | 다크모드 통일 (6개 컴포넌트) | UI 일관성 | P2 |
| 9 | 컴포넌트 중복 제거 | 유지보수 | P2 |
| 10 | hreflang 완전 적용 | SEO | P2 |

---

## 부록 A: SSOT 헌법 조항 준수 확인

> **"회사 롤은 정체성이고, 이번 달 아이템은 실행이다. 이 둘을 섞는 순간 Airoute는 망한다."**

| 원칙 | 구현 | 준수 |
|------|------|------|
| 회사 롤 = workspace_manager_settings | ✅ brand, profile, logo, attachments | ✅ |
| 아이템 = monthly_items (계획) | ❌ 테이블 미존재 | ⚠️ 생성 전 |
| 설정/실행 분리 | ✅ API 분리 | ✅ 구조 준수 |
| Personal = Team OWNER 동일 | ✅ Entitlements 통합 | ✅ |
| 메뉴 잠금 안 함 | ✅ 페이지 내부 분기 | ✅ |
| UI에 'Biz' 사용 금지 | ✅ "팀" 사용 | ✅ |

---

## 부록 B: 파일 수 통계

| 영역 | 파일 수 |
|------|--------|
| Admin 페이지 | 17개 |
| Admin API | 36개 |
| Workspace Admin 페이지 | 8개 |
| KR Workspace 페이지 | 40+ 개 |
| EN Workspace 페이지 | 10개 (Coming Soon) |
| Public 페이지 (EN+KR) | 30+ 개 |
| API 엔드포인트 (전체) | 65+ 개 |
| Lib 파일 | 25+ 개 |
| 컴포넌트 | 40+ 개 |
| DB 마이그레이션 | 25개 |
| 타입 정의 | 7개 |

---

> **문서 끝**  
> 최종 업데이트: 2026-02-21 v1.2
