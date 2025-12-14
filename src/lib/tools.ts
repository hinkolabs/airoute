import { supabaseServerClient } from "@/lib/supabase/server";

export type ToolRecord = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category_id: string | null;
  tags: string[] | null;
  badge: string | null;
  url: string | null;
  affiliate_url?: string | null;
  is_active: boolean | null;
  manual_rank?: number | null;
  rank_in_task?: number | null;
  desc_en?: string | null;
  desc_ko?: string | null;
  desc_simple_en?: string | null;
  desc_senior?: string | null;
  task_category?: string | null;
  best_for?: string | null;
  why_pick?: string | null;
  related_gear?: string | null;
};

export async function getActiveTools(): Promise<ToolRecord[]> {
  const supabase = supabaseServerClient;

  const { data, error } = await supabase
    .from("tools")
    .select(
      `
      id,
      name,
      slug,
      description,
      category_id,
      tags,
      badge,
      url,
      is_active,
      manual_rank,
      rank_in_task
    `
    )
    .eq("is_active", true)
    .order("manual_rank", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("[getActiveTools] Supabase error:", error);
    return [];
  }

  return data ?? [];
}

export async function getToolBySlug(slug: string): Promise<ToolRecord | null> {
  const supabase = supabaseServerClient;

  // Convert slug to name (e.g., "midjourney" -> "Midjourney")
  const toolName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const { data, error } = await supabase
    .from("tools")
    .select(
      `
      id,
      name,
      slug,
      description,
      category_id,
      tags,
      badge,
      url,
      affiliate_url,
      is_active,
      manual_rank,
      rank_in_task,
      desc_en,
      desc_ko,
      desc_simple_en,
      desc_senior,
      task_category,
      best_for,
      why_pick,
      related_gear
    `
    )
    .eq("name", toolName)
    .maybeSingle();

  if (error) {
    console.error("[getToolBySlug] Supabase error:", error);
    return null;
  }

  return data ?? null;
}



