import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import GuideCTA from "../_components/guide-cta";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function GuidePage({ params }: Props) {
  const resolvedParams = await params;
  if (!resolvedParams?.slug) return notFound();
  
  const slug = resolvedParams.slug;

  const { data: guide, error } = await supabaseServerClient
    .from("guides")
    .select(
      "id, slug, title, excerpt, content, guide_type, taxonomy, primary_intent, cta_type, cta_tool_slug, cta_route_slug, created_at, status, lang"
    )
    .eq("slug", slug)
    .eq("status", "approved")
    .eq("lang", "en")
    .single();

  // Development: show detailed error messages
  if (process.env.NODE_ENV !== "production") {
    if (error) {
      console.error("[guides/[slug]/page] Supabase error:", error);
      return (
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900">
            <h1 className="text-lg font-semibold">Error loading guide</h1>
            <p className="mt-2 text-sm">Slug: {slug}</p>
            <p className="mt-1 text-sm">Error: {error.message}</p>
            <pre className="mt-2 text-xs">{JSON.stringify(error, null, 2)}</pre>
          </div>
        </main>
      );
    }

    if (!guide) {
      console.warn("[guides/[slug]/page] No guide found for slug:", slug);
      return (
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 text-yellow-900">
            <h1 className="text-lg font-semibold">No guide found</h1>
            <p className="mt-2 text-sm">Slug: {slug}</p>
            <p className="mt-1 text-sm">
              This guide may not exist, or it may not be approved or in English.
            </p>
          </div>
        </main>
      );
    }
  }

  // Production: use notFound for both error and missing data
  if (error || !guide) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-3">{guide.title}</h1>
      {guide.excerpt && (
        <p className="text-base text-white/70 mb-6">{guide.excerpt}</p>
      )}
      {guide.content && (
        <div className="prose prose-invert prose-slate max-w-none mb-8">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
            {guide.content}
          </div>
        </div>
      )}
      
      <GuideCTA
        ctaType={guide.cta_type}
        ctaRouteSlug={guide.cta_route_slug}
        ctaToolSlug={guide.cta_tool_slug}
        primaryIntent={guide.primary_intent}
        guideType={guide.guide_type}
      />
    </main>
  );
}
