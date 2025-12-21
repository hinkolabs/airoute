import { notFound } from "next/navigation";
import { getRouteBySlug, getRouteBest3, getAllRoutes } from "@/lib/db/routes";
import RouteDetailContent from "./route-detail-content";

interface RouteDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const routes = await getAllRoutes();
  return routes.map((route) => ({ slug: route.slug }));
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { slug } = await params;
  
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
      <main className="mx-auto max-w-3xl px-4 py-8">
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

  return <RouteDetailContent route={route} best3Tools={best3Tools} />;
}

