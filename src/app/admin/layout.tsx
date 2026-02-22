import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read current pathname from middleware header
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  // /admin/login is the entry point — skip auth check to avoid redirect loop
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Check legacy ADMIN_KEY cookie (set by /admin/login form)
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("airoute_admin")?.value;
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && adminCookie === adminKey) {
    return <>{children}</>;
  }

  // Check Supabase auth + system_admins table
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect("/admin/login");
    }

    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!systemAdminRow) {
      redirect("/admin/login");
    }

    return <>{children}</>;
  } catch (error) {
    // Re-throw redirect errors so Next.js handles them correctly
    const isRedirect =
      error instanceof Error && "digest" in error &&
      typeof (error as { digest?: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT");
    if (isRedirect) throw error;

    console.error("[Admin Layout] Error:", error);
    redirect("/admin/login");
  }
}
