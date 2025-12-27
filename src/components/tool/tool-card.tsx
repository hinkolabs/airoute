'use client';

import { DbTool } from '@/types/db-tool';
import Button from '@/components/ui/button';
import AffiliateLinkButton from '@/components/AffiliateLinkButton';
import { ToolLogo } from '@/components/tool-logo';

interface ToolCardProps {
  tool: DbTool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const description = tool.desc_simple_en || tool.desc_ko || tool.desc_en || 'AI 도구';
  const visitUrl = (tool as any).affiliate_url ?? (tool as any).website_url ?? (tool as any).url;

  return (
    <AffiliateLinkButton
      href={visitUrl}
      placement="tool_card"
      toolSlug={tool.id}
      className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-300 hover:border-emerald-500/50 hover:bg-zinc-900"
    >
      <div className="mb-3 flex items-start gap-3">
        <ToolLogo
          tool={tool}
          size={48}
        />
        <div className="flex flex-1 items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
            {tool.name}
          </h3>
          {tool.best_for && (
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              {tool.best_for}
            </span>
          )}
        </div>
      </div>

      <p className="mb-4 line-clamp-2 flex-grow text-sm leading-relaxed text-zinc-400">
        {description}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
          {tool.task_category}
        </span>
        {tool.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded bg-zinc-800/60 px-2 py-1 text-xs text-zinc-500"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex h-10 w-full items-center justify-center rounded-lg bg-emerald-500 text-sm font-semibold text-slate-950 transition group-hover:bg-emerald-400">
        Visit Tool →
      </div>
    </AffiliateLinkButton>
  );
}








