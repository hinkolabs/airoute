import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Routes DB Verification API
 * 
 * GET /api/routes/verify
 * 
 * Checks:
 * - routes table row count
 * - route_tools table row count
 * - Sample route with Best3 tools
 */

export async function GET() {
  try {
    const supabase = supabaseServerClient;

    // 1) Count routes
    const { count: routesCount, error: routesError } = await supabase
      .from("routes")
      .select("*", { count: "exact", head: true });

    if (routesError) {
      return NextResponse.json(
        {
          status: "error",
          message: "routes table not found or error",
          error: routesError.message,
        },
        { status: 500 }
      );
    }

    // 2) Count route_tools
    const { count: routeToolsCount, error: routeToolsError } = await supabase
      .from("route_tools")
      .select("*", { count: "exact", head: true });

    if (routeToolsError) {
      return NextResponse.json(
        {
          status: "error",
          message: "route_tools table not found or error",
          error: routeToolsError.message,
        },
        { status: 500 }
      );
    }

    // 3) Get all routes (basic info)
    const { data: routes, error: routesListError } = await supabase
      .from("routes")
      .select("slug, title, featured")
      .order("created_at", { ascending: false });

    // 4) Get a sample route with Best3 tools
    const sampleSlug = "turn-long-videos-into-shorts";
    const { data: sampleRoute, error: sampleError } = await supabase
      .from("routes")
      .select(`
        id,
        slug,
        title,
        description,
        icon,
        featured
      `)
      .eq("slug", sampleSlug)
      .single();

    let sampleBest3 = null;
    if (sampleRoute?.id) {
      const { data: best3Data } = await supabase
        .from("route_tools")
        .select(`
          position,
          is_best3,
          step_title,
          step_why,
          tool_id
        `)
        .eq("route_id", sampleRoute.id)
        .eq("is_best3", true)
        .order("position", { ascending: true })
        .limit(3);

      sampleBest3 = best3Data;
    }

    // 5) Summary
    const isSuccess = 
      routesCount !== null && 
      routesCount >= 10 && 
      routeToolsCount !== null && 
      routeToolsCount >= 30 &&
      sampleBest3 &&
      sampleBest3.length === 3;

    return NextResponse.json({
      status: isSuccess ? "success" : "partial",
      summary: {
        routes_count: routesCount,
        route_tools_count: routeToolsCount,
        expected_routes: "10",
        expected_route_tools: "30 (10 routes × 3 steps)",
      },
      routes_list: routes?.map(r => ({
        slug: r.slug,
        title: r.title,
        featured: r.featured,
      })),
      sample_route: {
        route: sampleRoute,
        best3_tools: sampleBest3,
        best3_count: sampleBest3?.length || 0,
      },
      verdict: isSuccess 
        ? "✅ Migration successful! All data inserted correctly."
        : "⚠️ Partial success. Check the data above.",
      next_step: isSuccess
        ? "You can now update /routes/[slug] page to fetch from DB instead of src/lib/routes.ts"
        : "Some routes may be missing. Check errors in seed results.",
    });

  } catch (error) {
    console.error("[routes/verify] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}





