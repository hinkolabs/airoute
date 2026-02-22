import { Metadata } from "next";
import { getToolBySlug } from "@/lib/tools";
import { ToolDetailContent, ToolNotFoundContent } from "./tool-detail-content";
import { RelatedGuides } from "./related-guides";
import { getFallbackTool } from "@/lib/tool-fallback-data";

// ============================================================
// Types
// ============================================================
type ToolDetailPageProps = {
  params: Promise<{ slug: string }>;
};

// ============================================================
// SEO Metadata
// ============================================================
export async function generateMetadata({
  params,
}: ToolDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  let tool = await getToolBySlug(slug, "en");

  // Try fallback if not in DB
  if (!tool) {
    tool = getFallbackTool(slug);
  }

  if (!tool) {
    return {
      title: "Tool Not Found – Airoute",
      description: "This tool does not exist or has been removed.",
    };
  }

  return {
    title: `${tool.name} – Airoute`,
    description:
      tool.desc_en ?? tool.description ?? "AI tool details on Airoute",
    openGraph: {
      title: `${tool.name} – Airoute`,
      description:
        tool.desc_en ?? tool.description ?? "AI tool details on Airoute",
    },
  };
}

// ============================================================
// Page Component
// ============================================================
export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { slug } = await params;
  let tool = await getToolBySlug(slug, "en");

  // Try fallback if not in DB
  if (!tool) {
    tool = getFallbackTool(slug);
  }

  // Not Found State
  if (!tool || tool.is_active === false) {
    return <ToolNotFoundContent />;
  }

  return (
    <>
      <ToolDetailContent tool={tool} locale="en" />
      <RelatedGuides toolSlug={slug} />
    </>
  );
}

