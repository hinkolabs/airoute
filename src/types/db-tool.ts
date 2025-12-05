export interface DbTool {
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
  created_at: string;
}

