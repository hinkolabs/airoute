import { Metadata } from "next";
import { notFound } from "next/navigation";
import GuidesListClient from "./_components/guides-list-client";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "AI Tool Guides - Airoute",
  description: "Practical guides to help you choose the right AI tools faster. Learn about image generation, video editing, writing assistants, and more.",
  alternates: {
    canonical: "https://www.airoute.ai/guides",
  },
  openGraph: {
    title: "AI Tool Guides - Airoute",
    description: "Practical guides to help you choose the right AI tools faster. Learn about image generation, video editing, writing assistants, and more.",
    url: "https://www.airoute.ai/guides",
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

interface GuidesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GuidesPage({ searchParams }: GuidesPageProps) {
  const resolvedSearchParams = await searchParams;
  const routeFilter = typeof resolvedSearchParams?.route === "string" ? resolvedSearchParams.route : undefined;
  const isRouteMode = Boolean(routeFilter);

  try {
    let query = supabase
      .from("guides")
      .select("id,slug,title,excerpt,guide_type,primary_intent,taxonomy,created_at,cta_type,cta_tool_slug,cta_route_slug")
      .eq("status", "published") // Show only published guides
      .eq("lang", "en"); // Public pages default to EN only

    if (routeFilter) {
      query = query.eq("route_slug", routeFilter);
      query = query.eq("guide_type", "route_based");
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(20); // Fetch more for filtering

    if (error || !data) {
      return notFound();
    }

    const allItems = data ?? [];
    
    // Filter out route-CTA guides whose cta_route_slug doesn't exist
    const filteredItems = await Promise.all(
      allItems.map(async (guide) => {
        // If not a route CTA, keep it
        if (!guide.cta_type || guide.cta_type !== "route" || !guide.cta_route_slug) {
          return guide;
        }
        
        // Check if route exists
        const { data: route } = await supabase
          .from("routes")
          .select("slug")
          .eq("slug", guide.cta_route_slug)
          .single();
        
        return route ? guide : null;
      })
    );
    
    const items = filteredItems
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .slice(0, 10);
    
    const last = items.length ? items[items.length - 1] : null;
    const initialCursor =
      items.length === 10 && last ? { createdAt: last.created_at, id: last.id } : null;

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-3 text-2xl font-bold text-white">
            {isRouteMode ? "Guides for this Route" : "Getting started with AI"}
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-white/70">
            Simple, step-by-step guides
            <br />
            to help you choose the right AI tools
          </p>
          {routeFilter && (
            <p className="mt-2 text-xs text-emerald-400">
              Showing guides for this Route
            </p>
          )}
        </div>
        <GuidesListClient initialItems={items as any} initialCursor={initialCursor as any} />
      </div>
    );
  } catch (e: unknown) {
    return notFound();
  }
}
