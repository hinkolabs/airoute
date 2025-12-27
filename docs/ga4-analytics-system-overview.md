# GA4 이벤트 계측 및 리포팅 시스템 - 전체 요약

**작성일**: 2025-12-23  
**버전**: 1.0  
**상태**: Production Ready

---

## 📌 시스템 개요

Airoute의 **affiliate_click** 이벤트를 중심으로:
1. **코드 레벨**: 모든 외부 링크 클릭 추적
2. **GA4 레벨**: Custom Dimensions + Explorations 리포트
3. **운영 레벨**: 데이터 기반 Route/Tool 교체 의사결정

**핵심 원칙**:
- ❌ 수익 금액 추정하지 않음
- ❌ Conversion rate 계산하지 않음
- ⭕ **Event count + 구조 비교만 사용**
- ⭕ "어디서 돈 냄새가 나는가"만 추적

---

## 🎯 완료된 작업

### 1. 코드 구현 (`src/components/AffiliateLinkButton.tsx`)

#### 추가된 기능:
- ✅ `route_slug` prop (Route 컨텍스트)
- ✅ `guide_slug` prop (Guide 컨텍스트)
- ✅ `is_internal_traffic` 자동 판단 (localhost/preview 감지)

#### GA4 이벤트 스펙:
```typescript
gtag('event', 'affiliate_click', {
  partner_name: string,       // 필수 - affiliate partner 식별자
  tool_slug: string,          // 필수 - Tool 식별자
  link_url: string,           // 필수 - 외부 링크 URL
  placement: string,          // 필수 - 클릭 위치 컨텍스트
  route_slug: string | null,  // 선택 - Route 컨텍스트
  guide_slug: string | null,  // 선택 - Guide 컨텍스트
  is_internal_traffic: boolean // 필수 - 내부 트래픽 플래그
});
```

### 2. GA4 설정 문서

| 문서 | 목적 | 대상 |
|---|---|---|
| `ga4-custom-dimensions-setup.md` | Custom Dimensions 등록 스크립트 | GA4 Admin |
| `ga4-explorations-setup-guide.md` | Explorations 리포트 3종 설정 (상세) | GA4 Admin |
| `ga4-explorations-quick-checklist.md` | 5분 빠른 설정 체크리스트 | GA4 Admin |

### 3. README 업데이트

- Analytics & Tracking 섹션 추가
- 문서 참조 링크 추가
- 프로젝트 구조 업데이트

---

## 📊 GA4 리포트 3종 (요약)

### Exploration #1: Affiliate Click Overview
**목적**: 전체 클릭 분포 확인

**구조**:
- Rows: `route_slug`, `tool_slug`
- Columns: `placement`
- Values: Event count

**활용**: 어떤 Route/Tool/Placement가 강한지 전체 파악

---

### Exploration #2: Route × Tool Revenue Signal
**목적**: Route별 수익 잠재력 비교

**구조**:
- Rows: `route_slug`
- Columns: `tool_slug`
- Values: Event count
- Filter: `route_slug is not null`

**활용**: 약한 Route 제거, 홈 Best Route 교체 판단

---

### Exploration #3: Placement Performance
**목적**: 홈 UI 교체 판단

**구조**:
- Rows: `placement`
- Columns: `partner_name`
- Values: Event count

**활용**: `home_best_route` vs `guide_cta` 효과성 비교

---

## 🔄 주간 운영 루틴

### 월요일 오전
1. **Exploration #1** 확인
2. 지난주 대비 변화 체크
3. 이상 신호 마킹

### 수요일 오후
1. **Exploration #2** 확인
2. Route 순위 변동 체크
3. 교체 후보 선정

### 금요일 오후
1. **Exploration #3** 확인
2. Placement 효과성 평가
3. 홈 UI 변경 필요성 판단

---

## 🎯 의사결정 기준

### Route 유지
- 주간 클릭 30+ 이상
- Tool 다양성 2개 이상
- 하락 추세 없음

### Route 관찰 대상
- 주간 클릭 10~29
- Tool 1개에만 집중
- 2주 연속 하락

### Route 교체
- 주간 클릭 10 미만
- 3주 연속 하락
- Placement 기여도 0

---

## 🚀 다음 단계 (순서대로)

### 1단계: GA4 Custom Dimensions 등록 (Day 1)
- [ ] `docs/ga4-custom-dimensions-setup.md` 참고
- [ ] 6개 Custom Dimensions 등록
- [ ] 24시간 대기

### 2단계: Explorations 리포트 생성 (Day 2~3)
- [ ] `docs/ga4-explorations-setup-guide.md` 참고
- [ ] 리포트 3종 생성
- [ ] 데이터 확인

### 3단계: 1주일 데이터 수집 (Day 4~10)
- [ ] Realtime 이벤트 모니터링
- [ ] 내부 트래픽 필터 작동 확인
- [ ] 리포트 숫자 확인

### 4단계: 주간 운영 시작 (Day 11~)
- [ ] 월/수/금 루틴 설정
- [ ] 의사결정 기준 적용
- [ ] Route/Tool 교체 실행

---

## 📚 전체 문서 체계

```
airoute/
├── README.md                           # 프로젝트 전체 개요 + Analytics 섹션
├── docs/
│   ├── THIS-FILE.md                   # ⭐ 전체 요약 (이 문서)
│   ├── ga4-custom-dimensions-setup.md # 1단계: Custom Dimensions 등록
│   ├── ga4-explorations-setup-guide.md # 2단계: Explorations 상세 설정
│   └── ga4-explorations-quick-checklist.md # 빠른 참조 체크리스트
└── src/
    └── components/
        └── AffiliateLinkButton.tsx     # 이벤트 전송 코드 (주석 참고)
```

---

## 🔍 핵심 파일 참조

### 코드
- **이벤트 전송**: `src/components/AffiliateLinkButton.tsx` (line 89-147)
- **Route 컨텍스트 전달**: `src/app/routes/[slug]/route-detail-content.tsx` (line 221-232)
- **GA4 타입 정의**: `src/types/global.d.ts` (line 4-6)

### 문서
- **빠른 시작**: `docs/ga4-explorations-quick-checklist.md`
- **상세 가이드**: `docs/ga4-explorations-setup-guide.md`
- **Admin 설정**: `docs/ga4-custom-dimensions-setup.md`

---

## ⚠️ 주의사항

### 코드
1. ❌ `AffiliateLinkButton`의 `href` prop 변경 금지
2. ❌ `placement` 값 임의 추가 금지 (Placement 참조표 확인)
3. ❌ 이벤트 이름 변경 금지 (`affiliate_click` 고정)

### GA4
1. ❌ Custom Dimension 삭제 금지
2. ❌ Event parameter 이름 변경 금지
3. ⭕ 필터 조건만 수정 가능

### 운영
1. ❌ 클릭 1회 = $1 같은 추정 금지
2. ❌ Conversion 없이 수익 예측 금지
3. ⭕ Event count 비교만 사용

---

## 🚨 트러블슈팅 빠른 참조

| 증상 | 해결 문서 |
|---|---|
| Custom dimension 안 보임 | `ga4-custom-dimensions-setup.md` → 문제 1 |
| 리포트 데이터 0 | `ga4-explorations-setup-guide.md` → 트러블슈팅 |
| route_slug 전부 null | `ga4-explorations-setup-guide.md` → 문제 3 |
| is_internal_traffic 필터 안 됨 | `ga4-explorations-setup-guide.md` → 문제 2 |
| partner_name = unknown | `ga4-custom-dimensions-setup.md` → 문제 5 |

---

## 📞 지원 및 연락처

- **코드 관련**: `src/components/AffiliateLinkButton.tsx` 주석 참고
- **GA4 설정**: `docs/` 폴더 내 해당 가이드 참고
- **프로젝트 문의**: ramumkii@hinkolabs.com

---

**마지막 업데이트**: 2025-12-23  
**다음 리뷰**: 2026-01-23 (1개월 후)  
**버전**: 1.0 - Production Ready


