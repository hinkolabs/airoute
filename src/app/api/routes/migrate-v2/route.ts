import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";

/**
 * Routes DB Migration API V2
 * Enhanced with better error handling and tool slug checking
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "check";

  try {
    const supabase = supabaseServerClient;

    // ============================================================
    // Action: check-tools (tools 테이블에 필요한 slug 확인)
    // ============================================================
    if (action === "check-tools") {
      // ROUTES에서 사용하는 모든 toolSlug 수집
      const allToolSlugs = new Set<string>();
      ROUTES.forEach(route => {
        route.steps.forEach(step => {
          allToolSlugs.add(step.toolSlug);
        });
      });

      // tools 테이블에서 해당 slug들이 있는지 확인
      const { data: tools, error: toolsError } = await supabase
        .from("tools")
        .select("id, slug, name")
        .in("slug", Array.from(allToolSlugs));

      if (toolsError) {
        return NextResponse.json({
          status: "error",
          message: "Failed to query tools table",
          error: toolsError.message,
        }, { status: 500 });
      }

      const foundSlugs = new Set(tools?.map(t => t.slug) || []);
      const missingSlugs = Array.from(allToolSlugs).filter(slug => !foundSlugs.has(slug));

      return NextResponse.json({
        status: missingSlugs.length === 0 ? "ready" : "missing_tools",
        required_tools: Array.from(allToolSlugs),
        found_tools: tools?.map(t => ({ id: t.id, slug: t.slug, name: t.name })),
        missing_tools: missingSlugs,
        verdict: missingSlugs.length === 0 
          ? "✅ All required tools exist in DB. Ready to seed."
          : `⚠️ Missing ${missingSlugs.length} tools. Add them first or seed will fail for those routes.`,
      });
    }

    // ============================================================
    // Action: seed-force (강제로 데이터 삽입 - 상세 로그)
    // ============================================================
    if (action === "seed-force") {
      const results = {
        routes_inserted: 0,
        route_tools_inserted: 0,
        skipped: [] as string[],
        errors: [] as string[],
        details: [] as any[],
      };

      // 1) tools 테이블에서 slug → id 매핑
      const { data: tools, error: toolsError } = await supabase
        .from("tools")
        .select("id, slug, name");

      if (toolsError) {
        return NextResponse.json({
          status: "error",
          message: "Failed to load tools",
          error: toolsError.message,
        }, { status: 500 });
      }

      const toolMap = new Map(tools?.map((t) => [t.slug, t.id]) || []);
      console.log("[seed] Tool map loaded:", toolMap.size, "tools");

      // 2) 각 route 삽입
      for (const route of ROUTES) {
        const routeDetail: any = {
          slug: route.slug,
          title: route.title,
          status: "pending",
        };

        try {
          // 2-1) Insert route
          const { data: insertedRoute, error: routeError } = await supabase
            .from("routes")
            .insert({
              slug: route.slug,
              title: route.title,
              description: route.description,
              icon: route.icon,
              featured: route.featured || false,
              tags: route.tags || [],
              guide_bullets: route.guide?.bullets || [],
            })
            .select("id")
            .single();

          if (routeError) {
            if (routeError.code === "23505") {
              // Duplicate - try to fetch existing
              const { data: existing } = await supabase
                .from("routes")
                .select("id")
                .eq("slug", route.slug)
                .single();

              if (existing) {
                routeDetail.status = "exists";
                routeDetail.route_id = existing.id;
                results.skipped.push(`Route "${route.slug}" already exists`);
              } else {
                routeDetail.status = "error";
                routeDetail.error = routeError.message;
                results.errors.push(`Failed to insert/fetch route "${route.slug}": ${routeError.message}`);
                results.details.push(routeDetail);
                continue;
              }
            } else {
              routeDetail.status = "error";
              routeDetail.error = routeError.message;
              results.errors.push(`Failed to insert route "${route.slug}": ${routeError.message}`);
              results.details.push(routeDetail);
              continue;
            }
          } else {
            routeDetail.status = "inserted";
            routeDetail.route_id = insertedRoute.id;
            results.routes_inserted++;
          }

          // 2-2) Insert route_tools for each step
          const routeId = routeDetail.route_id;
          routeDetail.steps = [];

          for (let i = 0; i < route.steps.length; i++) {
            const step = route.steps[i];
            const toolId = toolMap.get(step.toolSlug);

            const stepDetail: any = {
              position: i + 1,
              toolSlug: step.toolSlug,
              title: step.title,
            };

            if (!toolId) {
              stepDetail.status = "missing_tool";
              stepDetail.error = `Tool slug "${step.toolSlug}" not found in tools table`;
              results.errors.push(stepDetail.error);
              routeDetail.steps.push(stepDetail);
              continue;
            }

            stepDetail.toolId = toolId;

            const { error: stepError } = await supabase
              .from("route_tools")
              .insert({
                route_id: routeId,
                tool_id: toolId,
                position: i + 1,
                is_best3: i < 3,
                step_title: step.title,
                step_why: step.why,
                step_cta_label: step.ctaLabel,
                step_prompt_example: step.promptExample,
              });

            if (stepError) {
              if (stepError.code === "23505") {
                stepDetail.status = "duplicate";
                results.skipped.push(`Step already exists: ${route.slug} > ${step.title}`);
              } else {
                stepDetail.status = "error";
                stepDetail.error = stepError.message;
                results.errors.push(`Failed to insert step "${step.title}" for route "${route.slug}": ${stepError.message}`);
              }
            } else {
              stepDetail.status = "inserted";
              results.route_tools_inserted++;
            }

            routeDetail.steps.push(stepDetail);
          }
        } catch (err) {
          routeDetail.status = "exception";
          routeDetail.error = err instanceof Error ? err.message : "Unknown error";
          results.errors.push(`Exception for route "${route.slug}": ${routeDetail.error}`);
        }

        results.details.push(routeDetail);
      }

      return NextResponse.json({
        status: "seed_complete",
        summary: {
          routes_inserted: results.routes_inserted,
          route_tools_inserted: results.route_tools_inserted,
          skipped_count: results.skipped.length,
          error_count: results.errors.length,
        },
        results,
      });
    }

    return NextResponse.json({
      status: "error",
      message: "Invalid action. Use: check-tools or seed-force",
    });

  } catch (error) {
    console.error("[routes/migrate-v2] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}








