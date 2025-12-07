// 도구 카드 그리드 섹션
// 필터링된 도구 목록을 그리드로 표시
// 모바일: 1열 / md: 3열
import { Tool } from '@/types/tool';
import { ToolCard } from './ToolCard';

type ToolGridProps = {
  tools: Tool[];
};

export function ToolGrid({ tools }: ToolGridProps) {
  // 도구가 없는 경우
  if (tools.length === 0) {
    return (
      <section className="mt-10">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/50 py-16 text-center">
          <EmptyIcon />
          <h3 className="mt-4 text-base font-semibold text-white md:text-lg">
            No tools found
          </h3>
          <p className="mt-2 max-w-sm px-4 text-xs text-slate-400 md:text-sm">
            No tools yet. Please add tools in Supabase later, or try adjusting your filters.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">
      {/* 섹션 헤더 - 제목과 개수를 한 줄에 배치 */}
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Top Tools</h2>
        <p className="text-xs text-slate-400">
          {tools.length} tool{tools.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* 카드 그리드 - 모바일: 1열 / md: 3열 */}
      <div className="grid gap-4 md:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}

// 빈 상태 아이콘
function EmptyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-600"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
