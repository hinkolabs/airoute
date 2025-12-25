# GA4 Explorations 리포트 설정 가이드

**Last updated**: 2025-12-23  
**Purpose**: affiliate_click 이벤트 기반 수익 신호 탐색 리포트 3종  
**Target**: Airoute GA4 Admin

---

## 📋 목차

1. [사전 조건 확인](#1-사전-조건-확인)
2. [Exploration #1: Affiliate Click Overview](#2-exploration-1-affiliate-click-overview)
3. [Exploration #2: Route × Tool Revenue Signal](#3-exploration-2-route--tool-revenue-signal)
4. [Exploration #3: Placement Performance](#4-exploration-3-placement-performance)
5. [리포트 활용 가이드](#5-리포트-활용-가이드)
6. [트러블슈팅](#6-트러블슈팅)

---

## 1. 사전 조건 확인

### ✅ Custom Dimensions 등록 확인

GA4 Admin → Data display → Custom definitions에서 다음 항목들이 Event-scoped로 등록되어 있어야 합니다:

| Parameter Name | Scope | Description |
|---|---|---|
| `partner_name` | Event | Affiliate partner identifier |
| `tool_slug` | Event | Tool identifier (slug or ID) |
| `placement` | Event | Click placement context |
| `route_slug` | Event | Route context (nullable) |
| `guide_slug` | Event | Guide context (nullable) |
| `is_internal_traffic` | Event | Internal/test traffic flag |

### 등록 방법 (없는 경우)

1. GA4 Admin → **Property** → **Custom definitions**
2. **Create custom dimension** 클릭
3. 각 항목별로:
   - Dimension name: `partner_name` (표시명은 자유)
   - Scope: **Event**
   - Event parameter: `partner_name` (정확히 일치해야 함)
   - Description: 위 테이블 참고
4. 저장 후 24시간 대기 (데이터 수집 시작)

---

## 2. Exploration #1: Affiliate Click Overview

### 목적
**"지금 서비스에서 실제 돈 신호가 나는 지점 요약"**

### 설정 방법

#### Step 1: 새 Exploration 생성
1. GA4 → **Explore** 메뉴
2. 좌상단 **+ (Blank)** 클릭
3. 탐색 유형: **Free form** 선택

#### Step 2: 변수 설정 (Variables 패널)

**Segments:**
- (기본값 사용 또는 "All Users")

**Dimensions (차원 추가):**
1. `route_slug` (Custom)
2. `tool_slug` (Custom)
3. `placement` (Custom)

**Metrics (측정항목 추가):**
1. `Event count` (Built-in)

#### Step 3: Tab Settings (우측 패널)

**Technique:**
- Free form

**Rows:**
- `route_slug`
- `tool_slug`

**Columns:**
- `placement`

**Values:**
- `Event count`

**Filters:**
1. Filter 1:
   - Dimension: `Event name`
   - Match type: `exactly matches`
   - Value: `affiliate_click`

2. Filter 2:
   - Dimension: `is_internal_traffic`
   - Match type: `exactly matches`
   - Value: `false`

#### Step 4: 저장
- 탐색 이름: `Affiliate Click Overview`
- 설명: `Overall affiliate click performance across routes, tools, and placements`

### 이 리포트로 답할 수 있는 질문

✅ 어떤 Route가 가장 많은 클릭을 만들어내는가?  
✅ 홈 vs Route Step 중 어디가 전환 신호가 강한가?  
✅ 어떤 Tool이 실제로 클릭되는가?  
✅ Placement별 클릭 분포는?

### 예상 출력 예시

| route_slug | tool_slug | home_best_route | route_detail | tool_card |
|---|---|---|---|---|
| remove-background | removebg | 45 | 120 | 30 |
| remove-background | photoroom | 12 | 45 | 8 |
| ai-logo-maker | looka | 89 | 200 | 55 |
| (null) | canva | 0 | 0 | 150 |

**해석:**
- `remove-background` Route가 가장 강력함
- `route_detail` placement가 가장 효과적
- `(null)` route_slug = 홈이나 Tool 카드에서의 직접 클릭

---

## 3. Exploration #2: Route × Tool Revenue Signal

### 목적
**"Route별 수익 잠재력 비교 — 클릭은 많은데 전환 냄새 없는 Route 제거용"**

### 설정 방법

#### Step 1: 새 Exploration 생성
1. GA4 → **Explore** → **+ (Blank)**
2. 탐색 유형: **Free form**

#### Step 2: 변수 설정

**Dimensions:**
1. `route_slug` (Custom)
2. `tool_slug` (Custom)

**Metrics:**
1. `Event count` (Built-in)

#### Step 3: Tab Settings

**Rows:**
- `route_slug`

**Columns:**
- `tool_slug`

**Values:**
- `Event count`

**Filters:**
1. Filter 1:
   - Dimension: `Event name`
   - Match type: `exactly matches`
   - Value: `affiliate_click`

2. Filter 2:
   - Dimension: `route_slug`
   - Match type: `is not null`

3. Filter 3:
   - Dimension: `is_internal_traffic`
   - Match type: `exactly matches`
   - Value: `false`

**Sort (정렬):**
- Metric: `Event count`
- Order: `Descending`

#### Step 4: 저장
- 탐색 이름: `Route × Tool Revenue Signal`
- 설명: `Route-level revenue potential comparison (click-based)`

### 이 리포트로 답할 수 있는 질문

✅ 어떤 Route가 실제 Tool 이동(전환 의도)을 만드는가?  
✅ 특정 Route에 과도하게 의존하는 Tool은 무엇인가?  
✅ Route가 있는데도 클릭이 없다면 왜?  
✅ 홈 Best Route 교체 우선순위는?

### 예상 출력 예시

| route_slug | removebg | photoroom | canva | Total |
|---|---|---|---|---|
| remove-background | 165 | 65 | 0 | **230** |
| ai-logo-maker | 0 | 5 | 344 | **349** |
| video-edit-ai | 0 | 0 | 89 | **89** |

**해석:**
- `ai-logo-maker`가 가장 강력한 수익 신호
- `remove-background`는 2개 Tool 집중
- `video-edit-ai`는 약함 → 홈에서 제거 고려

---

## 4. Exploration #3: Placement Performance

### 목적
**"홈 Best Route / Guide CTA 교체 판단 — 보여주기만 한 영역 제거"**

### 설정 방법

#### Step 1: 새 Exploration 생성
1. GA4 → **Explore** → **+ (Blank)**
2. 탐색 유형: **Free form**

#### Step 2: 변수 설정

**Dimensions:**
1. `placement` (Custom)
2. `partner_name` (Custom)

**Metrics:**
1. `Event count` (Built-in)

#### Step 3: Tab Settings

**Rows:**
- `placement`

**Columns:**
- `partner_name`

**Values:**
- `Event count`

**Filters:**
1. Filter 1:
   - Dimension: `Event name`
   - Match type: `exactly matches`
   - Value: `affiliate_click`

2. Filter 2:
   - Dimension: `is_internal_traffic`
   - Match type: `exactly matches`
   - Value: `false`

**Sort:**
- Metric: `Event count`
- Order: `Descending`

#### Step 4: 저장
- 탐색 이름: `Placement Performance`
- 설명: `UI placement effectiveness for homepage optimization`

### 이 리포트로 답할 수 있는 질문

✅ `home_best_route`가 실제로 돈 신호를 만드는가?  
✅ `guide_cta`는 장식인가, 기여자인가?  
✅ `route_detail`과 `tool_card` 중 어디가 강한가?  
✅ 어떤 placement를 홈에 더 배치해야 하는가?

### 예상 출력 예시

| placement | removebg | canva | looka | Total |
|---|---|---|---|---|
| route_detail | 320 | 445 | 289 | **1054** |
| tool_card | 188 | 233 | 144 | **565** |
| home_best_route | 57 | 101 | 95 | **253** |
| guide_cta | 12 | 8 | 3 | **23** |

**해석:**
- `route_detail`이 압도적으로 강함 → Route 중심 전략 정당화
- `home_best_route`는 약하지만 존재 가치 있음
- `guide_cta`는 매우 약함 → 개선 또는 제거 고려

---

## 5. 리포트 활용 가이드

### 주간 운영 루틴 (권장)

#### 매주 월요일 오전
1. **Exploration #1** 확인
   - 지난주 대비 클릭 수 변화
   - 새로운 Route/Tool 등장 여부
   - 급격한 하락 항목 체크

#### 매주 수요일 오후
2. **Exploration #2** 확인
   - Route별 순위 변동
   - 약한 Route 2~3개 마킹
   - 홈 교체 후보 선정

#### 매주 금요일 오후
3. **Exploration #3** 확인
   - Placement별 기여도 추이
   - 홈 UI 변경 필요성 판단

### 의사결정 기준

#### 🟢 Route 유지 조건
- Exploration #2에서 주간 클릭 30+ 이상
- Tool 다양성 2개 이상
- 하락 추세 없음

#### 🟡 Route 관찰 대상
- 주간 클릭 10~29
- Tool 1개에만 집중
- 2주 연속 하락

#### 🔴 Route 교체 고려
- 주간 클릭 10 미만
- 3주 연속 하락
- Exploration #3에서 placement 기여도 0

---

## 6. 트러블슈팅

### 문제 1: "Custom dimension이 리포트에 안 보여요"

**원인:**
- Custom dimension 등록 후 24~48시간 필요
- Event parameter 이름 오타

**해결:**
1. GA4 Admin → Custom definitions에서 parameter 이름 재확인
2. 코드에서 전송되는 parameter 이름과 정확히 일치하는지 확인
3. 24시간 대기 후 다시 시도

### 문제 2: "is_internal_traffic 필터가 작동 안 해요"

**원인:**
- Boolean 값을 string으로 전송했을 가능성
- Custom dimension 미등록

**해결:**
1. Realtime 이벤트에서 `is_internal_traffic` 값 확인
2. `true` / `false` (string)가 아닌 boolean인지 확인
3. Filter에서 `exactly matches` → `false` (string) 사용

### 문제 3: "route_slug가 전부 (null)로 나와요"

**원인:**
- Route 외부에서 발생한 클릭 (정상)
- 또는 코드에서 routeSlug prop 미전달

**해결:**
1. Exploration #1에서 `(null)` row 확인
2. `placement` 값이 `tool_card` / `home_best_route`이면 정상
3. `route_detail`인데 null이면 코드 점검 필요

### 문제 4: "데이터가 너무 적어요"

**원인:**
- 내부 트래픽 필터로 인한 데이터 부족
- 실제 사용자 트래픽이 아직 적음

**해결:**
1. 초기 테스트 단계에서는 Filter 2 (`is_internal_traffic = false`) 임시 제거
2. 전체 데이터로 리포트 구조 확인
3. 실사용 시작 후 필터 재적용

### 문제 5: "partner_name이 전부 'unknown'으로 나와요"

**원인:**
- 잘못된 URL 형식
- `partnerName` prop 미전달

**해결:**
1. 코드 점검: `AffiliateLinkButton`의 `href` prop 확인
2. Realtime 이벤트에서 `link_url` 값 확인
3. URL이 `https://` 로 시작하는지 확인

---

## 7. 부록: Placement 값 참조표

| Placement Value | 의미 | Context |
|---|---|---|
| `home_best_route` | 홈 Best Route 섹션 | Route 소개 |
| `route_detail` | Route 상세 페이지 | Route 워크플로우 Step |
| `route_step` | Route Step CTA | 구버전 (deprecated) |
| `tool_card` | Tool 카드 | Tool 그리드 |
| `tool_detail` | Tool 상세 페이지 | Tool 설명 하단 CTA |
| `guide_cta` | Guide CTA | Guide → Route/Tool 연결 |
| `guide_cta_bottom` | Guide 하단 CTA | Guide 본문 하단 |
| `best3` | Best 3 Tools | 홈 추천 섹션 |
| `trending` | Trending Tools | 트렌딩 섹션 |

---

## 8. 다음 단계

### Phase 1 (현재)
- [x] affiliate_click 이벤트 구현
- [x] Custom dimensions 등록
- [x] Explorations 리포트 3종 설정
- [ ] 1주일 데이터 수집

### Phase 2 (향후)
- [ ] Conversion 이벤트 추가 (optional)
- [ ] Partner별 전환율 추정
- [ ] Looker Studio 대시보드 연동

### Phase 3 (확장)
- [ ] Engagement rate 계산
- [ ] Route 추천 알고리즘 연동
- [ ] A/B 테스트 기반 홈 최적화

---

**문서 작성자**: AI Assistant  
**검토 필요**: GA4 Admin 권한 보유자  
**업데이트 주기**: 월 1회 또는 이벤트 스펙 변경 시

