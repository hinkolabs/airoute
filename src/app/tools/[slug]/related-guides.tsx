import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function RelatedGuides() {
  const { data: guides } = await supabaseServerClient
    .from("guides")
    .select("id, slug, title, excerpt")
    .order("created_at", { ascending: false })
    .limit(3);

  if (!guides || guides.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 border-t border-slate-800/50 pt-12">
      <div className="mx-auto max-w-4xl px-4">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Related Guides
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-4 transition hover:border-slate-700 hover:bg-slate-900/40"
            >
              <h4 className="mb-2 text-sm font-semibold text-slate-100">
                {guide.title}
              </h4>
              {guide.excerpt && (
                <p className="line-clamp-3 text-xs text-slate-400">
                  {guide.excerpt}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


