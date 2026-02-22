"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell, SearchBar, ToolCard, ToolCardProps } from "@/app/_design/components/page";
import type { ToolRecord } from "@/lib/tools";
import { Search, ShieldCheck } from "lucide-react";
import { getFavorites, toggleToolFavorite } from "@/lib/favorites";
import { useAuth } from "@/app/_providers/auth-provider";
import { Toast } from "@/components/toast";

// ============================================================
// i18n
// ============================================================
const i18nLabels = {
  en: {
    pageTitle: "All tools",
    pageDesc: "Browse all AI tools listed on Airoute.",
    officialOnly: "All links go directly to official sites only",
    searchPlaceholder: "Search tools by name, description, or tags...",
    resultsFound: (n: number) => `${n} tool${n !== 1 ? "s" : ""} found`,
    searchFor: "for",
    inCategory: "in",
    noToolsYet: "No tools available yet.",
    noMatch: "No tools match your search.",
    clearSearch: "Clear search",
    removedFromToolbox: "Removed from Toolbox",
    addedToToolbox: "Added to Toolbox",
    guestLimit: "Guest can save up to 3 tools. Sign in to save more.",
    failedUpdate: "Failed to update toolbox",
    categoryLabels: {
      "All": "All",
      "Image & Design": "Image & Design",
      "Writing": "Writing",
      "Video": "Video",
      "Audio": "Audio",
      "Voice": "Voice",
      "Coding": "Coding",
    } as Record<string, string>,
  },
  kr: {
    pageTitle: "AI 도구 전체보기",
    pageDesc: "Airoute에서 엄선한 AI 도구를 모두 확인하세요.",
    officialOnly: "모든 링크는 공식 사이트로만 연결됩니다",
    searchPlaceholder: "도구 이름, 설명, 태그로 검색...",
    resultsFound: (n: number) => `${n}개의 도구가 검색되었습니다`,
    searchFor: "검색어:",
    inCategory: "카테고리:",
    noToolsYet: "아직 등록된 도구가 없습니다.",
    noMatch: "검색 결과가 없습니다.",
    clearSearch: "검색 초기화",
    removedFromToolbox: "툴박스에서 제거됨",
    addedToToolbox: "툴박스에 추가됨",
    guestLimit: "게스트는 최대 3개까지 저장 가능합니다. 로그인하면 무제한 저장!",
    failedUpdate: "업데이트에 실패했습니다",
    categoryLabels: {
      "All": "전체",
      "Image & Design": "이미지 & 디자인",
      "Writing": "글쓰기",
      "Video": "동영상",
      "Audio": "오디오",
      "Voice": "음성",
      "Coding": "코딩",
    } as Record<string, string>,
  },
} as const;

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
  basePath?: string;
  locale?: "en" | "kr";
};

// ============================================================
// Component
// ============================================================
export function ToolsListClient({ tools, basePath, locale = "en" }: ToolsListClientProps) {
  const t = i18nLabels[locale];
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [categoryInitialized, setCategoryInitialized] = useState(false);
  
  // Resolve base path for link construction
  const resolvedBase = basePath ?? "";

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
      message: wasFavorited ? t.removedFromToolbox : t.addedToToolbox,
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
          message: t.guestLimit,
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
      setToast({ message: t.failedUpdate, type: "error" });
    }
  };

  // Map to ToolCardProps
  const toolCards: (ToolCardProps & { id: string; slug: string })[] = filteredTools.map(
    (tool) => {
      const displayTags = filterDisplayTags(tool.tags);
      const toolSlug = tool.slug || tool.id;
      const normalized = normalizeCategory(tool);

      const description = locale === "kr"
        ? (tool.description ?? tool.desc_ko ?? tool.desc_en ?? "설명 준비 중")
        : (tool.desc_en ?? tool.description ?? "No description available.");

      return {
        id: tool.id,
        slug: toolSlug,
        name: tool.name,
        description,
        category: normalized ?? 'Other',
        tags: displayTags,
        badge: tool.badge ?? undefined,
        href: tool.affiliate_url ?? tool.url ?? undefined,
        detailsHref: tool.slug ? `${resolvedBase}/tools/${tool.slug}` : undefined,
        isFavorited: favoriteSlugs.includes(toolSlug),
        onFavoriteToggle: () => handleFavoriteToggle(toolSlug),
        locale,
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
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {t.pageTitle}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {t.pageDesc}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t.officialOnly}
            </span>
          </div>
        </header>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 pl-10 text-sm text-foreground shadow-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
            />
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
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
                    ? "border-primary/50 bg-primary/20 text-primary"
                    : "border-border bg-muted text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {t.categoryLabels[category] ?? category}
              </button>
            ))}
          </div>
        </div>


        {/* Results count */}
        <div className="mb-4 text-xs text-muted-foreground sm:text-sm">
          {t.resultsFound(filteredTools.length)}
          {search && (
            <span className="ml-2">
              {t.searchFor} &quot;<span className="text-foreground">{search}</span>&quot;
            </span>
          )}
          {selectedCategory !== "All" && (
            <span className="ml-2">
              {t.inCategory} <span className="text-foreground">{t.categoryLabels[selectedCategory] ?? selectedCategory}</span>
            </span>
          )}
        </div>

        {/* Tools Grid */}
        {toolCards.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 text-center text-muted-foreground">
            <div>
              {tools.length === 0 ? (
                <p>{t.noToolsYet}</p>
              ) : (
                <p>
                  {t.noMatch}
                  <br />
                  <button
                    onClick={() => setSearch("")}
                    className="mt-2 text-primary hover:underline"
                  >
                    {t.clearSearch}
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
