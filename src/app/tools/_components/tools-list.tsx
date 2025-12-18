"use client";

import { useMemo, useState, useEffect } from "react";
import { PageShell, SearchBar, ToolCard, ToolCardProps } from "@/app/_design/components/page";
import type { ToolRecord } from "@/lib/tools";
import { Search } from "lucide-react";
import { getFavorites, toggleToolFavorite } from "@/lib/favorites";
import { useAuth } from "@/app/_providers/auth-provider";
import { Toast } from "@/components/toast";

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
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Load favorites
  useEffect(() => {
    async function loadFavorites() {
      try {
        const favorites = await getFavorites();
        setFavoriteSlugs(favorites.tools);
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    }
    loadFavorites();
  }, [user]);

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

  // Handle favorite toggle
  const handleFavoriteToggle = async (toolSlug: string) => {
    const wasFavorited = favoriteSlugs.includes(toolSlug);
    
    // Optimistic update
    setFavoriteSlugs(prev =>
      wasFavorited
        ? prev.filter(s => s !== toolSlug)
        : [...prev, toolSlug]
    );
    setToast({
      message: wasFavorited ? "Removed from Toolbox" : "Added to Toolbox",
      type: "success",
    });

    try {
      const result = await toggleToolFavorite(toolSlug);
      
      if (result.blocked) {
        // Rollback
        setFavoriteSlugs(prev =>
          wasFavorited
            ? [...prev, toolSlug]
            : prev.filter(s => s !== toolSlug)
        );
        setToast({
          message: "Guest can save up to 3 tools. Sign in to save more.",
          type: "error",
        });
      } else {
        // Update with server state
        setFavoriteSlugs(result.tools);
      }
    } catch (error) {
      // Rollback on error
      setFavoriteSlugs(prev =>
        wasFavorited
          ? [...prev, toolSlug]
          : prev.filter(s => s !== toolSlug)
      );
      setToast({ message: "Failed to update toolbox", type: "error" });
    }
  };

  // Map to ToolCardProps
  const toolCards: (ToolCardProps & { id: string; slug: string })[] = filteredTools.map(
    (tool) => {
      const displayTags = filterDisplayTags(tool.tags);
      const toolSlug = tool.slug || tool.id;

      return {
        id: tool.id,
        slug: toolSlug,
        name: tool.name,
        description:
          tool.desc_en ??
          tool.description ??
          "No description available.",
        category: categoryLabelFromId(tool.category_id),
        tags: displayTags,
        badge: tool.badge ?? undefined,
        href: tool.affiliate_url ?? tool.url ?? undefined,
        detailsHref: tool.slug ? `/tools/${tool.slug}` : undefined,
        isFavorited: favoriteSlugs.includes(toolSlug),
        onFavoriteToggle: () => handleFavoriteToggle(toolSlug),
        // For logo rendering
        image: tool.image,
        website_url: tool.websiteUrl || tool.url,
      };
    }
  );

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">
            All tools
          </h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
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
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-4 py-3 pl-10 text-sm text-slate-100 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-400"
            />
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-xs text-slate-400 sm:text-sm">
          {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""} found
          {search && (
            <span className="ml-2">
              for &quot;<span className="text-slate-200">{search}</span>&quot;
            </span>
          )}
        </div>

        {/* Tools Grid */}
        {toolCards.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/30 px-4 text-center text-slate-400">
            <div>
              {tools.length === 0 ? (
                <p>No tools available yet.</p>
              ) : (
                <p>
                  No tools match your search.
                  <br />
                  <button
                    onClick={() => setSearch("")}
                    className="mt-2 text-emerald-400 hover:underline"
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

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </PageShell>
  );
}
