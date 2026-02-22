'use client';

import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/button';
import Chip from '@/components/ui/Chip';
import AffiliateLinkButton from '@/components/AffiliateLinkButton';
import { ToolLogo } from '@/components/tool-logo';

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
      {/* Header with logo & badge */}
      <div className="mb-3 flex items-start gap-3">
        <ToolLogo
          tool={{ name: tool.name, website_url: tool.link }}
          size={48}
        />
        <div className="flex flex-1 items-start justify-between">
          <h3 className="text-lg font-semibold text-slate-100">{tool.name}</h3>
          {tool.badge && (
            <Badge tone="primary" className="ml-2 flex-shrink-0">
              {tool.badge}
            </Badge>
          )}
        </div>
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
          <AffiliateLinkButton 
            href={tool.link}
            placement="tool_card"
            toolSlug={tool.id}
            variant="primary" 
            size="sm"
          >
            Visit
          </AffiliateLinkButton>
        )}
        <Button variant="secondary" size="sm">
          Details
        </Button>
      </div>
    </article>
  );
}






