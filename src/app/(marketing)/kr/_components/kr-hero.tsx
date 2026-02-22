export function KRHero() {
  return (
    <section className="px-4 pt-6 pb-3 sm:px-6 lg:px-8 lg:pb-6">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-primary/10 p-8 shadow-md ring-1 ring-border/60 md:p-12">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1 text-xs font-medium text-primary lg:mb-5">
          <span>✦</span>
          <span>한국 사용자를 위한 AI 도구 네비게이션</span>
        </div>

        {/* Headline */}
        <h1 className="mb-2 text-3xl font-bold tracking-tight leading-[1.1] text-foreground md:text-5xl">
          <span className="block">AI 도구가 너무 많아서 헷갈리시나요?</span>
          <span className="block">
            우리가 가장 좋은{" "}
            <span className="text-primary">루트</span>를 찾아드립니다.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          끝없는 검색은 이제 그만. 목표를 선택하시면 최고의 AI 도구 3개를 보여드립니다.
        </p>
      </div>
    </section>
  );
}
