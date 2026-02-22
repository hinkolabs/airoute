# 운영자 대시보드 및 이벤트 로그 시스템 구현 완료 보고

## 구현 완료 날짜
2026-01-20

## 구현 내용 요약

system_admin 전용 운영자 대시보드와 이벤트 로그 검색 시스템을 완성했습니다. auto-posting 실행 성공/실패를 event_logs에 기록할 수 있는 인프라를 구축했으며, 대시보드에서 월별 집계를 확인할 수 있습니다.

---

## 생성/수정된 파일 목록

### 1. 신규 생성 파일

#### Admin 페이지
- `src/app/(workspace)/kr/workspace/admin/page.tsx` - Admin 대시보드 서버 컴포넌트 (system_admin guard)
- `src/app/(workspace)/kr/workspace/admin/admin-dashboard-client.tsx` - Admin 대시보드 클라이언트 UI
- `src/app/(workspace)/kr/workspace/admin/events/page.tsx` - 이벤트 로그 검색 서버 컴포넌트 (system_admin guard)
- `src/app/(workspace)/kr/workspace/admin/events/admin-events-client.tsx` - 이벤트 로그 검색 클라이언트 UI

#### API
- `src/app/api/admin/event-logs/route.ts` - 이벤트 로그 조회 API (system_admin 전용)

#### 유틸리티
- `src/lib/event-logger-autoposting.ts` - auto-posting 이벤트 로깅 함수 (logAutoPostingSuccess, logAutoPostingFail)

### 2. 수정된 파일

#### Sidebar 메뉴
- `src/app/(workspace)/kr/workspace/_components/workspace-sidebar.tsx` - Admin 메뉴 추가 (Admin Dashboard, Event Logs)

#### Metrics API 업데이트
- `src/app/api/admin/metrics/route.ts` - auto-posting 집계를 event_logs 기반으로 변경

---

## Auto-posting 실행 코드 위치 및 로그 심기

### 현재 상태
현재 레포지토리에는 **auto-posting 실행 로직이 UI 레벨에만 존재**하며, 실제 백엔드 실행 코드는 아직 구현되지 않았습니다.

다음 파일들이 auto-posting UI를 담당하고 있습니다:
- `src/app/(workspace)/kr/workspace/auto-posting/_components/auto-posting-client.tsx` (간단한 설정 UI)
- `src/app/(workspace)/kr/workspace/marketing/auto-posting/page.tsx` (상세한 자동발송 UI, 탭 구조)

### 로그 심기 방법 (향후 실행 코드 구현 시)

향후 auto-posting 실행 API를 구현할 때, 다음과 같이 이벤트 로그를 기록하면 됩니다:

```typescript
// 예시: src/app/api/workspace/auto-posting/execute/route.ts (미구현)
import { logAutoPostingSuccess, logAutoPostingFail } from "@/lib/event-logger-autoposting";

export async function POST(request: Request) {
  const { workspace_id, user_id } = await getAuthContext();
  const startTime = Date.now();

  try {
    // n8n webhook 호출 또는 자동 생성 로직 실행
    const result = await executeAutoPosting({ workspace_id, user_id });

    // 성공 로그
    await logAutoPostingSuccess({
      workspace_id,
      user_id,
      provider: "n8n",
      run_type: "scheduled",
      duration_ms: Date.now() - startTime,
      job_id: result.jobId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // 실패 로그
    await logAutoPostingFail({
      workspace_id,
      user_id,
      provider: "n8n",
      run_type: "scheduled",
      error: error.message.slice(0, 200),
    });

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## event_logs Insert Payload 예시

### 성공 이벤트
```json
{
  "event_type": "autoposting_success",
  "target_type": "autoposting",
  "target_slug": "run",
  "source": "workspace",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "anonymous_id": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "workspace_id": "660e8400-e29b-41d4-a716-446655440000",
    "provider": "n8n",
    "run_type": "scheduled",
    "status": "success",
    "duration_ms": 3421,
    "job_id": "job_abc123"
  },
  "created_at": "2026-01-20T10:30:00.000Z"
}
```

### 실패 이벤트
```json
{
  "event_type": "autoposting_fail",
  "target_type": "autoposting",
  "target_slug": "run",
  "source": "workspace",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "anonymous_id": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "workspace_id": "660e8400-e29b-41d4-a716-446655440000",
    "provider": "n8n",
    "run_type": "manual",
    "status": "fail",
    "error": "n8n webhook timeout after 30s",
    "job_id": "job_xyz789"
  },
  "created_at": "2026-01-20T10:35:00.000Z"
}
```

---

## Admin API 예시 호출

### 1. 전체 이벤트 조회 (최근 50개, 기본값)
```bash
GET /api/admin/event-logs
```

**응답 예시:**
```json
{
  "filters": {
    "from": null,
    "to": null,
    "event_type": null,
    "target_type": null,
    "user_id": null,
    "workspace_id": null,
    "limit": 50
  },
  "items": [
    {
      "id": "event-uuid-1",
      "created_at": "2026-01-20T10:30:00.000Z",
      "event_type": "autoposting_success",
      "target_type": "autoposting",
      "target_slug": "run",
      "source": "workspace",
      "user_id": "user-uuid-1",
      "metadata": {
        "workspace_id": "workspace-uuid-1",
        "provider": "n8n",
        "run_type": "scheduled",
        "status": "success",
        "duration_ms": 3421
      }
    }
  ]
}
```

### 2. 특정 기간 + event_type 필터
```bash
GET /api/admin/event-logs?from=2026-01-01&to=2026-01-31&event_type=autoposting_success&limit=100
```

### 3. 특정 워크스페이스의 auto-posting 실패 이벤트
```bash
GET /api/admin/event-logs?event_type=autoposting_fail&workspace_id=660e8400-e29b-41d4-a716-446655440000
```

### 4. 특정 사용자의 모든 이벤트
```bash
GET /api/admin/event-logs?user_id=550e8400-e29b-41d4-a716-446655440000&limit=200
```

---

## Lint 통과 여부

✅ **모든 파일 lint 통과**

다음 파일들에 대해 ESLint 검사 완료:
- `src/app/api/admin/event-logs/route.ts`
- `src/lib/event-logger-autoposting.ts`
- `src/app/(workspace)/kr/workspace/admin/page.tsx`
- `src/app/(workspace)/kr/workspace/admin/admin-dashboard-client.tsx`
- `src/app/(workspace)/kr/workspace/admin/events/page.tsx`
- `src/app/(workspace)/kr/workspace/admin/events/admin-events-client.tsx`
- `src/app/(workspace)/kr/workspace/_components/workspace-sidebar.tsx`
- `src/app/api/admin/metrics/route.ts`

**Result: No linter errors found.**

---

## 접근 권한 및 보안

### system_admin Guard 적용
- `/kr/workspace/admin` - system_admin만 접근 가능
- `/kr/workspace/admin/events` - system_admin만 접근 가능
- `/api/admin/event-logs` - system_admin만 호출 가능

권한이 없는 사용자는 `/kr/workspace?error=forbidden`으로 리다이렉트됩니다.

### 사이드바 메뉴
system_admin이 아닌 사용자에게는 Admin 메뉴가 표시되지 않습니다.

---

## 대시보드 KPI 집계 (event_logs 기반)

### Auto-posting 성공/실패 집계 로직

```typescript
// src/app/api/admin/metrics/route.ts
// 성공 count
const { count: successCount } = await adminSupabase
  .from("event_logs")
  .select("*", { count: "exact", head: true })
  .eq("event_type", "autoposting_success")
  .gte("created_at", startDate)
  .lt("created_at", endDate);

// 실패 count
const { count: failCount } = await adminSupabase
  .from("event_logs")
  .select("*", { count: "exact", head: true })
  .eq("event_type", "autoposting_fail")
  .gte("created_at", startDate)
  .lt("created_at", endDate);
```

대시보드에서 월 선택 시 해당 월의 auto-posting 성공/실패 건수를 event_logs에서 집계하여 표시합니다.

---

## 다음 단계 (실제 Auto-posting 실행 구현 시)

1. **n8n Webhook API 생성** (`/api/workspace/auto-posting/execute/route.ts`)
2. **Cron Job 또는 스케줄러 설정** (Vercel Cron 또는 외부 스케줄러)
3. **실행 로직에 logAutoPostingSuccess / logAutoPostingFail 호출 삽입**
4. **Workspace 설정 저장 API** (브랜드 설명, 톤, 수신 이메일 등)
5. **n8n 워크플로우와 연동** (실제 콘텐츠 생성 + 이메일 발송)

---

## 완료 체크리스트

- ✅ Admin Guard 공통 유틸 적용 (system_admins 테이블 기반)
- ✅ Admin 운영자 대시보드 페이지 (`/kr/workspace/admin`)
- ✅ Admin 이벤트 로그 검색 페이지 (`/kr/workspace/admin/events`)
- ✅ Admin API: GET `/api/admin/event-logs` (필터링 지원)
- ✅ Auto-posting 이벤트 로거 유틸 생성 (`src/lib/event-logger-autoposting.ts`)
- ✅ 대시보드 KPI 중 auto-posting 집계를 event_logs 기반으로 변경
- ✅ 사이드바 메뉴에 Admin Dashboard, Event Logs 추가 (system_admin만 노출)
- ✅ Lint 통과 확인

---

## 마무리

system_admin 전용 운영자 대시보드와 이벤트 로그 시스템 구축이 완료되었습니다. 향후 auto-posting 실행 로직 구현 시 `logAutoPostingSuccess` 및 `logAutoPostingFail` 함수를 호출하여 이벤트를 기록하면, 대시보드에서 실시간으로 성공/실패 건수를 확인할 수 있습니다.
