export const dynamic = 'force-dynamic';

import WorkspacePlaceholder from "../_components/workspace-placeholder";

export default function WorkspaceMessagesPage() {
  return (
    <WorkspacePlaceholder
      title="Messages"
      description="Manage team messages and customer communications. Coming soon."
      backHref="/workspace"
    />
  );
}
