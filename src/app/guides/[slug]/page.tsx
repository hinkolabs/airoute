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

  const { data: guide, error } = await supabaseServerClient
    .from("guides")
    .select(
      "id, slug, title, excerpt, content, guide_type, taxonomy, primary_intent, cta_type, cta_tool_slug, cta_route_slug, created_at, updated_at, status, lang"
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
  const lastUpdated = guide.updated_at ?? guide.created_at;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 md:py-16">
      {/* Header Section */}
      <header className="mb-12 border-b border-border pb-8">
        <h1 className="mb-5 text-3xl font-bold leading-tight text-foreground md:text-4xl md:leading-tight">
          {guide.title}
        </h1>
        {guide.excerpt && (
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
            {guide.excerpt}
          </p>
        )}
        {lastUpdated && (
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated:{" "}
            {new Date(lastUpdated).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </header>

      {/* Content Section */}
      {guide.content && (
        <article className="guide-content mb-16 text-foreground">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="guide-h1" {...props} />,
              h2: ({node, ...props}) => <h2 className="guide-h2" {...props} />,
              h3: ({node, ...props}) => <h3 className="guide-h3" {...props} />,
              h4: ({node, ...props}) => <h4 className="guide-h4" {...props} />,
              p: ({node, ...props}) => <p className="guide-p" {...props} />,
              ul: ({node, ...props}) => <ul className="guide-ul" {...props} />,
              ol: ({node, ...props}) => <ol className="guide-ol" {...props} />,
              li: ({node, ...props}) => <li className="guide-li" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
              em: ({node, ...props}) => <em className="text-primary" {...props} />,
              a: ({node, ...props}) => <a className="font-medium text-primary no-underline hover:underline" {...props} />,
              code: ({node, inline, ...props}: any) => 
                inline ? (
                  <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm text-primary" {...props} />
                ) : (
                  <code className="guide-code-block" {...props} />
                ),
              pre: ({node, ...props}) => <pre className="guide-pre" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="guide-blockquote" {...props} />,
              hr: ({node, ...props}) => <hr className="guide-hr" {...props} />,
            }}
          >
            {md}
          </ReactMarkdown>
        </article>
      )}
      
      {/* CTA Section */}
      <div className="mt-16 border-t-2 border-border pt-10">
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
