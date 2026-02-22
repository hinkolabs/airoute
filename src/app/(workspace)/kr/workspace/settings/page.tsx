import WorkspacePlaceholder from "@/app/(workspace)/workspace/_components/workspace-placeholder";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function KrWorkspaceSettingsPage() {
  return (
    <WorkspacePlaceholder
      title="워크스페이스 설정"
      description="알림, 멤버, 권한을 관리할 수 있는 설정 화면을 곧 제공합니다."
      backHref="/kr/workspace"
    />
  );
}
