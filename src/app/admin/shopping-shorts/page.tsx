import ShoppingShortsClient from "./shopping-shorts-client";

// Auth is already enforced by src/app/admin/layout.tsx (ADMIN_KEY cookie or
// Supabase system_admin fallback) for the whole /admin/* tree.
export const dynamic = "force-dynamic";

export default function ShoppingShortsSourcingPage() {
  return <ShoppingShortsClient />;
}
