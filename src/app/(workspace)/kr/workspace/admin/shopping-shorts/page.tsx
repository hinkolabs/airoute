import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShoppingShortsClient from "./shopping-shorts-client";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function ShoppingShortsSourcingPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/kr/login?next=/kr/workspace/admin/shopping-shorts");
  }

  const { data: systemAdminRow } = await supabase
    .from("system_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!systemAdminRow) {
    redirect("/kr/workspace?error=forbidden");
  }

  return <ShoppingShortsClient />;
}
