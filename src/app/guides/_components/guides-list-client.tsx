"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";

type GuideItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  guide_type: string | null;
  primary_intent: string | null;
  taxonomy?: string | null;
  created_at: string;
};

type Cursor = { createdAt: string; id: string } | null;

type GuideTypeFilter = "all" | "route_based" | "tool_based" | "safety";

function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold tracking-wide text-emerald-300 ring-1 ring-emerald-500/20">
      {children}
    </span>
  );
}

// Format date to YYYY-MM-DD
function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// Pretty label: convert underscore/hyphen to space, then Title Case
function prettyLabel(input?: string | null): string {
  if (!input) return "";
  return input
    .replace(/[_-]+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

// Build API URL with search and filter params
function buildApiUrl(params: {
  q: string;
  activeType: GuideTypeFilter;
  lang: string;
  limit: number;
  cursor?: Cursor;
}): string {
  const url = new URL("/api/guides/list", window.location.origin);
  url.searchParams.set("limit", params.limit.toString());
  url.searchParams.set("lang", params.lang);
  
  // If q exists, always use type=all for API
  // Otherwise, use activeType
  const apiType = params.q.trim() ? "all" : params.activeType;
  if (apiType !== "all") {
    url.searchParams.set("type", apiType);
  }
  
  if (params.q.trim()) {
    url.searchParams.set("q", params.q.trim());
  }
  
  if (params.cursor) {
    url.searchParams.set("cursorCreatedAt", params.cursor.createdAt);
    url.searchParams.set("cursorId", params.cursor.id);
  }
  
  return url.toString();
}

export default function GuidesListClient(props: {
  initialItems: GuideItem[];
  initialCursor: Cursor;
}) {
  const [allItems, setAllItems] = useState<GuideItem[]>(props.initialItems);
  const [cursor, setCursor] = useState<Cursor>(props.initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeType, setActiveType] = useState<GuideTypeFilter>("all");
  const [isInitialMount, setIsInitialMount] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Client-side filtering: if activeType is not "all", filter items
  const filteredItems = useMemo(() => {
    if (activeType === "all") return allItems;
    return allItems.filter((item) => item.guide_type === activeType);
  }, [allItems, activeType]);

  // Debounce search input by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(searchInput);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset pagination and reload when search/type changes
  useEffect(() => {
    // Skip on initial mount (use initialItems)
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    // Skip if search query is less than 2 characters (unless it's empty)
    const trimmedQ = debouncedQ.trim();
    if (trimmedQ.length === 1) {
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    async function reloadGuides() {
      // Create new AbortController for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setError(null);
      // Reset items, cursor, and states before reload
      setAllItems([]);
      setCursor(null);
      
      try {
        const url = buildApiUrl({
          q: debouncedQ,
          activeType,
          lang: "en",
          limit: 10,
        });

        const res = await fetch(url, { 
          method: "GET",
          signal: abortController.signal,
        });
        
        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        const json = await res.json();

        if (!json.ok) {
          console.error("[guides-list-client] API error:", json.error);
          setError("Failed to load guides.");
          setAllItems([]);
          setCursor(null);
          return;
        }

        const newItems: GuideItem[] = Array.isArray(json.items) ? json.items : [];
        const next: Cursor = json.nextCursor ?? null;

        setAllItems(newItems);
        setCursor(next);
      } catch (e: unknown) {
        // Ignore abort errors
        if (e instanceof Error && e.name === "AbortError") {
          return;
        }
        console.error("[guides-list-client] Fetch error:", e);
        setError("Failed to load guides.");
        setAllItems([]);
        setCursor(null);
      } finally {
        // Only set loading to false if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    reloadGuides();
    
    // Cleanup: abort request on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, activeType]);

  const canLoadMore = !!cursor && !loading;

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const url = buildApiUrl({
        q: debouncedQ,
        activeType,
        lang: "en",
        limit: 10,
        cursor,
      });

      const res = await fetch(url, { method: "GET" });
      const json = await res.json();

      // Handle error response
      if (!json.ok) {
        console.error("[guides-list-client] API error:", json.error);
        setError("Failed to load guides.");
        return;
      }

      const newItems: GuideItem[] = Array.isArray(json.items) ? json.items : [];
      const next: Cursor = json.nextCursor ?? null;

      // Dedup by id (safety)
      const merged = [...allItems, ...newItems];
      const seen = new Set<string>();
      const deduped = merged.filter((g) => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      });

      setAllItems(deduped);
      setCursor(next);
    } catch (e: unknown) {
      console.error("[guides-list-client] Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  const empty = useMemo(() => filteredItems.length === 0, [filteredItems.length]);

  const FILTER_OPTIONS: { value: GuideTypeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "route_based", label: "route_based" },
    { value: "tool_based", label: "tool_based" },
    { value: "safety", label: "safety" },
  ];

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search guides..."
          className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 transition-all focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
      </div>

      {/* Searching indicator */}
      {loading && (debouncedQ.trim().length >= 2 || activeType !== "all") && (
        <p className="text-xs text-white/50">Searching...</p>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActiveType(option.value)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              activeType === option.value
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          {error}
        </div>
      )}

      {/* Filter hint when search + type filter results in 0 items */}
      {!error && !loading && debouncedQ.trim() && activeType !== "all" && filteredItems.length === 0 && allItems.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/50">
          {activeType === "tool_based" 
            ? "No tool-based guides match your search. Try 'All' or switch to route_based."
            : `No ${activeType} guides match your search. Try switching to All.`}
        </div>
      )}

      {/* Empty state */}
      {!error && empty && !loading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70 space-y-3">
          <p className="font-medium">No guides found</p>
          <p className="text-white/50 text-xs">
            Try a different keyword or switch the filter.
          </p>
          {(debouncedQ.trim() || activeType !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setDebouncedQ("");
                setActiveType("all");
              }}
              className="mt-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/80 hover:bg-white/15 transition"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Guide list */}
      {!error && loading && allItems.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          Loading guides...
        </div>
      )}

      {!error && !empty && !loading && (
        <>
          {filteredItems.map((g) => (
            <Link
              key={g.id}
              href={`/guides/${g.slug}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/7"
            >
              {/* Row 1: Meta row - guide_type badge (left) + date (right) */}
              <div className="mb-3 flex min-h-[1.75rem] items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {g.guide_type ? (
                    <Badge>{g.guide_type}</Badge>
                  ) : (
                    <span className="h-5 w-0" aria-hidden="true" />
                  )}
                </div>
                <div className="shrink-0 text-xs text-white/40">
                  {formatDate(g.created_at)}
                </div>
              </div>

              {/* Row 2: Title (H2 sizing) */}
              <h2 className="mb-2 line-clamp-2 text-lg font-semibold text-white md:text-xl">
                {g.title}
              </h2>

              {/* Row 3: Intent chip (taxonomy 우선, 없으면 primary_intent) */}
              {(g.taxonomy || g.primary_intent) && (
                <div className="mb-2 w-full">
                  <span className="inline-block w-full truncate rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/60">
                    {prettyLabel(g.taxonomy || g.primary_intent)}
                  </span>
                </div>
              )}

              {/* Row 4: Excerpt (line-clamp-2) */}
              <div className="mb-3 min-h-[2.5rem]">
                {g.excerpt ? (
                  <p className="line-clamp-2 text-sm text-white/70">
                    {g.excerpt}
                  </p>
                ) : (
                  <span className="invisible text-sm">Placeholder</span>
                )}
              </div>
            </Link>
          ))}
        </>
      )}

      {/* Load more button - show if there are more items to load (based on API cursor, not filtered items) */}
      {!error && cursor && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}



