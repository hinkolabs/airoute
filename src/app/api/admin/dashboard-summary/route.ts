import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sb = createAdminSupabase();

    // --- Routes: count active routes, then KR translations only for active ones ---
    const { data: activeRoutes } = await sb
      .from("routes")
      .select("id")
      .eq("status", "active");

    const activeRouteIds = (activeRoutes ?? []).map((r) => r.id);
    const routesTotal = activeRouteIds.length;

    let routesKr = 0;
    if (activeRouteIds.length > 0) {
      const { count } = await sb
        .from("routes_i18n")
        .select("*", { count: "exact", head: true })
        .eq("locale", "kr")
        .in("route_id", activeRouteIds);
      routesKr = count ?? 0;
    }

    // --- Tools: count active tools, then KR translations only for active ones ---
    const { data: activeTools } = await sb
      .from("tools")
      .select("id")
      .eq("is_active", true);

    const activeToolIds = (activeTools ?? []).map((t) => t.id);
    const toolsTotal = activeToolIds.length;

    type ToolI18nRow = {
      tool_id: string;
      task_category: string | null;
      best_for: string | null;
      why_pick: string | null;
      detail_content: unknown;
    };

    let toolsI18nRows: ToolI18nRow[] = [];
    if (activeToolIds.length > 0) {
      const { data } = await sb
        .from("tools_i18n")
        .select("tool_id, name, task_category, best_for, why_pick, detail_content")
        .eq("locale", "kr")
        .in("tool_id", activeToolIds);
      toolsI18nRows = (data ?? []) as ToolI18nRow[];
    }

    let toolsKrDone = 0;
    for (const row of toolsI18nRows) {
      const hasExt = row.task_category || row.best_for || row.why_pick || row.detail_content;
      if (hasExt) toolsKrDone++;
    }
    const toolsKrNone = toolsTotal - toolsKrDone;

    // --- Guides ---
    const { data: guidesStatusRows } = await sb
      .from("guides")
      .select("status, lang");

    const all = guidesStatusRows ?? [];
    let guidesPublished = 0;
    let guidesDraft = 0;
    let guidesReview = 0;
    let guidesEn = 0;
    let guidesKr = 0;
    for (const g of all) {
      if (g.status === "approved" || g.status === "published") guidesPublished++;
      else if (g.status === "draft") guidesDraft++;
      else if (g.status === "review") guidesReview++;
      if (g.lang === "en") guidesEn++;
      else if (g.lang === "kr") guidesKr++;
    }

    return NextResponse.json({
      ok: true,
      routes: { total: routesTotal, kr: routesKr },
      tools: {
        total: toolsTotal,
        krDone: toolsKrDone,
        krNone: toolsKrNone,
      },
      guides: {
        total: all.length,
        published: guidesPublished,
        draft: guidesDraft,
        review: guidesReview,
        en: guidesEn,
        kr: guidesKr,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
