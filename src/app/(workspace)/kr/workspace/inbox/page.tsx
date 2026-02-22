export const dynamic = 'force-dynamic';

import WorkspacePlaceholder from "@/app/(workspace)/workspace/_components/workspace-placeholder";

export default function KrWorkspaceInboxPage() {
  return (
    <WorkspacePlaceholder
      title="인박스"
      description="팀과 함께 확인할 수 있는 알림/메시지 공간을 곧 공개합니다."
      backHref="/kr/workspace"
    />
  );
}
