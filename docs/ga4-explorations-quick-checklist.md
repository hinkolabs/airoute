# GA4 Explorations 빠른 설정 체크리스트

**5분 완성용** - 세부 설명은 `ga4-explorations-setup-guide.md` 참조

---

## ✅ 사전 준비 (한 번만)

### 1. Custom Dimensions 등록 확인
GA4 Admin → Custom definitions → **다음 6개 확인:**

- [ ] `partner_name` (Event)
- [ ] `tool_slug` (Event)
- [ ] `placement` (Event)
- [ ] `route_slug` (Event)
- [ ] `guide_slug` (Event)
- [ ] `is_internal_traffic` (Event)

**없으면**: Create custom dimension → Event parameter와 정확히 동일한 이름으로 등록

---

## 📊 리포트 #1: Affiliate Click Overview

### 설정 (2분)
```
GA4 → Explore → + Blank

Technique: Free form

Dimensions:
- route_slug
- tool_slug
- placement

Metrics:
- Event count

Rows: route_slug, tool_slug
Columns: placement
Values: Event count

Filters:
1. Event name = affiliate_click
2. is_internal_traffic = false

저장: "Affiliate Click Overview"
```

### 용도
- 전체 클릭 분포 확인
- Route vs Tool vs Placement 비교

---

## 📊 리포트 #2: Route × Tool Revenue Signal

### 설정 (2분)
```
GA4 → Explore → + Blank

Technique: Free form

Dimensions:
- route_slug
- tool_slug

Metrics:
- Event count

Rows: route_slug
Columns: tool_slug
Values: Event count

Filters:
1. Event name = affiliate_click
2. route_slug is not null
3. is_internal_traffic = false

Sort: Event count DESC

저장: "Route × Tool Revenue Signal"
```

### 용도
- Route별 수익 잠재력 비교
- 약한 Route 제거 판단

---

## 📊 리포트 #3: Placement Performance

### 설정 (2분)
```
GA4 → Explore → + Blank

Technique: Free form

Dimensions:
- placement
- partner_name

Metrics:
- Event count

Rows: placement
Columns: partner_name
Values: Event count

Filters:
1. Event name = affiliate_click
2. is_internal_traffic = false

Sort: Event count DESC

저장: "Placement Performance"
```

### 용도
- 홈 UI 교체 판단
- Placement 효과성 비교

---

## 🔍 빠른 검증 (리포트 설정 후)

### 1. 데이터 보이는지 확인
- [ ] 리포트에 숫자가 보임 (0이 아님)
- [ ] `(not set)` 항목이 없거나 소수

### 2. 내부 트래픽 필터 작동 확인
- [ ] 필터 제거 시 숫자 증가
- [ ] 필터 적용 시 localhost 클릭 제외됨

### 3. Context 파라미터 확인
- [ ] `route_slug` - route 상세에서 클릭 시 값 있음
- [ ] `placement` - 모든 클릭에 값 있음
- [ ] `partner_name` - unknown 아닌 실제 도메인명

---

## 🚨 문제 발생 시

| 증상 | 해결 |
|---|---|
| Custom dimension 안 보임 | 24시간 대기 필요 |
| 데이터가 0 | 필터 임시 제거 후 확인 |
| route_slug 전부 null | Route 외부 클릭 (정상) |
| partner_name = unknown | URL 형식 확인 |

---

## 📅 주간 운영 루틴

### 월요일 오전
- **리포트 #1** 확인 → 전주 대비 변화

### 수요일 오후  
- **리포트 #2** 확인 → Route 순위 체크

### 금요일 오후
- **리포트 #3** 확인 → Placement 효과성

---

## 🎯 의사결정 기준 (요약)

### Route 유지
- 주간 클릭 30+
- Tool 2개 이상
- 하락세 없음

### Route 교체
- 주간 클릭 10 미만
- 3주 연속 하락
- Placement 기여도 0

---

**상세 가이드**: `docs/ga4-explorations-setup-guide.md`  
**이벤트 스펙**: `src/components/AffiliateLinkButton.tsx` (코드 주석)




