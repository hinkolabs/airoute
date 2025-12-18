"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavorites, toggleToolFavorite, type FavoritesData } from "@/lib/favorites";
import { useAuth } from "@/app/_providers/auth-provider";
import { ToolLogo } from "@/components/tool-logo";
import { Toast } from "@/components/toast";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getLimits, clampFavorites } from "@/lib/limits";

// ===========================
// ROUTE METADATA
// ===========================
const ROUTE_META: Record<string, { title: string; icon: string }> = {
  "turn-long-videos-into-shorts": { title: "Turn long videos into Shorts", icon: "✂️" },
  "polish-shorts-and-reels": { title: "Polish Shorts & Reels", icon: "✨" },
  "rewrite-email-professionally": { title: "Rewrite email professionally", icon: "✉️" },
  "fix-grammar-and-clarity": { title: "Fix grammar and clarity", icon: "📝" },
  "make-slides-from-notes": { title: "Make slides from notes", icon: "📊" },
  "create-background-music": { title: "Create background music", icon: "🎵" },
  "text-to-narrated-video": { title: "Text to narrated video", icon: "🎙️" },
  "clip-podcasts-into-shorts": { title: "Clip podcasts", icon: "🎧" },
  "add-captions-fast": { title: "Add captions fast", icon: "💬" },
  "summarize-and-repurpose": { title: "Summarize & repurpose", icon: "♻️" },
};

// ===========================
// MY TOOLBOX SECTION
// ===========================
export function MyToolboxSection() {
  const { user, authStatus } = useAuth();
  const [favorites, setFavorites] = useState<FavoritesData>({ tools: [], routes: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Expand/collapse state
  const [toolboxExpanded, setToolboxExpanded] = useState(false);
  const [routesExpanded, setRoutesExpanded] = useState(false);

  // Get current limits based on auth status
  const limits = getLimits(authStatus);

  useEffect(() => {
    async function loadFavorites() {
      try {
        const data = await getFavorites();
        // Clamp favorites to current user limits to prevent UI flash
        const clamped = clampFavorites(data, limits);
        setFavorites(clamped);
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFavorites();
  }, [user, limits]);

  const handleRemoveTool = async (toolSlug: string) => {
    // Optimistic update
    const previousFavorites = favorites;
    setFavorites({
      ...favorites,
      tools: favorites.tools.filter(t => t !== toolSlug),
    });
    setToast({ message: "Removed from Toolbox", type: "success" });

    try {
      await toggleToolFavorite(toolSlug);
    } catch (error) {
      // Rollback on error
      setFavorites(previousFavorites);
      setToast({ message: "Failed to remove tool", type: "error" });
    }
  };


  // Determine how many items to show based on expand state and limits
  const baseToolSlots = 3;
  const expandedToolSlots = 6;
  const maxToolSlots = authStatus === 'authed' && toolboxExpanded ? expandedToolSlots : baseToolSlots;
  const slots = Array.from({ length: maxToolSlots }, (_, i) => i);
  const savedTools = favorites.tools.slice(0, maxToolSlots);
  
  // Routes: always show only what user is allowed to have (guest: 1, authed: up to limits.maxRoutes)
  const savedRoutes = favorites.routes.slice(0, limits.maxRoutes);
  
  // Show expand button only if authed user has more items
  const canExpandTools = authStatus === 'authed' && favorites.tools.length > baseToolSlots;
  const canExpandRoutes = false; // Routes expansion disabled for now

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-50">My Workspace</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {authStatus === 'authed' 
                ? "Your saved tools & routes" 
                : `${savedTools.length}/${limits.maxTools} tools · ${savedRoutes.length}/${limits.maxRoutes} route`}
            </p>
          </div>
          <Link
            href="/my"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-emerald-300"
          >
            <span>View all</span>
            <span>→</span>
          </Link>
        </div>

        {/* Split Layout: Tools (2/3) + Route (1/3) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
          
          {/* LEFT: My Toolbox (2/3 on desktop) */}
          <div className="md:col-span-2">
            {/* Toolbox Header */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium text-slate-400">My Toolbox</h3>
              
              {/* Expand/Collapse Button (authenticated users only) */}
              {canExpandTools && (
                <button
                  onClick={() => setToolboxExpanded(!toolboxExpanded)}
                  className="flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-300"
                  aria-label={toolboxExpanded ? "Collapse toolbox" : "Expand toolbox"}
                >
                  {toolboxExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      <span>Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      <span>More</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 transition-all duration-300">
              {loading ? (
                // Loading state
                slots.map((i) => (
                  <div
                    key={`loading-${i}`}
                    className="flex aspect-square items-center justify-center rounded-xl border border-slate-800/70 bg-slate-900/50"
                  >
                    <div className="h-4 w-4 animate-pulse rounded-full bg-slate-700" />
                  </div>
                ))
              ) : (
                slots.map((i) => {
                  const toolSlug = savedTools[i];
                  
                  if (toolSlug) {
                    // Saved tool slot with remove button
                    return (
                      <div
                        key={`tool-${i}`}
                        className="group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-slate-800/70 bg-slate-900/70 p-3 transition hover:border-emerald-400/30 hover:bg-slate-900"
                      >
                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveTool(toolSlug);
                          }}
                          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                          aria-label="Remove tool"
                        >
                          <span className="text-xs">×</span>
                        </button>

                        {/* Tool content - clickable to tool page */}
                        <Link href={`/tools/${toolSlug}`} className="flex flex-col items-center gap-2">
                          {/* Tool Logo */}
                          <div className="transition-transform group-hover:scale-110">
                            <ToolLogo
                              tool={{ slug: toolSlug, name: toolSlug }}
                              size={40}
                            />
                          </div>
                          
                          {/* Tool Name (truncated) */}
                          <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-slate-300">
                            {toolSlug}
                          </span>
                        </Link>
                      </div>
                    );
                  } else {
                    // Empty slot
                    return (
                      <Link
                        key={`empty-${i}`}
                        href="/tools"
                        className="group flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-slate-800/70 bg-slate-900/30 transition hover:border-emerald-400/30 hover:bg-slate-900/50"
                      >
                        <span className="text-2xl text-slate-600 transition group-hover:text-emerald-400/50">
                          +
                        </span>
                      </Link>
                    );
                  }
                })
              )}
            </div>
            
            {/* Guest message */}
            {!user && savedTools.length > 0 && (
              <p className="mt-2 text-center text-[10px] text-slate-500">
                Sign in to save more
              </p>
            )}
          </div>

          {/* RIGHT: My Routes (1/3 on desktop) */}
          <div className="md:col-span-1">
            {/* Routes Header */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium text-slate-400">
                My Routes {savedRoutes.length > 0 && `(${savedRoutes.length}/${limits.maxRoutes})`}
              </h3>
            </div>
            
            {loading ? (
              // Loading state
              <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-slate-800/70 bg-slate-900/50">
                <div className="h-4 w-4 animate-pulse rounded-full bg-slate-700" />
              </div>
            ) : savedRoutes.length > 0 ? (
              // Saved routes list
              <div className="space-y-2">
                {savedRoutes.map((routeSlug) => {
                  const routeMeta = ROUTE_META[routeSlug];
                  if (!routeMeta) return null;
                  
                  return (
                    <Link
                      key={routeSlug}
                      href={`/routes/${routeSlug}`}
                      className="group relative block rounded-xl border border-slate-800/70 bg-slate-900/70 p-3 transition hover:border-emerald-400/30 hover:bg-slate-900"
                    >
                      {/* Route Info */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-base transition-transform group-hover:scale-110">
                          {routeMeta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-50 transition group-hover:text-emerald-300 truncate">
                            {routeMeta.title}
                          </h4>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                
                {/* Guest message */}
                {!user && savedRoutes.length > 0 && (
                  <p className="mt-2 text-center text-[10px] text-slate-500">
                    Sign in to save up to {getLimits('authed').maxRoutes} routes
                  </p>
                )}
              </div>
            ) : (
              // Empty state - Browse routes CTA
              <Link
                href="/routes"
                className="group flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/70 bg-slate-900/30 p-4 text-center transition hover:border-emerald-400/30 hover:bg-slate-900/50"
              >
                <p className="mb-3 text-xs text-slate-400">No route saved yet</p>
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 transition group-hover:bg-emerald-500/30">
                  <span>Browse routes</span>
                  <span>→</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </section>
  );
}

