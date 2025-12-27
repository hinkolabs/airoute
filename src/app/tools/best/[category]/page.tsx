import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabase/server";
import AffiliateLinkButton from "@/components/AffiliateLinkButton";
import { ToolLogo } from "@/components/tool-logo";

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

// Slug to DB category label mapping (DB uses display names like "Image & Design")
const CATEGORY_SLUG_TO_LABEL: Record<CategoryKey, string> = {
  "image-design": "Image & Design",
  "writing": "Writing",
  "video": "Video",
  "audio": "Audio",
  "voice": "Voice",
  "coding": "Coding",
};

// Category slug to display name mapping
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

// Role labels
const ROLE_LABELS: Record<"popular" | "easy" | "free", string> = {
  popular: "Most popular",
  easy: "Beginner-friendly",
  free: "Free to try",
};

type ToolCategoryBest = {
  category: string;
  role: "popular" | "easy" | "free";
  tool_slug: string;
  note: string | null;
};

type ToolData = {
  id: string;
  slug: string;
  name: string;
  desc_en: string | null;
  description: string | null;
  website_url: string | null;
  url: string | null;
  affiliate_url: string | null;
  image: string | null;
};

export default async function BestCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const rawKey = category ?? "";

  // Validate category key
  const categoryKey = (CATEGORY_KEYS.includes(rawKey as CategoryKey)
    ? (rawKey as CategoryKey)
    : null);

  // If invalid category, return 404 (don't fallback)
  if (!categoryKey) {
    return (
      <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-50 mb-2">Category not found</h1>
          <p className="text-sm text-slate-400">The requested category does not exist.</p>
        </div>
      </main>
    );
  }

  const meta = CATEGORY_META[categoryKey];
  const categoryLabel = CATEGORY_SLUG_TO_LABEL[categoryKey]; // DB uses display names

  // Fallback hardcoded data (until DB table is populated)
  const FALLBACK_BEST3: Record<CategoryKey, Array<{role: "popular" | "easy" | "free"; toolSlug: string; note: string}>> = {
    "image-design": [
      { role: "popular", toolSlug: "midjourney", note: "Premium-quality image generation with the most stable results." },
      { role: "easy", toolSlug: "canva", note: "Template-based design tool that makes thumbnails and posters easy." },
      { role: "free", toolSlug: "leonardo-ai", note: "Great for concept art and game assets with lots of presets." },
    ],
    "writing": [
      { role: "popular", toolSlug: "chatgpt", note: "General-purpose writer for emails, essays, resumes, blog posts and more." },
      { role: "easy", toolSlug: "claude", note: "Strong at long reports and structured documents with clear reasoning." },
      { role: "free", toolSlug: "jasper-ai", note: "Marketing-focused writing with templates and brand voice." },
    ],
    "video": [
      { role: "popular", toolSlug: "runway", note: "All-in-one video creation and editing for shorts and YouTube content." },
      { role: "easy", toolSlug: "opus-clip", note: "Turn long videos into viral Shorts automatically with AI highlights." },
      { role: "free", toolSlug: "pika", note: "Quick video generation for social media content." },
    ],
    "audio": [
      { role: "popular", toolSlug: "suno", note: "End-to-end AI music generation for BGM or personal projects." },
      { role: "easy", toolSlug: "udio", note: "Alternative AI music option with different styles and flavors." },
      { role: "free", toolSlug: "aiva", note: "Focused on cinematic and classical-style background music." },
    ],
    "voice": [
      { role: "popular", toolSlug: "elevenlabs", note: "Most natural-sounding TTS for dubbing, narration and character voices." },
      { role: "easy", toolSlug: "play-ht", note: "Large collection of multilingual voice presets for international content." },
      { role: "free", toolSlug: "heygen", note: "Generates talking-head avatar videos with synced lips." },
    ],
    "coding": [
      { role: "popular", toolSlug: "github-copilot", note: "Inline AI code suggestions directly in your IDE." },
      { role: "easy", toolSlug: "cursor", note: "AI-powered editor that understands your project and assists with refactors." },
      { role: "free", toolSlug: "replit-ghostwriter", note: "AI coding assistant built into the Replit browser IDE." },
    ],
  };

  // Try to fetch from tool_category_best, fallback to hardcoded data
  const { data: categoryBest, error: categoryBestError } = await supabaseServerClient
    .from("tool_category_best")
    .select("*")
    .eq("category", categoryLabel);

  if (categoryBestError) {
    console.log("[BestCategory] tool_category_best not available, using fallback data:", categoryBestError.message);
  }

  // Use DB data if available, otherwise use fallback
  let best3Items: Array<{role: "popular" | "easy" | "free"; tool_slug: string; note: string}>;
  if (categoryBest && categoryBest.length > 0) {
    best3Items = categoryBest;
  } else {
    // Map fallback data to match DB structure
    best3Items = FALLBACK_BEST3[categoryKey].map(item => ({
      role: item.role,
      tool_slug: item.toolSlug,
      note: item.note,
    }));
  }

  // Get tool slugs
  const toolSlugs = best3Items.map((item: ToolCategoryBest) => item.tool_slug);

  // Fetch tool data
  const { data: tools, error: toolsError } = await supabaseServerClient
    .from("tools")
    .select("id, slug, name, desc_en, description, website_url, url, affiliate_url, image")
    .in("slug", toolSlugs);

  if (toolsError) {
    console.error("[BestCategory] Error fetching tools:", toolsError);
  }

  // Map tools by slug
  const toolsBySlug = new Map(
    tools?.map((t: ToolData) => [t.slug, t]) || []
  );

  // Sort by role order: popular -> easy -> free
  const roleOrder: Array<"popular" | "easy" | "free"> = ["popular", "easy", "free"];
  const sortedBest3 = best3Items
    .map((item: ToolCategoryBest) => {
      const tool = toolsBySlug.get(item.tool_slug);
      if (!tool) return null;
      return {
        role: item.role,
        tool,
        note: item.note,
      };
    })
    .filter((item): item is { role: "popular" | "easy" | "free"; tool: ToolData; note: string | null } => item !== null)
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
    .slice(0, 3);

  const encodedCategory = encodeURIComponent(categoryLabel);

  return (
    <main className="min-h-screen bg-[#020617]">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pt-1 pb-24 text-slate-50">
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
        </header>

        {/* Best 3 Cards */}
        <section className="mb-6">
          {sortedBest3.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/30 p-8 text-center">
              <p className="text-sm text-slate-400">
                No recommended tools yet for this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedBest3.map((item, index) => {
                const tool = item.tool;
                const description =
                  item.note || tool.desc_en || tool.description || "No description available.";
                const affiliateUrl = tool.affiliate_url || tool.website_url || tool.url;

                return (
                  <article
                    key={tool.id}
                    className="relative flex flex-col gap-4 rounded-2xl border border-slate-700/70 bg-slate-900/80 p-5 shadow-sm hover:border-slate-600 transition-colors"
                  >
                    {/* Role Badge - Top */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                        {ROLE_LABELS[item.role]}
                      </span>
                    </div>

                    {/* Tool Header: Logo + Name */}
                    <div className="flex items-center gap-3">
                      <ToolLogo
                        tool={{
                          name: tool.name,
                          image: tool.image,
                          website_url: tool.website_url || tool.url,
                        }}
                        size={48}
                      />
                      <h2 className="text-base font-semibold text-slate-50">
                        {tool.name}
                      </h2>
                    </div>

                    {/* Why Selected (Note) */}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-slate-300/90">
                        {description}
                      </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link
                        href={`/tools/${tool.slug}`}
                        className="inline-flex items-center rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                      >
                        Details
                      </Link>
                      {affiliateUrl && (
                        <AffiliateLinkButton
                          href={affiliateUrl}
                          placement="best3"
                          toolSlug={tool.slug}
                          className="inline-flex items-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/15"
                        >
                          Visit →
                        </AffiliateLinkButton>
                      )}
                    </div>
                  </article>
              );
            })}
            </div>
          )}
        </section>

        {/* Browse All Button */}
        <div className="mt-12 flex justify-center">
          <Link
            href={`/tools?category=${encodedCategory}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/15"
          >
            Browse all {categoryLabel} tools →
          </Link>
        </div>
      </div>
    </main>
  );
}
