import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in Route Handlers
          }
        },
      },
    }
  );
}

export default async function InsightLetterSettingsRoutePage() {
  const supabase = await createSupabaseClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get workspace from query or localStorage (handled by middleware/client)
  // For server component, we need to get workspace_id from the URL structure
  // But this route doesn't have [workspaceId] in path, so we redirect to main page with tab
  // This route is meant to be accessed via query param ?tab=settings, not direct URL
  // If user tries to access /kr/workspace/marketing/insight-letter/settings directly,
  // redirect to overview
  redirect("/kr/workspace/marketing/insight-letter?tab=settings");
}
