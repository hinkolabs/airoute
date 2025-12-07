"use client";

import { PageShell } from "@/app/_design/components/page";
import { useTheme } from "@/app/_design/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function ToolDetailLoading() {
  const { theme } = useTheme();

  const skeletonBg = theme === "day" ? "bg-slate-200" : "bg-slate-800";
  const cardBorder = theme === "day" ? "border-slate-200" : "border-white/10";
  const cardBg = theme === "day" ? "bg-slate-50" : "bg-slate-900/50";

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Back link skeleton */}
        <div className="pb-6">
          <div className={cn("h-5 w-32 animate-pulse rounded", skeletonBg)} />
        </div>

        {/* Header skeleton */}
        <header className="mb-8 text-center md:text-left">
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-between">
            <div className={cn("h-10 w-56 animate-pulse rounded md:w-72", skeletonBg)} />
            <div className={cn("h-7 w-24 animate-pulse rounded-full", skeletonBg)} />
          </div>
        </header>

        {/* Description skeleton */}
        <section className={cn("mb-8 rounded-2xl border p-6", cardBorder, cardBg)}>
          <div className="space-y-2">
            <div className={cn("h-5 w-full animate-pulse rounded", skeletonBg)} />
            <div className={cn("h-5 w-5/6 animate-pulse rounded", skeletonBg)} />
            <div className={cn("h-5 w-4/6 animate-pulse rounded", skeletonBg)} />
          </div>
        </section>

        {/* Button row skeleton */}
        <section className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={cn("h-12 w-44 animate-pulse rounded-xl", skeletonBg)} />
          <div className={cn("h-12 w-36 animate-pulse rounded-xl", skeletonBg)} />
        </section>

        {/* Meta blocks skeleton */}
        <section className="mb-10 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn("h-24 animate-pulse rounded-2xl border", cardBorder, cardBg)}
            />
          ))}
        </section>

        {/* Divider */}
        <hr className={cn("mb-10", theme === "day" ? "border-slate-200" : "border-white/10")} />

        {/* More tools skeleton */}
        <section>
          <div className={cn("mb-4 h-6 w-48 animate-pulse rounded", skeletonBg)} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn("h-32 animate-pulse rounded-2xl", skeletonBg)}
              />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

