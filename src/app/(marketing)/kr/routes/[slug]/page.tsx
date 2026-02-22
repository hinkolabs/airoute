import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getRouteBySlug, getRouteBest3, getAllRoutes } from "@/lib/db/routes";
import RouteDetailContent from "@/app/routes/[slug]/route-detail-content";
import { createClient } from "@supabase/supabase-js";

interface KRRouteDetailPageProps {
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

export default async function KRRouteDetailPage({ params, searchParams }: KRRouteDetailPageProps) {
  // Disable Next.js cache for this page
  noStore();
  
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Log the incoming slug for debugging
  console.log("[KRRouteDetailPage] Requested slug:", slug);
  
  // Fetch route metadata and Best3 tools from DB
  const [route, best3Tools] = await Promise.all([
    getRouteBySlug(slug, "kr"),
    getRouteBest3(slug, "kr"),
  ]);

  console.log("[KRRouteDetailPage] Route found:", route ? route.slug : "NOT FOUND");

  // Development: show helpful error if route not found
  if (!route && process.env.NODE_ENV !== "production") {
    return (
      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-yellow-900">
            <h1 className="text-lg font-semibold">루트를 찾을 수 없습니다</h1>
            <p className="mt-2 text-sm">요청한 slug: <code className="font-mono bg-yellow-100 px-1">{slug}</code></p>
            <p className="mt-1 text-sm">
              이 루트는 데이터베이스에 존재하지 않습니다.
            </p>
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

  // KR 가이드 우선 → EN 폴백
  const krGuidesRes = await supabase
    .from("guides")
    .select("id, slug, title, excerpt")
    .eq("guide_type", "route_based")
    .eq("route_slug", route.slug)
    .eq("status", "published")
    .eq("lang", "kr")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(10);

  const krGuides = krGuidesRes.data ?? [];

  let relatedGuides = krGuides;
  if (krGuides.length === 0) {
    const enGuidesRes = await supabase
      .from("guides")
      .select("id, slug, title, excerpt")
      .eq("guide_type", "route_based")
      .eq("route_slug", route.slug)
      .eq("status", "published")
      .eq("lang", "en")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(10);
    relatedGuides = enGuidesRes.data ?? [];
  }

  const totalGuidesCount = relatedGuides.length;

  if (process.env.NODE_ENV !== "production") {
    console.log("[KRRouteDetailPage] Related guides data:", {
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
        <div className="fixed top-4 left-4 z-50 max-w-md rounded-lg border border-primary bg-background/95 p-3 text-xs text-foreground shadow-lg backdrop-blur-sm">
          <div className="font-semibold mb-2 text-primary">🔍 Debug: Live DB Data</div>
          <div className="space-y-1 font-mono text-[10px]">
            <div><span className="text-primary">Project:</span> {supabaseProjectRef}</div>
            <div><span className="text-primary">Slug:</span> {route.slug}</div>
            <div><span className="text-primary">Steps:</span> {best3Tools.length}</div>
            <div className="mt-2 pt-2 border-t border-border/50">
              {best3Tools.map((step, idx) => (
                <div key={step.id} className="mb-2 pb-2 border-b border-border/30 last:border-0">
                  <div className="text-primary font-semibold">Step {step.position}:</div>
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
