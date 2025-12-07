"use client";

import { useMemo, useState } from "react";
import { PageShell, SearchBar, ToolCard, ToolCardProps } from "@/app/_design/components/page";
import { useTheme } from "@/app/_design/providers/theme-provider";
import { cn } from "@/lib/utils";
import type { ToolRecord } from "@/lib/tools";
import { Search } from "lucide-react";

// ============================================================
// Helpers
// ============================================================
function categoryLabelFromId(categoryId: string | null): string {
  if (!categoryId) return "Other";
  const map: Record<string, string> = {
    chat: "Chat & Text",
    image: "Image & Design",
    video: "Video & Editing",
    music: "Music & Audio",
  };
  return map[categoryId] ?? "Other";
}

function filterDisplayTags(tags: string[] | null | undefined): string[] {
  if (!tags) return [];
  return tags.filter((tag) => /[A-Za-z0-9]/.test(tag));
}

// ============================================================
// Props
// ============================================================
type ToolsListClientProps = {
  tools: ToolRecord[];
};

// ============================================================
// Component
// ============================================================
export function ToolsListClient({ tools }: ToolsListClientProps) {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");

  // Local filtering
  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length === 0) return tools;

    return tools.filter((tool) => {
      const name = tool.name?.toLowerCase() ?? "";
      const descEn = tool.desc_en?.toLowerCase() ?? "";
      const desc = tool.description?.toLowerCase() ?? "";
      const tags = tool.tags ?? [];

      return (
        name.includes(q) ||
        descEn.includes(q) ||
        desc.includes(q) ||
        tags.some((t) => (t ?? "").toLowerCase().includes(q))
      );
    });
  }, [tools, search]);

  // Map to ToolCardProps
  const toolCards: (ToolCardProps & { id: string })[] = filteredTools.map(
    (tool) => {
      const displayTags = filterDisplayTags(tool.tags);

      return {
        id: tool.id,
        name: tool.name,
        description:
          tool.desc_en ??
          tool.description ??
          "No description available.",
        category: categoryLabelFromId(tool.category_id),
        tags: displayTags,
        badge: tool.badge ?? undefined,
        href: tool.url ?? undefined,
        detailsHref: tool.slug ? `/tools/${tool.slug}` : undefined,
      };
    }
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">
            All tools
          </h1>
          <p className={cn(
            "mt-2 text-sm sm:text-base",
            theme === "day" ? "text-slate-600" : "text-slate-400"
          )}>
            Browse all AI tools listed on Airoute.
          </p>
        </header>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools by name, description, or tags..."
              className={cn(
                "w-full rounded-xl border px-4 py-3 pl-10 text-sm shadow-sm outline-none ring-0 focus:border-emerald-400",
                theme === "day"
                  ? "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                  : "border-slate-700/70 bg-slate-900/70 text-slate-100 placeholder:text-slate-400"
              )}
            />
            <div className={cn(
              "pointer-events-none absolute inset-y-0 left-3 flex items-center",
              theme === "day" ? "text-slate-400" : "text-slate-500"
            )}>
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className={cn(
          "mb-4 text-xs sm:text-sm",
          theme === "day" ? "text-slate-500" : "text-slate-400"
        )}>
          {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""} found
          {search && (
            <span className="ml-2">
              for &quot;<span className={theme === "day" ? "text-slate-700" : "text-slate-200"}>{search}</span>&quot;
            </span>
          )}
        </div>

        {/* Tools Grid */}
        {toolCards.length === 0 ? (
          <div className={cn(
            "flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed px-4 text-center",
            theme === "day"
              ? "border-slate-300 bg-slate-100/50 text-slate-500"
              : "border-slate-700/70 bg-slate-900/30 text-slate-400"
          )}>
            <div>
              {tools.length === 0 ? (
                <p>No tools available yet.</p>
              ) : (
                <p>
                  No tools match your search.
                  <br />
                  <button
                    onClick={() => setSearch("")}
                    className={cn(
                      "mt-2 hover:underline",
                      theme === "day" ? "text-emerald-600" : "text-emerald-400"
                    )}
                  >
                    Clear search
                  </button>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {toolCards.map((tool) => (
              <ToolCard key={tool.id} {...tool} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}


