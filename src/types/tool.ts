// Supabase tools 테이블 스키마 기반 타입 정의
export type Tool = {
  id: string;
  name: string;
  affiliate_url: string;
  desc_en: string | null;
  desc_ko: string | null;
  desc_simple_en: string | null;
  desc_senior: string | null;
  manual_rank: number;
  task_category: string;
  best_for: string | null;
  rank_in_task: number;
  why_pick: string | null;
  tags: string[] | null;
  related_gear: string | null;
};

// 카테고리 필터용 상수
export const TASK_CATEGORIES = [
  'All',
  'Image & Design',
  'Video',
  'Writing & Docs',
  'Code & Dev',
  'Voice & Music',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];







