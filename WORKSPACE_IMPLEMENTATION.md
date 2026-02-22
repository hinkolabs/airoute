# 워크스페이스 생성 및 비즈니스 결제 플로우 구현

## 구현 완료 항목

### 1. 워크스페이스 타입 정의
- `src/types/db-workspace.ts` - 워크스페이스 및 멤버 타입 정의
- `src/lib/workspace/getActiveWorkspace.ts` - 기존 타입 활용

### 2. UI 컴포넌트
#### 워크스페이스 생성 모달
- `src/app/kr/workspace/_components/create-workspace-modal.tsx`
- 워크스페이스 이름 입력 (2~40자)
- 생성 성공 시 새 워크스페이스로 리다이렉트

#### 워크스페이스 드롭다운
- `src/app/kr/workspace/_components/workspace-header.tsx` 수정
- 워크스페이스 목록 표시
- 워크스페이스 전환 기능
- "워크스페이스 추가" 버튼 추가
- 실제 워크스페이스 데이터 연동

#### 결제 페이지 컴포넌트
- `src/app/kr/workspace/_components/personal-pricing.tsx` - 개인 플랜 (Starter/Pro)
- `src/app/kr/workspace/_components/biz-pricing.tsx` - 비즈니스 플랜 (좌석 기반)

### 3. API 라우트
#### 워크스페이스 생성
- `src/app/api/workspaces/create/route.ts`
- POST 요청으로 워크스페이스 생성
- 자동으로 workspaces + workspace_members 테이블에 삽입
- type='business'로 생성
- role='owner'로 멤버십 생성
- 트랜잭션 실패 시 롤백

### 4. 상태 관리
#### 워크스페이스 프로바이더
- `src/app/_providers/workspace-provider.tsx`
- activeWorkspace: 현재 활성 워크스페이스
- workspaces: 사용자의 모든 워크스페이스 목록
- membersCount: 현재 워크스페이스 멤버 수
- loading/error 상태
- refreshWorkspace() 함수

#### 레이아웃 통합
- `src/app/kr/workspace/layout.tsx`
- WorkspaceProvider로 전체 레이아웃 래핑
- 모든 하위 페이지에서 useWorkspace() 훅 사용 가능

### 5. 결제 페이지
- `src/app/kr/workspace/billing/page.tsx`
- 워크스페이스 타입에 따라 자동 분기:
  - personal: PersonalPricing 컴포넌트 (Starter/Pro 2단계)
  - business: BizPricing 컴포넌트 (좌석 기반, 1~50석)
- 좌석 수 선택 UI
- 총 금액 계산 (좌석당 ₩15,000/월)

## 데이터베이스 요구사항

### workspaces 테이블
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('personal', 'business')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### workspace_members 테이블
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

### RLS 정책 (예시)
```sql
-- workspace_members: 자신이 멤버인 워크스페이스만 조회
CREATE POLICY "Users can view their workspace memberships"
  ON workspace_members FOR SELECT
  USING (auth.uid() = user_id);

-- workspace_members: 인증된 사용자는 자신을 멤버로 추가 가능
CREATE POLICY "Users can insert their own membership"
  ON workspace_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- workspaces: 자신이 멤버인 워크스페이스만 조회
CREATE POLICY "Users can view their workspaces"
  ON workspaces FOR SELECT
  USING (id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

-- workspaces: 인증된 사용자는 워크스페이스 생성 가능
CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

## 테스트 시나리오

### 1. 워크스페이스 생성
1. 로그인 후 워크스페이스 드롭다운 클릭
2. "워크스페이스 추가" 클릭
3. 워크스페이스 이름 입력 (예: "마케팅팀")
4. "생성" 버튼 클릭
5. 새 워크스페이스로 리다이렉트 확인
6. DB 확인:
   - workspaces 테이블에 새 행 (type='business')
   - workspace_members 테이블에 owner 행

### 2. 워크스페이스 전환
1. 워크스페이스 드롭다운 클릭
2. 다른 워크스페이스 선택
3. 페이지 새로고침 없이 전환 확인
4. 헤더에 선택된 워크스페이스 이름 표시 확인

### 3. 결제 페이지 - Personal
1. Personal Workspace 선택
2. "구독 및 결제" 메뉴 클릭
3. Starter/Pro 2단계 플랜 표시 확인
4. 각 플랜의 기능 목록 확인

### 4. 결제 페이지 - Business
1. Business Workspace 선택 (새로 생성한 워크스페이스)
2. "구독 및 결제" 메뉴 클릭
3. 좌석 기반 Team 플랜 표시 확인
4. 좌석 수 증감 버튼으로 1~50 범위 조절
5. 총 금액 자동 계산 확인 (좌석 수 × ₩15,000)
6. "좌석 구매하기" 버튼 클릭 시 콘솔 로그 확인

## 수정된 파일 목록

### 새로 생성된 파일
1. `src/app/kr/workspace/_components/create-workspace-modal.tsx`
2. `src/app/kr/workspace/_components/personal-pricing.tsx`
3. `src/app/kr/workspace/_components/biz-pricing.tsx`
4. `src/app/api/workspaces/create/route.ts`
5. `src/app/_providers/workspace-provider.tsx`
6. `src/types/db-workspace.ts`

### 수정된 파일
1. `src/app/kr/workspace/_components/workspace-header.tsx`
2. `src/app/kr/workspace/layout.tsx`
3. `src/app/kr/workspace/billing/page.tsx`

## 다음 단계 (향후 구현)

### 결제 연동
- Stripe Checkout Session 생성
- 좌석 구매 완료 후 subscription 레코드 생성
- 구독 상태 표시

### 팀 관리
- 팀원 초대 기능
- 역할 관리 (owner/admin/member)
- 팀원 제거 기능

### 좌석 추가
- 기존 구독에 좌석 추가 기능
- 즉시 결제 or 다음 청구일 합산

### 구독 취소
- 좌석 감소 기능
- 구독 취소 및 환불 정책

## 주의사항

1. **데이터베이스 마이그레이션 필수**
   - workspaces 테이블 생성
   - workspace_members 테이블 생성
   - RLS 정책 설정

2. **기존 Personal Workspace 마이그레이션**
   - 기존 사용자들은 `ensurePersonalWorkspace()` 함수로 자동 생성
   - 이미 getActiveWorkspace.ts에 구현되어 있음

3. **결제 시스템은 플레이스홀더**
   - 현재는 콘솔 로그 및 alert만 표시
   - Stripe 연동은 별도 작업 필요

4. **토큰 밸런스는 하드코딩**
   - 워크스페이스 헤더의 "1,000" 토큰은 임시 값
   - 실제 DB에서 가져오도록 수정 필요
