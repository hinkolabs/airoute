import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabase/server";
import GuideCTA from "../_components/guide-cta";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function GuidePage({ params }: Props) {
  const resolvedParams = await params;
  if (!resolvedParams?.slug) return notFound();
  
  const slug = resolvedParams.slug;
  console.log("[GuideDetail] slug:", slug);

  const { data: guide, error } = await supabaseServerClient
    .from("guides")
    .select(
      "id, slug, title, excerpt, content, guide_type, taxonomy, primary_intent, cta_type, cta_tool_slug, cta_route_slug, created_at, status, lang"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return notFound();
    }
    throw error;
  }
  
  if (!guide) {
    return notFound();
  }

  const md = (guide.content ?? "").replaceAll("\\n", "\n");

  console.log("🔥 [GUIDE DETAIL] Rendering guide:", guide.slug);
  console.log("🔥 [GUIDE DETAIL] Content length:", guide.content?.length);
  console.log("🔥 [GUIDE DETAIL] First 200 chars:", md.substring(0, 200));

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 md:py-16">
      {/* Header Section */}
      <header className="mb-16 border-b border-slate-700/50 pb-10">
        <h1 className="text-[28px] leading-[1.3] md:text-5xl font-bold text-white mb-6">
          {guide.title}
        </h1>
        {guide.excerpt && (
          <p className="text-[17px] md:text-xl text-slate-300 leading-[1.75] md:leading-[1.8]">
            {guide.excerpt}
          </p>
        )}
      </header>

      {/* Content Section */}
      {guide.content && (
        <article className="markdown-content mb-20 max-w-none text-slate-200">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-[26px] leading-[1.35] md:text-4xl font-bold text-white mt-16 mb-8" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-[22px] leading-[1.4] md:text-3xl font-bold text-white mt-14 mb-6 pb-3 border-b-2 border-slate-700/60" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-[19px] leading-[1.4] md:text-2xl font-bold text-white mt-12 mb-5" {...props} />,
              h4: ({node, ...props}) => <h4 className="text-[17px] md:text-xl font-bold text-white mt-10 mb-4" {...props} />,
              p: ({node, ...props}) => <p className="text-[16px] leading-[2] md:text-lg text-slate-200 mb-8" {...props} />,
              ul: ({node, ...props}) => <ul className="my-8 text-[16px] md:text-lg text-slate-200 leading-[2] list-disc pl-6 space-y-3" {...props} />,
              ol: ({node, ...props}) => <ol className="my-8 text-[16px] md:text-lg text-slate-200 leading-[2] list-decimal pl-6 space-y-3" {...props} />,
              li: ({node, ...props}) => <li className="my-3 leading-[2]" {...props} />,
              strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />,
              em: ({node, ...props}) => <em className="text-emerald-300" {...props} />,
              a: ({node, ...props}) => <a className="text-emerald-400 no-underline hover:underline font-medium" {...props} />,
              code: ({node, inline, ...props}: any) => 
                inline ? (
                  <code className="text-[15px] text-emerald-300 bg-slate-800/70 px-2.5 py-1 rounded font-mono" {...props} />
                ) : (
                  <code className="block bg-slate-900 border border-slate-700 rounded-lg p-5 my-8 font-mono text-sm overflow-x-auto" {...props} />
                ),
              pre: ({node, ...props}) => <pre className="bg-slate-900 border border-slate-700 rounded-lg p-5 my-8 overflow-x-auto" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-l-emerald-400 text-slate-300 pl-6 italic my-8 py-2" {...props} />,
              hr: ({node, ...props}) => <hr className="border-slate-700/50 my-12" {...props} />,
            }}
          >
            {md}
          </ReactMarkdown>
        </article>
      )}
      
      {/* CTA Section */}
      <div className="mt-20 pt-10 border-t-2 border-slate-700/50">
        <GuideCTA
          ctaType={guide.cta_type}
          ctaRouteSlug={guide.cta_route_slug}
          ctaToolSlug={guide.cta_tool_slug}
          primaryIntent={guide.primary_intent}
          guideType={guide.guide_type}
        />
      </div>
    </main>
  );
}
