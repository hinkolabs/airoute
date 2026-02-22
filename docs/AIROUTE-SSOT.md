# AIRoute Integrated Master Specification (SSOT)

> **Version:** v1.1 (Updated)  
> **Last Updated:** 2026-02-21  
> **Owner:** HinkoLabs  
> **Document Role:** Single Source of Truth (SSOT)  
> **변경 이력:** v1.0 (2026-01 초안) → v1.1 (2026-02-21 코드 기반 확정 반영)

---

## 0. Airoute 한 줄 정의 (절대 기준)

Airoute는 'AI를 배우는 서비스'가 아니라
**'AI를 대신 써주는 실행 서비스'**다.

- **Front (v1):** 신뢰를 만드는 AI Route & Guide
- **Back (v2):** 돈을 버는 자동화 실행 (Workspace + n8n)

모든 기능은 **"귀찮은 일을 대신 끝내준다"**는 한 문장으로 설명 가능해야 한다.

---

## 1. 브랜드 & 포지셔닝

### 1.1 Two-Track 전략

| 구분 | Front (Public / Marketing) | Back (Workspace / SaaS) |
|------|---------------------------|------------------------|
| 역할 | 신뢰 확보 + SEO + 트래픽 | 자동화 실행 |
| 태도 | 팔지 않는다, 설명한다 | "귀찮으면 우리가 합니다" |
| 수익 | Affiliate / Ads | 구독 + Credit |
| 톤 | 고고한 선비 (정보·중립·가이드) | 유능한 공장 (결과 중심) |

### 1.2 기술 스택 (확정)

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Framework | Next.js (App Router) | 16.x |
| Runtime | React | 19.x |
| Language | TypeScript | ^5 (Strict) |
| Styling | Tailwind CSS | ^4 (CSS 변수 테마) |
| Auth | Supabase Auth | @supabase/ssr |
| Database | Supabase (PostgreSQL + RLS) | - |
| Payments | Stripe | ^20.x |
| AI | OpenAI (gpt-4o / gpt-4o-mini) | ^6.x |
| Deploy | Vercel | Cron Jobs |
| Automation | n8n | 외부 API 연동 |

---

## 2. 핵심 상품 정의

### 2.1 Airoute B2B 마케팅 자동화

- **슬로건:** "월 49,000원에 고용하는 AI 마케팅 팀장"
- **타겟:** 여행사, 보험/렌탈/네트워크 세일즈, 1인 셀러 포함 SMB
- **가치:**
  - 자동화: 2일 1회 포스팅 + 주 1회 인사이트
  - 브랜딩: 이미지 로고 + 개인 문구 자동 합성
  - 유지: 리포트 → 바로 생성 CTA

---

## 3. 워크스페이스 구조

### 3.1 Workspace Types

| 구분 | DB `type` | UI 표기 | 생성 방식 |
|------|-----------|---------|----------|
| 개인 | `personal` | 개인 | 회원가입 시 자동 생성 |
| 팀 | `company` | 팀 | 결제 성공 후에만 생성 |

> ⚠️ UI에서 'Biz'라는 단어는 **절대 사용하지 않는다**

### 3.2 Personal = Team OWNER와 동일

- Personal Workspace 사용자는 Team Workspace의 OWNER와 권한이 **완전히 동일**
- 차이는 오직:
  - Team은 멤버 2명 이상 가능
  - Personal은 멤버 관리 없음
- 기능 차등 금지
- 차이는 "관리/청구/멤버"만

### 3.3 Workspace 생성 원칙 (확정)

**Personal Workspace:**
- 회원가입 시 1개 자동 생성 (`ensurePersonalWorkspace`)

**Team Workspace:**
- ❌ 결제 전 생성 금지
- ✅ 결제 성공(Webhook) 후에만 생성

**Flow:**
```
"워크스페이스 추가" 클릭
  → 요금제 선택 + 이름 입력
  → Stripe Checkout (metadata: kind=team)
  → checkout.session.completed (Webhook)
  → DB에서 workspace + subscription 생성
  → /kr/workspace?team_created=1 이동
```

### 3.4 Workspace 선택 로직 (확정)

```
우선순위:
1. ?ws= 쿼리 파라미터
2. localStorage (airoute_active_ws_id)
3. 단일 personal workspace
4. 첫 번째 멤버십
```

---

## 4. 권한 모델

### 4.1 Workspace Role (확정: 3개 + system_admin)

| Role | 권한 | 비고 |
|------|------|------|
| `owner` | 전체 설정/아이템/일정/결제 | WS 생성자 |
| `admin` | 결제 관리 + 설정 | Team 관리용 |
| `member` | 읽기 + 개인 설정 | 기본 역할 |
| `system_admin` | 시스템 전체 관리 | `system_admins` 테이블 별도 |

### 4.2 Entitlement 시스템 (구현 완료)

```
can_use_workspace    → 항상 true (인증 기반)
can_use_paid_features → 활성 구독 필요
can_create_workspace  → Pro+ 플랜 필요
can_manage_billing    → owner/admin만
is_paid_for_lock      → company=항상true, personal=구독필요
```

---

## 5. Auto Posting (핵심 기능)

### 5.1 한 줄 정의

> 월 15개의 마케팅 아이템을 미리 만들어두고
> AI 호출 없이 일정에 맞춰 이메일로 전달한다

### 5.2 월간 아이템풀 구조

- **단위:** workspace
- **기준일:** 매월 1일
- **개수:** 15개 고정
- **아이템은 고정 자산** (수정/삭제 불가)
- **아이템 구성:** 주제, 타겟, 관점, CTA, 키워드 규칙, 이미지 검색 키워드

### 5.3 발송 정책

- **채널:** 이메일
- **매 회차 포함:**
  - 블로그용 글 1개
  - SNS용 글 1개
  - 이미지 2장

### 5.4 텍스트 규칙

**블로그:**
- 최소 1,200자
- 메인 키워드 ≥ 5회
- 세컨드 키워드 ≥ 2회

**SNS:**
- 150 ~ 300자
- 해시태그 5~12개
- 이모지 허용

### 5.5 이미지 정책

- **기본:** Unsplash / Pexels
- **Pro:** AI 이미지 추가 가능
- **워터마크:**
  - 하단 10~15% 띠배너
  - 좌측: 워크스페이스 로고
  - 우측: 개인 문구 (user별)

### 5.6 구현 현황 (v1.1 추가)

| 항목 | 상태 |
|------|------|
| UI 뼈대 (/marketing/auto-posting) | ⚠️ Mock 데이터 |
| 테스트 실행 API | ✅ 존재 |
| 이벤트 로거 | ✅ 존재 |
| DB 테이블 (5개) | ❌ 미구현 |
| 이메일 발송 로직 | ❌ 미구현 |
| 텍스트 규칙 엔진 | ❌ 미구현 |
| 이미지 워터마크 | ❌ 미구현 |

---

## 6. 주간 트렌드 리포트 (Insight Letter)

- **주기:** 매주 월요일 08:00
- **데이터:** Tavily
- **구성:** Hot Keyword, Money Flow (환율/수요), CTA: "이 주제로 바로 생성"
- **목적:** Retention 전용 기능

### 6.1 구현 현황 (v1.1 추가)

| 항목 | 상태 |
|------|------|
| 설정 DB 테이블 (workspace_insight_letter_settings) | ✅ |
| 설정 API | ✅ |
| 설정 UI | ⚠️ 부분 |
| Tavily 연동 | ❌ |
| 주간 발송 | ❌ |

---

## 7. 전체 설정 vs 개인 설정 (UI 기준)

### 7.1 전체 설정 (회사 롤) — owner만 수정

| 항목 | DB 위치 | 상태 |
|------|---------|------|
| 브랜드 설명 | `workspace_manager_settings.brand_name` | ✅ |
| 서비스 강점 | `workspace_manager_settings.company_profile` | ✅ |
| 금지어 | `workspace_insight_letter_settings.forbidden_claims` | ✅ |
| 기본 톤 | — | ❌ 미구현 |
| 로고 | `workspace_manager_settings.logo_url` | ✅ |
| 개념: **정체성 데이터** | | |

### 7.2 개인 설정 — 모든 유저

| 항목 | DB 위치 | 상태 |
|------|---------|------|
| 톤 프리셋/예시 | `user_marketing_settings.tone_preset/example` | ✅ |
| 개인 키워드 | `user_marketing_settings.personal_keywords` | ✅ |
| 톤 프로필 JSON | `user_marketing_settings.tone_profile_json` | ✅ |
| 이미지 서명 문구 | — | ❌ 미구현 |
| (Pro) 개인 말투 학습 | `tone_profile_json`으로 구현 | ✅ |

---

## 8. 플랜 정의 (KR 기준 확정)

### 8.1 개인 플랜 (구현 완료)

| 구분 | Standard (starter) | Premium (pro) |
|------|-------------------|---------------|
| **가격** | ₩49,000/월 | ₩99,000/월 |
| **연간** | ₩490,000/년 | ₩990,000/년 |
| Credit | 1,000P | 5,000P |
| Custom Tone | ❌ | ✅ |
| AI 이미지 | ❌ | ✅ |
| AI 추천 | ❌ | ✅ |
| 판정단 | 일 5회 | 일 20회 |

### 8.2 팀 플랜 (v1.1 추가 — 코드에서 확인)

| 구분 | Standard | Premium |
|------|----------|---------|
| **가격** | ₩149,000/월 | ₩299,000/월 |
| **연간** | ₩1,490,000/년 | ₩2,990,000/년 |

### 8.3 Credit 정책

- **성격:** 고비용 작업용 종량제
- **매월 리셋** (미구현)
- **Top-up:** 10,000원 = 1,000P
- **패키지:** 200P / 500P / 1,000P / 5,000P (코드 기준)

### 8.4 결제 수단 (v1.1 추가)

| 수단 | 상태 |
|------|------|
| Stripe (카드/해외) | ✅ 구현 |
| 토스 (한국 간편결제) | ⚠️ 501 (미구현) |

---

## 9. 해지 / 환불

### 9.1 해지

- **해지 예약 버튼 필수** ✅ (구현)
- **만료일까지 사용** ⚠️ (DB만 업데이트, Stripe 미연동)

### 9.2 환불

- **UI 버튼 없음** ✅
- **고객센터 문의** ✅
- **위약금 10% 공제** ❌ (미구현)

---

## 10. DB 설계 핵심 테이블

### 10.1 구현 완료 테이블

| 테이블 | 역할 |
|--------|------|
| `workspaces` | 워크스페이스 |
| `workspace_members` | 멤버십 (role) |
| `workspace_subscriptions` | 구독 (Stripe 연동) |
| `workspace_manager_settings` | 전체 설정 (회사 롤) |
| `workspace_insight_letter_settings` | 인사이트 레터 설정 |
| `user_marketing_settings` | 개인 설정 |
| `plans` | 플랜 정의 (Stripe Price ID) |
| `workspace_credits` | 크레딧 잔액 |
| `credit_ledger` | 크레딧 트랜잭션 |
| `coupons` | 쿠폰 마스터 |
| `coupon_redemptions` | 쿠폰 사용 |
| `tools` | 도구 마스터 |
| `tools_i18n` | 도구 다국어 |
| `routes` | 루트 마스터 |
| `route_tools` | 루트-도구 매핑 |
| `routes_i18n` | 루트 다국어 |
| `route_tools_i18n` | 루트 단계 다국어 |
| `guides` | 가이드 |
| `guides_public` | 가이드 공개 VIEW |
| `favorites_tools` / `favorites_routes` | 즐겨찾기 |
| `saved_tools` / `saved_routes` | 저장 |
| `event_logs` | 이벤트 로그 |
| `system_admins` | 시스템 관리자 |
| `app_settings` | 전역 설정 (테마/데모) |
| `admin_guide_generation_logs` | 가이드 생성 로그 |
| `admin_openai_usage_logs` | OpenAI 사용 로그 |
| `admin_guide_publish_logs` | 가이드 발행 로그 |

### 10.2 미구현 테이블 (Auto Posting 관련)

| 테이블 | 역할 | 상태 |
|--------|------|------|
| `marketing_briefs` | 회사 롤 (→ `workspace_manager_settings`로 대체 가능) | ❌ |
| `monthly_item_pools` | 월간 아이템풀 메타 | ❌ |
| `monthly_items` | 개별 아이템 (15개) | ❌ |
| `posting_slots` | 발송 일정 슬롯 | ❌ |
| `posting_runs` | 발송 실행 기록 | ❌ |

> 👉 아이템은 workspace 단위, 실행은 user 단위

---

## 11. n8n 워크플로우 기준

| 주기 | 워크플로우 | 구현 |
|------|-----------|------|
| 월초 | 아이템 생성 | ❌ |
| 월초 | 스케줄 빌드 | ❌ |
| 일간 | 슬롯 실행 | ❌ |
| 일간 | 이메일 발송 | ❌ |
| 월말 | 발송 미달 계산 | ❌ |
| 월말 | 토큰 보상 | ❌ |

### 11.1 현재 연결점 (v1.1 추가)

- `POST /api/admin/automation/run` — Bearer 토큰 인증, route-based 가이드 생성
- `POST /api/workspace/autoposting/test-run` — 테스트 실행
- 이벤트 로거: `event-logger-autoposting.ts`

---

## 12. UI 원칙 (Workspace)

- 메뉴에서 **잠그지 않는다**
- 페이지 내부에서 **상태 분기**
- Personal / Team **동일 화면**
- 권한은 **버튼 활성/비활성**으로 표현

---

## 13. URL 정책 (최종)

| 로케일 | 접두사 | 비고 |
|--------|--------|------|
| 한국 | `/kr` | 유일한 비영어 |
| 글로벌 | `/` | 기본값 |
| `/ko` | 사용 금지 | legacy 301만 허용 |
| `/ja` | 미래 확장 | DB 스키마에 이미 포함 |

---

## 14. 최종 핵심 문장 (헌법 조항)

> **회사 롤은 정체성이고,**
> **이번 달 아이템은 실행이다.**
> **이 둘을 섞는 순간 Airoute는 망한다.**

---

## 15. Admin 시스템 (v1.1 추가 — 전체 확정)

### 15.1 Admin 대시보드

- 5개 탭: Dashboard / Routes / Tools / Guides / Tests
- 전역 설정: Homepage Theme (default/v2/v2-simple), Demo Mode
- 콘텐츠 통계: Routes/Tools/Guides 수 + KR 번역율

### 15.2 콘텐츠 CRUD (Routes / Tools / Guides)

| 대상 | 생성 | 편집 | 삭제 | 번역 (EN→KR) |
|------|------|------|------|-------------|
| Routes | ✅ (빠른 생성) | ✅ (상세 편집, 단계 관리) | ✅ (소프트/하드) | ✅ (OpenAI) |
| Tools | ✅ (빠른 생성) | ✅ (상세 편집) | ✅ | ✅ (OpenAI 배치) |
| Guides | ✅ (수동/무료/OpenAI) | ✅ (전체 필드) | ✅ | ✅ (OpenAI 배치) |

### 15.3 AI Creator (통합 생성)

- 하나의 프롬프트 → Route + Guide + Tool 동시 생성
- 모드: route (다중 도구) / tool (단일 도구)
- 언어: en / kr / both
- 프리뷰 → 수동 편집 → 부분 재생성 → DB 저장
- 사용량 추적 (토큰, 비용)

### 15.4 가이드 자동 발행 파이프라인

```
무료 템플릿 / OpenAI / AI Creator
  → 품질 점수 계산 (100점 만점)
  → 80점 이상 → auto_publish_eligible
  → Vercel Cron (03:00, 14:00) → 하루 최대 2개 자동 발행
```

### 15.5 Workspace Admin (KR)

- 운영 KPI 대시보드 (구독/쿠폰/크레딧/자동발행)
- 크레딧 감사 (필터/CSV)
- 이벤트 로그 뷰어 (필터/메타데이터)

---

## 16. 테마 & 디자인 시스템 (v1.1 추가)

### 16.1 테마 시스템

- `ThemeProvider`: day/night 전환
- CSS 변수 기반 (`globals.css`)
- Night = 다크 (primary: emerald), Day = 라이트 (primary: blue)
- localStorage 저장

### 16.2 다크모드 통일 과제

6개 컴포넌트가 하드코딩 라이트 스타일 → CSS 변수로 전환 필요:
- BestForYouSection, BenefitServicesSection, PopularToolsSection
- SimpleModeCtaSection, AiStudioSection, KRWorkspacePlaceholder

### 16.3 컴포넌트 이원화

Button, Chip, PageShell이 `_design/` 과 `components/`에 중복 → 통합 필요

---

## 17. 이벤트 로깅 시스템 (v1.1 추가)

- **클라이언트:** `sendBeacon` → `/api/events/log` → `event_logs`
- **식별:** Anonymous ID (localStorage), PII 수집 없음
- **이벤트:** tool_click, route_click, guide_view, save_action, auth_sign_in/out
- **Admin 조회:** 필터링 UI + 메타데이터 모달

---

## 18. SEO & 국제화 (v1.1 추가)

- robots.txt, sitemap.xml (동적) ✅
- Metadata + OpenGraph 모든 페이지 ✅
- i18n: tools_i18n, routes_i18n, route_tools_i18n, guides.lang
- 지원: en, kr / 계획: ja
- hreflang: 부분 적용 (완전 적용 필요)

---

## 19. 인증 시스템 (v1.1 추가)

| 방법 | 상태 |
|------|------|
| Google OAuth | ✅ |
| Email OTP | ✅ |
| 카카오 OAuth | ⚠️ KR에서만, 코드 존재 |

- Admin: 쿠키(레거시) + system_admins 테이블(현대)
- 세션: @supabase/ssr 쿠키 기반
- 로그아웃: 명시적 마커로 즉시 재로그인 방지
- Geo 리다이렉트: KR IP → /kr (쿠키 오버라이드 가능)

---

## 20. 다음 작업 우선순위 (현실적)

| 순서 | 작업 | 상태 |
|------|------|------|
| 1 | Auto Posting DB 테이블 마이그레이션 | ❌ P0 |
| 2 | /kr/workspace/auto-posting UI 뼈대 완성 | ⚠️ P0 |
| 3 | 전체 설정 / 개인 설정 분리 화면 | ⚠️ P1 |
| 4 | 월간 아이템 리스트 read-only UI | ❌ P0 |
| 5 | 결제 → 워크스페이스 생성 webhook 정리 | ✅ 완료 |
| 6 | Credit 기능별 차등 로직 | ❌ P1 |
| 7 | Stripe 구독 취소 실제 연동 | ⚠️ P1 |
| 8 | n8n 워크플로우 설계 + 연결 | ❌ P0 |
| 9 | 다크모드 통일 (6개 컴포넌트) | ❌ P2 |
| 10 | 컴포넌트 중복 제거 | ❌ P2 |

---

> **문서 끝**
> 이 문서 하나만 들고 가면 기획·UI·DB·n8n·결제·권한·법무까지 전부 같은 방향으로 간다.
