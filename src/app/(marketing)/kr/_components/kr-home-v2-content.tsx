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
} from "lucide-react";
import { krTopRoutes, krTopGuides } from "../_data/kr-home";
import { getPublicStats } from "@/lib/tools";
import { MyToolboxSection } from "@/app/_components/home/my-toolbox-section";

const CATEGORIES = [
  { id: "image-design", title: "이미지 & 디자인", Icon: Image },
  { id: "writing", title: "글쓰기", Icon: PenLine },
  { id: "video", title: "영상", Icon: Film },
  { id: "audio", title: "오디오", Icon: Music },
  { id: "voice", title: "음성", Icon: Mic },
  { id: "coding", title: "코딩", Icon: Code },
];

export async function KRHomeV2Content() {
  const stats = await getPublicStats();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute top-20 right-0 h-60 w-60 rounded-full bg-primary/5 blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-20 text-center sm:pt-28 sm:pb-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            AI 도구 네비게이션
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl !leading-[1.15]">
            AI 작업, 어디서부터
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
              시작해야 할지
            </span>{" "}
            모르겠다면
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            하고싶은 일만 선택하세요. 검증된 AI 도구 조합과 단계별 워크플로우를
            안내합니다. 더 이상 혼자 고민하지 마세요.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/kr/routes"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-7 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110"
            >
              루트 둘러보기
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/kr/tools"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-7 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              AI 도구 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center justify-around rounded-2xl border border-border bg-muted/30 py-6 px-4">
          {[
            { value: stats.toolsCount, label: "AI 도구" },
            { value: stats.routesCount, label: "워크플로우 루트" },
            { value: stats.guidesCount, label: "실전 가이드" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead icon={<Route className="h-5 w-5 text-primary" />} title="인기 루트" sub="가장 많이 사용되는 AI 워크플로우" href="/kr/routes" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {krTopRoutes.map((r, i) => (
              <Link key={r.slug} href={`/kr/routes/${r.slug}`} className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card px-4 py-3 transition hover:border-primary/30 hover:shadow-md sm:gap-4 sm:p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition sm:text-base">{r.title}</h3>
                </div>
                {r.badge && <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{r.badge}</span>}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pt-8 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-2xl border border-border bg-muted/10 p-4 sm:p-8">
          <SectionHead icon={<BookOpen className="h-5 w-5 text-primary" />} title="가이드" sub="AI 도구 선택이 쉬워지는 실전 가이드" href="/kr/guides" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {krTopGuides.map((g) => (
              <Link key={g.slug} href={`/kr/guides/${g.slug}`} className="group flex items-start gap-3 overflow-hidden rounded-2xl border border-border bg-card px-4 py-3 transition hover:border-primary/30 hover:shadow-md sm:gap-4 sm:p-5">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex h-4 items-center">
                    {g.badge && <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium leading-none text-primary">{g.badge}</span>}
                  </div>
                  <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition sm:text-base">{g.title}</h3>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <MyToolboxSection basePath="/kr" />

      <section className="px-5 pt-8 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead icon={<Target className="h-5 w-5 text-primary" />} title="카테고리" sub="목적에 맞는 AI 도구를 찾아보세요" href="/kr/tools" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((c) => {
              const Icon = c.Icon;
              return (
                <Link key={c.id} href={`/kr/tools/best/${c.id}`} className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition hover:border-primary/30 hover:shadow-md">
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

      <section className="px-5 pb-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-violet-600 p-10 text-center text-white sm:p-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative">
            <Zap className="mx-auto mb-4 h-8 w-8" />
            <h2 className="text-2xl font-bold sm:text-3xl">지금 바로 따라해보세요</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">{String(stats.toolsCount).replace("+", "")}개가 넘는 AI 도구 중 최적의 조합을 찾고, 단계별 가이드를 따라 즉시 시작하세요.</p>
            <Link href="/kr/routes" className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold !text-gray-900 shadow-lg transition hover:bg-white/90">
              루트 둘러보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex gap-6 text-xs text-muted-foreground">
              <a href="mailto:contact@hinkolabs.com?subject=[Contact] Airoute KR" className="transition hover:text-foreground">문의하기</a>
              <a href="mailto:contact@hinkolabs.com?subject=[Partnership] Airoute KR" className="transition hover:text-foreground">파트너십</a>
              <a href="mailto:contact@hinkolabs.com?subject=[Support] Airoute KR" className="transition hover:text-foreground">고객지원</a>
            </div>
            <p className="text-xs text-muted-foreground/60">© {new Date().getFullYear()} HinkoLabs</p>
            <div className="flex gap-3 text-xs text-muted-foreground/60">
              <Link href="/privacy" className="transition hover:text-muted-foreground">개인정보처리방침</Link>
              <span>·</span>
              <Link href="/terms" className="transition hover:text-muted-foreground">이용약관</Link>
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
        더보기
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
