import Link from "next/link";
import { Scissors, Sparkles, Layout, FileText, AudioWaveform } from "lucide-react";

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

type BestRoutesSectionProps = {
  routes: FeaturedRoute[];
  steps: Array<{ position: number; step_title: string | null; tool_id: string }>;
};

const ROUTE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "✂️": Scissors,
  "✨": Sparkles,
  "📊": Layout,
  "📝": FileText,
  "🎵": AudioWaveform,
};

// ===========================
// BEST ROUTES SECTION
// Server-rendered component with pre-fetched data
// ===========================
export function BestRoutesSection({ routes, steps }: BestRoutesSectionProps) {
  // Hide section if no routes
  if (!routes || routes.length === 0) {
    return null;
  }

  // Sort by manual_order ASC (assuming routes already have manual_order property)
  const sortedRoutes = [...routes].sort((a: any, b: any) => (a.manual_order ?? 999) - (b.manual_order ?? 999));
  
  // Split: first route = highlighted card, next 3 = list items
  const featuredPrimary = sortedRoutes[0] ?? null;
  const featuredRest = sortedRoutes.slice(1, 4);

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
        <div className="space-y-2.5 lg:space-y-3">
          {featuredPrimary && (() => {
            const Icon = featuredPrimary.icon && ROUTE_ICON_MAP[featuredPrimary.icon] ? ROUTE_ICON_MAP[featuredPrimary.icon] : Sparkles;
            return (
              <Link
                key={featuredPrimary.id}
                href={`/routes/${featuredPrimary.slug}`}
                className="group relative flex min-h-[125px] flex-col gap-2 overflow-hidden rounded-lg border border-white/10 bg-slate-900/35 px-4 py-4 shadow-[0_20px_60px_rgba(2,6,23,0.45)] transition hover:border-emerald-400/30 hover:bg-slate-900/40 backdrop-blur-xl lg:flex-row lg:flex-wrap lg:items-start lg:gap-4 lg:px-5 lg:py-5"
              >
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-sky-500/25 via-indigo-500/15 to-transparent opacity-80" />
                <div className="flex flex-1 flex-col gap-3 lg:flex-auto">
                  {/* Header row */}
                  <div className="flex w-full items-center gap-2.5 lg:w-auto lg:gap-3">
                    {/* Icon */}
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 transition-transform group-hover:scale-105 lg:h-9 lg:w-9">
                      <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-400 lg:h-5 lg:w-5" />
                    </div>

                    {/* Featured Badge */}
                    <span className="inline-flex h-5 flex-shrink-0 items-center rounded-full bg-emerald-500/20 px-2 text-[10px] font-semibold uppercase leading-none tracking-wide text-emerald-300">
                      Featured
                    </span>

                    {/* Title */}
                    <h3 className="flex-1 text-sm font-medium leading-snug text-slate-50 line-clamp-2 lg:flex-initial lg:text-base">
                      {featuredPrimary.title}
                    </h3>
                  </div>

                  {/* Description */}
                  {featuredPrimary.description && (
                    <p className="text-xs leading-relaxed text-slate-300/60 line-clamp-2 sm:hidden lg:block lg:flex-1 lg:text-sm">
                      {featuredPrimary.description}
                    </p>
                  )}
                </div>

                {steps && steps.length > 0 && (
                  <div className="space-y-1 sm:hidden lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0 lg:w-full lg:mt-2">
                    {steps.slice(0, 3).map((step, stepIndex) => (
                      <div key={stepIndex} className="flex min-w-0 items-start gap-1.5">
                        <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-semibold text-emerald-300">
                          {step.position}
                        </span>
                        <span className="text-xs text-slate-300/70 truncate whitespace-nowrap">
                          {step.step_title || `Step ${step.position}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            );
          })()}

          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3 lg:gap-3">
            {featuredRest.map((route) => {
              const Icon = route.icon && ROUTE_ICON_MAP[route.icon] ? ROUTE_ICON_MAP[route.icon] : Sparkles;
              return (
                <Link
                  key={route.id}
                  href={`/routes/${route.slug}`}
                  className="group relative flex min-h-[44px] items-center gap-2.5 rounded-lg border border-white/10 bg-slate-900/25 px-3 py-1.5 transition hover:border-emerald-400/30 hover:bg-slate-900/35"
                >
                  {/* Icon */}
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 transition-transform group-hover:scale-105">
                    <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-400" />
                  </div>

                  {/* Title */}
                  <h3 className="flex-1 min-w-0 text-sm font-medium text-slate-50 truncate">
                    {route.title}
                  </h3>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
