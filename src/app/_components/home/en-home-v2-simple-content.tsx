import Link from "next/link";
import { ArrowRight, ArrowUpRight, Route, BookOpen } from "lucide-react";
import { supabaseServerClient } from "@/lib/supabase/server";

type FeaturedRoute = { slug: string; title: string; description: string | null };
type GuideRecord = { slug: string; title: string; guide_type: string | null };

const GUIDE_LABEL: Record<string, string> = {
  route_based: "Step-by-Step",
  tool_based: "Quick Start",
  safety: "Safety",
};

export async function ENHomeV2SimpleContent() {
  const { data: routesData } = await supabaseServerClient
    .from("routes")
    .select("slug, title, description, routes_i18n!left(locale, title, description)")
    .eq("status", "active")
    .eq("featured", true)
    .order("manual_order", { ascending: true })
    .limit(6);

  const routes: FeaturedRoute[] = (routesData ?? []).map((r: any) => {
    const i18n = (r.routes_i18n || []).find((i: any) => i && i.locale === "en");
    return { slug: r.slug, title: i18n?.title ?? r.title, description: i18n?.description ?? r.description };
  });

  let guides: GuideRecord[] = [];
  try {
    const { data } = await supabaseServerClient
      .from("guides")
      .select("slug, title, guide_type")
      .in("status", ["approved", "published"])
      .eq("lang", "en")
      .order("created_at", { ascending: false })
      .limit(4);
    guides = (data as GuideRecord[]) ?? [];
  } catch { /* silently fail */ }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-2xl px-5 pb-20 pt-24 text-center sm:pt-32">
        <p className="mb-4 text-sm font-medium tracking-wide text-primary uppercase">AI Tool Navigation</p>
        <h1 className="text-4xl font-bold tracking-tight !leading-[1.2] sm:text-5xl">
          Stop searching.
          <br />
          Start building.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          Pick a goal — we&apos;ll show you the 3 best AI tools and a step-by-step workflow.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/routes" className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110">
            Explore Routes <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/tools" className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-6 text-sm font-medium text-foreground transition hover:bg-muted">
            All Tools
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl border-t border-border" />

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Popular Routes</h2>
          </div>
          <Link href="/routes" className="text-sm text-muted-foreground transition hover:text-primary">View all →</Link>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border">
          {routes.map((r) => (
            <Link key={r.slug} href={`/routes/${r.slug}`} className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/50">
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-foreground transition group-hover:text-primary">{r.title}</h3>
                {r.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.description}</p>}
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {guides.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 pb-16">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Guides</h2>
            </div>
            <Link href="/guides" className="text-sm text-muted-foreground transition hover:text-primary">View all →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {guides.map((g) => (
              <Link key={g.slug} href={`/guides/${g.slug}`} className="group flex flex-col justify-between rounded-xl border border-border p-4 transition hover:border-primary/30 hover:shadow-sm">
                <span className="mb-2 block min-h-[20px]">
                  {g.guide_type ? <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{GUIDE_LABEL[g.guide_type] ?? g.guide_type}</span> : null}
                </span>
                <h3 className="text-sm font-medium leading-snug text-foreground transition group-hover:text-primary">{g.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-violet-600 p-10 text-center text-white sm:p-14">
          <h2 className="text-xl font-bold sm:text-2xl">Ready to find your AI workflow?</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/70">200+ tools, curated routes, and expert guides.</p>
          <Link href="/routes" className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-7 text-sm font-semibold !text-gray-900 shadow-lg transition hover:bg-white/90">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-8 text-center">
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <a href="mailto:contact@hinkolabs.com?subject=[Contact] Airoute" className="transition hover:text-foreground">Contact</a>
            <a href="mailto:contact@hinkolabs.com?subject=[Partnership] Airoute" className="transition hover:text-foreground">Partnership</a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} HinkoLabs ·{" "}
            <Link href="/privacy" className="hover:text-muted-foreground">Privacy</Link>{" "}·{" "}
            <Link href="/terms" className="hover:text-muted-foreground">Terms</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
