import Link from "next/link";
import { Image, PenLine, Film, Music, Mic, Code } from "lucide-react";
import type { ToolRecord } from "@/lib/tools";
import { BestRoutesSection } from "./home/best-routes-section";
import { MyToolboxSection } from "./home/my-toolbox-section";

type FeaturedRoute = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  tags: string[] | null;
};

type GuideRecord = {
  slug: string;
  title: string;
  excerpt: string | null;
  guide_type: string | null;
  primary_intent: string | null;
  taxonomy?: string | null;
  created_at: string;
  cta_type: string | null;
  cta_route_slug: string | null;
  cta_tool_slug: string | null;
};

// Pretty label: convert underscore/hyphen to space, then Title Case
function prettyLabel(input?: string | null): string {
  if (!input) return "";
  return input
    .replace(/[_-]+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Guide type label mapping
const GUIDE_TYPE_LABEL: Record<string, string> = {
  route_based: "Step-by-Step",
  tool_based: "Quick Start",
  safety: "Before You Start",
};

// Format date to YYYY-MM-DD
function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

type NormalModePageProps = {
  tools: ToolRecord[];
  featuredRoutes: FeaturedRoute[];
  featuredRouteSteps: Array<{ position: number; step_title: string | null; tool_id: string }>;
  latestGuides: GuideRecord[];
};

// ===========================
// CATEGORY DATA
// ===========================
const CATEGORIES = [
  {
    id: "image-design",
    title: "Image & Design",
    description: "Create logos, posters, and polished UI designs",
    Icon: Image,
  },
  {
    id: "writing",
    title: "Writing",
    description: "Write blogs, marketing copy, and scripts faster",
    Icon: PenLine,
  },
  {
    id: "video",
    title: "Video",
    description: "Edit and generate professional videos easily",
    Icon: Film,
  },
  {
    id: "audio",
    title: "Audio",
    description: "Produce music, podcasts, and background tracks",
    Icon: Music,
  },
  {
    id: "voice",
    title: "Voice",
    description: "Generate realistic voice and dubbing instantly",
    Icon: Mic,
  },
  {
    id: "coding",
    title: "Coding",
    description: "Get code assistance and debug efficiently",
    Icon: Code,
  },
];

// ===========================
// SHARED: SECTION HEADER
// ===========================
function SectionHeader({ title, moreHref }: { title: string; moreHref: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold leading-6 text-foreground">{title}</h2>
      <Link
        href={moreHref}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <span>More</span>
        <span>→</span>
      </Link>
    </div>
  );
}

// Header is now global (in layout.tsx)

// ===========================
// 1. HERO SECTION (Text Only)
// ===========================
function HeroSection() {
  return (
    <section className="px-4 pt-4 pb-3 sm:px-6 lg:px-8 lg:pb-6">
      <div className="mx-auto max-w-[1200px] rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/5 px-4 py-4 shadow-sm sm:px-5 sm:py-6 lg:px-12 lg:py-10">
        {/* Badge */}
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/30 lg:mb-3">
          <span>✦</span>
          <span>AI tool navigation, not another directory</span>
        </div>

        {/* Headline */}
        <h1 className="mb-2 text-3xl font-semibold leading-tight text-foreground sm:text-4xl sm:leading-tight lg:mb-3 lg:max-w-[900px] lg:text-5xl lg:leading-tight">
          <span className="block">Too many AI tools?</span>
          <span className="block">We find the best route for you.</span>
        </h1>

        {/* Subtext */}
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground sm:text-lg lg:max-w-none lg:whitespace-nowrap lg:overflow-hidden lg:text-ellipsis">
          No more endless searching. Choose your goal, and we'll show you the top 3 AI tools.
        </p>
      </div>
    </section>
  );
}

// ===========================
// 2. CATEGORY SECTION
// ===========================
function CategorySection() {
  return (
    <section id="categories" className="px-4 py-10 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader title="Categories" moreHref="/tools" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => {
          const Icon = category.Icon;
          return (
            <Link
              key={category.id}
              href={`/tools/best/${category.id}`}
              className="group flex min-h-[145px] flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              {/* Icon + Title */}
              <div className="flex-1">
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold leading-5 text-card-foreground lg:text-lg">
                  {category.title}
                </h3>
                <p className="line-clamp-2 text-sm leading-5 text-muted-foreground lg:text-base">
                  {category.description}
                </p>
              </div>

              {/* Bottom CTA (single line) */}
              <div className="mt-3 flex min-h-[44px] items-center justify-between px-1 text-sm font-medium text-primary">
                <span>View best 3 tools</span>
                <span className="transition group-hover:translate-x-0.5">→</span>
              </div>
            </Link>
          );
        })}
        </div>
      </div>
    </section>
  );
}

// ===========================
// 3. GUIDES SECTION
// ===========================
function GuidesSection({ guides }: { guides: GuideRecord[] }) {
  const hasGuides = guides && guides.length > 0;

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold leading-6 text-foreground">Start here</h2>
            <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
              Step-by-step guides to help you choose AI tools
            </p>
          </div>
          <Link
            href="/guides"
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <span>More</span>
            <span>→</span>
          </Link>
        </div>

        {/* Guides Cards */}
        {hasGuides ? (
          <div className="space-y-2.5 lg:space-y-2.5">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group block rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98] lg:py-3.5 lg:px-5"
              >
                {/* Row 1: Meta row - guide_type pill (left) + date (right) */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {guide.guide_type && (
                      <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium tracking-wide text-primary ring-1 ring-primary/20">
                        {GUIDE_TYPE_LABEL[guide.guide_type] ?? guide.guide_type}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 text-xs leading-4 text-muted">
                    {formatDate(guide.created_at)}
                  </div>
                </div>

                {/* Row 2: Title - Readable & Clean */}
                <h3 className="text-sm font-semibold leading-5 text-card-foreground line-clamp-2 transition-colors group-hover:text-primary lg:text-lg lg:font-bold lg:leading-6">
                  {guide.title}
                </h3>

                {/* Row 3: Category (mobile only, minimal) */}
                {(guide.taxonomy || guide.primary_intent) && (
                  <div className="mt-1.5 lg:mt-2">
                    <span className="inline-block truncate text-xs leading-4 text-muted lg:hidden">
                      {prettyLabel(guide.taxonomy || guide.primary_intent)}
                    </span>
                    <div className="hidden lg:flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{prettyLabel(guide.taxonomy || guide.primary_intent)}</span>
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          /* Fallback - Simple and lightweight */
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card/50 px-6 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Guides are loading...
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ===========================
// 4. STUDIO TEASER
// ===========================
function StudioTeaser() {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-[1200px] rounded-2xl border border-border bg-card px-5 py-7 text-center shadow-sm lg:px-8 lg:py-10">
        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span>✨</span>
          <span>Coming soon</span>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-lg font-bold text-card-foreground lg:text-xl">
          Airoute <span className="text-primary">Studio</span>
        </h2>

        {/* Subtitle */}
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground lg:text-base">
          One-screen workflow automation for scripts, images, and videos.
        </p>

        {/* Pill */}
        <div className="inline-flex cursor-not-allowed rounded-full border border-border bg-muted/50 px-5 py-1.5 text-xs font-medium text-muted-foreground">
          Launching Feb 2026
        </div>
      </div>
    </section>
  );
}

// ===========================
// 5. FOOTER
// ===========================
function PageFooter() {
  return (
    <footer className="px-4 py-8 text-center lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4 flex justify-center gap-6 text-xs">
        <a href="mailto:contact@hinkolabs.com?subject=[Contact] Airoute" className="text-muted-foreground transition-colors hover:text-primary">
          Contact Us
        </a>
        <a href="mailto:contact@hinkolabs.com?subject=[Partnership] Airoute" className="text-muted-foreground transition-colors hover:text-primary">
          Partner with us
        </a>
        <a href="mailto:contact@hinkolabs.com?subject=[Support] Airoute" className="text-muted-foreground transition-colors hover:text-primary">
          Help Center
        </a>
      </div>
      <div className="mb-2">
        <p className="text-xs text-muted-foreground">© 2025 HinkoLabs</p>
      </div>
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <Link href="/privacy" className="transition-colors hover:text-muted-foreground">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/terms" className="transition-colors hover:text-muted-foreground">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}

// BottomTabBar is now global (MobileBottomNav in layout.tsx)

// ===========================
// MAIN COMPONENT
// ===========================
export default function NormalModePage({ tools, featuredRoutes, featuredRouteSteps, latestGuides }: NormalModePageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="pb-20">
        <HeroSection />
        <BestRoutesSection routes={featuredRoutes} steps={featuredRouteSteps} />
        <GuidesSection guides={latestGuides} />
        <MyToolboxSection />
        <CategorySection />
        <StudioTeaser />
        <PageFooter />
      </main>
    </div>
  );
}
