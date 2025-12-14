import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/Chip';

export interface Tool {
  id: string;
  name: string;
  descShort: string;
  bestFor?: string;
  categoryLabel?: string;
  badge?: string;
  link?: string;
}

interface ToolCardProps {
  tool: Tool;
  variant?: 'list' | 'detail';
  className?: string;
}

/**
 * ToolCard - Displays a tool with badge, name, category, description,
 * "Best for" line, and action buttons.
 */
export default function ToolCard({
  tool,
  variant = 'list',
  className,
}: ToolCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5',
        'shadow-lg shadow-slate-950/50',
        'transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90',
        className
      )}
    >
      {/* Header with badge */}
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-slate-100">{tool.name}</h3>
        {tool.badge && (
          <Badge tone="emerald" className="ml-2 flex-shrink-0">
            {tool.badge}
          </Badge>
        )}
      </div>

      {/* Category chip */}
      {tool.categoryLabel && (
        <div className="mb-3">
          <Chip>{tool.categoryLabel}</Chip>
        </div>
      )}

      {/* Description */}
      <p className="mb-3 flex-1 text-sm leading-relaxed text-slate-400">
        {tool.descShort}
      </p>

      {/* Best for */}
      {tool.bestFor && (
        <p className="mb-4 text-sm text-slate-500">
          <span className="font-medium text-slate-400">Best for:</span>{' '}
          {tool.bestFor}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {tool.link && (
          <Button variant="primary" size="sm" href={tool.link}>
            Visit
          </Button>
        )}
        <Button variant="secondary" size="sm">
          Details
        </Button>
      </div>
    </article>
  );
}






