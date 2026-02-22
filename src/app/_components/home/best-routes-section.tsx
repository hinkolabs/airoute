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
          <h2 className="text-base font-semibold leading-6 text-foreground">Best Routes</h2>
          <Link
            href="/routes"
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
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
                className="group relative flex min-h-[90px] flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card/60 px-4 py-3 shadow-sm transition hover:border-primary/30 hover:shadow-md backdrop-blur-xl"
              >
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-primary/10 via-accent/5 to-transparent opacity-80" />
                <div className="flex flex-1 flex-col gap-2">
                  {/* Header row */}
                  <div className="flex w-full items-center gap-2.5">
                    {/* Icon */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 transition-transform group-hover:scale-105">
                      <Icon className="text-primary transition-colors group-hover:text-primary" size={22} strokeWidth={2} />
                    </div>

                    {/* Title */}
                    <h3 className="flex-1 text-sm font-semibold leading-5 text-card-foreground line-clamp-2">
                      {featuredPrimary.title}
                    </h3>
                  </div>

                  {/* Description */}
                  {featuredPrimary.description && (
                    <p className="text-sm leading-5 text-muted-foreground line-clamp-1">
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
                  className="group relative flex min-h-[52px] items-center gap-2.5 rounded-lg border border-border bg-card/40 px-3 py-2 transition hover:border-primary/30 hover:bg-card/60"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 transition-transform group-hover:scale-105">
                    <Icon className="text-primary transition-colors" size={22} strokeWidth={2} />
                  </div>

                  {/* Title */}
                  <div className="flex flex-1 min-w-0 flex-col justify-center text-left">
                    <h3 className="text-sm font-semibold leading-5 text-card-foreground truncate">
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
                  border bg-card p-5 shadow-sm
                  transition-all duration-200 ease-out
                  ${isFeatured 
                    ? 'border-primary/20 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5' 
                    : 'border-border hover:border-border hover:bg-card hover:shadow-lg hover:-translate-y-0.5'
                  }
                `}
              >
                {/* Icon - Large & Prominent (44-48px) */}
                <div className={`mb-4 flex flex-shrink-0 items-center justify-center rounded-xl bg-muted/30 transition-all duration-200 lg:h-12 lg:w-12 group-hover:scale-110 ${isFeatured ? 'group-hover:shadow-md group-hover:shadow-primary/20' : ''}`}>
                  <Icon 
                    size={32}
                    className={`transition-all duration-200 ${isFeatured ? 'text-primary group-hover:text-primary' : 'text-primary group-hover:text-accent'}`} 
                    strokeWidth={1.75} 
                  />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  {/* Title - White, prominent */}
                  <h3 className="text-xl font-semibold leading-tight text-card-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
                    {route.title}
                  </h3>

                  {/* Description - 2 lines, readable gray */}
                  {route.description && (
                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
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
                        className="inline-flex items-center rounded-full bg-muted/50 border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground"
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
