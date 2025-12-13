"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

// ============================================================
// Types
// ============================================================
type RankingMeta = {
  rank: 1 | 2 | 3;
  badge: string;
  badgeIcon: string;
  monthlyVisits: string;
  rating: number;
  ratingSource: string;
  reason: string;
  matchScore: number;
};

type BestPick = {
  slug: string;
  name: string;
  tagline: string;
  bestFor: string;
  highlight: string;
  ranking: RankingMeta;
};

// ============================================================
// Category Data
// ============================================================
const CATEGORY_CONFIG: Record<
  string,
  {
    title: string;
    subtitle: string;
    description: string;
    picks: BestPick[];
  }
> = {
  "image-design": {
    title: "Image & Design",
    subtitle: "이미지 생성 · 디자인 · 그래픽",
    description:
      "From AI-generated illustrations to professional design tools — these are the top picks for visual creation.",
    picks: [
      {
        slug: "midjourney",
        name: "Midjourney",
        tagline: "The gold standard for AI-generated art and illustrations",
        bestFor: "Creative professionals, concept artists, designers",
        highlight: "Industry-leading aesthetic quality",
        ranking: {
          rank: 1,
          badge: "Most Popular",
          badgeIcon: "🔥",
          monthlyVisits: "15M+",
          rating: 4.8,
          ratingSource: "G2",
          reason: "Chosen for its consistently stable output and the largest creator community.",
          matchScore: 96,
        },
      },
      {
        slug: "leonardo-ai",
        name: "Leonardo AI",
        tagline: "Fast, high-quality image generation with style control",
        bestFor: "Game artists, content creators, marketers",
        highlight: "Excellent character consistency",
        ranking: {
          rank: 2,
          badge: "Best Value",
          badgeIcon: "💎",
          monthlyVisits: "8M+",
          rating: 4.6,
          ratingSource: "ProductHunt",
          reason: "Best balance of quality and affordability with precise control options.",
          matchScore: 91,
        },
      },
      {
        slug: "canva",
        name: "Canva",
        tagline: "All-in-one design platform with AI features",
        bestFor: "Non-designers, social media managers, small businesses",
        highlight: "Easiest learning curve",
        ranking: {
          rank: 3,
          badge: "Beginner Friendly",
          badgeIcon: "⚡",
          monthlyVisits: "120M+",
          rating: 4.7,
          ratingSource: "G2",
          reason: "Most accessible design tool with templates and AI assistance built-in.",
          matchScore: 88,
        },
      },
    ],
  },
  video: {
    title: "Video",
    subtitle: "영상 생성 · 편집 · 숏폼",
    description:
      "AI-powered video creation tools for everything from short clips to cinematic productions.",
    picks: [
      {
        slug: "runway",
        name: "Runway",
        tagline: "Professional AI video generation and editing",
        bestFor: "Filmmakers, content creators, advertisers",
        highlight: "Best overall video AI",
        ranking: {
          rank: 1,
          badge: "Most Popular",
          badgeIcon: "🔥",
          monthlyVisits: "12M+",
          rating: 4.7,
          ratingSource: "G2",
          reason: "Industry-leading video quality and the most reliable results for professional use.",
          matchScore: 95,
        },
      },
      {
        slug: "pika",
        name: "Pika",
        tagline: "Fast and fun AI video clips with creative effects",
        bestFor: "Social media creators, TikTokers",
        highlight: "Great for short-form content",
        ranking: {
          rank: 2,
          badge: "Best Value",
          badgeIcon: "💎",
          monthlyVisits: "5M+",
          rating: 4.5,
          ratingSource: "ProductHunt",
          reason: "Fastest generation speed with great results for social media content.",
          matchScore: 90,
        },
      },
      {
        slug: "capcut",
        name: "CapCut",
        tagline: "Free video editor with AI-powered features",
        bestFor: "Beginners, mobile editors, short-form creators",
        highlight: "Best free option",
        ranking: {
          rank: 3,
          badge: "Beginner Friendly",
          badgeIcon: "⚡",
          monthlyVisits: "200M+",
          rating: 4.6,
          ratingSource: "App Store",
          reason: "Most popular free video editor with powerful AI features and mobile-first design.",
          matchScore: 87,
        },
      },
    ],
  },
  writing: {
    title: "Writing & Docs",
    subtitle: "글쓰기 · 문서 작성 · 카피라이팅",
    description:
      "AI writing assistants for everything from blog posts to professional documents.",
    picks: [
      {
        slug: "chatgpt",
        name: "ChatGPT",
        tagline: "The most versatile AI writing and conversation tool",
        bestFor: "Everyone — from students to professionals",
        highlight: "Best all-around AI assistant",
        ranking: {
          rank: 1,
          badge: "Most Popular",
          badgeIcon: "🔥",
          monthlyVisits: "1.8B+",
          rating: 4.7,
          ratingSource: "G2",
          reason: "Most widely used AI with proven reliability across all writing tasks.",
          matchScore: 97,
        },
      },
      {
        slug: "claude",
        name: "Claude",
        tagline: "Thoughtful, nuanced AI for complex writing tasks",
        bestFor: "Long-form writers, researchers, analysts",
        highlight: "Superior reasoning and context handling",
        ranking: {
          rank: 2,
          badge: "Best Value",
          badgeIcon: "💎",
          monthlyVisits: "100M+",
          rating: 4.8,
          ratingSource: "ProductHunt",
          reason: "Best for long documents and complex reasoning with superior context understanding.",
          matchScore: 93,
        },
      },
      {
        slug: "notion-ai",
        name: "Notion AI",
        tagline: "AI-powered writing inside your workspace",
        bestFor: "Team collaboration, note-taking, project docs",
        highlight: "Best integration with productivity tools",
        ranking: {
          rank: 3,
          badge: "Beginner Friendly",
          badgeIcon: "⚡",
          monthlyVisits: "30M+",
          rating: 4.6,
          ratingSource: "G2",
          reason: "Seamlessly integrated into existing workflows with zero context switching.",
          matchScore: 89,
        },
      },
    ],
  },
  audio: {
    title: "Audio & Voice",
    subtitle: "음성 · 음악 · 오디오",
    description:
      "AI tools for voice synthesis, music generation, and audio production.",
    picks: [
      {
        slug: "elevenlabs",
        name: "ElevenLabs",
        tagline: "The most realistic AI voice generation",
        bestFor: "Podcasters, video creators, audiobook producers",
        highlight: "Unmatched voice quality",
        ranking: {
          rank: 1,
          badge: "Most Popular",
          badgeIcon: "🔥",
          monthlyVisits: "20M+",
          rating: 4.8,
          ratingSource: "G2",
          reason: "Most natural-sounding voices with consistent quality across languages.",
          matchScore: 96,
        },
      },
      {
        slug: "suno",
        name: "Suno",
        tagline: "Create full songs with AI in seconds",
        bestFor: "Musicians, content creators, hobbyists",
        highlight: "Best for complete song generation",
        ranking: {
          rank: 2,
          badge: "Best Value",
          badgeIcon: "💎",
          monthlyVisits: "12M+",
          rating: 4.6,
          ratingSource: "ProductHunt",
          reason: "Fastest and easiest way to create complete songs with vocals and instruments.",
          matchScore: 92,
        },
      },
      {
        slug: "udio",
        name: "Udio",
        tagline: "High-quality AI music with detailed control",
        bestFor: "Producers, soundtrack creators",
        highlight: "Best audio fidelity",
        ranking: {
          rank: 3,
          badge: "Beginner Friendly",
          badgeIcon: "⚡",
          monthlyVisits: "8M+",
          rating: 4.7,
          ratingSource: "ProductHunt",
          reason: "Superior audio quality with more control over musical composition.",
          matchScore: 90,
        },
      },
    ],
  },
  code: {
    title: "Code & Dev",
    subtitle: "코딩 · 개발 · 자동화",
    description:
      "AI-powered coding assistants and development tools for programmers of all levels.",
    picks: [
      {
        slug: "cursor",
        name: "Cursor",
        tagline: "AI-first code editor that writes code with you",
        bestFor: "Professional developers, teams",
        highlight: "Best AI coding experience",
        ranking: {
          rank: 1,
          badge: "Most Popular",
          badgeIcon: "🔥",
          monthlyVisits: "5M+",
          rating: 4.9,
          ratingSource: "ProductHunt",
          reason: "Most integrated AI coding experience with context-aware suggestions.",
          matchScore: 97,
        },
      },
      {
        slug: "github-copilot",
        name: "GitHub Copilot",
        tagline: "AI pair programmer from GitHub and OpenAI",
        bestFor: "Developers using VS Code, JetBrains",
        highlight: "Best IDE integration",
        ranking: {
          rank: 2,
          badge: "Best Value",
          badgeIcon: "💎",
          monthlyVisits: "10M+",
          rating: 4.7,
          ratingSource: "G2",
          reason: "Widest IDE support and proven reliability across all programming languages.",
          matchScore: 94,
        },
      },
      {
        slug: "replit",
        name: "Replit",
        tagline: "Browser-based IDE with AI coding features",
        bestFor: "Beginners, students, quick prototyping",
        highlight: "Easiest to get started",
        ranking: {
          rank: 3,
          badge: "Beginner Friendly",
          badgeIcon: "⚡",
          monthlyVisits: "15M+",
          rating: 4.6,
          ratingSource: "G2",
          reason: "Zero setup required with instant coding environment and collaborative features.",
          matchScore: 90,
        },
      },
    ],
  },
};

// ============================================================
// Scanning Banner Component
// ============================================================
function ScanningBanner() {
  const [text, setText] = useState("Scanning 5,230 tools...");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setText("Filtering...");
    }, 500);
    const timer2 = setTimeout(() => {
      setText("Found 3 best routes");
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center">
      <p className="text-sm font-medium text-emerald-300">{text}</p>
    </div>
  );
}

// ============================================================
// Match Score Component (with color differentiation)
// ============================================================
function MatchScore({ rank, score }: { rank: number; score: number }) {
  let colorClass = "text-gray-500"; // default
  if (rank === 1) colorClass = "text-emerald-400"; // 네온 그린
  else if (rank === 2) colorClass = "text-emerald-300"; // 민트
  else if (rank === 3) colorClass = "text-gray-400"; // 그레이 톤 그린

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-400">Match:</span>
      <span className={`text-lg font-bold ${colorClass}`}>{score}%</span>
    </div>
  );
}

// ============================================================
// Page Component
// ============================================================
export default function BestCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const config = CATEGORY_CONFIG[params.category];

  // Not Found
  if (!config) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:pt-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Category Not Found</h1>
          <p className="mt-2 text-slate-300">
            The category &quot;{params.category}&quot; does not exist.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Go back home
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-3">
      {/* Scanning Banner */}
      <ScanningBanner />

      {/* Header */}
      <section className="mb-6 sm:mb-8">
        <div className="mb-2 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1">
          <span className="text-xs font-medium text-emerald-300">
            AIROUTE BEST 3
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Best 3 tools for {config.title}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{config.subtitle}</p>
        <p className="mt-3 text-sm text-slate-300 sm:text-base">
          {config.description}
        </p>
      </section>

      {/* Best 3 Cards */}
      <section className="space-y-4">
        {config.picks.map((pick) => (
          <Link
            key={pick.slug}
            href={`/tools/${pick.slug}`}
            className="block"
          >
            <article className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm transition hover:border-emerald-400 hover:bg-slate-900">
              {/* Header: Rank Badge + Name */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-lg font-bold text-emerald-400">
                    {pick.ranking.badgeIcon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-white group-hover:text-emerald-300">
                        {pick.name}
                      </h2>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                        #{pick.ranking.rank} {pick.ranking.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{pick.tagline}</p>
                  </div>
                </div>
                <MatchScore rank={pick.ranking.rank} score={pick.ranking.matchScore} />
              </div>

              {/* Why Top 3? (Credibility Section) */}
              <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-800/30 p-3">
                <p className="text-xs font-medium text-slate-400">Why Top 3?</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-200">
                  {pick.ranking.reason}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                  <span>⭐ {pick.ranking.rating} / {pick.ranking.ratingSource}</span>
                  <span>👥 {pick.ranking.monthlyVisits} visits</span>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-800/50 p-3">
                  <p className="text-xs font-medium text-slate-400">Best for</p>
                  <p className="mt-1 text-sm text-slate-200">{pick.bestFor}</p>
                </div>
                <div className="rounded-xl bg-slate-800/50 p-3">
                  <p className="text-xs font-medium text-slate-400">
                    Why we picked it
                  </p>
                  <p className="mt-1 text-sm text-emerald-300">
                    {pick.highlight}
                  </p>
                </div>
              </div>

              {/* CTA hint */}
              <div className="mt-4 text-right">
                <span className="text-xs font-medium text-slate-500 group-hover:text-emerald-400">
                  View details →
                </span>
              </div>
            </article>
          </Link>
        ))}
      </section>
    </main>
  );
}
