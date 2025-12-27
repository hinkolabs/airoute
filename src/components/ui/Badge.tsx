import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'emerald' | 'slate';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  emerald:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  slate:
    'border-slate-600 bg-slate-800/50 text-slate-300',
};

/**
 * Badge - Rounded-full pill with border and small text.
 */
export default function Badge({
  children,
  tone = 'emerald',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}











