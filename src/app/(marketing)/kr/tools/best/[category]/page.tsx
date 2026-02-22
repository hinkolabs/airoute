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

// Category slug to display name mapping (Korean)
const CATEGORY_META: Record<
  CategoryKey,
  { title: string; description: string }
> = {
  "image-design": {
    title: "이미지 & 디자인",
    description:
      "로고, 썸네일, 포스터, UI 등 시각 작업에 최적화된 도구 베스트 3",
  },
  writing: {
    title: "글쓰기",
    description:
      "콘텐츠 제작과 마케팅 카피에 가장 많이 사용되는 도구 베스트 3",
  },
  video: {
    title: "영상",
    description:
      "크리에이터들이 선호하는 영상 편집 및 생성 도구 베스트 3",
  },
  audio: {
    title: "오디오",
    description:
      "음악과 사운드 디자인에 자주 사용되는 도구 베스트 3",
  },
  voice: {
    title: "음성",
    description:
      "음성 생성과 더빙 작업에서 높은 채택률을 보이는 도구 베스트 3",
  },
  coding: {
    title: "코딩",
    description:
      "개발자들이 코드 작성과 개발 작업에 널리 사용하는 도구 베스트 3",
  },
};

// Role labels (Korean)
const ROLE_LABELS: Record<"popular" | "easy" | "free", string> = {
  popular: "가장 인기있는",
  easy: "초보자 친화적",
  free: "무료 체험 가능",
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

export default async function KRBestCategoryPage({
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
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">카테고리를 찾을 수 없습니다</h1>
          <p className="text-sm text-muted-foreground">요청하신 카테고리가 존재하지 않습니다.</p>
        </div>
      </main>
    );
  }

  const meta = CATEGORY_META[categoryKey];
  const categoryLabel = CATEGORY_SLUG_TO_LABEL[categoryKey]; // DB uses display names

  // Fallback hardcoded data (until DB table is populated)
  const FALLBACK_BEST3: Record<CategoryKey, Array<{role: "popular" | "easy" | "free"; toolSlug: string; note: string}>> = {
    "image-design": [
      { role: "popular", toolSlug: "midjourney", note: "가장 안정적인 결과를 제공하는 프리미엄 이미지 생성 도구" },
      { role: "easy", toolSlug: "canva", note: "템플릿 기반 디자인으로 썸네일과 포스터를 쉽게 만들 수 있음" },
      { role: "free", toolSlug: "leonardo-ai", note: "다양한 프리셋으로 컨셉 아트와 게임 에셋 제작에 탁월" },
    ],
    "writing": [
      { role: "popular", toolSlug: "chatgpt", note: "이메일, 에세이, 이력서, 블로그 등 범용 글쓰기에 최적화" },
      { role: "easy", toolSlug: "claude", note: "긴 보고서와 구조화된 문서 작성에 강점을 보임" },
      { role: "free", toolSlug: "jasper-ai", note: "마케팅 중심 글쓰기 템플릿과 브랜드 보이스 제공" },
    ],
    "video": [
      { role: "popular", toolSlug: "runway", note: "쇼츠와 유튜브 콘텐츠를 위한 올인원 영상 제작 및 편집 도구" },
      { role: "easy", toolSlug: "opus-clip", note: "긴 영상을 AI가 자동으로 바이럴 쇼츠로 변환" },
      { role: "free", toolSlug: "pika", note: "소셜 미디어 콘텐츠를 위한 빠른 영상 생성" },
    ],
    "audio": [
      { role: "popular", toolSlug: "suno", note: "BGM이나 개인 프로젝트를 위한 종합 AI 음악 생성" },
      { role: "easy", toolSlug: "udio", note: "다양한 스타일과 느낌의 AI 음악 제작 대안" },
      { role: "free", toolSlug: "aiva", note: "영화 같은 분위기와 클래식 스타일 배경 음악에 특화" },
    ],
    "voice": [
      { role: "popular", toolSlug: "elevenlabs", note: "더빙, 내레이션, 캐릭터 보이스를 위한 가장 자연스러운 TTS" },
      { role: "easy", toolSlug: "play-ht", note: "국제 콘텐츠를 위한 다국어 음성 프리셋이 풍부함" },
      { role: "free", toolSlug: "heygen", note: "립싱크가 동기화된 토킹헤드 아바타 영상 생성" },
    ],
    "coding": [
      { role: "popular", toolSlug: "github-copilot", note: "IDE 내에서 직접 제공되는 인라인 AI 코드 제안" },
      { role: "easy", toolSlug: "cursor", note: "프로젝트를 이해하고 리팩토링을 지원하는 AI 기반 에디터" },
      { role: "free", toolSlug: "replit-ghostwriter", note: "Replit 브라우저 IDE에 내장된 AI 코딩 어시스턴트" },
    ],
  };

  // Try to fetch from tool_category_best, fallback to hardcoded data
  const { data: categoryBest, error: categoryBestError } = await supabaseServerClient
    .from("tool_category_best")
    .select("*")
    .eq("category", categoryLabel);

  if (categoryBestError) {
    console.log("[KR BestCategory] tool_category_best not available, using fallback data:", categoryBestError.message);
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
  const toolSlugs = best3Items.map(item => item.tool_slug);

  // Fetch tool data
  const { data: tools, error: toolsError } = await supabaseServerClient
    .from("tools")
    .select("id, slug, name, desc_en, description, website_url, url, affiliate_url, image")
    .in("slug", toolSlugs);

  if (toolsError) {
    console.error("[KR BestCategory] Error fetching tools:", toolsError);
  }

  // Map tools by slug
  const toolsBySlug = new Map(
    tools?.map((t: ToolData) => [t.slug, t]) || []
  );

  // Sort by role order: popular -> easy -> free
  const roleOrder: Array<"popular" | "easy" | "free"> = ["popular", "easy", "free"];
  const sortedBest3 = best3Items
    .map(item => {
      const tool = toolsBySlug.get(item.tool_slug);
      if (!tool) return null;
      return {
        role: item.role,
        tool,
        note: item.note,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
    .slice(0, 3);

  const encodedCategory = encodeURIComponent(categoryLabel);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pt-1 pb-24 text-foreground">
        {/* Header */}
        <header className="mb-6">
          <div className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <span className="mr-1.5 text-xs">✨</span>
            <span>Airoute 베스트 3</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">
            {meta.title} 베스트 3 도구
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
        </header>

        {/* Best 3 Cards */}
        <section className="mb-6">
          {sortedBest3.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                아직 이 카테고리에 추천 도구가 없습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedBest3.map((item, index) => {
                const tool = item.tool;
                const description =
                  item.note || tool.desc_en || tool.description || "설명이 없습니다.";
                const affiliateUrl = tool.affiliate_url || tool.website_url || tool.url;

                return (
                  <article
                    key={tool.id}
                    className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-5 shadow-sm hover:border-border transition-colors"
                  >
                    {/* Role Badge - Top */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
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
                      <h2 className="text-base font-semibold text-foreground">
                        {tool.name}
                      </h2>
                    </div>

                    {/* Why Selected (Note) */}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-muted-foreground/90">
                        {description}
                      </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link
                        href={`/kr/tools/${tool.slug}`}
                        className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition hover:border-primary hover:bg-muted"
                      >
                        자세히 보기
                      </Link>
                      {affiliateUrl && (
                      <AffiliateLinkButton
                        href={affiliateUrl}
                        placement="best3"
                        toolSlug={tool.slug}
                        className="inline-flex items-center rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/15"
                      >
                        방문하기 →
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
            href={`/kr/tools?category=${encodedCategory}`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary transition hover:border-primary hover:bg-primary/15"
          >
            모든 {meta.title} 도구 보기 →
          </Link>
        </div>
      </div>
    </main>
  );
}
