import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

/**
 * Check routes_i18n data
 * GET /api/admin/routes/check-i18n
 */
export async function GET() {
  try {
    const supabase = createAdminSupabase();

    // Count KR translations
    const { data: krData, error: krError } = await supabase
      .from("routes_i18n")
      .select("id, route_id, title")
      .eq("locale", "kr");

    if (krError) {
      return NextResponse.json({ ok: false, error: krError.message }, { status: 500 });
    }

    // Count EN translations
    const { data: enData, error: enError } = await supabase
      .from("routes_i18n")
      .select("id, route_id, title")
      .eq("locale", "en");

    if (enError) {
      return NextResponse.json({ ok: false, error: enError.message }, { status: 500 });
    }

    // Count total routes
    const { data: routesData, error: routesError } = await supabase
      .from("routes")
      .select("id, slug, title")
      .eq("status", "active");

    if (routesError) {
      return NextResponse.json({ ok: false, error: routesError.message }, { status: 500 });
    }

    // Count route_tools_i18n KR
    const { data: stepKrData, error: stepKrError } = await supabase
      .from("route_tools_i18n")
      .select("id, route_tool_id")
      .eq("locale", "kr");

    if (stepKrError) {
      return NextResponse.json({ ok: false, error: stepKrError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      summary: {
        totalRoutes: routesData?.length || 0,
        routesWithKR: krData?.length || 0,
        routesWithEN: enData?.length || 0,
        stepsWithKR: stepKrData?.length || 0,
      },
      krTranslations: krData?.slice(0, 5).map((r: any) => ({
        title: r.title,
      })),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
