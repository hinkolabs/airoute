'use client';

import { useState, FormEvent } from 'react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button';

interface ToolSearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * ToolSearchBar - Search input with rounded-full style and primary button.
 * Calls onSearch when the form is submitted.
 */
export default function ToolSearchBar({
  onSearch,
  placeholder = 'e.g. "remove background", "logo", "resume"',
  className,
}: ToolSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex w-full gap-2', className)}
    >
      <div className="relative flex-1">
        {/* Search Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg
            className="h-5 w-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-full border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4',
            'text-slate-100 placeholder:text-slate-500',
            'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            'transition-colors duration-200'
          )}
        />
      </div>
      <Button type="submit" variant="primary" size="lg">
        Search
      </Button>
    </form>
  );
}






