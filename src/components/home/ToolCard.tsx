// 개별 도구 카드 컴포넌트
// 도구 정보 표시 및 Visit/Details 버튼 포함
// w-full로 grid cell에 맞게 꽉 차도록 설정
'use client';

import Link from 'next/link';
import { Tool } from '@/types/tool';
import AffiliateLinkButton from '@/components/AffiliateLinkButton';
import { ToolLogo } from '@/components/tool-logo';

type ToolCardProps = {
  tool: Tool;
};

export function ToolCard({ tool }: ToolCardProps) {
  // 설명 텍스트: desc_en 우선, 없으면 why_pick
  const description = tool.desc_en || tool.why_pick || 'No description available.';
  const visitUrl = (tool as any).affiliate_url ?? (tool as any).website_url ?? (tool as any).url;

  return (
    <AffiliateLinkButton
      href={visitUrl}
      placement="tool_card"
      toolSlug={tool.id}
      className="group flex w-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg md:p-5"
    >
      {/* 상단: 로고 + 이름 + 카테고리 배지 */}
      <div className="mb-3 flex items-start gap-3">
        <ToolLogo
          tool={tool}
          size={40}
        />
        <div className="flex flex-1 items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground transition-colors group-hover:text-primary md:text-base">
            {tool.name}
          </h3>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground border border-border">
            {tool.task_category}
          </span>
        </div>
      </div>

      {/* 중간: 설명 - 2~3줄 제한 */}
      <p className="mt-2 line-clamp-2 flex-grow text-xs leading-relaxed text-muted-foreground md:line-clamp-3 md:text-sm">
        {description}
      </p>

      {/* Best for 문구 (있는 경우만) */}
      {tool.best_for && (
        <p className="mt-2 text-[11px] font-medium text-primary">
          Best for: {tool.best_for}
        </p>
      )}

      {/* 하단: Visit 버튼 */}
      <div className="mt-4 flex border-t border-border pt-4">
        <div className="flex h-10 w-full items-center justify-center rounded-full bg-primary text-center text-sm font-semibold text-primary-foreground transition group-hover:opacity-90">
          Visit Tool
          <ExternalLinkIcon />
        </div>
      </div>
    </AffiliateLinkButton>
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
