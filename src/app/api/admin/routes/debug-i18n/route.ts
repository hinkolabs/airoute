import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

/**
 * Debug: Check specific route i18n data
 * GET /api/admin/routes/debug-i18n?slug=turn-long-videos-into-shorts
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ ok: false, error: "slug parameter required" }, { status: 400 });
    }

    const supabase = createAdminSupabase();

    // Get route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("id, slug, title")
      .eq("slug", slug)
      .single();

    if (routeError || !route) {
      return NextResponse.json({ ok: false, error: "Route not found" }, { status: 404 });
    }

    // Get route i18n
    const { data: routeI18n } = await supabase
      .from("routes_i18n")
      .select("*")
      .eq("route_id", route.id)
      .eq("locale", "kr");

    // Get route_tools
    const { data: routeTools } = await supabase
      .from("route_tools")
      .select("id, position, step_title")
      .eq("route_id", route.id)
      .order("position");

    // Get route_tools i18n
    const toolIds = routeTools?.map((t) => t.id) || [];
    const { data: toolsI18n } = await supabase
      .from("route_tools_i18n")
      .select("*")
      .in("route_tool_id", toolIds)
      .eq("locale", "kr");

    return NextResponse.json({
      ok: true,
      route: {
        id: route.id,
        slug: route.slug,
        title_en: route.title,
      },
      route_i18n_kr: routeI18n || null,
      route_tools: routeTools || [],
      route_tools_i18n_kr: toolsI18n || [],
      summary: {
        hasRouteKR: (routeI18n?.length || 0) > 0,
        totalSteps: routeTools?.length || 0,
        stepsWithKR: toolsI18n?.length || 0,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
