import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminEventsClient from "./admin-events-client";

export default async function KrWorkspaceAdminEventsPage() {
  // 1. Get current authenticated user from server
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 2. If no user, redirect to login with next param
  if (authError || !user) {
    redirect("/kr/login?next=/kr/workspace/admin/events");
  }

  // 3. Check system_admin status
  const { data: systemAdminRow } = await supabase
    .from("system_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isSystemAdmin = !!systemAdminRow;

  // 4. Authorization check: only system_admin allowed
  if (!isSystemAdmin) {
    redirect("/kr/workspace?error=forbidden");
  }

  // 5. Render client component
  return <AdminEventsClient />;
}
