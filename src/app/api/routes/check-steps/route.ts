import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServerClient;

  const { data: routesWithSteps } = await supabase
    .from('routes')
    .select(`
      slug,
      title,
      route_tools (
        id,
        position,
        is_best3,
        step_title,
        tool_id
      )
    `)
    .order('slug');

  const summary = routesWithSteps?.map(r => ({
    slug: r.slug,
    title: r.title,
    steps_count: r.route_tools?.length || 0,
    missing: 3 - (r.route_tools?.length || 0),
    steps: r.route_tools?.map((rt: any) => ({
      position: rt.position,
      title: rt.step_title,
      tool_id: rt.tool_id,
    })),
  }));

  const incomplete = summary?.filter(r => r.steps_count < 3) || [];

  return NextResponse.json({
    total_routes: routesWithSteps?.length,
    total_steps: routesWithSteps?.reduce((sum, r) => sum + (r.route_tools?.length || 0), 0),
    incomplete_routes: incomplete,
    all_routes: summary,
  });
}









