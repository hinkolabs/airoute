import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminOpsClient from "./admin-ops-client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminOpsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login?next=/kr/admin/ops");
  }

  // Check system_admin status
  const { data: systemAdminRow } = await supabase
    .from("system_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!systemAdminRow) {
    redirect("/kr/workspace?error=forbidden");
  }

  return <AdminOpsClient />;
}
