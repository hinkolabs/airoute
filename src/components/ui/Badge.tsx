import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'primary' | 'muted' | 'success';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneStyles: Record<BadgeTone, string> = {
  primary:
    'border-primary/30 bg-primary/10 text-primary',
  muted:
    'border-border bg-muted text-muted-foreground',
  success:
    'border-green-500/30 bg-green-500/10 text-green-600',
};

/**
 * Badge - Rounded-full pill with border and small text.
 */
export default function Badge({
  children,
  tone = 'primary',
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        toneStyles[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}














