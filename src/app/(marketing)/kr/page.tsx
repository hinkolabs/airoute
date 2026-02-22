import { Metadata } from "next";
import { KRHero } from "./_components/kr-hero";
import { KRTopPicks } from "./_components/kr-top-picks";
import { MyToolboxSection } from "@/app/_components/home/my-toolbox-section";
import { KRWorkspacePlaceholder } from "./_components/kr-workspace-placeholder";
import { KRHomeV2Content } from "./_components/kr-home-v2-content";
import { KRHomeV2SimpleContent } from "./_components/kr-home-v2-simple-content";
import { krTopRoutes, krTopGuides } from "./_data/kr-home";
import { getDemoMode, getHomepageTheme } from "@/lib/flags";
import Link from "next/link";
import { Image, PenLine, Film, Music, Mic, Code } from "lucide-react";

export const metadata: Metadata = {
  title: "Airoute KR - AI 도구 네비게이션",
  description: "AI 도구가 너무 많아서 헷갈리시나요? 한국 사용자를 위한 최고의 AI 도구 추천과 가이드를 제공합니다.",
  alternates: {
    canonical: "https://www.airoute.ai/kr",
  },
  openGraph: {
    title: "Airoute KR - AI 도구 네비게이션",
    description: "AI 도구가 너무 많아서 헷갈리시나요? 한국 사용자를 위한 최고의 AI 도구 추천과 가이드를 제공합니다.",
    url: "https://www.airoute.ai/kr",
    locale: "ko_KR",
  },
};

// ===========================
// CATEGORY DATA
// ===========================
const CATEGORIES = [
  {
    id: "image-design",
    title: "이미지 & 디자인",
    description: "로고, 포스터, UI 디자인 제작",
    Icon: Image,
    filterName: "Image & Design",
  },
  {
    id: "writing",
    title: "글쓰기",
    description: "블로그, 마케팅 카피, 스크립트 작성",
    Icon: PenLine,
    filterName: "Writing",
  },
  {
    id: "video",
    title: "영상",
    description: "전문적인 영상 편집 및 생성",
    Icon: Film,
    filterName: "Video",
  },
  {
    id: "audio",
    title: "오디오",
    description: "음악, 팟캐스트, 배경음악 제작",
    Icon: Music,
    filterName: "Audio",
  },
  {
    id: "voice",
    title: "음성",
    description: "실감나는 음성 및 더빙 생성",
    Icon: Mic,
    filterName: "Voice",
  },
  {
    id: "coding",
    title: "코딩",
    description: "코드 작성 및 디버깅 지원",
    Icon: Code,
    filterName: "Coding",
  },
];

// ===========================
// SHARED: SECTION HEADER
// ===========================
function SectionHeader({ title, moreHref }: { title: string; moreHref: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">{title}</h2>
      <Link
        href={moreHref}
        className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <span>더보기</span>
        <span>→</span>
      </Link>
    </div>
  );
}

// ===========================
// CATEGORY SECTION (Korean)
// ===========================
function CategorySection() {
  return (
    <section id="categories" className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader title="카테고리" moreHref="/kr/tools" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => {
          const Icon = category.Icon;
          return (
            <Link
              key={category.id}
              href={`/kr/tools/best/${category.id}`}
              className="group flex min-h-[145px] flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Icon + Title */}
              <div className="flex-1">
                <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary transition-colors group-hover:text-primary/80" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold leading-5 text-card-foreground lg:text-lg">
                  {category.title}
                </h3>
                <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {category.description}
                </p>
              </div>

              {/* Bottom CTA (single line) */}
              <div className="mt-3 flex min-h-[44px] items-center justify-between px-1 text-sm font-medium text-primary">
                <span>베스트 3 도구 보기</span>
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
// FOOTER (Korean)
// ===========================
function PageFooter() {
  return (
    <footer className="px-4 py-8 text-center lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4 flex justify-center gap-6 text-xs">
        <a href="mailto:contact@hinkolabs.com?subject=[Contact] Airoute KR" className="text-muted-foreground transition-colors hover:text-primary">
          문의하기
        </a>
        <a href="mailto:contact@hinkolabs.com?subject=[Partnership] Airoute KR" className="text-muted-foreground transition-colors hover:text-primary">
          파트너십
        </a>
        <a href="mailto:contact@hinkolabs.com?subject=[Support] Airoute KR" className="text-muted-foreground transition-colors hover:text-primary">
          고객지원
        </a>
      </div>
      <div className="mb-2">
        <p className="text-xs text-muted-foreground">© 2025 HinkoLabs</p>
      </div>
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <Link href="/privacy" className="transition-colors hover:text-muted-foreground">
            개인정보처리방침
          </Link>
          <span>·</span>
          <Link href="/terms" className="transition-colors hover:text-muted-foreground">
            이용약관
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ===========================
// MAIN PAGE
// ===========================
export default async function KRHomePage() {
  const [demoMode, theme] = await Promise.all([getDemoMode(), getHomepageTheme()]);

  if (theme === "v2") return <KRHomeV2Content />;
  if (theme === "v2-simple") return <KRHomeV2SimpleContent />;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="pb-20">
        <div className="bg-gradient-to-b from-primary/10 via-background to-background">
          <KRHero />
          <KRTopPicks routes={krTopRoutes} guides={krTopGuides} />
        </div>
        <div className="space-y-16">
          <MyToolboxSection basePath="/kr" />
          {!demoMode && <KRWorkspacePlaceholder />}
          <CategorySection />
        </div>
        <PageFooter />
      </main>
    </div>
  );
}
