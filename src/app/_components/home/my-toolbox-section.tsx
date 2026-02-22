"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthOptional } from "@/app/_providers/use-auth-optional";
import { ToolLogo } from "@/components/tool-logo";
import { Toast } from "@/components/toast";
import { ChevronDown, ExternalLink } from "lucide-react";
import { loadGuestFavorites, saveGuestFavorites } from "@/lib/guest";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useDemoMode } from "@/app/_providers/demo-mode-provider";

// ===========================
// TYPES
// ===========================
type RouteData = {
  slug: string;
  title: string;
  icon: string | null;
};

type ToolData = {
  id: string;
  slug: string;
  name: string;
  website_url: string | null;
  affiliate_url: string | null;
};

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "timeout" | "error"; error?: unknown };

async function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<Result<T>> {
  let t: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeoutP = new Promise<Result<T>>(res => {
      t = setTimeout(() => res({ ok: false, reason: "timeout" }), ms);
    });

    const valueP = p
      .then(v => ({ ok: true, value: v } as const))
      .catch(e => ({ ok: false, reason: "error", error: e } as const));

    return await Promise.race([valueP, timeoutP]);
  } finally {
    if (t) {
      clearTimeout(t);
    }
  }
}

const __DEV__ = process.env.NODE_ENV !== "production";

const TOOLBOX_EXPANSION_KEY = "airoute_mytools_expanded";
const TOOLBOX_BASE_SLOTS = 3;
const TOOLBOX_EXPANDED_SLOTS = 6;
const ROUTES_LIMIT_GUEST = 1;
const ROUTES_LIMIT_AUTHED = 2;

const GUEST_SAVED_ROUTES_KEY = "airoute_saved_routes_guest_v1";

function loadGuestSavedRoutes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const json = localStorage.getItem(GUEST_SAVED_ROUTES_KEY);
    const data = json ? JSON.parse(json) : [];
    return Array.isArray(data) ? data.slice(0, ROUTES_LIMIT_GUEST) : [];
  } catch {
    return [];
  }
}

// ===========================
// MY TOOLBOX SECTION
// ===========================
export function MyToolboxSection({ basePath }: { basePath?: string }) {
  const demoMode = useDemoMode();
  const { user, authStatus, loading: authLoading } = useAuthOptional();
  
  // Resolve base path for link construction
  const resolvedBase = basePath ?? "";
  
  // Tools: saved_tools for authed, localStorage for guests
  const [savedToolSlugs, setSavedToolSlugs] = useState<string[]>([]);
  const [toolsData, setToolsData] = useState<ToolData[]>([]);
  const [toolsResolved, setToolsResolved] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
 
  const [routesData, setRoutesData] = useState<RouteData[]>([]);
  const [routesResolved, setRoutesResolved] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [savedRoutesCount, setSavedRoutesCount] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  const isAuthed = authStatus === "authed" && Boolean(user?.id);
  const toolsMax = isAuthed ? TOOLBOX_EXPANDED_SLOTS : TOOLBOX_BASE_SLOTS;
  const toolsVisible = isAuthed ? (toolsExpanded ? TOOLBOX_EXPANDED_SLOTS : TOOLBOX_BASE_SLOTS) : TOOLBOX_BASE_SLOTS;
  const routesVisible = isAuthed ? ROUTES_LIMIT_AUTHED : ROUTES_LIMIT_GUEST;
  const routesLimit = routesVisible;

  const loading = authLoading || (!toolsResolved || !routesResolved);

  // --- all hooks declared above this line ---

  useEffect(() => {
    let active = true;

    if (authLoading) {
      return () => {
        active = false;
      };
    }

    setToolsError(null);
    setToolsResolved(false);

    async function loadTools() {
      if (!active) return;

      try {
        if (!isAuthed || !user?.id) {
          const guestFavorites = loadGuestFavorites();
          const guestTools = (guestFavorites.tools || []).slice(0, toolsMax);
          if (!active) return;
          setSavedToolSlugs(guestTools);

          if (guestTools.length > 0) {
            const supabase = getBrowserSupabaseClient();
            const metaResult = await withTimeout(
              (async () => {
                return await supabase
                  .from("tools")
                  .select("id, slug, name, website_url, affiliate_url")
                  .in("slug", guestTools)
                  .limit(toolsMax);
              })(),
              8000
            );
            if (active && metaResult.ok) {
              const meta = metaResult.value as any;
              if (!meta.error && meta.data) {
                setToolsData(meta.data as ToolData[]);
                return;
              }
            }
          }

          setToolsData([]);
          return;
        }

        if (__DEV__) {
          console.log('[MyToolbox] Fetching saved tools');
        }

        const supabase = getBrowserSupabaseClient();
        const savedToolsResult = await withTimeout(
          (async () => {
            return await supabase
              .from('saved_tools')
              .select('tool_id')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(toolsMax);
          })(),
          8000
        );

        if (!active) return;

        if (!savedToolsResult.ok) {
          throw savedToolsResult.reason === 'timeout'
            ? new Error('timeout')
            : savedToolsResult.error ?? new Error('Failed to load saved tools.');
        }

        const savedToolsData = savedToolsResult.value as any;
        if (savedToolsData.error) {
          throw savedToolsData.error;
        }

        const toolIds = (savedToolsData.data || [])
          .map((entry: { tool_id: string | null }) => entry.tool_id)
          .filter((id: any): id is string => Boolean(id));

        if (toolIds.length === 0) {
          setSavedToolSlugs([]);
          setToolsData([]);
          return;
        }

        const metadataResult = await withTimeout(
          (async () => {
            return await supabase
              .from('tools')
              .select('id, slug, name, website_url, affiliate_url')
              .in('id', toolIds)
              .limit(toolsMax);
          })(),
          8000
        );

        if (!active) return;

        if (!metadataResult.ok) {
          throw metadataResult.reason === 'timeout'
            ? new Error('timeout')
            : metadataResult.error ?? new Error('Failed to load tool metadata.');
        }

        const metadata = metadataResult.value as any;
        if (metadata.error) {
          throw metadata.error;
        }

        const toolsById = new Map(
          (metadata.data || []).map((tool: ToolData) => [tool.id, tool])
        );

        const orderedTools = toolIds
          .map((id: any) => toolsById.get(id))
          .filter((tool: any): tool is ToolData => tool !== undefined);

        setSavedToolSlugs(orderedTools.map((tool: any) => tool.slug));
        setToolsData(orderedTools);
      } catch (err) {
        if (!active) return;

        if (__DEV__) {
          console.error('[MyToolbox] failed to load saved tools', err);
        }

        const errorMessage =
          err instanceof Error && err.message === 'timeout'
            ? 'Request timed out while loading saved tools.'
            : 'Failed to load saved tools.';

        setSavedToolSlugs([]);
        setToolsData([]);
        setToolsError(errorMessage);
      } finally {
        if (active) {
          setToolsResolved(true);
        }
      }
    }

    loadTools();

    return () => {
      active = false;
    };
  }, [authLoading, isAuthed, user?.id, reloadKey, toolsMax]);

  useEffect(() => {
    let active = true;

    if (authLoading) {
      return () => {
        active = false;
      };
    }

    setRoutesError(null);
    setRoutesResolved(false);

    const routeLimit = routesVisible;

    async function loadRoutes() {
      if (!active) return;

      try {
        if (!isAuthed || !user?.id) {
          const guestRoutes = loadGuestSavedRoutes().slice(0, routeLimit);
          if (!active) return;

          if (guestRoutes.length > 0) {
            const supabase = getBrowserSupabaseClient();
            const locale = basePath === "/kr" ? "kr" : "en";
            const metaResult = await withTimeout(
              (async () => {
                return await supabase
                  .from("routes")
                  .select("slug, title, icon, routes_i18n(locale, title)")
                  .in("slug", guestRoutes)
                  .limit(routeLimit);
              })(),
              8000
            );
            if (active && metaResult.ok) {
              const meta = metaResult.value as any;
              if (!meta.error && meta.data) {
                const mapped = guestRoutes
                  .map((slug) => {
                    const r = (meta.data as any[]).find((d: any) => d.slug === slug);
                    if (!r) return { slug, title: slug, icon: null };
                    const i18n = r.routes_i18n || [];
                    const tr = i18n.find((i: any) => i?.locale === locale) || i18n.find((i: any) => i?.locale === "en");
                    return {
                      slug: r.slug,
                      title: tr?.title ?? r.title ?? slug,
                      icon: r.icon ?? null,
                    };
                  });
                setRoutesData(mapped);
                setSavedRoutesCount(mapped.length);
                return;
              }
            }
          }

          const guestRouteData = guestRoutes.map((slug) => ({
            slug,
            title: slug,
            icon: null,
          }));
          setRoutesData(guestRouteData);
          setSavedRoutesCount(guestRouteData.length);
          return;
        }

        if (__DEV__) {
          console.log('[MyToolbox] Fetching saved routes');
        }

        const supabase = getBrowserSupabaseClient();
        const savedRoutesResult = await withTimeout(
          (async () => {
            return await supabase
              .from('saved_routes')
              .select(`
                route_id,
                created_at,
                routes (
                  slug,
                  title,
                  icon,
                  routes_i18n (
                    locale,
                    title
                  )
                )
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(routeLimit);
          })(),
          8000
        );

        if (!active) return;

        if (!savedRoutesResult.ok) {
          throw savedRoutesResult.reason === 'timeout'
            ? new Error('timeout')
            : savedRoutesResult.error ?? new Error('Failed to load saved routes.');
        }

        const savedRoutesData = savedRoutesResult.value as any;
        if (savedRoutesData.error) {
          throw savedRoutesData.error;
        }

        if (!active) return;

        const locale = basePath === '/kr' ? 'kr' : 'en';
        const rows = savedRoutesData.data || [];
        const mappedRoutes = rows
          .map((entry: {
            routes?: {
              slug?: string | null;
              title?: string | null;
              icon?: string | null;
              routes_i18n?: Array<{ locale?: string | null; title?: string | null } | null> | null;
            } | null;
          }) => {
            const route = entry.routes;
            if (!route || !route.slug) return null;
            const i18n = route.routes_i18n || [];
            const translation =
              i18n.find((item) => item?.locale === locale) ||
              i18n.find((item) => item?.locale === 'en');
            return {
              slug: route.slug,
              title: translation?.title ?? route.title ?? route.slug,
              icon: route.icon ?? null,
            };
          })
          .filter((route: any): route is RouteData => Boolean(route));

        const limitedRoutes = mappedRoutes.slice(0, routeLimit);
        setRoutesData(limitedRoutes);
        setSavedRoutesCount(limitedRoutes.length);
      } catch (err) {
        if (!active) return;

        if (__DEV__) {
          console.error('[MyToolbox] failed to load saved routes', err);
        }

        const errorMessage =
          err instanceof Error && err.message === 'timeout'
            ? 'Request timed out while loading saved routes.'
            : 'Failed to load saved routes.';

        setRoutesData([]);
        setSavedRoutesCount(0);
        setRoutesError(errorMessage);
      } finally {
        if (active) {
          setRoutesResolved(true);
        }
      }
    }

    loadRoutes();

    return () => {
      active = false;
    };
  }, [authLoading, authStatus, basePath, reloadKey, user?.id, isAuthed, routesVisible]);

  useEffect(() => {
    if (!isAuthed || typeof window === "undefined") {
      setToolsExpanded(false);
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(TOOLBOX_EXPANSION_KEY);
      setToolsExpanded(storedValue === "true");
    } catch (error) {
      if (__DEV__) {
        console.warn("[MyToolbox] failed to read expand preference", error);
      }
    }
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(TOOLBOX_EXPANSION_KEY, toolsExpanded ? "true" : "false");
    } catch (error) {
      if (__DEV__) {
        console.warn("[MyToolbox] failed to store expand preference", error);
      }
    }
  }, [isAuthed, toolsExpanded]);

  const handleRemoveTool = async (toolSlug: string) => {
    const previousSlugs = savedToolSlugs;
    const previousTools = toolsData;
    const updatedSlugs = previousSlugs.filter((slug) => slug !== toolSlug);
    const updatedTools = previousTools.filter((tool) => tool.slug !== toolSlug);
    setSavedToolSlugs(updatedSlugs);
    setToolsData(updatedTools);

    try {
      if (!isAuthed || !user?.id) {
        const guestFavorites = loadGuestFavorites();
        const newTools = guestFavorites.tools.filter((slug) => slug !== toolSlug);
        saveGuestFavorites({ ...guestFavorites, tools: newTools });
        setToast({ message: "Removed from Toolbox", type: "success" });
        return;
      }

      const supabase = getBrowserSupabaseClient();
      let toolId = previousTools.find((tool) => tool.slug === toolSlug)?.id;

      if (!toolId) {
        const lookupResult = await withTimeout(
          (async () => {
            return await supabase
              .from('tools')
              .select('id')
              .eq('slug', toolSlug)
              .maybeSingle();
          })(),
          8000
        );

        if (!lookupResult.ok) {
          throw lookupResult.reason === 'timeout'
            ? new Error('timeout')
            : lookupResult.error ?? new Error('Failed to remove tool.');
        }

        const lookupData = lookupResult.value as any;
        if (lookupData.error) {
          throw lookupData.error;
        }

        toolId = lookupData.data?.id ?? null;
      }

      if (!toolId) {
        throw new Error('tool_not_found');
      }

      const deleteResult = await withTimeout(
        (async () => {
          return await supabase
            .from('saved_tools')
            .delete()
            .eq('user_id', user.id)
            .eq('tool_id', toolId);
        })(),
        8000
      );

      if (!deleteResult.ok) {
        throw deleteResult.reason === 'timeout'
          ? new Error('timeout')
          : deleteResult.error ?? new Error('Failed to remove saved tool.');
      }

      const deleteData = deleteResult.value as any;
      if (deleteData.error) {
        throw deleteData.error;
      }

      setToast({ message: "Removed from Toolbox", type: "success" });
    } catch (error) {
      if (__DEV__) {
        console.error('[MyToolbox] failed to remove saved tool', error);
      }
      setSavedToolSlugs(previousSlugs);
      setToolsData(previousTools);
      setToast({ message: "Failed to remove tool", type: "error" });
    }
  };


  const visibleRoutes = routesData.slice(0, routesVisible);
  const toolSlots = Array.from({ length: toolsVisible }, (_, i) => i);
  const visibleToolSlugs = savedToolSlugs.slice(0, toolsVisible);
  const toolsHref = `${resolvedBase}/tools`;
  const routesHref = `${resolvedBase}/routes`;
  const fetchErrorMessage = toolsError && routesError
    ? "Failed to load saved tools and routes."
    : toolsError
      ? "Failed to load saved tools."
      : "Failed to load saved routes.";
  const showErrorState = !loading && Boolean(toolsError || routesError);
  const showEmptyState = !loading && !showErrorState && visibleToolSlugs.length === 0 && visibleRoutes.length === 0 && isAuthed;
  const handleRetry = () => setReloadKey((prev) => prev + 1);

  const canExpandTools = isAuthed;

  const hasGuestData = savedToolSlugs.length > 0 || routesData.length > 0;
  const showGuestLoginCta = !user && !demoMode && !hasGuestData && !loading;

  if (showGuestLoginCta) {
    return (
      <section className="px-4 py-5 sm:px-6 sm:py-4 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-4">
            <h2 className="text-base font-semibold leading-6 text-foreground">My Toolbox</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Save tools & routes to build your workflow
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 px-6 py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <span className="text-3xl">📦</span>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              My Toolbox
            </h3>
            <p className="mb-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Log in to save tools and build your workflow
            </p>
            <Link
              href="/login?next=/workspace"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <span>Log in to get started</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // User is logged in: Show full functionality
  return (
    <section className="px-4 py-5 sm:px-6 sm:py-4 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold leading-6 text-foreground">
              {demoMode ? "My Toolbox" : "My Workspace"}
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {isAuthed
                ? "Your saved tools & routes"
                : `${Math.min(savedToolSlugs.length, toolsMax)}/${toolsMax} tools · ${savedRoutesCount}/${routesLimit} route`}
            </p>
          </div>
          {!demoMode && (
            <Link
              href="/workspace"
              className="inline-flex h-9 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <span>View all</span>
              <span>→</span>
            </Link>
          )}
        </div>

        {showErrorState && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{fetchErrorMessage}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1 text-sm font-semibold text-red-900 transition hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {showEmptyState && (
          <div className="mb-6 rounded-xl border border-dashed border-border bg-muted/10 px-4 py-6 text-center text-sm text-muted-foreground">
            <p className="mb-3 text-base font-semibold text-muted-foreground">No saved tools or routes yet.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={toolsHref}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
              >
                Browse tools
              </Link>
              <Link
                href={routesHref}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-primary"
              >
                Browse routes
              </Link>
            </div>
          </div>
        )}

        {/* Split Layout: Tools (2/3) + Route (1/3) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
          
          {/* LEFT: My Toolbox (2/3 on desktop) */}
          <div className="md:col-span-2">
            {/* Toolbox Header */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold leading-5 text-muted-foreground">My Toolbox</h3>
              {canExpandTools && (
                <button
                  type="button"
                  onClick={() => setToolsExpanded((prev) => !prev)}
                  aria-label={toolsExpanded ? "Collapse saved tools" : "Expand saved tools"}
                  aria-expanded={toolsExpanded}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${toolsExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>

            <div
              className={`transition-all duration-300 ${toolsExpanded ? "w-full max-w-[780px] mx-auto" : "w-full"}`}
            >
              <div className="grid grid-cols-3 gap-3">
                {loading ? (
                  toolSlots.map((i) => (
                    <div
                      key={`loading-${i}`}
                      className="flex aspect-square items-center justify-center rounded-xl border border-border bg-card/50"
                    >
                      <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
                    </div>
                  ))
                ) : (
                  toolSlots.map((i) => {
                    const toolSlug = visibleToolSlugs[i];
                    const toolData = toolsData.find((t) => t.slug === toolSlug);
                    
                    if (toolSlug) {
                      const officialUrl = toolData?.affiliate_url || toolData?.website_url;
                      
                      return (
                        <div
                          key={`tool-${i}`}
                          className="group relative flex aspect-square flex-col items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-md"
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveTool(toolSlug);
                            }}
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100 z-10"
                            aria-label="Remove tool"
                          >
                            <span className="text-xs">×</span>
                          </button>

                          <Link 
                            href={`${resolvedBase}/tools/${toolSlug}`}
                            className="flex flex-1 flex-col items-center justify-center gap-2 w-full"
                          >
                            <div className="flex items-center justify-center transition-transform hover:scale-105">
                              <ToolLogo
                                tool={toolData ?? { slug: toolSlug, name: toolSlug, website_url: null }}
                                size={56}
                              />
                            </div>
                            
                            <span className="line-clamp-2 text-center text-sm font-semibold leading-5 text-card-foreground transition hover:text-primary">
                              {toolData?.name ?? toolSlug}
                            </span>
                          </Link>

                          <div className="w-full mt-2 flex justify-center">
                            {officialUrl ? (
                              <a
                                href={officialUrl}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium !text-primary transition hover:bg-primary/20 hover:!text-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
                                    window.gtag('event', 'affiliate_click', {
                                      partner_name: toolSlug,
                                      tool_slug: toolSlug,
                                      link_url: officialUrl,
                                      placement: 'home_my_toolbox',
                                    });
                                  }
                                }}
                              >
                                <span className="text-primary">Visit</span>
                                <ExternalLink size={14} className="text-primary" />
                              </a>
                            ) : (
                              <span className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-muted-foreground">
                                <span>No link</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={`empty-${i}`}
                        href={`${resolvedBase}/tools`}
                        className="group flex min-h-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 transition hover:border-primary/30 hover:bg-muted/30"
                      >
                        <span className="text-2xl text-muted transition group-hover:text-primary/50">
                          +
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
            
            {!demoMode && !user && savedToolSlugs.length > 0 && (
              <p className="mt-3 text-center text-sm leading-5 text-muted-foreground">
                Sign in to save more
              </p>
            )}
          </div>

          {/* RIGHT: My Routes (1/3 on desktop) */}
          <div className="md:col-span-1">
            {/* Routes Header */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold leading-5 text-muted-foreground">
                My Routes {savedRoutesCount > 0 && `(${savedRoutesCount}/${routesLimit})`}
              </h3>
            </div>
            
            {loading ? (
              // Loading state
              <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-border bg-card/50">
                <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
              </div>
            ) : visibleRoutes.length > 0 ? (
              // Saved routes list
              <div className="space-y-2">
                {visibleRoutes.map((route) => (
                  <Link
                    key={route.slug}
                    href={`${resolvedBase}/routes/${route.slug}`}
                    className="group relative block rounded-xl border border-border bg-card p-3 transition hover:border-primary/30 hover:shadow-md"
                  >
                    {/* Route Info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base transition-transform group-hover:scale-110">
                        {route.icon || "🚀"}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="text-sm font-semibold leading-5 text-card-foreground transition group-hover:text-primary truncate">
                          {route.title}
                        </h4>
                      </div>
                    </div>
                  </Link>
                ))}
                
                {!demoMode && !user && visibleRoutes.length > 0 && (
                  <p className="mt-3 text-center text-sm leading-5 text-muted-foreground">
                    Sign in to save up to {ROUTES_LIMIT_AUTHED} routes
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Empty state - Browse routes CTA */}
              <Link
                href={`${resolvedBase}/routes`}
                className="group flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center transition hover:border-primary/30 hover:bg-muted/30"
              >
                <p className="mb-3 text-sm leading-5 text-muted-foreground">No route saved yet</p>
                <div className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/20 px-3 py-2 text-sm font-medium text-primary transition group-hover:bg-primary/30">
                  <span>Browse routes</span>
                  <span>→</span>
                </div>
              </Link>
              {routesVisible > 1 && (
                <div
                  aria-hidden="true"
                  className="min-h-[120px] rounded-xl border border-dashed border-border bg-muted/20"
                />
              )}
            </div>
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



