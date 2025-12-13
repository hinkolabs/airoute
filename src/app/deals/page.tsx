import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";
import { DEAL_TOOL_SLUGS, DEAL_METADATA } from "@/lib/deals";
import type { ToolRecord } from "@/lib/tools";

export default async function DealsPage() {
  // Fetch deal tools from Supabase
  const { data: tools, error } = await supabaseServerClient
    .from("tools")
    .select("*")
    .in("slug", DEAL_TOOL_SLUGS as unknown as string[]);

  if (error || !tools) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 pb-24 pt-3">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-slate-400">Failed to load special offers.</p>
        </div>
      </div>
    );
  }

  // Sort tools according to DEAL_TOOL_SLUGS order
  const sortedTools = DEAL_TOOL_SLUGS.map((slug) =>
    tools.find((t) => t.slug === slug)
  ).filter((t): t is ToolRecord => t !== undefined);

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-24 pt-3">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">
            Special Offers
          </h1>
          <p className="text-sm text-slate-400 sm:text-base">
            Based on publicly available plans and partner information.
          </p>
        </header>

        {/* Tool List */}
        <div className="space-y-3">
          {sortedTools.map((tool) => {
            const metadata = DEAL_METADATA[tool.slug];
            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 shadow-sm transition hover:border-emerald-400/30 hover:bg-slate-900"
              >
                <div className="flex items-center gap-4">
                  {/* Icon/Logo */}
                  {tool.logo_url ? (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800/50 bg-slate-900">
                      <img
                        src={tool.logo_url}
                        alt={tool.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
                      💎
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-50 group-hover:text-emerald-300">
                        {tool.name}
                      </h3>
                      {metadata?.tag && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                          {metadata.tag}
                        </span>
                      )}
                    </div>
                    {metadata?.offerText && (
                      <p className="text-sm text-slate-400">
                        {metadata.offerText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-400">
                  →
                </div>
              </Link>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-xl border border-slate-800/50 bg-slate-900/40 px-4 py-3 text-center">
          <p className="text-xs text-slate-400">
            Information based on publicly available plans. Please verify current offers on official sites.
          </p>
        </div>
      </div>
    </div>
  );
}

