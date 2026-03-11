"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell, ToolCard, ToolCardProps } from "@/app/_design/components/page";
import type { ToolRecord } from "@/lib/tools";
import { Search, ShieldCheck } from "lucide-react";
import { getFavorites, toggleToolFavorite } from "@/lib/favorites";
import { useAuth } from "@/app/_providers/auth-provider";
import { Toast } from "@/components/toast";

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
    noDesc: "No description available.",
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
    pageTitle: "AI \uB3C4\uAD6C \uC804\uCCB4\uBCF4\uAE30",
    pageDesc: "Airoute\uC5D0\uC11C \uC5C4\uC120\uD55C AI \uB3C4\uAD6C\uB97C \uBAA8\uB450 \uD655\uC778\uD558\uC138\uC694.",
    officialOnly: "\uBAA8\uB4E0 \uB9C1\uD06C\uB294 \uACF5\uC2DD \uC0AC\uC774\uD2B8\uB85C\uB9CC \uC5F0\uACB0\uB429\uB2C8\uB2E4",
    searchPlaceholder: "\uB3C4\uAD6C \uC774\uB984, \uC124\uBA85, \uD0DC\uADF8\uB85C \uAC80\uC0C9...",
    resultsFound: (n: number) => `${n}\uAC1C\uC758 \uB3C4\uAD6C\uAC00 \uAC80\uC0C9\uB418\uC5C8\uC2B5\uB2C8\uB2E4`,
    searchFor: "\uAC80\uC0C9\uC5B4:",
    inCategory: "\uCE74\uD14C\uACE0\uB9AC:",
    noToolsYet: "\uC544\uC9C1 \uB4F1\uB85D\uB41C \uB3C4\uAD6C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    noMatch: "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    clearSearch: "\uAC80\uC0C9 \uCD08\uAE30\uD654",
    removedFromToolbox: "\uD234\uBC15\uC2A4\uC5D0\uC11C \uC81C\uAC70\uB428",
    addedToToolbox: "\uD234\uBC15\uC2A4\uC5D0 \uCD94\uAC00\uB428",
    guestLimit: "\uAC8C\uC2A4\uD2B8\uB294 \uCD5C\uB300 3\uAC1C\uAE4C\uC9C0 \uC800\uC7A5 \uAC00\uB2A5\uD569\uB2C8\uB2E4. \uB85C\uADF8\uC778\uD558\uBA74 \uBB34\uC81C\uD55C \uC800\uC7A5!",
    failedUpdate: "\uC5C5\uB370\uC774\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4",
    noDesc: "\uC124\uBA85 \uC900\uBE44 \uC911",
    categoryLabels: {
      "All": "\uC804\uCCB4",
      "Image & Design": "\uC774\uBBF8\uC9C0 & \uB514\uC790\uC778",
      "Writing": "\uAE00\uC4F0\uAE30",
      "Video": "\uB3D9\uC601\uC0C1",
      "Audio": "\uC624\uB514\uC624",
      "Voice": "\uC74C\uC131",
      "Coding": "\uCF54\uB529",
    } as Record<string, string>,
  },
} as const;

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

function resolveCategory(value: string | null | undefined): CategoryFilter | null {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (s === "Image & Design" || s === "Writing" || s === "Video" || s === "Audio" || s === "Voice" || s === "Coding")
    return s as CategoryFilter;
  const lower = s.toLowerCase();
  if (lower === "image" || lower === "design" || lower === "photo" || lower.includes("image") || lower.includes("design") || lower.includes("art") || lower.includes("diffusion") || lower.includes("typography")) return "Image & Design";
  if (lower === "video" || lower === "film" || lower.includes("video") || lower.includes("cinematic") || lower.includes("footage")) return "Video";
  if (lower === "audio" || lower === "music" || lower.includes("audio") || lower.includes("music") || lower.includes("podcast")) return "Audio";
  if (lower === "voice" || lower === "speech" || lower === "tts" || lower.includes("voice") || lower.includes("tts") || lower.includes("speech")) return "Voice";
  if (lower === "coding" || lower === "code" || lower === "dev" || lower.includes("coding") || lower.includes("dev") || lower.includes("ide") || lower.includes("full-stack") || lower.includes("agentic") || lower.includes("terminal")) return "Coding";
  if (lower === "writing" || lower === "text" || lower === "chat" || lower.includes("writing") || lower.includes("grammar") || lower.includes("copywriting") || lower.includes("research") || lower.includes("presentation")) return "Writing";
  return null;
}

function normalizeCategory(tool: any): CategoryFilter | null {
  const fromBase = resolveCategory(tool?._base_task_category);
  if (fromBase) return fromBase;

  const id = tool?.category_id ?? tool?.categoryId ?? tool?.categoryID ?? tool?.category_key ?? null;

  const fromId = resolveCategory(typeof id === "string" ? id : null);
  if (fromId) return fromId;

  if (typeof id === "number") {
    if (id === 1) return "Writing";
    if (id === 2) return "Image & Design";
    if (id === 3) return "Video";
    if (id === 4) return "Audio";
  }

  const direct = tool?.category ?? tool?.task_category ?? tool?.taskCategory ?? null;
  return resolveCategory(typeof direct === "string" ? direct : null);
}

function filterDisplayTags(tags: string[] | null | undefined): string[] {
  if (!tags) return [];
  return tags.filter((tag) => /[A-Za-z0-9]/.test(tag));
}

type ToolsListClientProps = {
  tools: ToolRecord[];
  basePath?: string;
  locale?: "en" | "kr";
};

export function ToolsListClient({ tools, basePath, locale = "en" }: ToolsListClientProps) {
  const t = i18nLabels[locale];
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [favoriteSlugs, setFavoriteSlugs] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [categoryInitialized, setCategoryInitialized] = useState(false);

  const resolvedBase = basePath ?? "";

  useEffect(() => {
    if (categoryInitialized) return;
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      const normalizedParam = categoryParam.trim();
      const validCategories: CategoryFilter[] = ["Image & Design", "Writing", "Video", "Audio", "Voice", "Coding"];
      if (validCategories.includes(normalizedParam as CategoryFilter)) {
        setSelectedCategory(normalizedParam as CategoryFilter);
      }
    }
    setCategoryInitialized(true);
  }, [searchParams, categoryInitialized]);

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

  const filteredTools = useMemo(() => {
    let result = tools;
    const q = search.trim().toLowerCase();
    if (q.length > 0) {
      result = result.filter((tool) => {
        const name = tool.name?.toLowerCase() ?? "";
        const descEn = tool.desc_en?.toLowerCase() ?? "";
        const desc = tool.description?.toLowerCase() ?? "";
        const tags = tool.tags ?? [];
        return name.includes(q) || descEn.includes(q) || desc.includes(q) || tags.some((tg) => (tg ?? "").toLowerCase().includes(q));
      });
    }
    if (selectedCategory !== "All") {
      result = result.filter((tool) => {
        const cat = normalizeCategory(tool);
        return cat === selectedCategory;
      });
    }
    return result;
  }, [tools, search, selectedCategory]);

  const handleFavoriteToggle = async (toolSlug: string) => {
    const wasFavorited = favoriteSlugs.includes(toolSlug);
    setFavoriteSlugs(prev => wasFavorited ? prev.filter(s => s !== toolSlug) : [...prev, toolSlug]);
    setToast({ message: wasFavorited ? t.removedFromToolbox : t.addedToToolbox, type: "success" });
    try {
      const result = await toggleToolFavorite(toolSlug);
      if (result.blocked) {
        setFavoriteSlugs(prev => wasFavorited ? [...prev, toolSlug] : prev.filter(s => s !== toolSlug));
        setToast({ message: t.guestLimit, type: "error" });
      } else {
        setFavoriteSlugs(result.tools);
      }
    } catch {
      setFavoriteSlugs(prev => wasFavorited ? [...prev, toolSlug] : prev.filter(s => s !== toolSlug));
      setToast({ message: t.failedUpdate, type: "error" });
    }
  };

  const toolCards: (ToolCardProps & { id: string; slug: string })[] = filteredTools.map((tool) => {
    const displayTags = filterDisplayTags(tool.tags);
    const toolSlug = tool.slug || tool.id;
    const normalized = normalizeCategory(tool);
    const description = locale === "kr"
      ? (tool.description ?? tool.desc_ko ?? tool.desc_en ?? t.noDesc)
      : (tool.desc_en ?? tool.description ?? t.noDesc);
    return {
      id: tool.id,
      slug: toolSlug,
      name: tool.name,
      description,
      category: normalized ?? "Other",
      tags: displayTags,
      badge: tool.badge ?? undefined,
      href: tool.affiliate_url ?? tool.url ?? undefined,
      detailsHref: tool.slug ? `${resolvedBase}/tools/${tool.slug}` : undefined,
      isFavorited: favoriteSlugs.includes(toolSlug),
      onFavoriteToggle: () => handleFavoriteToggle(toolSlug),
      locale,
      image: tool.image,
      website_url: tool.websiteUrl || tool.url,
    };
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t.pageTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t.pageDesc}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t.officialOnly}</span>
          </div>
        </header>

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

        {toolCards.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 text-center text-muted-foreground">
            <div>
              {tools.length === 0 ? (
                <p>{t.noToolsYet}</p>
              ) : (
                <p>
                  {t.noMatch}
                  <br />
                  <button onClick={() => setSearch("")} className="mt-2 text-primary hover:underline">
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

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </PageShell>
  );
}