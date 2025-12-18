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
  
  // Fetch route metadata and Best3 tools from DB
  const [route, best3Tools] = await Promise.all([
    getRouteBySlug(slug),
    getRouteBest3(slug),
  ]);

  if (!route) {
    notFound();
  }

  return <RouteDetailContent route={route} best3Tools={best3Tools} />;
}

