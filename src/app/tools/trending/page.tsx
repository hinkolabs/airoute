import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";
import { TRENDING_TOOL_SLUGS } from "@/lib/trending";
import type { ToolRecord } from "@/lib/tools";

export default async function TrendingPage() {
  // Fetch trending tools from Supabase
  const { data: tools, error } = await supabaseServerClient
    .from("tools")
    .select("*")
    .in("slug", TRENDING_TOOL_SLUGS as unknown as string[]);

  if (error || !tools) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 pb-24 pt-3">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-slate-400">Failed to load trending tools.</p>
        </div>
      </div>
    );
  }

  // Sort tools according to TRENDING_TOOL_SLUGS order
  const sortedTools = TRENDING_TOOL_SLUGS.map((slug) =>
    tools.find((t) => t.slug === slug)
  ).filter((t): t is ToolRecord => t !== undefined);

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-24 pt-3">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            Trending AI Tools
          </h1>
          <p className="text-sm text-slate-400 sm:text-base">
            Based on recent user interest and usage patterns across categories.
          </p>
        </header>

        {/* Tool List */}
        <div className="space-y-3">
          {sortedTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 shadow-sm transition hover:border-primary/30 hover:bg-slate-900"
            >
              {/* Icon/Logo */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                🔥
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="mb-1 text-base font-semibold text-slate-50 group-hover:text-primary">
                  {tool.name}
                </h3>
                <p className="line-clamp-2 text-sm text-slate-400">
                  {tool.desc_simple_en || tool.best_for || "Trending AI tool"}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-primary">
                →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}



