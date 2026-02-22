'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  leadingIcon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Chip - Small rounded-full button style element.
 * active=true gives emerald accent; otherwise slate border/background.
 */
export default function Chip({
  children,
  active = false,
  leadingIcon,
  onClick,
  className,
}: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium',
        'transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'border-primary bg-primary/20 text-primary'
          : 'border-border bg-secondary/50 text-muted-foreground hover:border-muted-foreground hover:bg-secondary',
        className
      )}
    >
      {leadingIcon && <span className="flex-shrink-0">{leadingIcon}</span>}
      {children}
    </button>
  );
}














