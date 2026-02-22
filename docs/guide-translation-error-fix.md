# 가이드 번역 오류 해결 가이드

## 문제 상황

관리자 페이지에서 가이드 번역 버튼을 누르면 다음 오류가 발생:

```
{"code":"P0001","details":null,"hint":null,"message":"route_based guide must have route_slug"}
```

## 원인 분석

1. **데이터베이스 제약 조건**: `guides` 테이블에 CHECK 제약 조건이 있어서, `guide_type = 'route_based'`인 가이드는 반드시 `cta_route_slug` 또는 `primary_route` 값을 가져야 함
2. **번역 API 문제**: 기존 번역 API가 일부 필드만 SELECT하여 모든 필드가 제대로 복사되지 않았음

## 해결 방법

### 1단계: 데이터베이스 마이그레이션 실행

Supabase SQL Editor에서 다음 파일을 실행하세요:

```
supabase/migrations/20260105_fix_route_based_constraint.sql
```

이 마이그레이션은 다음을 수행합니다:
- `route_based` 관련 CHECK 제약 조건을 찾아서 제거
- 남은 CHECK 제약 조건 목록을 출력

### 2단계: 문제 가이드 확인 (선택사항)

다음 SQL을 실행하여 문제가 되는 가이드 데이터를 확인:

```
debug-guide-constraints.sql
```

### 3단계: 코드 변경 사항 확인

다음 파일들이 수정되었습니다:

#### `src/app/api/admin/guides/translate-to-kr/route.ts`
- **변경 전**: 일부 필드만 SELECT (`id, slug, title, ...` 나열)
- **변경 후**: 모든 필드 SELECT (`SELECT "*"`)
- **이유**: `guide_type`이 `route_based`인 경우 필요한 모든 메타데이터를 복사해야 함

#### INSERT 로직 개선
```typescript
// 모든 메타데이터 필드를 동적으로 복사
const metadataFields = [
  'guide_type',
  'primary_intent', 
  'primary_route',
  'cta_type',
  'cta_route_slug',
  'cta_tool_slug',
  'cta_partner',
  'generation_version',
];

for (const field of metadataFields) {
  if (guide[field] !== null && guide[field] !== undefined) {
    insertData[field] = guide[field];
  }
}
```

#### `src/app/admin/guides/translate/page.tsx`
- 에러 메시지에 `code`, `details`, `hint` 정보를 포함하도록 개선
- 사용자가 정확한 오류 원인을 파악할 수 있음

## 테스트 방법

1. Supabase SQL Editor에서 마이그레이션 실행
2. 관리자 페이지 접속: `/admin/guides/translate`
3. 문제가 되었던 가이드 선택 (`create-10-commercial-images-midjourney-guide`)
4. "선택한 가이드 번역하기" 버튼 클릭
5. 성공 메시지 확인

## 예방 조치

앞으로 유사한 문제를 방지하기 위해:

1. **CHECK 제약 조건 최소화**: 데이터베이스 레벨의 비즈니스 로직은 최소화하고, 애플리케이션 레벨에서 검증
2. **필드 전체 복사**: 번역/복제 로직에서는 `SELECT *`를 사용하여 모든 필드를 가져오기
3. **에러 로깅 강화**: Supabase 에러의 `code`, `details`, `hint`를 모두 로깅

## 참고 파일

- `supabase/migrations/20260105_fix_route_based_constraint.sql` - 제약 조건 제거
- `debug-guide-constraints.sql` - 디버그용 SQL 쿼리
- `src/app/api/admin/guides/translate-to-kr/route.ts` - 번역 API
- `src/app/admin/guides/translate/page.tsx` - 번역 UI
