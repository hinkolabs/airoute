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
export function BestRoutesSection({ routes }: BestRoutesSectionProps) {
  // Hide section if no routes
  if (!routes || routes.length === 0) {
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
          {routes.map((route) => {
            const Icon = route.icon && ROUTE_ICON_MAP[route.icon] ? ROUTE_ICON_MAP[route.icon] : Sparkles;
            return (
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
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 transition-transform group-hover:scale-105">
                  <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-400" />
                </div>

                {/* Title */}
                <h3 className="flex-1 text-sm font-medium text-slate-50">
                  {route.title}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
