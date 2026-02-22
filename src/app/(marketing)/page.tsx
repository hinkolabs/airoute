import { Metadata } from "next";
import NormalModePage from "../_components/normal-mode-page";
import { ENHomeV2Content } from "../_components/home/en-home-v2-content";
import { ENHomeV2SimpleContent } from "../_components/home/en-home-v2-simple-content";
import { getHomepageTheme } from "@/lib/flags";
import { supabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Airoute - Find the Best AI Tools for Your Goals",
  description: "Too many AI tools? We help you find the right one. Get personalized AI tool recommendations for image, video, writing, coding, and more.",
  alternates: {
    canonical: "https://www.airoute.ai",
  },
  openGraph: {
    title: "Airoute - Find the Best AI Tools for Your Goals",
    description: "Too many AI tools? We help you find the right one. Get personalized AI tool recommendations for image, video, writing, coding, and more.",
    url: "https://www.airoute.ai",
  },
};

type HomeFeaturedRoute = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  tags: string[] | null;
};

export default async function Page() {
  const theme = await getHomepageTheme();

  if (theme === "v2") return <ENHomeV2Content />;
  if (theme === "v2-simple") return <ENHomeV2SimpleContent />;

  // Best Routes are editorial (featured) and ordered by manual_order.
  const { data: routesData } = await supabaseServerClient
    .from("routes")
    .select(`
      id,
      slug,
      title,
      description,
      icon,
      featured,
      tags,
      routes_i18n!left(
        locale,
        title,
        description
      )
    `)
    .eq("status", "active")
    .eq("featured", true)
    .order("manual_order", { ascending: true })
    .limit(4);

  // Merge i18n for locale="en"
  const featuredRoutes = (routesData ?? []).map((route: any) => {
    const i18n_array = route.routes_i18n || [];
    const i18n = i18n_array.find((r: any) => r && r.locale === "en");
    return {
      id: route.id,
      slug: route.slug,
      title: i18n?.title ?? route.title,
      description: i18n?.description ?? route.description,
      icon: route.icon,
      featured: route.featured,
      tags: route.tags,
    } as HomeFeaturedRoute;
  });

  // For the first route, fetch its Best3 steps from route_tools
  let featuredRouteSteps: any[] = [];
  if (featuredRoutes.length > 0) {
    const firstRouteId = featuredRoutes[0].id;
    const { data: stepsData } = await supabaseServerClient
      .from("route_tools")
      .select("position, step_title, tool_id")
      .eq("route_id", firstRouteId)
      .eq("is_best3", true)
      .order("position", { ascending: true })
      .limit(3);
    
    featuredRouteSteps = stepsData || [];
  }

  // Fetch latest 3 guides for home page (lightweight)
  // Only select columns that exist in DB schema
  let latestGuides: any[] = [];
  try {
    const { data, error } = await supabaseServerClient
      .from("guides")
      .select("slug, title, excerpt, guide_type, primary_intent, created_at, cta_type, cta_route_slug, cta_tool_slug")
      .in("status", ["approved", "published"])
      .eq("lang", "en")
      .order("created_at", { ascending: false })
      .limit(10); // Fetch more than we need for filtering
    
    if (error) {
      console.error("[Home] Error fetching guides:", error);
    } else if (data) {
      // Filter out route-CTA guides whose cta_route_slug doesn't exist
      const filtered = await Promise.all(
        data.map(async (guide) => {
          // If not a route CTA, keep it
          if (!guide.cta_type || guide.cta_type !== "route" || !guide.cta_route_slug) {
            return guide;
          }
          
          // Check if route exists
          const { data: route } = await supabaseServerClient
            .from("routes")
            .select("slug")
            .eq("slug", guide.cta_route_slug)
            .single();
          
          return route ? guide : null;
        })
      );
      
      latestGuides = filtered.filter((g): g is NonNullable<typeof g> => g !== null).slice(0, 3);
    }
  } catch (err) {
    console.error("[Home] Unexpected error fetching guides:", err);
    // Silently fail - don't crash the page
  }

  return (
    <NormalModePage 
      tools={[]} 
      featuredRoutes={featuredRoutes || []} 
      featuredRouteSteps={featuredRouteSteps}
      latestGuides={latestGuides}
    />
  );
}
