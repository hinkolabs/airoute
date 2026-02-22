"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import type { DbRoute } from "@/lib/db/routes";
import { useSavedRoutes } from "@/lib/hooks/use-saved-routes";
import { useAuth } from "@/app/_providers/auth-provider";
import { getRouteIcon } from "@/lib/routeIcons";

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
        const response = await fetch("/api/routes/list?locale=en");
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
    <div className="min-h-screen bg-background px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">All Routes</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Quick start workflows built from trusted AI tools.
          </p>
        </header>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Count */}
        <p className="mb-4 text-sm text-muted-foreground">
          {filteredRoutes.length} {filteredRoutes.length === 1 ? "route" : "routes"} found
        </p>

        {/* Routes Grid */}
        {isLoading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-card/40 p-8 text-center">
            <p className="text-lg font-medium text-muted-foreground">Loading routes...</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-card/40 p-8 text-center">
            <p className="text-lg font-medium text-muted-foreground">No routes found</p>
            <p className="mt-2 text-sm text-muted-foreground">
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
                  className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
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
                          ? "fill-primary stroke-primary"
                          : "stroke-muted hover:stroke-muted-foreground"
                      }`}
                    />
                  </button>

                  {/* Icon */}
                  <div className="mb-3 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-muted/30 border border-border transition-all duration-200 group-hover:border-primary/50">
                    {(() => {
                      const Icon = getRouteIcon(route.slug);
                      return <Icon className="h-7 w-7 text-muted-foreground transition-colors group-hover:text-primary" strokeWidth={1.75} />;
                    })()}
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 text-lg font-semibold text-card-foreground transition group-hover:text-primary">
                    {route.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {route.description}
                  </p>

                  {/* Tags */}
                  {route.tags && route.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {route.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
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
                : "border-primary bg-primary/80 text-primary-foreground"
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

