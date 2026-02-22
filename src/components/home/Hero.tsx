// 히어로 섹션 컴포넌트
// 배지 + 타이틀 3줄 + 서브텍스트 + 검색바
// 왼쪽 정렬, 컨테이너 내에서만 표시
'use client';

import { Dispatch, SetStateAction } from 'react';

type HeroProps = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
};

export function Hero({ query, setQuery }: HeroProps) {
  return (
    <>
      {/* Hero 섹션 - 텍스트 중심 블록, 왼쪽 정렬 */}
      <section className="flex flex-col gap-4">
        {/* Early Access 배지 - 초록색 점 포함 */}
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          Early Access · v0.5
        </div>

        {/* 메인 타이틀 (3줄 구성) */}
        <h1 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">
          Too many AI tools?
          <br />
          We find the <span className="text-primary">best route</span>
          <br />
          for you.
        </h1>

        {/* 서브 텍스트 (최대 2줄) */}
        <p className="max-w-xl text-sm text-muted-foreground md:text-base">
          Stop wasting time testing everything. AIROUTE curates honest recommendations for every task.
        </p>
      </section>

      {/* 검색창 섹션 */}
      <section className="mt-6">
        <div className="flex flex-col gap-3 md:flex-row">
          {/* 검색 입력 */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <SearchIcon />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "remove background", "logo"'
              className="h-11 w-full rounded-full border border-input bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {/* Search 버튼 */}
          <button
            type="button"
            className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 md:w-32"
          >
            Search
          </button>
        </div>

        {/* 태그 칩들 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <TagChip emoji="🇰🇷" text="Best for Korean" />
          <TagChip emoji="✨" text="Curated picks" />
          <TagChip emoji="🚫" text="No BS links" />
        </div>
      </section>
    </>
  );
}

// 태그 칩 컴포넌트
function TagChip({ emoji, text }: { emoji: string; text: string }) {
  return (
    <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
      <span>{emoji}</span>
      <span>{text}</span>
    </span>
  );
}

// 검색 아이콘 SVG
function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
