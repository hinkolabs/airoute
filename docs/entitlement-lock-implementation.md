# Entitlement Lock Implementation (is_paid_for_lock)

## 개요
Entitlement SSOT API가 "UI 잠금 해제 기준"을 서버에서 확정해서 내려주도록 개선.

## 목표
- **Company Workspace**: 구독 없어도 항상 유료 기능 unlock (`is_paid_for_lock = true`)
- **Personal Workspace**: 구독 active일 때만 unlock (`is_paid_for_lock = is_paid_by_subscription`)
- 기존 entitlement 필드들은 모두 유지

---

## 구현 로직

### Server Side (API)
**파일**: `src/app/api/workspace/entitlement/route.ts`

```typescript
const workspaceType = workspaceRow?.type;
const isPaidForLock = workspaceType === 'company' ? true : !!isPaidBySubscription;

capabilities: {
  can_manage_billing: ...,
  is_paid_by_subscription: ...,
  is_paid: ...,
  is_paid_for_lock: isPaidForLock,  // ⭐ NEW
}
```

### Client Side (Types)
**파일**: `src/lib/billing/entitlements.ts`

```typescript
const isPaidForLock = workspaceType === 'company' ? true : isPaidBySubscription;

capabilities: {
  is_paid_by_subscription: isPaidBySubscription,
  can_manage_billing: canManageBilling,
  is_paid_for_lock: isPaidForLock,  // ⭐ NEW
}
```

### UI Component
**파일**: `src/app/(workspace)/kr/workspace/_components/workspace-sidebar.tsx`

```typescript
// BEFORE (클라이언트에서 계산)
const workspaceType = entitlement?.workspace?.type;
const isPaidBySub = entitlement?.capabilities?.is_paid_by_subscription === true;
const isCompany = workspaceType === 'company';
const isPaidForLock = isCompany || isPaidBySub;

// AFTER (서버에서 계산된 값 사용)
const isPaidForLock = entitlement?.capabilities?.is_paid_for_lock === true;
```

---

## 테스트

### 로컬 테스트 페이지
**URL**: `http://localhost:3000/test-entitlement-lock.html`

### 테스트 케이스

| Workspace Type | Subscription | Expected `is_paid_for_lock` | Expected `is_paid_by_subscription` |
|----------------|--------------|----------------------------|-----------------------------------|
| `company`      | ❌ (없음)     | ✅ `true`                  | ❌ `false`                         |
| `company`      | ✅ (active)   | ✅ `true`                  | ✅ `true`                          |
| `personal`     | ✅ (active)   | ✅ `true`                  | ✅ `true`                          |
| `personal`     | ❌ (없음)     | ❌ `false`                 | ❌ `false`                         |

### Manual API Test (curl)

```bash
# Company workspace (should return is_paid_for_lock: true even without subscription)
curl -H "Cookie: YOUR_SESSION_COOKIE" \
  "http://localhost:3000/api/workspace/entitlement?workspace_id=ee45..."

# Personal paid workspace (should return is_paid_for_lock: true)
curl -H "Cookie: YOUR_SESSION_COOKIE" \
  "http://localhost:3000/api/workspace/entitlement?workspace_id=8e6a..."
```

---

## 기존 필드 유지 (변경 없음)

### Capabilities
- ✅ `can_manage_billing`: owner/admin/system_admin만 결제 관리 가능
- ✅ `is_paid_by_subscription`: 구독 상태가 'active'인지 여부
- ✅ `is_paid`: system_admin 우회 포함한 "유료 기능 사용 가능" 여부

### 민감 정보 제외
- ✅ `stripe_customer_id`, `stripe_subscription_id` 등은 응답에서 제외 유지

---

## 변경 파일 목록

1. **`src/app/api/workspace/entitlement/route.ts`**
   - `is_paid_for_lock` 계산 로직 추가
   - `capabilities`에 새 필드 추가

2. **`src/lib/billing/entitlements.ts`**
   - 클라이언트 측 `Entitlement` 타입에 `is_paid_for_lock` 추가
   - `getEntitlements()` 함수에 동일 로직 구현

3. **`src/app/(workspace)/kr/workspace/_components/workspace-sidebar.tsx`**
   - 클라이언트 계산 제거, 서버에서 내려온 `is_paid_for_lock` 직접 사용

4. **`public/test-entitlement-lock.html`**
   - 로컬 테스트용 UI 추가

5. **`src/app/_providers/workspace-provider.tsx`**
   - `workspaceRole` 파라미터를 `getEntitlements()`에 전달하도록 업데이트

---

## 참고 사항

### Why Server-Side Calculation?
- **SSOT (Single Source of Truth)**: 잠금 로직이 서버에서 확정되어 클라이언트 불일치 방지
- **Simplicity**: UI 컴포넌트는 단순히 `is_paid_for_lock` 값만 확인
- **Consistency**: 모든 클라이언트(Web, Mobile, Admin)가 동일한 로직 적용

### Migration Path
- 기존 코드와 100% 호환
- `is_paid_for_lock` 추가만으로 기존 필드 변경 없음
- 점진적으로 다른 컴포�트들도 `is_paid_for_lock` 사용으로 전환 가능

---

## 다음 단계

1. ✅ 로컬 테스트 (`/test-entitlement-lock.html`)
2. ✅ 실제 workspace ID로 API 응답 확인
3. 🔄 다른 workspace 컴포넌트들도 `is_paid_for_lock` 사용으로 전환 고려
4. 🔄 모바일/관리자 UI에도 동일 로직 적용

---

**작성일**: 2026-01-17
**작성자**: AI (Claude Sonnet 4.5)
