import { supabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

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

        {/* CTA Section */}
        <section className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Continue with the best AI tools
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Explore trending tools and curated recommendations on Airoute.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-emerald-600"
              >
                View Trending Tools
              </Link>
              <Link
                href="/#categories"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-transparent px-4 py-2 text-base font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
              >
                See Best 3 by Category
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
