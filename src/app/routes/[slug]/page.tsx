import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getRouteBySlug, getRouteBest3, getAllRoutes } from "@/lib/db/routes";
import RouteDetailContent from "./route-detail-content";
import { createClient } from "@supabase/supabase-js";

interface RouteDetailPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Force dynamic rendering to avoid caching issues with route_tools updates
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateStaticParams() {
  const routes = await getAllRoutes();
  return routes.map((route) => ({ slug: route.slug }));
}

export default async function RouteDetailPage({ params, searchParams }: RouteDetailPageProps) {
  // Disable Next.js cache for this page
  noStore();
  
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Log the incoming slug for debugging
  console.log("[RouteDetailPage] Requested slug:", slug);
  
  // Fetch route metadata and Best3 tools from DB
  const [route, best3Tools] = await Promise.all([
    getRouteBySlug(slug),
    getRouteBest3(slug),
  ]);

  console.log("[RouteDetailPage] Route found:", route ? route.slug : "NOT FOUND");

  // Development: show helpful error if route not found
  if (!route && process.env.NODE_ENV !== "production") {
    return (
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-yellow-900">
          <h1 className="text-lg font-semibold">Route not found</h1>
          <p className="mt-2 text-sm">Requested slug: <code className="font-mono bg-yellow-100 px-1">{slug}</code></p>
          <p className="mt-1 text-sm">
            This route does not exist in the database.
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold">Troubleshooting</summary>
            <div className="mt-2 text-xs space-y-1">
              <p>• Check if the slug matches exactly with routes.slug in DB</p>
              <p>• Verify cta_route_slug in guides table is properly slugified</p>
              <p>• Run the fix-guide-cta-routes.sql script if needed</p>
            </div>
          </details>
        </div>
      </main>
    );
  }

  if (!route) {
    notFound();
  }

  // Fetch related guides for this route
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const [guidesPreview, guidesCount] = await Promise.all([
    supabase
      .from("guides")
      .select("id, slug, title, excerpt")
      .eq("guide_type", "route_based")
      .eq("route_slug", route.slug)
      .eq("status", "published")
      .eq("lang", "en")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("guides")
      .select("id", { count: "exact", head: true })
      .eq("guide_type", "route_based")
      .eq("route_slug", route.slug)
      .eq("status", "published")
      .eq("lang", "en")
  ]);

  const relatedGuides = guidesPreview.data ?? [];
  const totalGuidesCount = guidesCount.count ?? 0;

  if (process.env.NODE_ENV !== "production") {
    console.log("[RouteDetailPage] Related guides data:", {
      routeSlug: route.slug,
      relatedGuidesCount: relatedGuides.length,
    });
  }

  // Debug mode: show DB data info
  const showDebug = resolvedSearchParams?.debug === "1";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseProjectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1]?.substring(0, 8) || "unknown";

  return (
    <>
      {showDebug && (
        <div className="fixed top-4 left-4 z-50 max-w-md rounded-lg border border-emerald-500 bg-emerald-950/95 p-3 text-xs text-emerald-100 shadow-lg backdrop-blur-sm">
          <div className="font-semibold mb-2 text-emerald-300">🔍 Debug: Live DB Data</div>
          <div className="space-y-1 font-mono text-[10px]">
            <div><span className="text-emerald-400">Project:</span> {supabaseProjectRef}</div>
            <div><span className="text-emerald-400">Slug:</span> {route.slug}</div>
            <div><span className="text-emerald-400">Steps:</span> {best3Tools.length}</div>
            <div className="mt-2 pt-2 border-t border-emerald-800/50">
              {best3Tools.map((step, idx) => (
                <div key={step.id} className="mb-2 pb-2 border-b border-emerald-900/30 last:border-0">
                  <div className="text-emerald-300 font-semibold">Step {step.position}:</div>
                  <div className="text-white/90">Title: {step.step_title || "N/A"}</div>
                  <div className="text-white/70 break-words">Why: {step.step_why?.substring(0, 40) || "N/A"}...</div>
                  <div className="text-white/70 break-words">Prompt: {step.step_prompt_example?.substring(0, 40) || "N/A"}...</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <RouteDetailContent route={route} best3Tools={best3Tools} relatedGuides={relatedGuides} totalGuidesCount={totalGuidesCount} />
    </>
  );
}

