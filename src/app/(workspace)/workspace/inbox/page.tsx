export const dynamic = 'force-dynamic';

import WorkspacePlaceholder from "../_components/workspace-placeholder";

export default function WorkspaceInboxPage() {
  return (
    <WorkspacePlaceholder
      title="Inbox"
      description="A unified space for team tasks, notifications, and messages. Coming soon."
      backHref="/workspace"
    />
  );
}

