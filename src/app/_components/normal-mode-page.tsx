"use client";

import Link from "next/link";
import type { ToolRecord } from "@/lib/tools";

type NormalModePageProps = {
  tools: ToolRecord[];
};

// ===========================
// CATEGORY DATA
// ===========================
const CATEGORIES = [
  {
    id: "image-design",
    title: "Image & Design",
    description: "Create logos, posters, and polished UI designs",
    icon: "🖼️",
  },
  {
    id: "writing",
    title: "Writing",
    description: "Write blogs, marketing copy, and scripts faster",
    icon: "✏️",
  },
  {
    id: "video",
    title: "Video",
    description: "Edit and generate professional videos easily",
    icon: "🎬",
  },
  {
    id: "audio",
    title: "Audio",
    description: "Produce music, podcasts, and background tracks",
    icon: "🎵",
  },
  {
    id: "voice",
    title: "Voice",
    description: "Generate realistic voice and dubbing instantly",
    icon: "🎙️",
  },
  {
    id: "coding",
    title: "Coding",
    description: "Get code assistance and debug efficiently",
    icon: "💻",
  },
];

// ===========================
// TRENDING TOOLS DATA
// ===========================
const TRENDING_TOOLS = [
  {
    id: "midjourney",
    name: "Midjourney",
    description: "AI art generation",
    icon: "🎨",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "AI writing assistant",
    icon: "✍️",
  },
  {
    id: "runway",
    name: "Runway",
    description: "Video editing & generation",
    icon: "🎬",
  },
];

// ===========================
// DEAL TOOLS DATA
// ===========================
const DEAL_TOOLS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    tag: "Popular",
    benefit: "Plans and features vary. Check official pricing.",
    icon: "✍️",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    tag: "Premium",
    benefit: "Pricing and promos may change. See official plans.",
    icon: "🎨",
  },
  {
    id: "runway",
    name: "Runway",
    tag: "Video AI",
    benefit: "Limited-time deals may be available. Verify on site.",
    icon: "🎬",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    tag: "Voice AI",
    benefit: "Credits and plans vary. Confirm on official page.",
    icon: "🎙️",
  },
];

// ===========================
// GUIDES DATA
// ===========================
const GUIDES = [
  {
    slug: "how-to-choose-ai-tool",
    title: "How to choose the right AI tool",
    description: "A beginner's framework for evaluating AI tools.",
  },
  {
    slug: "ai-image-generation-guide",
    title: "Beginner's guide to AI image generation",
    description: "Learn the basics of creating stunning images.",
  },
];

// ===========================
// SHARED: SECTION HEADER
// ===========================
function SectionHeader({ title, moreHref }: { title: string; moreHref: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-50">{title}</h2>
      <Link
        href={moreHref}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-emerald-300"
      >
        <span>More</span>
        <span>→</span>
      </Link>
    </div>
  );
}

// Header is now global (in layout.tsx)

// ===========================
// 1. HERO SECTION
// ===========================
function HeroSection() {
  return (
    <section className="px-4 pt-4 pb-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800/70 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-cyan-500/5 px-5 py-6 shadow-sm lg:px-8 lg:py-8">
        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/30">
          <span>✦</span>
          <span>AI tool navigation, not another directory</span>
        </div>

        {/* Headline */}
        <h1 className="mb-2 text-2xl font-semibold leading-snug text-slate-50 lg:text-3xl lg:leading-tight">
          <span className="block">Too many AI tools?</span>
          <span className="block">We find the best route for you.</span>
        </h1>

        {/* Subtext */}
        <p className="mb-3 text-sm leading-relaxed text-slate-300 lg:text-base lg:leading-7">
          No more endless searching. Choose your goal, and we'll show you the top 3 AI tools.
        </p>

        {/* Trust Line */}
        <p className="text-xs leading-relaxed text-slate-400">
          Rankings based on real usage data, expert curation, and tool popularity.
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
    <section className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title="Categories" moreHref="/categories" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={`/tools/best/${category.id}`}
            className="group flex h-[135px] flex-col justify-between rounded-2xl border border-slate-800/70 bg-slate-900/70 p-3.5 shadow-sm transition hover:border-emerald-400/30 hover:bg-slate-900"
          >
            {/* Icon + Title */}
            <div>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
                {category.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold leading-tight text-slate-50">
                {category.title}
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                {category.description}
              </p>
            </div>

            {/* Bottom CTA (single line) */}
            <div className="flex items-center justify-between text-[10px] font-medium text-emerald-400/80">
              <span>View best 3 tools</span>
              <span className="transition group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
        ))}
        </div>
      </div>
    </section>
  );
}

// ===========================
// 3. TRENDING SECTION
// ===========================
function TrendingSection() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title="Trending AI tools" moreHref="/tools/trending" />
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {TRENDING_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="flex min-h-[60px] items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 shadow-sm transition hover:border-emerald-400/30"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-lg">
              {tool.icon}
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-50">{tool.name}</h3>
                <span className="text-[10px] text-slate-500">Most used this week</span>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{tool.description}</p>
            </div>
          </Link>
        ))}
        </div>
      </div>
    </section>
  );
}

// ===========================
// 4. DEALS SECTION
// ===========================
function DealsSection() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title="Deals & Official Links" moreHref="/deals" />
        <p className="mb-4 text-xs leading-relaxed text-slate-400">
          Promotions may vary by region and time. Always verify details on the official pricing page.
        </p>
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {DEAL_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="flex min-h-[60px] items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 shadow-sm transition hover:border-emerald-400/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-lg">
                {tool.icon}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-50">{tool.name}</h3>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    {tool.tag}
                  </span>
                  <span className="text-[10px] text-slate-500">Official link</span>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">{tool.benefit}</p>
              </div>
            </div>
            <div className="flex-shrink-0 text-slate-500">→</div>
          </Link>
        ))}
        </div>
      </div>
    </section>
  );
}

// ===========================
// 5. GUIDES SECTION
// ===========================
function GuidesSection() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title="Guides for beginners" moreHref="/guides" />
        <p className="mb-4 text-xs leading-relaxed text-slate-400">
          Learn the basics and get the most out of AI tools.
        </p>

        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="block min-h-[90px] rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-4 shadow-sm transition hover:border-emerald-400/30"
          >
            <h3 className="mb-2 text-sm font-semibold leading-snug text-slate-50">{guide.title}</h3>
            <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">{guide.description}</p>
          </Link>
        ))}
        </div>
      </div>
    </section>
  );
}

// ===========================
// 6. STUDIO TEASER
// ===========================
function StudioTeaser() {
  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800/70 bg-slate-900/70 px-5 py-7 text-center shadow-sm lg:px-8 lg:py-10">
        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-black/40 px-3 py-1 text-xs font-medium text-emerald-300">
          <span>✨</span>
          <span>Coming soon</span>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-lg font-bold text-slate-50 lg:text-xl">
          Airoute <span className="text-emerald-300">Studio</span>
        </h2>

        {/* Subtitle */}
        <p className="mb-5 text-sm leading-relaxed text-slate-400 lg:text-base">
          One-screen workflow automation for scripts, images, and videos.
        </p>

        {/* Pill */}
        <div className="inline-flex cursor-not-allowed rounded-full border border-slate-700 bg-slate-800/50 px-5 py-1.5 text-xs font-medium text-slate-500">
          Launching Feb 2026
        </div>
      </div>
    </section>
  );
}

// ===========================
// 7. FOOTER
// ===========================
function PageFooter() {
  return (
    <footer className="px-4 py-8 text-center">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex justify-center gap-6 text-xs">
        <a href="mailto:contact@hinkolabs.com?subject=[Contact] Airoute" className="text-slate-500 transition-colors hover:text-emerald-400">
          Contact Us
        </a>
        <a href="mailto:contact@hinkolabs.com?subject=[Partnership] Airoute" className="text-slate-500 transition-colors hover:text-emerald-400">
          Partner with us
        </a>
        <a href="mailto:contact@hinkolabs.com?subject=[Support] Airoute" className="text-slate-500 transition-colors hover:text-emerald-400">
          Help Center
        </a>
      </div>
      <div className="mb-2">
        <p className="text-xs text-slate-500">© 2025 HinkoLabs</p>
      </div>
        <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
          <Link href="/privacy" className="transition-colors hover:text-slate-400">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/terms" className="transition-colors hover:text-slate-400">
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
export default function NormalModePage({ tools }: NormalModePageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <main className="pb-20">
        <HeroSection />
        <CategorySection />
        <TrendingSection />
        <DealsSection />
        <GuidesSection />
        <StudioTeaser />
        <PageFooter />
      </main>
    </div>
  );
}
