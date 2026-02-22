import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BillingHistoryClient from "./billing-history-client";

export default async function BillingHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ ws?: string }>;
}) {
  // 1. Get current authenticated user from server
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 2. If no user, redirect to login
  if (authError || !user) {
    redirect("/auth/login?next=/kr/workspace/billing/history");
  }

  // 3. Get workspace_id from query param or use first membership
  const params = await searchParams;
  let workspaceId = params.ws;

  if (!workspaceId) {
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (!memberships || memberships.length === 0) {
      redirect("/kr/workspace");
    }

    workspaceId = memberships[0].workspace_id;
  }

  // Ensure workspaceId is defined (for TypeScript)
  if (!workspaceId) {
    redirect("/kr/workspace?error=no_workspace");
  }

  // 4. Verify membership
  const { data: membershipRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membershipRow) {
    redirect("/kr/workspace?error=not_a_member");
  }

  // 5. Check system_admin status
  const { data: systemAdminRow } = await supabase
    .from("system_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isSystemAdmin = !!systemAdminRow;

  // 6. Pass data to client component
  return (
    <BillingHistoryClient
      workspaceId={workspaceId}
      isSystemAdmin={isSystemAdmin}
    />
  );
}
