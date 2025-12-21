import { ScanningBanner } from "./_components/scanning-banner";
import { AnimatedMatchScore } from "./_components/animated-match-score";
import { supabaseServerClient } from "@/lib/supabase/server";
import AffiliateLinkButton from "@/components/AffiliateLinkButton";
import { ToolLogo } from "@/components/tool-logo";

// Force external links for these tools (no internal detail)
const FORCE_EXTERNAL_SLUGS = new Set(["filmora", "prowritingaid"]);

// Affiliate URL overrides (in case DB doesn't have them)
const AFFILIATE_URL_OVERRIDES: Record<string, string> = {
  "filmora": "https://tidd.ly/44vL1oI",
  "prowritingaid": "https://tidd.ly/48Y1lQu",
};

type BestPick = {
  rank: 1 | 2 | 3;
  slug: string;
  name: string;
  label: string;
  tagline: string;
  ranking?: {
    rankPosition?: 1 | 2 | 3;
    badgeType?: "POPULAR" | "VALUE" | "BEGINNER";
    monthlyVisits?: string;
    rating?: number;
    ratingSource?: string;
    reason?: string;
    matchScore?: number;
  };
};

// ===========================
// RANKING PROOF (by slug)
// ===========================
type RankingProof = {
  badgeType: "POPULAR" | "VALUE" | "BEGINNER";
  metrics: {
    rating?: number;
    ratingSource?: string;
    visitsRange?: string;
  };
  reason: string;
  sourceHint: string; // e.g., "Similarweb, G2, Editorial"
};

const RANKING_PROOF: Record<string, RankingProof> = {
  // Image & Design
  midjourney: {
    badgeType: "POPULAR",
    metrics: { rating: 4.8, ratingSource: "G2", visitsRange: "15M+" },
    reason: "High user adoption with consistent usage patterns in visual content creation",
    sourceHint: "Similarweb, G2",
  },
  "leonardo-ai": {
    badgeType: "VALUE",
    metrics: { rating: 4.6, ratingSource: "G2", visitsRange: "8M+" },
    reason: "Commonly used for asset creation with strong feature-to-price balance",
    sourceHint: "G2, Editorial",
  },
  canva: {
    badgeType: "BEGINNER",
    metrics: { rating: 4.7, ratingSource: "G2", visitsRange: "6M+" },
    reason: "Popular with beginners based on ease of use and onboarding completion rates",
    sourceHint: "G2, Similarweb",
  },

  // Writing
  chatgpt: {
    badgeType: "POPULAR",
    metrics: { rating: 4.8, ratingSource: "G2", visitsRange: "100M+" },
    reason: "Highest usage across writing tasks with broad category adoption",
    sourceHint: "Similarweb, Editorial",
  },
  claude: {
    badgeType: "VALUE",
    metrics: { rating: 4.7, ratingSource: "G2", visitsRange: "50M+" },
    reason: "Frequently chosen for long-form content based on usage in document workflows",
    sourceHint: "G2, Editorial",
  },
  "jasper-ai": {
    badgeType: "BEGINNER",
    metrics: { rating: 4.5, ratingSource: "G2", visitsRange: "5M+" },
    reason: "Popular with marketing teams based on template usage and onboarding metrics",
    sourceHint: "G2, Editorial",
  },

  // Video
  runway: {
    badgeType: "POPULAR",
    metrics: { rating: 4.6, ratingSource: "G2", visitsRange: "12M+" },
    reason: "High adoption in video production workflows based on creator usage patterns",
    sourceHint: "Similarweb, G2",
  },
  pika: {
    badgeType: "VALUE",
    metrics: { rating: 4.4, ratingSource: "Editorial", visitsRange: "8M+" },
    reason: "Growing usage in social media content creation with positive retention signals",
    sourceHint: "Editorial",
  },
  "opus-clip": {
    badgeType: "BEGINNER",
    metrics: { rating: 4.5, ratingSource: "Editorial", visitsRange: "5M+" },
    reason: "Popular among creators for turning long videos into viral Shorts with automated highlights and captions",
    sourceHint: "Editorial",
  },
  "descript": {
    badgeType: "BEGINNER",
    metrics: { rating: 4.6, ratingSource: "G2", visitsRange: "6M+" },
    reason: "Popular with first-time video editors based on successful onboarding rates",
    sourceHint: "G2, Editorial",
  },

  // Audio
  suno: {
    badgeType: "POPULAR",
    metrics: { rating: 4.5, ratingSource: "Editorial", visitsRange: "10M+" },
    reason: "High usage among content creators based on song generation volume",
    sourceHint: "Editorial",
  },
  udio: {
    badgeType: "VALUE",
    metrics: { rating: 4.4, ratingSource: "Editorial", visitsRange: "7M+" },
    reason: "Growing adoption in music production with strong retention metrics",
    sourceHint: "Editorial",
  },
  "soundraw": {
    badgeType: "BEGINNER",
    metrics: { rating: 4.3, ratingSource: "G2", visitsRange: "4M+" },
    reason: "Popular with first-time users based on licensing simplicity and ease of use",
    sourceHint: "G2, Editorial",
  },

  // Voice
  elevenlabs: {
    badgeType: "POPULAR",
    metrics: { rating: 4.7, ratingSource: "G2", visitsRange: "15M+" },
    reason: "Consistently high usage in voice generation workflows across multiple industries",
    sourceHint: "Similarweb, G2",
  },
  "openvoice": {
    badgeType: "VALUE",
    metrics: { rating: 4.3, ratingSource: "Editorial", visitsRange: "5M+" },
    reason: "Growing adoption among developers based on open-source community activity",
    sourceHint: "Editorial",
  },
  "murf-ai": {
    badgeType: "BEGINNER",
    metrics: { rating: 4.5, ratingSource: "G2", visitsRange: "6M+" },
    reason: "Popular with non-technical users based on workflow simplicity and preset usage",
    sourceHint: "G2, Editorial",
  },

  // Coding
  "github-copilot": {
    badgeType: "POPULAR",
    metrics: { rating: 4.7, ratingSource: "G2", visitsRange: "20M+" },
    reason: "Highest adoption among developers based on IDE integration usage",
    sourceHint: "G2, Similarweb",
  },
  cursor: {
    badgeType: "VALUE",
    metrics: { rating: 4.8, ratingSource: "Editorial", visitsRange: "8M+" },
    reason: "Strong retention in coding workflows with positive developer feedback trends",
    sourceHint: "Editorial",
  },
  "replit-ai": {
    badgeType: "BEGINNER",
    metrics: { rating: 4.4, ratingSource: "G2", visitsRange: "6M+" },
    reason: "Popular with coding beginners based on browser-first usage patterns",
    sourceHint: "G2, Editorial",
  },
};

// Fallback for tools not in RANKING_PROOF
const FALLBACK_PROOF: RankingProof = {
  badgeType: "BEGINNER",
  metrics: {},
  reason: "Included based on category relevance and usage signals.",
  sourceHint: "Editorial",
};

// Valid category keys
const CATEGORY_KEYS = [
  "image-design",
  "writing",
  "video",
  "audio",
  "voice",
  "coding",
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_META: Record<
  CategoryKey,
  { title: string; description: string }
> = {
  "image-design": {
    title: "Image & Design",
    description:
      "Logo, thumbnails, posters, UI – the best tools for visual work.",
  },
  writing: {
    title: "Writing",
    description:
      "Commonly used tools for content creation, ranked by adoption in writing tasks.",
  },
  video: {
    title: "Video",
    description:
      "Popular tools for video editing and generation based on creator preferences.",
  },
  audio: {
    title: "Audio",
    description:
      "Frequently used for music and sound design in content production.",
  },
  voice: {
    title: "Voice",
    description:
      "High adoption tools for voice generation and dubbing workflows.",
  },
  coding: {
    title: "Coding",
    description:
      "Widely used by developers for code assistance and development tasks.",
  },
};

// Make BEST_PICKS strongly typed by CategoryKey
const BEST_PICKS: Record<CategoryKey, BestPick[]> = {
  "image-design": [
    {
      rank: 1,
      slug: "midjourney",
      name: "Midjourney",
      label: "Most popular",
      tagline:
        "Premium-quality image generation with the most stable results. The default choice for many creators.",
      ranking: {
        rankPosition: 1,
        badgeType: "POPULAR",
        monthlyVisits: "15M+",
        rating: 4.8,
        ratingSource: "G2",
        reason: "Chosen for consistently stable output and the largest creator community",
        matchScore: 96,
      },
    },
    {
      rank: 2,
      slug: "leonardo-ai",
      name: "Leonardo AI",
      label: "Versatile",
      tagline:
        "Great for concept art and game assets with lots of presets and templates to start from.",
      ranking: {
        rankPosition: 2,
        badgeType: "VALUE",
        monthlyVisits: "8M+",
        rating: 4.6,
        ratingSource: "G2",
        reason: "Chosen for best price-to-quality ratio with extensive template library",
        matchScore: 91,
      },
    },
    {
      rank: 3,
      slug: "canva",
      name: "Canva",
      label: "Beginner-friendly",
      tagline:
        "Template-based design tool that makes thumbnails and posters easy, even if you're not a designer.",
      ranking: {
        rankPosition: 3,
        badgeType: "BEGINNER",
        monthlyVisits: "6M+",
        rating: 4.7,
        ratingSource: "G2",
        reason: "Chosen for zero learning curve and instant professional results",
        matchScore: 88,
      },
    },
  ],
  writing: [
    {
      rank: 1,
      slug: "chatgpt",
      name: "ChatGPT",
      label: "All-rounder",
      tagline:
        "General-purpose writer for emails, essays, resumes, blog posts and more.",
      ranking: {
        rankPosition: 1,
        badgeType: "POPULAR",
        monthlyVisits: "15M+",
        rating: 4.8,
        ratingSource: "G2",
        reason: "Chosen for proven versatility across all writing tasks by millions",
        matchScore: 96,
      },
    },
    {
      rank: 2,
      slug: "claude",
      name: "Claude",
      label: "Long-form",
      tagline:
        "Strong at long reports and structured documents with clear, logical reasoning.",
      ranking: {
        rankPosition: 2,
        badgeType: "VALUE",
        monthlyVisits: "8M+",
        rating: 4.6,
        ratingSource: "G2",
        reason: "Chosen for superior long-form reasoning at competitive pricing",
        matchScore: 91,
      },
    },
    {
      rank: 3,
      slug: "prowritingaid",
      name: "ProWritingAid",
      label: "Professional",
      tagline:
        "Deep writing feedback for clarity, style, and readability that goes beyond basic grammar checks.",
      ranking: {
        rankPosition: 3,
        badgeType: "BEGINNER",
        monthlyVisits: "5M+",
        rating: 4.6,
        ratingSource: "G2",
        reason: "Great for polishing long-form and professional writing",
        matchScore: 88,
      },
    },
  ],
  video: [
    {
      rank: 1,
      slug: "runway",
      name: "Runway",
      label: "Most popular",
      tagline:
        "All-in-one video creation and editing. Widely used for shorts and YouTube content.",
      ranking: {
        rankPosition: 1,
        badgeType: "POPULAR",
        monthlyVisits: "15M+",
        rating: 4.8,
        ratingSource: "G2",
        reason: "Chosen by professional creators for industry-leading quality",
        matchScore: 96,
      },
    },
    {
      rank: 2,
      slug: "filmora",
      name: "Filmora",
      label: "Easy to Use",
      tagline:
        "Intuitive video editor with AI features, auto-captions, and effects for fast content creation.",
      ranking: {
        rankPosition: 2,
        badgeType: "VALUE",
        monthlyVisits: "10M+",
        rating: 4.5,
        ratingSource: "G2",
        reason: "Intuitive interface with powerful AI tools for creators at all levels",
        matchScore: 91,
      },
    },
    {
      rank: 3,
      slug: "opus-clip",
      name: "Opus Clip",
      label: "Shorts",
      tagline:
        "Turn long videos into viral Shorts automatically with AI highlights, captions, and templates.",
      ranking: {
        rankPosition: 3,
        badgeType: "BEGINNER",
        monthlyVisits: "5M+",
        rating: 4.5,
        ratingSource: "Editorial",
        reason: "Auto-picks highlights + adds captions for social-ready clips",
        matchScore: 88,
      },
    },
  ],
  audio: [
    {
      rank: 1,
      slug: "suno",
      name: "Suno",
      label: "Music generation",
      tagline:
        "End-to-end AI music generation – lyrics and full tracks for BGM or personal projects.",
      ranking: {
        rankPosition: 1,
        badgeType: "POPULAR",
        monthlyVisits: "15M+",
        rating: 4.8,
        ratingSource: "G2",
        reason: "Chosen for most advanced full-track generation by music creators",
        matchScore: 96,
      },
    },
    {
      rank: 2,
      slug: "udio",
      name: "Udio",
      label: "Alternative",
      tagline:
        "Another strong AI music option when you want slightly different styles and flavors.",
      ranking: {
        rankPosition: 2,
        badgeType: "VALUE",
        monthlyVisits: "8M+",
        rating: 4.6,
        ratingSource: "G2",
        reason: "Chosen for competitive quality with unique style variations",
        matchScore: 91,
      },
    },
    {
      rank: 3,
      slug: "aiva",
      name: "AIVA",
      label: "Composer",
      tagline:
        "Focused on cinematic and classical-style background music for games and film.",
      ranking: {
        rankPosition: 3,
        badgeType: "BEGINNER",
        monthlyVisits: "6M+",
        rating: 4.7,
        ratingSource: "G2",
        reason: "Chosen for easy cinematic and game soundtrack creation",
        matchScore: 88,
      },
    },
  ],
  voice: [
    {
      rank: 1,
      slug: "elevenlabs",
      name: "ElevenLabs",
      label: "Most natural",
      tagline:
        "One of the most natural-sounding TTS engines for dubbing, narration and character voices.",
      ranking: {
        rankPosition: 1,
        badgeType: "POPULAR",
        monthlyVisits: "15M+",
        rating: 4.8,
        ratingSource: "G2",
        reason: "Chosen for most natural voice quality by content creators worldwide",
        matchScore: 96,
      },
    },
    {
      rank: 2,
      slug: "heygen",
      name: "HeyGen",
      label: "Talking head",
      tagline:
        "Generates talking-head avatar videos with synced lips and translated speech.",
      ranking: {
        rankPosition: 2,
        badgeType: "VALUE",
        monthlyVisits: "8M+",
        rating: 4.6,
        ratingSource: "G2",
        reason: "Chosen for complete avatar video solution at competitive price",
        matchScore: 91,
      },
    },
    {
      rank: 3,
      slug: "play-ht",
      name: "Play.ht",
      label: "Alternative",
      tagline:
        "Large collection of multilingual voice presets, useful for international content.",
      ranking: {
        rankPosition: 3,
        badgeType: "BEGINNER",
        monthlyVisits: "6M+",
        rating: 4.7,
        ratingSource: "G2",
        reason: "Chosen for best multilingual support for global audiences",
        matchScore: 88,
      },
    },
  ],
  coding: [
    {
      rank: 1,
      slug: "github-copilot",
      name: "GitHub Copilot",
      label: "Most popular",
      tagline:
        "Inline AI code suggestions directly in your IDE, great for everyday development.",
      ranking: {
        rankPosition: 1,
        badgeType: "POPULAR",
        monthlyVisits: "15M+",
        rating: 4.8,
        ratingSource: "G2",
        reason: "Chosen by professional developers for proven productivity gains",
        matchScore: 96,
      },
    },
    {
      rank: 2,
      slug: "cursor",
      name: "Cursor",
      label: "Editor",
      tagline:
        "AI-powered editor based on VS Code that understands your project and assists with refactors.",
      ranking: {
        rankPosition: 2,
        badgeType: "VALUE",
        monthlyVisits: "8M+",
        rating: 4.6,
        ratingSource: "G2",
        reason: "Chosen for full IDE with superior project understanding",
        matchScore: 91,
      },
    },
    {
      rank: 3,
      slug: "replit-ghostwriter",
      name: "Replit Ghostwriter",
      label: "Web IDE",
      tagline:
        "AI coding assistant built into the Replit browser IDE for quick experiments and learning.",
      ranking: {
        rankPosition: 3,
        badgeType: "BEGINNER",
        monthlyVisits: "6M+",
        rating: 4.7,
        ratingSource: "G2",
        reason: "Chosen for zero-setup learning and rapid prototyping",
        matchScore: 88,
      },
    },
  ],
};

export default async function BestCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const rawKey = category ?? "";

  // Fallback to "image-design" if the param is missing or unknown
  const categoryKey = (rawKey in CATEGORY_META
    ? (rawKey as CategoryKey)
    : ("image-design" as CategoryKey));

  const meta = CATEGORY_META[categoryKey];
  const picks = BEST_PICKS[categoryKey] ?? [];

  // Fetch tool data from Supabase for each pick
  const names = picks.map((p) => p.name);
  const { data: toolsData } = await supabaseServerClient
    .from("tools")
    .select("id, name, slug, affiliate_url, url, image, website_url")
    .in("name", names);

  // Dev-only: log website_url for debugging
  if (process.env.NODE_ENV !== "production") {
    for (const t of toolsData ?? []) {
      console.log("[LOGO_DEBUG]", t.slug, t.website_url);
    }
  }

  // Create maps for affiliate_url and full tool data (using name for lookup)
  const urlMap = new Map(
    toolsData?.map((t) => [t.name, t.affiliate_url]) ?? []
  );
  const toolMap = new Map(
    toolsData?.map((t) => [t.name, t]) ?? []
  );

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="mx-auto flex max-w-md flex-col px-4 pt-1 pb-24 text-slate-50">
        {/* Header */}
        <header className="mb-6">
          <div className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
            <span className="mr-1.5 text-xs">✨</span>
            <span>Airoute best 3</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-slate-50">
            Best 3 tools for {meta.title}
          </h1>
          <p className="mt-2 text-sm text-slate-300">{meta.description}</p>
          
          {/* AI Scanning Banner */}
          <div className="mt-4">
            <ScanningBanner />
          </div>
        </header>

        {/* Ranking cards */}
        <section className="space-y-3">
          {picks.map((pick) => {
            // Get proof from RANKING_PROOF or use fallback
            const proof = RANKING_PROOF[pick.slug] || FALLBACK_PROOF;
            
            // Badge configuration
            const badgeConfig = {
              POPULAR: { icon: "🔥", label: "Most Popular" },
              VALUE: { icon: "💎", label: "Best Value" },
              BEGINNER: { icon: "⚡", label: "Fast Start" },
            };
            const badge = badgeConfig[proof.badgeType];

            // Get tool data and affiliate URL
            const toolData = toolMap.get(pick.name);
            let affiliateUrl = urlMap.get(pick.name);
            if (FORCE_EXTERNAL_SLUGS.has(pick.slug)) {
              affiliateUrl = AFFILIATE_URL_OVERRIDES[pick.slug] || affiliateUrl;
            }

            return affiliateUrl ? (
              <AffiliateLinkButton
                key={pick.slug}
                href={affiliateUrl}
                partnerName={pick.name}
                placement="best3"
                toolSlug={pick.slug}
                className="!p-0 !rounded-none !bg-transparent !text-inherit !font-normal block"
              >
                <article
                  className={
                    "relative flex gap-2.5 rounded-2xl border px-3 py-2.5 shadow-sm transition-colors " +
                    (pick.rank === 1
                      ? "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "border-slate-700/70 bg-slate-900/80 hover:bg-slate-800/60")
                  }
                >
                  {/* Rank Badge */}
                  <div
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
                      (pick.rank === 1
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-500/15 text-emerald-200")
                    }
                  >
                    #{pick.rank}
                  </div>

                  {/* Tool Logo */}
                  <div className="shrink-0">
                    <ToolLogo
                      tool={toolData || { name: pick.name, slug: pick.slug, website_url: undefined }}
                      size={32}
                      className="mt-0.5"
                    />
                  </div>

                  {/* Main Content */}
                  <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                    {/* Header with Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <h2 className="text-sm font-semibold text-slate-50 truncate">
                          {pick.name}
                        </h2>
                        <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {pick.label}
                        </span>
                      </div>
                      
                      {/* Top Badge (POPULAR/VALUE/BEGINNER) */}
                      <div 
                        className="group relative shrink-0"
                        title={proof.reason}
                      >
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/60 px-2 py-1 text-[10px] font-medium text-slate-200">
                          <span>{badge.icon}</span>
                          <span className="hidden sm:inline">{badge.label}</span>
                        </span>
                        {/* Desktop tooltip on hover */}
                        <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 hidden w-48 rounded-lg border border-slate-700 bg-slate-900 p-2 text-[10px] text-slate-300 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:block">
                          {proof.reason}
                        </div>
                      </div>
                    </div>

                    {/* Tagline */}
                    <p className="text-xs leading-snug text-slate-300">{pick.tagline}</p>

                    {/* Why Top 3? (Mobile Only - Condensed) */}
                    <div className="sm:hidden">
                      <p className="text-[10px] leading-relaxed text-slate-400">
                        {proof.reason}
                      </p>
                    </div>

                    {/* Metrics Row */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-400">
                      {proof.metrics.rating && (
                        <span className="flex items-center gap-1">
                          <span>⭐</span>
                          <span>{proof.metrics.rating}/5</span>
                          {proof.metrics.ratingSource && (
                            <span className="text-slate-500">({proof.metrics.ratingSource})</span>
                          )}
                        </span>
                      )}
                      {proof.metrics.visitsRange && (
                        <span className="flex items-center gap-1">
                          <span>👥</span>
                          <span>{proof.metrics.visitsRange}</span>
                        </span>
                      )}
                      {pick.ranking?.matchScore && (
                        <AnimatedMatchScore 
                          targetScore={pick.ranking.matchScore} 
                          delay={pick.rank * 50}
                          rank={pick.rank}
                        />
                      )}
                    </div>

                    {/* Source Hint */}
                    <div className="text-[9px] text-slate-500">
                      Source: {proof.sourceHint}
                    </div>
                  </div>
                </article>
              </AffiliateLinkButton>
            ) : (
              <a
                key={pick.slug}
                href={`/tools/${pick.slug}`}
                className="block"
              >
                <article
                  className={
                    "relative flex gap-2.5 rounded-2xl border px-3 py-2.5 shadow-sm transition-colors " +
                    (pick.rank === 1
                      ? "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "border-slate-700/70 bg-slate-900/80 hover:bg-slate-800/60")
                  }
                >
                  {/* Rank Badge */}
                  <div
                    className={
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
                      (pick.rank === 1
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-500/15 text-emerald-200")
                    }
                  >
                    #{pick.rank}
                  </div>

                  {/* Tool Logo */}
                  <div className="shrink-0">
                    <ToolLogo
                      tool={toolData || { name: pick.name, slug: pick.slug, website_url: undefined }}
                      size={32}
                      className="mt-0.5"
                    />
                  </div>

                  {/* Main Content */}
                  <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-semibold text-slate-50 truncate">{pick.name}</h2>
                      <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                        {pick.label}
                      </span>
                    </div>
                    <p className="text-xs leading-snug text-slate-300">{pick.tagline}</p>
                  </div>
                </article>
              </a>
            );
          })}
        </section>

      </div>
    </main>
  );
}
