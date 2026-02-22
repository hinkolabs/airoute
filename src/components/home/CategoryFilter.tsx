// 태스크 카테고리 필터 영역
// 가로 스크롤 가능한 칩 리스트
'use client';

import { Dispatch, SetStateAction } from 'react';
import { TASK_CATEGORIES, TaskCategory } from '@/types/tool';

type CategoryFilterProps = {
  selectedCategory: TaskCategory;
  setSelectedCategory: Dispatch<SetStateAction<TaskCategory>>;
};

export function CategoryFilter({
  selectedCategory,
  setSelectedCategory,
}: CategoryFilterProps) {
  return (
    <section className="mt-6">
      {/* 가로 스크롤 가능한 필터 바 */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        <span className="shrink-0 text-xs text-slate-500">Filter:</span>
        
        {TASK_CATEGORIES.map((category) => (
          <CategoryChip
            key={category}
            category={category}
            isActive={selectedCategory === category}
            onClick={() => setSelectedCategory(category)}
          />
        ))}
      </div>
    </section>
  );
}

// 카테고리 칩 컴포넌트
function CategoryChip({
  category,
  isActive,
  onClick,
}: {
  category: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 shrink-0 cursor-pointer rounded-full border px-3 text-xs transition md:text-sm ${
        isActive
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-border bg-secondary/60 text-muted-foreground hover:border-primary/60 hover:text-foreground'
      }`}
    >
      {category}
    </button>
  );
}
