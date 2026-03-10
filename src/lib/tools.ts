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
  detail_content?: Record<string, unknown> | null;
  image?: string | null;
  websiteUrl?: string | null;
  website_url?: string | null;
};

const I18N_EXTENDED = "name, description, task_category, best_for, why_pick, detail_content";
const I18N_BASIC = "name, description";

function buildToolsSelect(base: string, i18nCols: string) {
  return `${base}, tools_i18n(${i18nCols})`;
}

function mergeI18n(tool: any): ToolRecord {
  const i18n = tool.tools_i18n?.[0];
  return {
    ...tool,
    name: i18n?.name ?? tool.name ?? "",
    description: i18n?.description ?? tool.desc_en ?? "",
    task_category: i18n?.task_category ?? tool.task_category,
    best_for: i18n?.best_for ?? tool.best_for,
    why_pick: i18n?.why_pick ?? tool.why_pick,
    detail_content: i18n?.detail_content ?? tool.detail_content,
  } as ToolRecord;
}

const LIST_BASE = `
  id, slug, category_id, tags, badge, url, affiliate_url,
  is_active, manual_rank, rank_in_task, desc_en, desc_ko,
  desc_simple_en, task_category, best_for, image, website_url
`;

const DETAIL_BASE = `
  id, slug, category_id, tags, badge, url, affiliate_url,
  is_active, manual_rank, rank_in_task, desc_en, desc_ko,
  desc_simple_en, desc_senior, task_category, best_for, why_pick,
  related_gear, image, website_url, detail_content
`;

export async function getActiveTools(locale: "en" | "kr" = "en"): Promise<ToolRecord[]> {
  const supabase = supabaseServerClient;

  // Try extended i18n columns first, fallback to basic if columns don't exist yet
  let { data, error } = await supabase
    .from("tools")
    .select(buildToolsSelect(LIST_BASE, I18N_EXTENDED))
    .eq("is_active", true)
    .eq("tools_i18n.locale", locale)
    .order("manual_rank", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    ({ data, error } = await supabase
      .from("tools")
      .select(buildToolsSelect(LIST_BASE, I18N_BASIC))
      .eq("is_active", true)
      .eq("tools_i18n.locale", locale)
      .order("manual_rank", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true }));

    if (error) {
      console.error("[getActiveTools] Supabase error:", error);
      return [];
    }
  }

  return (data ?? []).map(mergeI18n);
}

export async function getToolBySlug(slug: string, locale: "en" | "kr" = "en"): Promise<ToolRecord | null> {
  const supabase = supabaseServerClient;

  let { data, error } = await supabase
    .from("tools")
    .select(buildToolsSelect(DETAIL_BASE, I18N_EXTENDED))
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("tools_i18n.locale", locale)
    .maybeSingle();

  if (error) {
    ({ data, error } = await supabase
      .from("tools")
      .select(buildToolsSelect(DETAIL_BASE, I18N_BASIC))
      .eq("slug", slug)
      .eq("is_active", true)
      .eq("tools_i18n.locale", locale)
      .maybeSingle());

    if (error) {
      console.error("[getToolBySlug] Supabase error:", error);
      return null;
    }
  }

  if (!data) {
    console.log(`[getToolBySlug] Tool not found in DB: ${slug}`);
    return null;
  }

  return mergeI18n(data);
}

export async function getPublicStats(): Promise<{
  toolsCount: string;
  routesCount: string;
  guidesCount: string;
}> {
  const supabase = supabaseServerClient;

  const [tools, routes, guides] = await Promise.all([
    supabase.from("tools").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("routes").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("guides").select("id", { count: "exact", head: true }).in("status", ["approved", "published"]),
  ]);

  const format = (n: number) => {
    if (n < 10) return `${n}`;
    const floored = Math.floor(n / 10) * 10;
    return `${floored}+`;
  };

  return {
    toolsCount: format(tools.count ?? 0),
    routesCount: format(routes.count ?? 0),
    guidesCount: format(guides.count ?? 0),
  };
}
