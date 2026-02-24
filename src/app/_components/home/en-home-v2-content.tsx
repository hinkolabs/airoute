import Link from "next/link";
import {
  ArrowRight,
  Route,
  BookOpen,
  Image,
  PenLine,
  Film,
  Music,
  Mic,
  Code,
  Sparkles,
  Zap,
  Target,
  ChevronRight,
} from "lucide-react";
import { supabaseServerClient } from "@/lib/supabase/server";
import { getPublicStats } from "@/lib/tools";
import { MyToolboxSection } from "@/app/_components/home/my-toolbox-section";

type FeaturedRoute = { id: string; slug: string; title: string; description: string | null };
type GuideRecord = { slug: string; title: string; guide_type: string | null };

const GUIDE_TYPE_LABEL: Record<string, string> = {
  route_based: "Step-by-Step",
  tool_based: "Quick Start",
  safety: "Before You Start",
};

const CATEGORIES = [
  { id: "image-design", title: "Image & Design", Icon: Image },
  { id: "writing", title: "Writing", Icon: PenLine },
  { id: "video", title: "Video", Icon: Film },
  { id: "audio", title: "Audio", Icon: Music },
  { id: "voice", title: "Voice", Icon: Mic },
  { id: "coding", title: "Coding", Icon: Code },
];

export async function ENHomeV2Content() {
  const stats = await getPublicStats();
  const { data: routesData } = await supabaseServerClient
    .from("routes")
    .select("id, slug, title, description, routes_i18n!left(locale, title, description)")
    .eq("status", "active")
    .eq("featured", true)
    .order("manual_order", { ascending: true })
    .limit(4);

  const featuredRoutes: FeaturedRoute[] = (routesData ?? []).map((r: any) => {
    const i18n = (r.routes_i18n || []).find((i: any) => i && i.locale === "en");
    return { id: r.id, slug: r.slug, title: i18n?.title ?? r.title, description: i18n?.description ?? r.description };
  });

  let latestGuides: GuideRecord[] = [];
  try {
    const { data } = await supabaseServerClient
      .from("guides")
      .select("slug, title, guide_type")
      .in("status", ["approved", "published"])
      .eq("lang", "en")
      .order("created_at", { ascending: false })
      .limit(4);
    latestGuides = (data as GuideRecord[]) ?? [];
  } catch { /* silently fail */ }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute top-20 right-0 h-60 w-60 rounded-full bg-primary/5 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-20 text-center sm:pt-28 sm:pb-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            AI tool navigation, not another directory
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl !leading-[1.15]">
            Too many AI tools?
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">We find the best route</span>{" "}for you.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Choose your goal. We&apos;ll show you the best AI tool combinations and step-by-step workflows. No more endless searching.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/routes" className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-7 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110">
              Explore Routes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/tools" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-7 text-sm font-semibold text-foreground transition hover:bg-muted">
              Browse AI Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center justify-around rounded-2xl border border-border bg-muted/30 py-6 px-4">
          {[
            { value: stats.toolsCount, label: "AI Tools" },
            { value: stats.routesCount, label: "Workflow Routes" },
            { value: stats.guidesCount, label: "Expert Guides" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Routes */}
      <section className="px-5 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead icon={<Route className="h-5 w-5 text-primary" />} title="Popular Routes" sub="The most-used AI workflows" href="/routes" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {featuredRoutes.map((r, i) => (
              <Link key={r.slug} href={`/routes/${r.slug}`} className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-4 py-3 transition hover:border-primary/30 hover:shadow-md sm:gap-4 sm:p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground transition group-hover:text-primary sm:text-base">{r.title}</h3>
                  {r.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.description}</p>}
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      {latestGuides.length > 0 && (
        <section className="px-5 pt-8 pb-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1200px] overflow-hidden rounded-2xl border border-border bg-muted/10 p-4 sm:p-8">
            <SectionHead icon={<BookOpen className="h-5 w-5 text-primary" />} title="Guides" sub="Expert guides to help you choose the right tool" href="/guides" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {latestGuides.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`} className="group flex items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card px-4 py-3 transition hover:border-primary/30 hover:shadow-md sm:gap-4 sm:p-5">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex h-4 items-center">
                      {g.guide_type && <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium leading-none text-primary">{GUIDE_TYPE_LABEL[g.guide_type] ?? g.guide_type}</span>}
                    </div>
                    <h3 className="truncate text-sm font-semibold leading-snug text-foreground transition group-hover:text-primary sm:text-base">{g.title}</h3>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <MyToolboxSection />

      {/* Categories */}
      <section className="px-5 pt-8 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead icon={<Target className="h-5 w-5 text-primary" />} title="Categories" sub="Find the right AI tool for your needs" href="/tools" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((c) => {
              const Icon = c.Icon;
              return (
                <Link key={c.id} href={`/tools/best/${c.id}`} className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition hover:border-primary/30 hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 transition group-hover:bg-primary/15">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{c.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-violet-600 p-10 text-center text-white sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative">
            <Zap className="mx-auto mb-4 h-8 w-8" />
            <h2 className="text-2xl font-bold sm:text-3xl">Start following right now</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">Find the best combinations from over {String(stats.toolsCount).replace("+", "")} AI tools and get started instantly with step-by-step guides.</p>
            <Link href="/routes" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold !text-gray-900 shadow-lg transition hover:bg-white/90">
              Explore Routes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex gap-6 text-xs text-muted-foreground">
              <a href="mailto:contact@hinkolabs.com?subject=[Contact] Airoute" className="transition hover:text-foreground">Contact Us</a>
              <a href="mailto:contact@hinkolabs.com?subject=[Partnership] Airoute" className="transition hover:text-foreground">Partner with us</a>
              <a href="mailto:contact@hinkolabs.com?subject=[Support] Airoute" className="transition hover:text-foreground">Help Center</a>
            </div>
            <p className="text-xs text-muted-foreground/60">© 2025 HinkoLabs</p>
            <div className="flex gap-3 text-xs text-muted-foreground/60">
              <Link href="/privacy" className="transition hover:text-muted-foreground">Privacy Policy</Link>
              <span>·</span>
              <Link href="/terms" className="transition hover:text-muted-foreground">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ icon, title, sub, href }: { icon: React.ReactNode; title: string; sub: string; href: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </div>
      <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-primary sm:inline-flex">
        More <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
