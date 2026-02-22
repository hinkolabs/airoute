import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BillingPageClient from "./billing-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function KrWorkspaceBillingPage() {
  // 1. Get current authenticated user from server
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 2. If no user, redirect to login with next param
  if (authError || !user) {
    redirect("/kr/login?next=/kr/workspace/billing");
  }

  // 3. Get active workspace with role
  // Try to get workspace from query param or use the first one
  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError || !memberships || memberships.length === 0) {
    // No workspace found - redirect to workspace setup
    redirect("/kr/workspace");
  }

  const activeWorkspaceMembership = memberships[0];
  const workspaceId = activeWorkspaceMembership.workspace_id;
  const userRole = activeWorkspaceMembership.role as "owner" | "admin" | "member";

  // Get workspace details
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, type")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    redirect("/kr/workspace");
  }

  // 4. Check system_admin status
  const { data: systemAdminRow } = await supabase
    .from("system_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isSystemAdmin = !!systemAdminRow;

  // 5. Authorization check
  // - system_admin: always allowed
  // - owner/admin: allowed
  // - member: blocked
  if (!isSystemAdmin && userRole !== "owner" && userRole !== "admin") {
    redirect("/kr/workspace?error=forbidden");
  }

  // 6. Get active subscription for current workspace
  const { data: subscription } = await supabase
    .from("workspace_subscriptions")
    .select("status, plan_key")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .maybeSingle();

  // 7. Pass data to client component (existing UI logic)
  return (
    <BillingPageClient
      workspace={{
        id: workspace.id,
        name: workspace.name,
        workspaceType: workspace.type as "personal" | "company",
      }}
      isSystemAdmin={isSystemAdmin}
      subscription={subscription}
    />
  );
}
