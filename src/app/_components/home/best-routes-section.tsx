import Link from "next/link";
import { getRouteIcon } from "@/lib/routeIcons";

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

// Helper: Extract verb/keyword from step_title for desktop compact view
function extractStepKeyword(stepTitle: string | null, position: number): string {
  if (!stepTitle) return `Step ${position}`;
  
  // Extract first meaningful word (usually a verb)
  const cleaned = stepTitle.trim();
  const firstWord = cleaned.split(/[\s,]/)[0];
  
  // If first word is too short, try to get first 2 words
  if (firstWord.length <= 3 && cleaned.includes(' ')) {
    const words = cleaned.split(' ').slice(0, 2);
    return words.join(' ');
  }
  
  return firstWord;
}

// ===========================
// BEST ROUTES SECTION
// Server-rendered component with pre-fetched data
// ===========================
export function BestRoutesSection({ routes, steps }: BestRoutesSectionProps) {
  // Hide section if no routes
  if (!routes || routes.length === 0) {
    return null;
  }

  // Sort by manual_order ASC
  const sortedRoutes = [...routes].sort((a: any, b: any) => (a.manual_order ?? 999) - (b.manual_order ?? 999));
  
  // Mobile: first route = featured card, rest = list items
  // Desktop: all routes = uniform cards in grid
  const featuredPrimary = sortedRoutes[0] ?? null;
  const featuredRest = sortedRoutes.slice(1, 4);

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between lg:mb-5">
          <h2 className="text-base font-semibold leading-6 text-slate-50">Best Routes</h2>
          <Link
            href="/routes"
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-emerald-300"
          >
            <span>More</span>
            <span>→</span>
          </Link>
        </div>

        {/* MOBILE: Featured + List (sm/md) */}
        <div className="space-y-2.5 lg:hidden">
          {/* Featured Primary Card (mobile only) */}
          {featuredPrimary && (() => {
            const Icon = getRouteIcon(featuredPrimary.slug);
            return (
              <Link
                key={featuredPrimary.id}
                href={`/routes/${featuredPrimary.slug}`}
                className="group relative flex min-h-[90px] flex-col gap-2 overflow-hidden rounded-lg border border-white/10 bg-slate-900/35 px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.45)] transition hover:border-emerald-400/30 hover:bg-slate-900/40 backdrop-blur-xl"
              >
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-sky-500/25 via-indigo-500/15 to-transparent opacity-80" />
                <div className="flex flex-1 flex-col gap-2">
                  {/* Header row */}
                  <div className="flex w-full items-center gap-2.5">
                    {/* Icon */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 transition-transform group-hover:scale-105">
                      <Icon className="text-emerald-400 transition-colors group-hover:text-emerald-300" size={22} strokeWidth={2} />
                    </div>

                    {/* Title */}
                    <h3 className="flex-1 text-sm font-semibold leading-5 text-slate-50 line-clamp-2">
                      {featuredPrimary.title}
                    </h3>
                  </div>

                  {/* Description */}
                  {featuredPrimary.description && (
                    <p className="text-sm leading-5 text-slate-400 line-clamp-1">
                      {featuredPrimary.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })()}

          {/* Rest as list items (mobile only) */}
          <div className="grid grid-cols-1 gap-2.5">
            {featuredRest.map((route) => {
              const Icon = getRouteIcon(route.slug);
              return (
                <Link
                  key={route.id}
                  href={`/routes/${route.slug}`}
                  className="group relative flex min-h-[52px] items-center gap-2.5 rounded-lg border border-white/10 bg-slate-900/25 px-3 py-2 transition hover:border-emerald-400/30 hover:bg-slate-900/35"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/10 transition-transform group-hover:scale-105">
                    <Icon className="text-emerald-400 transition-colors group-hover:text-emerald-300" size={22} strokeWidth={2} />
                  </div>

                  {/* Title */}
                  <div className="flex flex-1 min-w-0 flex-col justify-center text-left">
                    <h3 className="text-sm font-semibold leading-5 text-slate-50 truncate">
                      {route.title}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* DESKTOP: Uniform Card Grid (>=1024px) */}
        <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 lg:gap-4">
          {sortedRoutes.map((route, index) => {
            const Icon = getRouteIcon(route.slug);
            const isFeatured = index === 0;
            
            return (
              <Link
                key={route.id}
                href={`/routes/${route.slug}`}
                className={`
                  group relative flex h-full flex-col cursor-pointer overflow-visible rounded-xl 
                  border bg-slate-900/40 p-5 shadow-sm
                  transition-all duration-200 ease-out
                  ${isFeatured 
                    ? 'border-emerald-400/20 hover:border-emerald-400/50 hover:bg-slate-900/55 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5' 
                    : 'border-slate-600/60 hover:border-slate-500/60 hover:bg-slate-900/55 hover:shadow-lg hover:-translate-y-0.5'
                  }
                `}
              >
                {/* Icon - Large & Prominent (44-48px) */}
                <div className={`mb-4 flex flex-shrink-0 items-center justify-center rounded-xl bg-slate-800/50 transition-all duration-200 lg:h-12 lg:w-12 group-hover:scale-110 ${isFeatured ? 'group-hover:shadow-md group-hover:shadow-emerald-500/20' : ''}`}>
                  <Icon 
                    size={32}
                    className={`transition-all duration-200 ${isFeatured ? 'text-emerald-300 group-hover:text-emerald-300' : 'text-emerald-300 group-hover:text-emerald-400'}`} 
                    strokeWidth={1.75} 
                  />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  {/* Title - White, prominent */}
                  <h3 className="text-xl font-semibold leading-tight text-white line-clamp-2 group-hover:text-emerald-50 transition-colors duration-200">
                    {route.title}
                  </h3>

                  {/* Description - 2 lines, readable gray */}
                  {route.description && (
                    <p className="text-sm leading-relaxed text-slate-300 line-clamp-2">
                      {route.description}
                    </p>
                  )}
                </div>

                {/* Route-specific chips (max 2 per card) */}
                <div className="mt-auto pt-4 flex items-center gap-2 overflow-visible">
                  {(() => {
                    // Slug-based chip mapping (no DB changes)
                    const chipMap: Record<string, string[]> = {
                      'turn-long-videos-into-shorts': ['Video', '~20 min'],
                      'make-slides-from-notes': ['Work', '~10 min'],
                      'write-professional-business-emails': ['Writing', 'Templates'],
                      'research-anything-faster-than-google': ['Research', 'Summary'],
                    };
                    
                    const chips = chipMap[route.slug] || ['AI', 'Quick'];
                    
                    return chips.map((label, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center rounded-full bg-slate-800/70 border border-slate-600/50 px-2.5 py-1 text-xs font-medium text-slate-200"
                      >
                        {label}
                      </span>
                    ));
                  })()}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
