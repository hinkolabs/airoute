import { Metadata } from "next";
import NormalModePage from "./_components/normal-mode-page";
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

export default async function Page() {
  // Fetch featured routes server-side with limit
  const { data: featuredRoutes } = await supabaseServerClient
    .from("routes")
    .select("id, slug, title, description, icon, featured, tags")
    .eq("featured", true)
    .order("manual_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch latest 3 guides for home page (lightweight)
  // Only select columns that exist in DB schema
  let latestGuides: any[] = [];
  try {
    const { data, error } = await supabaseServerClient
      .from("guides_public")
      .select("slug, title, excerpt, guide_type, primary_intent, created_at, cta_type, cta_route_slug, cta_tool_slug")
      .order("created_at", { ascending: false })
      .limit(3);
    
    if (error) {
      console.error("[Home] Error fetching guides:", error);
    } else {
      latestGuides = data || [];
    }
  } catch (err) {
    console.error("[Home] Unexpected error fetching guides:", err);
    // Silently fail - don't crash the page
  }

  return (
    <NormalModePage 
      tools={[]} 
      featuredRoutes={featuredRoutes || []} 
      latestGuides={latestGuides}
    />
  );
}
