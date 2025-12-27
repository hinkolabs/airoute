import { MetadataRoute } from "next";
import { getActiveTools } from "@/lib/tools";
import { supabaseServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.airoute.ai";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Dynamic tool pages
  const tools = await getActiveTools();
  const toolPages: MetadataRoute.Sitemap = tools
    .filter((tool) => tool.slug)
    .map((tool) => ({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  // Dynamic guide pages
  const { data: guides } = await supabaseServerClient
    .from("guides")
    .select("slug, created_at");
  
  const guidePages: MetadataRoute.Sitemap = guides
    ? guides.map((guide) => ({
        url: `${baseUrl}/guides/${guide.slug}`,
        lastModified: new Date(guide.created_at),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
    : [];

  return [...staticPages, ...toolPages, ...guidePages];
}








