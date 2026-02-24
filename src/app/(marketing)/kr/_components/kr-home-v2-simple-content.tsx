import Link from "next/link";
import { ArrowRight, ArrowUpRight, Route, BookOpen } from "lucide-react";
import { krTopRoutes, krTopGuides } from "../_data/kr-home";

export function KRHomeV2SimpleContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-2xl px-5 pb-20 pt-24 text-center sm:pt-32">
        <p className="mb-4 text-sm font-medium tracking-wide text-primary uppercase">AI 도구 네비게이션</p>
        <h1 className="text-4xl font-bold tracking-tight !leading-[1.2] sm:text-5xl">
          검색은 그만.
          <br />
          지금 바로 시작하세요.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
          목표를 선택하면 최고의 AI 도구 3개와 단계별 워크플로우를 안내합니다.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link href="/kr/routes" className="inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110">
            루트 둘러보기
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/kr/tools" className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-6 text-sm font-medium text-foreground transition hover:bg-muted">
            AI 도구 보기
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl border-t border-border" />

      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">인기 루트</h2>
          </div>
          <Link href="/kr/routes" className="text-sm text-muted-foreground transition hover:text-primary">전체보기 →</Link>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border">
          {krTopRoutes.map((r) => (
            <Link key={r.slug} href={`/kr/routes/${r.slug}`} className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/50">
              <div className="flex min-w-0 items-center gap-3">
                <h3 className="text-sm font-medium text-foreground transition group-hover:text-primary">{r.title}</h3>
                {r.badge && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{r.badge}</span>}
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">가이드</h2>
          </div>
          <Link href="/kr/guides" className="text-sm text-muted-foreground transition hover:text-primary">전체보기 →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {krTopGuides.map((g) => (
            <Link key={g.slug} href={`/kr/guides/${g.slug}`} className="group flex flex-col justify-between rounded-xl border border-border p-4 transition hover:border-primary/30 hover:shadow-sm">
              <span className="mb-2 block min-h-[20px]">
                {g.badge ? <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{g.badge}</span> : null}
              </span>
              <h3 className="truncate text-sm font-medium text-foreground transition group-hover:text-primary">{g.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-violet-600 p-10 text-center text-white sm:p-14">
          <h2 className="text-xl font-bold sm:text-2xl">나만의 AI 워크플로우를 찾아보세요</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/70">200개 이상의 AI 도구, 큐레이션 루트, 실전 가이드</p>
          <Link href="/kr/routes" className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-7 text-sm font-semibold !text-gray-900 shadow-lg transition hover:bg-white/90">
            시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-8 text-center">
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <a href="mailto:contact@hinkolabs.com?subject=[Contact] Airoute KR" className="transition hover:text-foreground">문의하기</a>
            <a href="mailto:contact@hinkolabs.com?subject=[Partnership] Airoute KR" className="transition hover:text-foreground">파트너십</a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/50">
            © 2025 HinkoLabs ·{" "}
            <Link href="/privacy" className="hover:text-muted-foreground">개인정보처리방침</Link>{" "}·{" "}
            <Link href="/terms" className="hover:text-muted-foreground">이용약관</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
