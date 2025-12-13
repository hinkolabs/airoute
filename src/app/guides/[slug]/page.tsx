import { supabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

type GuideRecord = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  created_at: string;
};

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;

  const { data, error } = await supabaseServerClient
    .from("guides")
    .select("*")
    .eq("slug", slug)
    .single<GuideRecord>();

  if (error || !data) {
    notFound();
  }

  const { title, excerpt, content } = data;

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
        <article className="mt-2 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 sm:p-6">
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-100 sm:text-base whitespace-pre-wrap">
            {content}
          </div>
        </article>
      </div>
    </div>
  );
}
