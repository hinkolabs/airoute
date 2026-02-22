import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AutoPostingClient from "./_components/auto-posting-client";

type Props = {
  searchParams: Promise<{ workspace_id?: string }>;
};

export default async function AutoPostingPage({ searchParams }: Props) {
  // 1. Get current authenticated user from server
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 2. If no user, redirect to login with next param
  if (authError || !user) {
    redirect("/kr/login?next=/kr/workspace/auto-posting");
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
    redirect("/kr/workspace");
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

  // 5. Check entitlement directly from DB
  const { data: subscriptionRow } = await supabase
    .from("workspace_subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle();

  const isPaidBySubscription = !!subscriptionRow && subscriptionRow.status === "active";
  const isPaidForLock = workspace.type === "company" ? true : isPaidBySubscription;

  // 6. Guard: if not paid, redirect to billing
  if (!isPaidForLock) {
    const currentPath = encodeURIComponent("/kr/workspace/auto-posting");
    redirect(`/kr/workspace/billing?next=${currentPath}`);
  }

  // 7. Render the client component
  return <AutoPostingClient />;
}
