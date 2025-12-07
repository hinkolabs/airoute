// 개별 도구 카드 컴포넌트
// 도구 정보 표시 및 Visit/Details 버튼 포함
// w-full로 grid cell에 맞게 꽉 차도록 설정
import Link from 'next/link';
import { Tool } from '@/types/tool';

type ToolCardProps = {
  tool: Tool;
};

export function ToolCard({ tool }: ToolCardProps) {
  // 설명 텍스트: desc_en 우선, 없으면 why_pick
  const description = tool.desc_en || tool.why_pick || 'No description available.';

  return (
    <article className="group flex w-full flex-col rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 shadow-sm transition hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-lg md:p-5">
      {/* 상단: 이름 + 카테고리 배지 */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-white transition-colors group-hover:text-emerald-300 md:text-base">
          {tool.name}
        </h3>
        <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
          {tool.task_category}
        </span>
      </div>

      {/* 중간: 설명 - 2~3줄 제한 */}
      <p className="mt-2 line-clamp-2 flex-grow text-xs leading-relaxed text-slate-300 md:line-clamp-3 md:text-sm">
        {description}
      </p>

      {/* Best for 문구 (있는 경우만) */}
      {tool.best_for && (
        <p className="mt-2 text-[11px] font-medium text-emerald-300">
          Best for: {tool.best_for}
        </p>
      )}

      {/* 하단: 버튼들 - 모바일: 세로 스택 / md: 가로 배치 */}
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-800/60 pt-4 md:flex-row">
        {/* Visit 버튼 - primary */}
        <a
          href={tool.affiliate_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 flex-1 items-center justify-center rounded-full bg-emerald-500 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Visit
          <ExternalLinkIcon />
        </a>
        
        {/* Details 버튼 - secondary */}
        {/* TODO: /tools/[id] 페이지 구현 필요 */}
        <Link
          href={`/tools/${tool.id}`}
          className="flex h-10 flex-1 items-center justify-center rounded-full border border-slate-600 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-emerald-200"
        >
          Details
        </Link>
      </div>
    </article>
  );
}

// 외부 링크 아이콘
function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-1.5"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}
