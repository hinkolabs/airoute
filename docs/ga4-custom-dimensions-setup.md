# GA4 Custom Dimensions 설정 스크립트

**목적**: affiliate_click 이벤트 파라미터를 GA4 Custom Dimensions로 등록  
**소요 시간**: 약 5분  
**권한 필요**: GA4 Property Editor 이상

---

## 📋 등록할 Custom Dimensions (총 6개)

아래 항목들을 **순서대로** 등록하세요.

---

### 1. partner_name

**GA4 Admin → Custom definitions → Create custom dimension**

```
Dimension name: Partner Name
Scope: Event
Description: Affiliate partner identifier (extracted from domain)
Event parameter: partner_name
```

**저장** 클릭

---

### 2. tool_slug

**Create custom dimension** 클릭

```
Dimension name: Tool Slug
Scope: Event
Description: Tool identifier (slug or ID)
Event parameter: tool_slug
```

**저장** 클릭

---

### 3. placement

**Create custom dimension** 클릭

```
Dimension name: Placement
Scope: Event
Description: Click placement context (e.g., route_detail, tool_card)
Event parameter: placement
```

**저장** 클릭

---

### 4. route_slug

**Create custom dimension** 클릭

```
Dimension name: Route Slug
Scope: Event
Description: Route context (nullable - only present in route pages)
Event parameter: route_slug
```

**저장** 클릭

---

### 5. guide_slug

**Create custom dimension** 클릭

```
Dimension name: Guide Slug
Scope: Event
Description: Guide context (nullable - only present in guide CTAs)
Event parameter: guide_slug
```

**저장** 클릭

---

### 6. is_internal_traffic

**Create custom dimension** 클릭

```
Dimension name: Is Internal Traffic
Scope: Event
Description: Internal/test traffic flag (true for localhost/preview)
Event parameter: is_internal_traffic
```

**저장** 클릭

---

## ✅ 등록 완료 확인

### 1. Custom definitions 목록 확인

GA4 Admin → Custom definitions → Custom dimensions 탭

**다음 6개 항목이 보여야 함:**

| Dimension name | Scope | Event parameter |
|---|---|---|
| Partner Name | Event | partner_name |
| Tool Slug | Event | tool_slug |
| Placement | Event | placement |
| Route Slug | Event | route_slug |
| Guide Slug | Event | guide_slug |
| Is Internal Traffic | Event | is_internal_traffic |

### 2. 24시간 대기

- Custom dimensions는 등록 후 **24~48시간** 후부터 데이터 수집 시작
- 과거 데이터에는 적용되지 않음 (등록 시점 이후만)

### 3. Realtime 이벤트 확인 (24시간 후)

**GA4 → Reports → Realtime → Event count by Event name**

1. `affiliate_click` 이벤트 클릭
2. 우측 패널에서 **"Event parameters"** 확인
3. 다음 파라미터들이 보이는지 확인:
   - `partner_name`
   - `tool_slug`
   - `placement`
   - `route_slug` (Route 페이지 클릭 시만)
   - `guide_slug` (Guide CTA 클릭 시만)
   - `is_internal_traffic`

---

## 🎯 다음 단계

Custom dimensions 등록이 완료되었으면:

1. **24시간 대기** (데이터 수집 시작)
2. `docs/ga4-explorations-setup-guide.md` 참고하여 **Explorations 리포트 3종** 생성
3. 주간 운영 루틴 시작

---

## 🚨 트러블슈팅

### 문제 1: "Event parameter를 찾을 수 없어요"

**원인**: 이벤트 parameter 이름 오타

**해결**:
1. 코드에서 전송되는 parameter 이름 확인: `src/components/AffiliateLinkButton.tsx`
2. GA4에서 Realtime 이벤트 → `affiliate_click` → Event parameters에서 **정확한 이름** 확인
3. Custom dimension의 "Event parameter" 값과 정확히 일치시킴

### 문제 2: "Scope를 User로 선택했어요"

**원인**: Scope 잘못 선택

**해결**:
1. 해당 Custom dimension 삭제
2. 재생성 시 **Scope: Event** 선택

### 문제 3: "이미 Custom dimension 30개를 사용 중이에요"

**원인**: GA4 무료 버전은 Custom dimension 50개 제한 (Event 25개 + User 25개)

**해결**:
1. 사용하지 않는 Custom dimension 삭제
2. 또는 GA4 360 업그레이드 고려

### 문제 4: "Realtime에서 파라미터가 안 보여요"

**원인**:
- 아직 해당 이벤트가 발생하지 않음
- 코드에서 이벤트 전송 안 됨

**해결**:
1. 로컬 환경에서 테스트 클릭 실행
2. 브라우저 콘솔에서 `📊 GA4 Affiliate Click:` 로그 확인
3. 로그는 있는데 GA4에 안 보이면 gtag 설정 확인 (`src/app/layout.tsx`)

---

## 📚 참고 문서

- **이벤트 스펙**: `src/components/AffiliateLinkButton.tsx` (line 112-120)
- **Explorations 설정**: `docs/ga4-explorations-setup-guide.md`
- **빠른 체크리스트**: `docs/ga4-explorations-quick-checklist.md`

---

**작성일**: 2025-12-23  
**버전**: 1.0  
**업데이트 필요 시**: 이벤트 파라미터 추가/변경 시

