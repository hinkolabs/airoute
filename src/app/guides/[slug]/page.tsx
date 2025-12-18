import { supabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import AffiliateLinkButton from "@/components/AffiliateLinkButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Force dynamic rendering - always fetch fresh data from Supabase
export const dynamic = "force-dynamic";
export const revalidate = 0;

type GuideRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  created_at: string;
  // CTA fields
  cta_type: 'route' | 'tool' | 'mixed';
  cta_route_slug: string | null;
  cta_tool_slug: string | null;
  cta_partner: string | null;
  guide_type: 'route_based' | 'tool_based' | 'safety';
  primary_intent: string | null;
  primary_route: string | null;
  generation_version: string | null;
};

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;

  const { data, error } = await supabaseServerClient
    .from("guides")
    .select(`
      id,
      slug,
      title,
      excerpt,
      content,
      created_at,
      cta_type,
      cta_route_slug,
      cta_tool_slug,
      cta_partner,
      guide_type,
      primary_intent,
      primary_route,
      generation_version
    `)
    .eq("slug", slug)
    .single<GuideRecord>();

  if (error || !data) {
    notFound();
  }

  // Development debugging: log CTA fields
  if (process.env.NODE_ENV === 'development') {
    console.log('[Guide CTA Debug]', {
      slug: data.slug,
      cta_type: data.cta_type,
      cta_route_slug: data.cta_route_slug,
      cta_tool_slug: data.cta_tool_slug,
      cta_partner: data.cta_partner,
      guide_type: data.guide_type,
      generation_version: data.generation_version,
    });
  }

  const { 
    title, 
    excerpt, 
    content, 
    cta_type, 
    cta_route_slug, 
    cta_tool_slug,
    cta_partner 
  } = data;

  // Normalize content: replace \n with actual newlines and strip only CTA patterns (not entire sections)
  const normalizedContent = (content ?? "")
    .replace(/\\n/g, "\n")
    // Remove specific CTA patterns only (preserve Conclusion and tool mentions)
    .replace(/\n## CTA\nTry This Tool\.\n?/g, "\n")
    .replace(/\n## CTA\nTry this Tool\.\n?/g, "\n")
    .replace(/\nCTA\nTry this Tool\.\n?/g, "\n")
    .replace(/\nReady to apply this method\?\n/g, "")
    .replace(/\n## Ready to (apply this method|get started|start)\?\n/g, "")
    .trim();

  // Fetch tool data if cta_type includes 'tool'
  let toolData: { name: string; affiliate_url: string } | null = null;
  if ((cta_type === 'tool' || cta_type === 'mixed') && cta_tool_slug) {
    const { data: tool, error: toolError } = await supabaseServerClient
      .from("tools")
      .select("name, affiliate_url")
      .eq("slug", cta_tool_slug)
      .single();
    
    // Development debugging: log tool fetch
    if (process.env.NODE_ENV === 'development') {
      console.log('[Guide Tool Fetch Debug]', {
        cta_tool_slug,
        tool_found: !!tool,
        tool_name: tool?.name || 'NOT FOUND',
        error: toolError?.message || null,
      });
    }
    
    if (tool) {
      toolData = tool;
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 px-4 pb-24 pt-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {/* 헤더 영역 */}
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            {title}
          </h1>
          {excerpt && (
            <p className="text-sm text-slate-400 sm:text-base">{excerpt}</p>
          )}
        </header>

        {/* 본문 */}
        <article className="mt-2 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-5 sm:p-8">
          <div className="max-w-none text-slate-100
            leading-[1.5]

            [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:mt-8 [&_h1]:mb-4
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mt-7 [&_h2]:mb-2
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:mt-5 [&_h3]:mb-1.5

            [&_p]:my-4
            [&_strong]:font-semibold

            [&_ul]:my-3 [&_ul]:pl-5 [&_ul]:list-disc
            [&_ol]:my-3 [&_ol]:pl-5 [&_ol]:list-decimal
            [&_li]:my-1.5

            [&_hr]:my-8 [&_hr]:border-slate-800
            [&_blockquote]:my-6 [&_blockquote]:pl-4 [&_blockquote]:border-l [&_blockquote]:border-slate-700
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {normalizedContent}
            </ReactMarkdown>
          </div>
        </article>

        {/* Next steps */}
        <section className="mt-10 space-y-4">
          {/* Official website notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>🛡️ Official website only. You'll be redirected to the official site.</span>
          </div>

          {/* Action prompt */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
            {cta_type === 'route' && cta_route_slug ? (
              // Route CTA
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-slate-300">
                  Ready to get started?
                </p>
                <Link
                  href={`/routes/${cta_route_slug}`}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Get started →
                </Link>
              </div>
            ) : cta_type === 'tool' && toolData ? (
              // Tool CTA
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-slate-300">
                  Ready to apply this method?
                </p>
                <AffiliateLinkButton
                  href={toolData.affiliate_url}
                  placement="guide_cta_bottom"
                  toolSlug={cta_tool_slug || undefined}
                  partnerName={cta_partner || undefined}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Get started →
                </AffiliateLinkButton>
              </div>
            ) : cta_type === 'mixed' && cta_route_slug && toolData ? (
              // Mixed CTA (Route + Tool)
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-slate-300">
                    Ready to get started?
                  </p>
                  <Link
                    href={`/routes/${cta_route_slug}`}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-emerald-600"
                  >
                    Get started →
                  </Link>
                </div>
                
                <div className="border-t border-slate-800 pt-4">
                  <p className="mb-3 text-sm font-medium text-slate-300">
                    Or start with {toolData.name} directly
                  </p>
                  <AffiliateLinkButton
                    href={toolData.affiliate_url}
                    placement="guide_cta_bottom"
                    toolSlug={cta_tool_slug || undefined}
                    partnerName={cta_partner || undefined}
                    variant="secondary"
                    size="lg"
                    className="w-full"
                  >
                    Get started →
                  </AffiliateLinkButton>
                </div>
              </div>
            ) : (
              // Fallback: No CTA data or coming soon
              <div className="flex flex-col items-center py-6 text-center">
                <p className="text-sm text-slate-400">
                  Looking for next steps? Check back soon.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
