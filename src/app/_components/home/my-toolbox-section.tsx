"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getFavorites, toggleToolFavorite, type FavoritesData } from "@/lib/favorites";
import { useAuth } from "@/app/_providers/auth-provider";
import { ToolLogo } from "@/components/tool-logo";
import { Toast } from "@/components/toast";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getLimits, clampFavorites } from "@/lib/limits";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSavedRoutes, USER_ROUTE_LIMIT } from "@/lib/hooks/use-saved-routes";

// ===========================
// TYPES
// ===========================
type RouteData = {
  slug: string;
  title: string;
  icon: string | null;
};

type ToolData = {
  slug: string;
  name: string;
  website_url: string | null;
};

// ===========================
// MY TOOLBOX SECTION
// ===========================
export function MyToolboxSection() {
  const { user, authStatus } = useAuth();
  
  // Tools: use existing favorites system
  const [toolFavorites, setToolFavorites] = useState<string[]>([]);
  const [toolsData, setToolsData] = useState<ToolData[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  
  // Routes: use new hybrid hook (localStorage for guest, DB for user)
  const { 
    routeSlugs: savedRouteSlugs, 
    count: savedRoutesCount, 
    limit: routesLimit,
    isLoading: routesLoading 
  } = useSavedRoutes();
  
  const [routesData, setRoutesData] = useState<RouteData[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // Expand/collapse state
  const [toolboxExpanded, setToolboxExpanded] = useState(false);
  const [routesExpanded, setRoutesExpanded] = useState(false);

  // Get current limits based on auth status (memoized to prevent infinite loops)
  const toolsLimits = useMemo(() => getLimits(authStatus), [authStatus]);

  // Loading state: combined
  const loading = toolsLoading || routesLoading;

  // Load tool favorites and metadata
  useEffect(() => {
    async function loadToolFavorites() {
      try {
        const data = await getFavorites();
        // Clamp favorites to current user limits to prevent UI flash
        const currentLimits = getLimits(authStatus);
        const clamped = clampFavorites(data, currentLimits);
        setToolFavorites(clamped.tools);

        // Fetch tool metadata from Supabase
        if (clamped.tools.length > 0) {
          const supabase = getSupabaseBrowserClient();
          const { data: tools, error } = await supabase
            .from('tools')
            .select('slug, name, website_url')
            .in('slug', clamped.tools);
          
          if (error) {
            console.error("Error fetching tools metadata:", error);
            setToolsData([]);
          } else if (tools) {
            // Dev-only: confirm website_url is present
            if (process.env.NODE_ENV !== "production") {
              tools.forEach(t => {
                console.log("[MyToolbox]", t.slug, "website_url:", t.website_url);
              });
            }
            
            // Maintain order from clamped.tools
            const orderedTools = clamped.tools
              .map(slug => tools.find(t => t.slug === slug))
              .filter((t): t is ToolData => t !== undefined);
            setToolsData(orderedTools);
          }
        } else {
          setToolsData([]);
        }
      } catch (error) {
        console.error("Error loading tool favorites:", error);
      } finally {
        setToolsLoading(false);
      }
    }
    loadToolFavorites();
  }, [authStatus]);

  // Load route metadata when savedRouteSlugs changes
  // Use string representation to avoid infinite loop from array reference changes
  const savedRouteSlugsKey = savedRouteSlugs.join(',');
  
  useEffect(() => {
    async function loadRouteMetadata() {
      if (savedRouteSlugs.length === 0) {
        setRoutesData([]);
        return;
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const { data: routes, error } = await supabase
          .from('routes')
          .select('slug, title, icon')
          .in('slug', savedRouteSlugs);
        
        if (error) {
          console.error("Error fetching routes:", error);
          setRoutesData([]);
        } else if (routes) {
          // Maintain order from savedRouteSlugs
          const orderedRoutes = savedRouteSlugs
            .map(slug => routes.find(r => r.slug === slug))
            .filter((r): r is RouteData => r !== undefined);
          setRoutesData(orderedRoutes);
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
        setRoutesData([]);
      }
    }
    loadRouteMetadata();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedRouteSlugsKey]); // Use string key instead of array to prevent infinite loop

  const handleRemoveTool = async (toolSlug: string) => {
    // Optimistic update
    const previousTools = toolFavorites;
    setToolFavorites(toolFavorites.filter(t => t !== toolSlug));
    setToast({ message: "Removed from Toolbox", type: "success" });

    try {
      await toggleToolFavorite(toolSlug);
    } catch (error) {
      // Rollback on error
      setToolFavorites(previousTools);
      setToast({ message: "Failed to remove tool", type: "error" });
    }
  };


  // Determine how many items to show based on expand state and limits
  const baseToolSlots = 3;
  const expandedToolSlots = 6;
  const maxToolSlots = authStatus === 'authed' && toolboxExpanded ? expandedToolSlots : baseToolSlots;
  const slots = Array.from({ length: maxToolSlots }, (_, i) => i);
  const savedTools = toolFavorites.slice(0, maxToolSlots);
  
  // Show expand button only if authed user has more items
  const canExpandTools = authStatus === 'authed' && toolFavorites.length > baseToolSlots;
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
                : `${savedTools.length}/${toolsLimits.maxTools} tools · ${savedRoutesCount}/${routesLimit} route`}
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
                  const toolData = toolsData.find(t => t.slug === toolSlug);
                  
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
                              tool={toolData ?? { slug: toolSlug, name: toolSlug, website_url: null }}
                              size={40}
                            />
                          </div>
                          
                          {/* Tool Name (truncated) */}
                          <span className="line-clamp-2 text-center text-[10px] font-medium leading-tight text-slate-300">
                            {toolData?.name ?? toolSlug}
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
                My Routes {savedRoutesCount > 0 && `(${savedRoutesCount}/${routesLimit})`}
              </h3>
            </div>
            
            {loading ? (
              // Loading state
              <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-slate-800/70 bg-slate-900/50">
                <div className="h-4 w-4 animate-pulse rounded-full bg-slate-700" />
              </div>
            ) : routesData.length > 0 ? (
              // Saved routes list
              <div className="space-y-2">
                {routesData.map((route) => (
                  <Link
                    key={route.slug}
                    href={`/routes/${route.slug}`}
                    className="group relative block rounded-xl border border-slate-800/70 bg-slate-900/70 p-3 transition hover:border-emerald-400/30 hover:bg-slate-900"
                  >
                    {/* Route Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-base transition-transform group-hover:scale-110">
                        {route.icon || "🚀"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-50 transition group-hover:text-emerald-300 truncate">
                          {route.title}
                        </h4>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* Guest message */}
                {!user && routesData.length > 0 && (
                  <p className="mt-2 text-center text-[10px] text-slate-500">
                    Sign in to save up to {USER_ROUTE_LIMIT} routes
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

