"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import type { DbRoute } from "@/lib/db/routes";
import { useSavedRoutes } from "@/lib/hooks/use-saved-routes";
import { useAuth } from "@/app/_providers/auth-provider";

export default function RoutesPage() {
  const { user } = useAuth();
  const { routeSlugs: favoriteSlugs, isSaved, toggle, count, limit, isLoading: favoritesLoading } = useSavedRoutes();
  const [searchQuery, setSearchQuery] = useState("");
  const [routes, setRoutes] = useState<DbRoute[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load routes from DB
  useEffect(() => {
    async function loadRoutes() {
      try {
        const response = await fetch("/api/routes/list");
        if (response.ok) {
          const data = await response.json();
          setRoutes(data);
        }
      } catch (error) {
        console.error("Error loading routes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRoutes();
  }, []);

  // Filter routes by search query
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    
    const query = searchQuery.toLowerCase();
    return routes.filter(route =>
      route.title.toLowerCase().includes(query) ||
      route.description?.toLowerCase().includes(query) ||
      route.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [routes, searchQuery]);

  const handleToggleFavorite = async (routeSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const result = await toggle(routeSlug);
      if (result.blocked) {
        const limitMessage = user
          ? `You reached your save limit (${limit} routes).`
          : "Guest can save up to 1 route. Sign in to save more.";
        setToast({ message: limitMessage, type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setToast({ message: "Failed to update favorites", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-8 pt-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-50 sm:text-4xl">All Routes</h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Quick start workflows built from trusted AI tools.
          </p>
        </header>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 py-3 pl-10 pr-4 text-sm text-slate-50 placeholder-slate-500 transition focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
        </div>

        {/* Count */}
        <p className="mb-4 text-sm text-slate-400">
          {filteredRoutes.length} {filteredRoutes.length === 1 ? "route" : "routes"} found
        </p>

        {/* Routes Grid */}
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/40 p-8 text-center">
            <p className="text-lg font-medium text-slate-400">Loading routes...</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/40 p-8 text-center">
            <p className="text-lg font-medium text-slate-400">No routes found</p>
            <p className="mt-2 text-sm text-slate-500">
              {searchQuery ? "Try a different search term" : "No routes available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRoutes.map((route) => {
              const isFavorited = isSaved(route.slug);
              return (
                <Link
                  key={route.slug}
                  href={`/routes/${route.slug}`}
                  className="group relative flex flex-col rounded-2xl border border-slate-800/70 bg-slate-900/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-slate-900 hover:shadow-md"
                >
                  {/* Star Toggle */}
                  <button
                    onClick={(e) => handleToggleFavorite(route.slug, e)}
                    aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  >
                    <Star
                      className={`h-5 w-5 transition-colors ${
                        isFavorited
                          ? "fill-emerald-400 stroke-emerald-400"
                          : "stroke-slate-500 hover:stroke-slate-300"
                      }`}
                    />
                  </button>

                  {/* Icon */}
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
                    {route.icon || "🚀"}
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-lg font-semibold text-slate-50 transition group-hover:text-emerald-300">
                    {route.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400 line-clamp-2">
                    {route.description}
                  </p>

                  {/* Tags */}
                  {route.tags && route.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {route.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-900/40 px-2 py-0.5 text-[10px] text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Toast - positioned at top to avoid mobile bottom nav overlap */}
        {toast && (
          <div
            className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${
              toast.type === "error"
                ? "border-red-700 bg-red-900/80 text-red-100"
                : "border-emerald-700 bg-emerald-900/80 text-emerald-100"
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

