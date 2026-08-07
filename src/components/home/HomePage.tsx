// 홈 노멀 모드 메인 페이지 컴포넌트
// layout.tsx에서 컨테이너를 제공하므로 여기서는 중복 컨테이너 제거
// 비즈니스 로직(검색/필터링) 유지
'use client';

import { useState, useMemo } from 'react';
import { Tool, TASK_CATEGORIES, TaskCategory } from '@/types/tool';
import Link from 'next/link';
import AffiliateLinkButton from '@/components/AffiliateLinkButton';

type HomePageProps = {
  initialTools: Tool[];
};

export function HomePage({ initialTools }: HomePageProps) {
  // 🔹 상태 관리 (기존 로직 유지)
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('All');

  // 🔹 필터링 로직 (기존 로직 유지)
  const filteredTools = useMemo(() => {
    let result = initialTools;

    // 1. 카테고리 필터링
    if (selectedCategory !== 'All') {
      result = result.filter((tool) => {
        const toolCategory = tool.task_category?.toLowerCase() || '';
        const selected = selectedCategory.toLowerCase();
        return toolCategory.includes(selected.split(' ')[0]);
      });
    }

    // 2. 검색 쿼리 필터링
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      result = result.filter((tool) => {
        const name = tool.name?.toLowerCase() || '';
        const descEn = tool.desc_en?.toLowerCase() || '';
        const bestFor = tool.best_for?.toLowerCase() || '';
        const tags = tool.tags?.join(' ').toLowerCase() || '';
        
        return (
          name.includes(searchTerm) ||
          descEn.includes(searchTerm) ||
          bestFor.includes(searchTerm) ||
          tags.includes(searchTerm)
        );
      });
    }

    return result;
  }, [initialTools, selectedCategory, query]);

  // 🔹 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col">
      {/* 1) Hero 섹션 - 프리미엄 SaaS 랜딩 느낌 */}
      {/* 모바일: 컴팩트, 데스크탑: 넓은 여백 */}
      <section className="space-y-4 md:space-y-6">
        {/* Early Access 배지 */}
        <div className="text-xs inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary w-fit">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          Early Access · v0.5
        </div>

        {/* 텍스트 영역 - max-w-3xl로 제한 */}
        <div className="max-w-3xl space-y-3 md:space-y-4">
          {/* 메인 타이틀 - 반응형 폰트 크기 */}
          <h1 className="font-bold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight text-foreground">
            <span>Too many AI tools?</span>
            <br />
            <span>We find the <span className="text-primary">best route</span></span>
            <br />
            <span>for you.</span>
          </h1>

          {/* 서브 텍스트 */}
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-xl leading-relaxed">
            Stop wasting time testing everything. AIROUTE curates honest,
            beginner-friendly recommendations for every task.
          </p>
        </div>
      </section>

      {/* 2) 검색 섹션 */}
      <section className="mt-6 md:mt-10">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <div className="flex-1 relative group">
            {/* 검색 아이콘 */}
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-all duration-200 ease-in-out group-hover:text-slate-300">
              <SearchIcon />
            </div>
            {/* 검색 인풋 */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "remove background", "logo"'
              className="w-full h-11 md:h-14 rounded-full bg-card border border-input pl-11 pr-4 text-sm md:text-base text-foreground placeholder:text-muted-foreground transition-all duration-200 ease-in-out hover:border-border focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
            />
          </div>
          {/* 검색 버튼 */}
          <button
            type="submit"
            className="sm:w-28 md:w-32 h-11 md:h-14 rounded-full bg-primary hover:opacity-90 text-primary-foreground text-sm md:text-base font-semibold transition-all duration-200 ease-in-out active:scale-[0.98]"
          >
            Search
          </button>
        </form>
      </section>

      {/* 3) 태그/카테고리 필터 섹션 */}
      <section className="flex flex-col gap-3 md:gap-4 mt-4 md:mt-8">
        {/* 상단: 특징 태그 - 모바일: 더 작은 간격 */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-xs">
          <TagChip emoji="🇰🇷" label="Best for Korean users" />
          <TagChip emoji="✨" label="Curated picks" />
          <TagChip emoji="🚫" label="No BS affiliate links" />
        </div>

        {/* 하단: 카테고리 필터 - 모바일: 스크롤 가능 */}
        <div className="flex flex-wrap items-center gap-2 md:gap-2.5 text-xs md:text-sm">
          <span className="text-muted-foreground mr-1 font-medium">Filter:</span>
          {TASK_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full border transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* 4) Top Tools 섹션 */}
      <section className="mt-8 md:mt-12 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">Top Tools</h2>
          <p className="text-xs text-muted-foreground">
            {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* 카드 그리드 - 반응형 간격 */}
        {filteredTools.length > 0 ? (
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} isBestChoice={index === 0} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      {/* 5) 푸터 */}
      <footer className="pt-8 md:pt-10 mt-10 md:mt-16 border-t border-border text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
        <span>© {new Date().getFullYear()} Hinko Labs · AIROUTE</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-primary transition">Privacy</Link>
          <Link href="/terms" className="hover:text-primary transition">Terms</Link>
          <Link href="mailto:contact@hinkolabs.com" className="hover:text-primary transition">Contact</Link>
        </div>
      </footer>
    </div>
  );
}

// 🔹 태그 칩 컴포넌트 - 모바일 최적화
function TagChip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-full border border-border bg-card text-muted-foreground text-xs md:text-sm hover:border-primary/50 hover:bg-muted hover:text-primary transition-all duration-200 cursor-pointer">
      <span className="text-sm md:text-base">{emoji}</span>
      <span>{label}</span>
    </span>
  );
}

// 🔹 도구 카드 컴포넌트 - 모바일 최적화된 패딩
function ToolCard({ tool, isBestChoice }: { tool: Tool; isBestChoice?: boolean }) {
  const description = tool.desc_en || tool.why_pick || 'AI Tool';
  const visitUrl = (tool as any).affiliate_url ?? (tool as any).website_url ?? (tool as any).url;

  return (
    <article className="w-full flex flex-col rounded-2xl border border-border bg-card p-4 md:p-5 transition-all duration-150 ease-out hover:border-primary/50 hover:shadow-md md:hover:-translate-y-1">
      {/* 상단: 이름 + 카테고리 */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">✨</span>
          <h3 className="font-semibold text-foreground text-base">{tool.name}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {tool.task_category}
        </span>
      </div>

      {/* Best Choice 라벨 */}
      {isBestChoice && (
        <span className="inline-flex items-center gap-1.5 text-primary text-xs font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Best Choice
        </span>
      )}

      {/* 설명 */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow leading-relaxed">
        {description}
      </p>

      {/* Best for 배지 */}
      {tool.best_for && (
        <p className="text-xs text-primary mb-4 font-medium">
          Best for: {tool.best_for}
        </p>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-2.5 mt-auto pt-4 border-t border-border">
        <AffiliateLinkButton
          href={visitUrl}
          placement="tool_card"
          toolSlug={tool.id}
          className="flex-1 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold transition-all duration-200 hover:opacity-90"
        >
          Visit
        </AffiliateLinkButton>
        <Link
          href={`/tools/${tool.id}`}
          className="flex-1 h-10 flex items-center justify-center rounded-full border border-border text-foreground text-sm font-medium transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5"
        >
          Details
        </Link>
      </div>
    </article>
  );
}

// 🔹 빈 상태 컴포넌트
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
      <div className="text-4xl mb-4">📦</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No tools found</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        No tools match your search. Try adjusting your filters or search query.
      </p>
    </div>
  );
}

// 🔹 검색 아이콘
function SearchIcon() {
  return (
    <svg
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
