"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell, SearchBar, ToolCard, ToolCardProps } from "@/app/_design/components/page";
import type { ToolRecord } from "@/lib/tools";
import { Search } from "lucide-react";
import { getFavorites, toggleToolFavorite } from "@/lib/favorites";
import { useAuth } from "@/app/_providers/auth-provider";
import { Toast } from "@/components/toast";

// ============================================================
// Types
// ============================================================
type CategoryFilter = "All" | "Image & Design" | "Writing" | "Video" | "Audio" | "Voice" | "Coding";

const CATEGORY_FILTERS: CategoryFilter[] = [
  "All",
  "Image & Design",
  "Writing",
  "Video",
  "Audio",
  "Voice",
  "Coding",
];

// ============================================================
// Helpers
// ============================================================
function normalizeCategory(tool: any): CategoryFilter | null {
  // 1) Direct canonical enum
  const direct =
    tool?.category ??
    tool?.task_category ??
    tool?.taskCategory ??
    tool?.category_name ??
    tool?.categoryName ??
    null;

  if (typeof direct === 'string') {
    const s = direct.trim();

    // exact match
    if (
      s === 'Image & Design' || s === 'Writing' || s === 'Video' ||
      s === 'Audio' || s === 'Voice' || s === 'Coding'
    ) return s as CategoryFilter;

    // common variants -> canonical
    const lower = s.toLowerCase();
    if (lower.includes('image')) return 'Image & Design';
    if (lower.includes('design')) return 'Image & Design';
    if (lower.includes('writing')) return 'Writing';
    if (lower.includes('text')) return 'Writing';
    if (lower.includes('video')) return 'Video';
    if (lower.includes('audio')) return 'Audio';
    if (lower.includes('music')) return 'Audio';
    if (lower.includes('voice')) return 'Voice';
    if (lower.includes('coding')) return 'Coding';
    if (lower.includes('dev')) return 'Coding';
  }

  // 2) category_id / categoryId (string)
  const id =
    tool?.category_id ??
    tool?.categoryId ??
    tool?.categoryID ??
    tool?.category_key ??
    tool?.categoryKey ??
    null;

  if (typeof id === 'string') {
    const s = id.trim().toLowerCase();
    if (s === 'image') return 'Image & Design';
    if (s === 'video') return 'Video';
    if (s === 'music') return 'Audio';
    if (s === 'audio') return 'Audio';
    if (s === 'voice') return 'Voice';
    if (s === 'coding') return 'Coding';
    if (s === 'chat') return 'Writing';
    if (s === 'text') return 'Writing';
    if (s === 'writing') return 'Writing';
  }

  // 3) category_id numeric (fallback guess)
  if (typeof id === 'number') {
    // common legacy mapping guess:
    // 1=chat, 2=image, 3=video, 4=music
    if (id === 1) return 'Writing';
    if (id === 2) return 'Image & Design';
    if (id === 3) return 'Video';
    if (id === 4) return 'Audio';
  }

  return null;
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
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [categoryInitialized, setCategoryInitialized] = useState(false);

  // Initialize category from URL query parameter (only once on mount)
  useEffect(() => {
    if (categoryInitialized) return;
    
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const normalizedParam = categoryParam.trim();
      // Check if it's a valid category
      const validCategories: CategoryFilter[] = [
        "Image & Design",
        "Writing",
        "Video",
        "Audio",
        "Voice",
        "Coding",
      ];
      
      if (validCategories.includes(normalizedParam as CategoryFilter)) {
        setSelectedCategory(normalizedParam as CategoryFilter);
      }
    }
    setCategoryInitialized(true);
  }, [searchParams, categoryInitialized]);

  // Debug log (dev-only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[tools-list] sample tool:', tools?.[0]);
      // eslint-disable-next-line no-console
      console.log('[tools-list] sample keys:', tools?.[0] ? Object.keys(tools[0]) : []);
    }
  }, [tools]);

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

  // Local filtering: first by search, then by category
  const filteredTools = useMemo(() => {
    let result = tools;

    // 1. Search filtering
    const q = search.trim().toLowerCase();
    if (q.length > 0) {
      result = result.filter((tool) => {
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
    }

    // 2. Category filtering
    if (selectedCategory !== "All") {
      result = result.filter((tool) => {
        const cat = normalizeCategory(tool);
        if (!cat) return false;
        return cat === selectedCategory;
      });
    }

    return result;
  }, [tools, search, selectedCategory]);

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
      const normalized = normalizeCategory(tool);

      return {
        id: tool.id,
        slug: toolSlug,
        name: tool.name,
        description:
          tool.desc_en ??
          tool.description ??
          "No description available.",
        category: normalized ?? 'Other',
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
        <div className="mb-4">
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

        {/* Category Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  selectedCategory === category
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
                }`}
              >
                {category}
              </button>
            ))}
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
          {selectedCategory !== "All" && (
            <span className="ml-2">
              in <span className="text-slate-200">{selectedCategory}</span>
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
