import { cn } from '@/lib/utils';
import ToolCard, { Tool } from './ToolCard';

interface ToolGridProps {
  tools: Tool[];
  className?: string;
}

/**
 * ToolGrid - Renders tools in a responsive grid.
 * 3 columns on desktop, 2 on tablet, 1 on mobile.
 */
export default function ToolGrid({ tools, className }: ToolGridProps) {
  if (tools.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        No tools found.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}











