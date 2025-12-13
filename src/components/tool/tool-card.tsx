import { DbTool } from '@/types/db-tool';
import Button from '@/components/ui/button';

interface ToolCardProps {
  tool: DbTool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const description = tool.desc_simple_en || tool.desc_ko || tool.desc_en || 'AI 도구';

  return (
    <article className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all duration-300 hover:border-emerald-500/50 hover:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
          {tool.name}
        </h3>
        {tool.best_for && (
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            {tool.best_for}
          </span>
        )}
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

      <Button href={tool.affiliate_url} size="sm" className="w-full">
        바로가기
      </Button>
    </article>
  );
}








