'use client';

import { cn } from '@/lib/utils';
import Chip from '@/components/ui/Chip';

export type CategoryId = 'all' | 'image' | 'video' | 'writing' | 'code' | 'voice';

interface ToolFilterChipsProps {
  activeCategory?: CategoryId;
  onCategoryChange?: (category: CategoryId) => void;
  className?: string;
}

const TOP_CHIPS = [
  { id: 'korean', label: '🇰🇷 Best for Korean users' },
  { id: 'curated', label: '✨ Curated picks' },
  { id: 'nobs', label: '🚫 No BS affiliate links' },
];

const CATEGORY_CHIPS: { id: CategoryId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Image & Design' },
  { id: 'video', label: 'Video' },
  { id: 'writing', label: 'Writing & Docs' },
  { id: 'code', label: 'Code & Dev' },
  { id: 'voice', label: 'Voice & Music' },
];

/**
 * ToolFilterChips - Renders feature chips and category filter chips.
 */
export default function ToolFilterChips({
  activeCategory = 'all',
  onCategoryChange,
  className,
}: ToolFilterChipsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Top feature chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {TOP_CHIPS.map((chip) => (
          <Chip key={chip.id}>{chip.label}</Chip>
        ))}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {CATEGORY_CHIPS.map((chip) => (
          <Chip
            key={chip.id}
            active={activeCategory === chip.id}
            onClick={() => onCategoryChange?.(chip.id)}
          >
            {chip.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}





