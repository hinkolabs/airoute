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
    description: "Logo, poster, UI design",
    icon: "🖼️",
  },
  {
    id: "writing",
    title: "Writing",
    description: "Blog, copy, scripts",
    icon: "✏️",
  },
  {
    id: "video",
    title: "Video",
    description: "Edit, generate videos",
    icon: "🎬",
  },
  {
    id: "audio",
    title: "Audio",
    description: "Music, podcast, BGM",
    icon: "🎵",
  },
  {
    id: "voice",
    title: "Voice",
    description: "TTS, dubbing, cloning",
    icon: "🎙️",
  },
  {
    id: "coding",
    title: "Coding",
    description: "Code assist, debug",
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
    benefit: "Free GPT-4o mini available",
    icon: "✍️",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    tag: "Premium",
    benefit: "30% off first month",
    icon: "🎨",
  },
  {
    id: "runway",
    name: "Runway",
    tag: "Video AI",
    benefit: "20% OFF first month",
    icon: "🎬",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    tag: "Free credits",
    benefit: "Get 10,000 free characters",
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
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-50">{title}</h2>
      <Link
        href={moreHref}
        className="text-xs font-medium text-slate-400 transition hover:text-emerald-300"
      >
        More →
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
    <section className="px-4 pt-3 pb-5">
      <div className="rounded-2xl border border-slate-800/70 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-cyan-500/5 px-5 py-6 shadow-sm">
        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/30">
          <span>✦</span>
          <span>AI tool navigation, not another directory</span>
        </div>

        {/* Headline */}
        <h1 className="mb-3 text-2xl font-semibold leading-tight text-slate-50">
          <span className="block">Too many AI tools?</span>
          <span className="block">We find the best route for you.</span>
        </h1>

        {/* Subtext */}
        <p className="text-sm leading-relaxed text-slate-300">
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
    <section className="px-4 py-6">
      <SectionHeader title="Categories" moreHref="/categories" />
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={`/tools/best/${category.id}`}
            className="group flex h-[130px] flex-col justify-between rounded-2xl border border-slate-800/70 bg-slate-900/70 p-3 shadow-sm transition hover:border-emerald-400/30 hover:bg-slate-900"
          >
            {/* Icon + Title */}
            <div>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-xl">
                {category.icon}
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-50">
                {category.title}
              </h3>
              <p className="text-xs leading-snug text-slate-400">
                {category.description}
              </p>
            </div>

            {/* Bottom CTA (single line) */}
            <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300">
              <span>View best 3 tools</span>
              <span className="transition group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ===========================
// 3. TRENDING SECTION
// ===========================
function TrendingSection() {
  return (
    <section className="px-4 py-6">
      <SectionHeader title="Trending AI tools" moreHref="/tools/trending" />
      <div className="space-y-2">
        {TRENDING_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-900/70 px-3 py-2.5 shadow-sm transition hover:border-emerald-400/30"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-lg">
              {tool.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-50">{tool.name}</h3>
              <p className="text-xs text-slate-400">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ===========================
// 4. DEALS SECTION
// ===========================
function DealsSection() {
  return (
    <section className="px-4 py-6">
      <SectionHeader title="Tools with special offers" moreHref="/deals" />
      <div className="space-y-2">
        {DEAL_TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/70 px-3 py-2.5 shadow-sm transition hover:border-emerald-400/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-lg">
                {tool.icon}
              </div>
              <div className="flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-50">{tool.name}</h3>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    {tool.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{tool.benefit}</p>
              </div>
            </div>
            <div className="flex-shrink-0 text-slate-500">→</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ===========================
// 5. GUIDES SECTION
// ===========================
function GuidesSection() {
  return (
    <section className="px-4 py-6">
      <SectionHeader title="Guides for beginners" moreHref="/guides" />
      <p className="mb-4 text-xs text-slate-400">
        Learn the basics and get the most out of AI tools.
      </p>

      <div className="space-y-3">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="block rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 shadow-sm transition hover:border-emerald-400/30"
          >
            <h3 className="mb-1 text-sm font-semibold text-slate-50">{guide.title}</h3>
            <p className="text-xs leading-relaxed text-slate-400">{guide.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ===========================
// 6. STUDIO TEASER
// ===========================
function StudioTeaser() {
  return (
    <section className="px-4 py-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-5 py-6 text-center shadow-sm">
        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-black/40 px-3 py-1 text-xs font-medium text-emerald-300">
          <span>✨</span>
          <span>Coming soon</span>
        </div>

        {/* Title */}
        <h2 className="mb-2 text-lg font-bold text-slate-50">
          Airoute <span className="text-emerald-300">Studio</span>
        </h2>

        {/* Subtitle */}
        <p className="mb-4 text-xs leading-relaxed text-slate-400">
          One-screen workflow automation for scripts, images, and videos.
        </p>

        {/* Pill */}
        <div className="inline-flex rounded-full border border-slate-700 bg-slate-800/50 px-5 py-1.5 text-xs font-semibold text-slate-500">
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
    <footer className="px-4 py-6 text-center">
      <div className="mb-4 flex justify-center gap-6 text-xs text-slate-400">
        <Link href="/contact" className="transition hover:text-emerald-300">
          Contact Us
        </Link>
        <Link href="/partner" className="transition hover:text-emerald-300">
          Partner with us
        </Link>
        <Link href="/help" className="transition hover:text-emerald-300">
          Help Center
        </Link>
      </div>
      <div className="mb-2">
        <p className="text-xs text-slate-500">© 2025 HinkoLabs</p>
      </div>
      <div className="flex items-center justify-center gap-3 text-xs">
        <Link href="/privacy" className="text-gray-500 hover:underline">
          Privacy Policy
        </Link>
        <span className="text-gray-700">·</span>
        <Link href="/terms" className="text-gray-500 hover:underline">
          Terms of Service
        </Link>
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
