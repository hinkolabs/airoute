"use client";

import Link from "next/link";

// ===========================
// BEST ROUTES DATA
// ===========================
const BEST_ROUTES = [
  {
    id: "turn-long-videos-into-shorts",
    title: "Turn long videos into Shorts",
    icon: "✂️",
    href: "/routes/turn-long-videos-into-shorts",
  },
  {
    id: "fix-grammar-and-clarity",
    title: "Fix grammar and clarity",
    icon: "📝",
    href: "/routes/fix-grammar-and-clarity",
  },
  {
    id: "add-captions-fast",
    title: "Add captions fast",
    icon: "💬",
    href: "/routes/add-captions-fast",
  },
];

// ===========================
// BEST ROUTES SECTION
// ===========================
export function BestRoutesSection() {

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
          {BEST_ROUTES.map((route) => (
            <Link
              key={route.id}
              href={route.href}
              className="group flex min-h-[50px] items-center gap-2.5 rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2.5 transition hover:border-emerald-400/30 hover:bg-slate-900/70"
            >
              {/* Icon */}
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-lg transition-transform group-hover:scale-105">
                {route.icon}
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

