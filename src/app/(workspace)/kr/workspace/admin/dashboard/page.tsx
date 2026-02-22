import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboardClient from "./admin-dashboard-client";

export default async function AdminDashboardPage() {
  // 1. Get current authenticated user from server
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // 2. If no user, redirect to login
  if (authError || !user) {
    redirect("/kr/login?next=/kr/workspace/admin/dashboard");
  }

  // 3. Check system_admin status (REQUIRED for this page)
  const { data: systemAdminRow } = await supabase
    .from("system_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const isSystemAdmin = !!systemAdminRow;

  // 4. Authorization check: system_admin ONLY
  if (!isSystemAdmin) {
    redirect("/kr/workspace?error=forbidden");
  }

  // 5. Pass to client component
  return <AdminDashboardClient />;
}
