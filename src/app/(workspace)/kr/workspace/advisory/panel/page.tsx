import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VerdictClient from "./verdict-client";

type Props = {
  searchParams: Promise<{ workspace_id?: string }>;
};

export default async function VerdictPage({ searchParams }: Props) {
  // 1. Get current authenticated user from server
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 2. If no user, redirect to login with next param
  if (authError || !user) {
    redirect("/kr/login?next=/kr/workspace/advisory/panel");
  }

  // 3. Resolve searchParams
  const params = await searchParams;
  const requestedWorkspaceId = params.workspace_id;

  // 4. Get all user memberships
  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (membershipError || !memberships || memberships.length === 0) {
    const currentPath = encodeURIComponent("/kr/workspace/advisory/panel");
    redirect(`/kr/workspace?next=${currentPath}`);
  }

  // 5. Determine active workspace with priority:
  //    (a) requested workspace via ?workspace_id=
  //    (b) first membership as fallback
  let activeWorkspaceMembership = memberships[0];
  if (requestedWorkspaceId) {
    const found = memberships.find((m) => m.workspace_id === requestedWorkspaceId);
    if (found) {
      activeWorkspaceMembership = found;
    }
  }

  const workspaceId = activeWorkspaceMembership.workspace_id;

  // 4. Get workspace details
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, type")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    redirect("/kr/workspace");
  }

  // No paid guard needed - basic verdict is free, detailed reasoning costs 20P

  // 5. Render the client component
  return <VerdictClient workspaceId={workspaceId} />;
}
