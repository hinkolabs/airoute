import { notFound } from "next/navigation";
import { getRouteBySlug, getAllRouteSlugs } from "@/lib/routes";
import { getActiveTools } from "@/lib/tools";
import RouteDetailContent from "./route-detail-content";

interface RouteDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllRouteSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { slug } = await params;
  const route = getRouteBySlug(slug);

  if (!route) {
    notFound();
  }

  // Fetch all tools (in production, you'd want to optimize this)
  const allTools = await getActiveTools();

  return <RouteDetailContent route={route} allTools={allTools} />;
}

