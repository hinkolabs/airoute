import Link from "next/link";
import { ChevronRight, Route, BookOpen } from "lucide-react";

type PickItem = {
  title: string;
  slug: string;
  badge: string | null;
};

type KRTopPicksProps = {
  routes: PickItem[];
  guides: PickItem[];
};

export function KRTopPicks({ routes, guides }: KRTopPicksProps) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Section Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">추천 콘텐츠</h2>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Left: Routes */}
          <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all duration-200 hover:shadow-md md:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-card-foreground">인기 루트</h3>
            </div>
            
            <div className="space-y-2">
              {routes.map((route) => (
                <Link
                  key={route.slug}
                  href={`/kr/routes/${route.slug}`}
                  className="group flex min-h-[44px] items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2.5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-px hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 text-sm font-medium text-foreground">
                      {route.title}
                    </span>
                    {route.badge && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {route.badge}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </Link>
              ))}
            </div>
            
            <Link
              href="/kr/routes"
              className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
            >
              <span>루트 더보기</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right: Guides */}
          <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/60 transition-all duration-200 hover:shadow-md md:p-6">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-card-foreground">가이드</h3>
            </div>
            
            <div className="space-y-2">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/kr/guides/${guide.slug}`}
                  className="group flex min-h-[44px] items-center justify-between rounded-xl border border-border/60 bg-background px-3 py-2.5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-px hover:shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-1 text-sm font-medium text-foreground">
                      {guide.title}
                    </span>
                    {guide.badge && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {guide.badge}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition group-hover:text-primary" />
                </Link>
              ))}
            </div>
            
            <Link
              href="/kr/guides"
              className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
            >
              <span>가이드 더보기</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
