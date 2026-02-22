import WorkspacePlaceholder from "../_components/workspace-placeholder";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function WorkspaceSettingsPage() {
  return (
    <WorkspacePlaceholder
      title="Workspace Settings"
      description="Manage notifications, members, and permissions. Coming soon."
      backHref="/workspace"
    />
  );
}
