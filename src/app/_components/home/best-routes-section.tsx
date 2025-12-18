"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ===========================
// TYPE
// ===========================
type FeaturedRoute = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  tags: string[] | null;
};

// ===========================
// BEST ROUTES SECTION
// Client component with single fetch (no infinite loops)
// ===========================
export function BestRoutesSection() {
  const [routes, setRoutes] = useState<FeaturedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Guard to prevent duplicate fetches
  const didFetchRef = useRef(false);
  const instanceIdRef = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    const instanceId = instanceIdRef.current;
    console.log(`[BestRoutesSection ${instanceId}] useEffect called, didFetch=${didFetchRef.current}`);
    
    // Prevent duplicate calls
    if (didFetchRef.current) {
      console.log(`[BestRoutesSection ${instanceId}] Skipping - already fetched`);
      return;
    }
    didFetchRef.current = true;

    const abortController = new AbortController();

    (async () => {
      try {
        console.log(`[BestRoutesSection ${instanceId}] Starting fetch to /api/routes/featured`);
        setLoading(true);
        setError(false);

        const res = await fetch("/api/routes/featured", {
          signal: abortController.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log(`[BestRoutesSection ${instanceId}] Fetch success, routes count:`, data.routes?.length ?? 0);
        setRoutes(data.routes ?? []);
      } catch (e) {
        // Don't set error on abort
        if (e instanceof Error && e.name === "AbortError") {
          console.log(`[BestRoutesSection ${instanceId}] Fetch aborted`);
          return;
        }
        console.error(`[BestRoutesSection ${instanceId}] Fetch error:`, e);
        setError(true);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    })();

    // Cleanup: abort on unmount
    return () => {
      console.log(`[BestRoutesSection ${instanceId}] Cleanup - aborting fetch`);
      abortController.abort();
    };
  }, []); // Empty deps - only run once on mount

  // Loading state
  if (loading) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-50">Best Routes</h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[50px] animate-pulse rounded-lg border border-slate-800/70 bg-slate-900/50"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error or empty state - hide section
  if (error || routes.length === 0) {
    return null;
  }

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-50">Best Routes</h2>
          <Link
            href="/routes"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-emerald-300"
          >
            <span>More</span>
            <span>→</span>
          </Link>
        </div>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:gap-3">
          {routes.map((route) => (
            <Link
              key={route.id}
              href={`/routes/${route.slug}`}
              className="group relative flex min-h-[50px] items-center gap-2.5 rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2.5 transition hover:border-emerald-400/30 hover:bg-slate-900/70"
            >
              {/* Featured Badge */}
              {route.featured && (
                <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  Featured
                </span>
              )}

              {/* Icon */}
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-lg transition-transform group-hover:scale-105">
                {route.icon || "🚀"}
              </div>

              {/* Title */}
              <h3 className="flex-1 text-sm font-medium text-slate-50">
                {route.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
