import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";

/**
 * Routes DB Migration API
 * 
 * GET /api/routes/migrate?action=check
 * GET /api/routes/migrate?action=create
 * GET /api/routes/migrate?action=seed
 * GET /api/routes/migrate?action=all
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "check";

  try {
    const supabase = supabaseServerClient;

    // ============================================================
    // Action: check (DB 상태 확인)
    // ============================================================
    if (action === "check") {
      // 1) routes 테이블 존재 여부
      const { data: routesTable, error: routesError } = await supabase
        .from("routes")
        .select("id")
        .limit(1);

      // 2) route_tools 테이블 존재 여부
      const { data: routeToolsTable, error: routeToolsError } = await supabase
        .from("route_tools")
        .select("id")
        .limit(1);

      // 3) tools.id 샘플 조회 (타입 확인용)
      const { data: toolSample } = await supabase
        .from("tools")
        .select("id, name")
        .limit(1)
        .single();

      return NextResponse.json({
        status: "check_complete",
        tables: {
          routes: {
            exists: !routesError || routesError.code !== "42P01", // 42P01 = undefined_table
            error: routesError?.message,
          },
          route_tools: {
            exists: !routeToolsError || routeToolsError.code !== "42P01",
            error: routeToolsError?.message,
          },
        },
        tools: {
          sample_id: toolSample?.id,
          sample_id_type: typeof toolSample?.id,
          sample_name: toolSample?.name,
        },
        next_step:
          !routesError && !routeToolsError
            ? "Tables already exist. Use ?action=seed to populate data."
            : "Tables missing. Use ?action=create to create them.",
      });
    }

    // ============================================================
    // Action: create (테이블 생성)
    // ============================================================
    if (action === "create") {
      // Supabase SQL execution via RPC or direct DDL
      // Note: DDL commands require special permissions or SQL Editor
      
      const createRoutesSQL = `
        CREATE TABLE IF NOT EXISTS public.routes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          featured BOOLEAN NOT NULL DEFAULT false,
          tags TEXT[],
          guide_bullets TEXT[],
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `;

      const createRouteToolsSQL = `
        CREATE TABLE IF NOT EXISTS public.route_tools (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
          tool_id TEXT NOT NULL,
          position INT NOT NULL DEFAULT 999,
          is_best3 BOOLEAN NOT NULL DEFAULT false,
          step_title TEXT,
          step_why TEXT,
          step_cta_label TEXT,
          step_prompt_example TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE(route_id, tool_id)
        );
      `;

      const createIndexesSQL = `
        CREATE INDEX IF NOT EXISTS idx_routes_slug ON public.routes(slug);
        CREATE INDEX IF NOT EXISTS idx_routes_featured ON public.routes(featured);
        CREATE INDEX IF NOT EXISTS idx_route_tools_route ON public.route_tools(route_id);
        CREATE INDEX IF NOT EXISTS idx_route_tools_best3 ON public.route_tools(route_id, is_best3, position);
        CREATE INDEX IF NOT EXISTS idx_route_tools_tool ON public.route_tools(tool_id);
      `;

      // Execute DDL (this requires admin/service_role key)
      // For now, return SQL for manual execution
      return NextResponse.json({
        status: "create_sql_generated",
        message: "Run these SQL commands in Supabase SQL Editor:",
        sql: {
          routes: createRoutesSQL,
          route_tools: createRouteToolsSQL,
          indexes: createIndexesSQL,
        },
        note: "API cannot execute DDL directly. Use SQL Editor or update to service_role key.",
      });
    }

    // ============================================================
    // Action: seed (데이터 삽입)
    // ============================================================
    if (action === "seed") {
      const results = {
        routes_inserted: 0,
        route_tools_inserted: 0,
        errors: [] as string[],
        details: [] as any[],
      };

      // 먼저 tools 테이블에서 slug로 id 매핑 가져오기
      const { data: tools, error: toolsError } = await supabase
        .from("tools")
        .select("id, slug, name");

      if (toolsError) {
        return NextResponse.json({
          status: "error",
          message: "Failed to load tools table",
          error: toolsError.message,
        }, { status: 500 });
      }

      const toolMap = new Map(tools?.map((t) => [t.slug, t.id]) || []);
      
      // Log available tools
      console.log("[seed] Available tools:", Array.from(toolMap.keys()));

      for (const route of ROUTES) {
        const routeDetail: any = {
          slug: route.slug,
          title: route.title,
        };

        // 1) Insert route
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
            // Unique violation - already exists, try to get ID
            const { data: existing } = await supabase
              .from("routes")
              .select("id")
              .eq("slug", route.slug)
              .single();

            if (existing?.id) {
              routeDetail.status = "exists";
              routeDetail.route_id = existing.id;
              // Use existing route for steps
            } else {
              routeDetail.status = "error";
              routeDetail.error = "Already exists but cannot fetch ID";
              results.errors.push(`Route "${route.slug}" already exists but cannot fetch ID`);
              results.details.push(routeDetail);
              continue;
            }
          } else {
            routeDetail.status = "error";
            routeDetail.error = routeError.message;
            results.errors.push(
              `Failed to insert route "${route.slug}": ${routeError.message}`
            );
            results.details.push(routeDetail);
            continue;
          }
        } else {
          routeDetail.status = "inserted";
          routeDetail.route_id = insertedRoute.id;
          results.routes_inserted++;
        }

        // 2) Insert route_tools for each step
        const routeId = routeDetail.route_id || insertedRoute?.id;
        routeDetail.steps = [];

        if (routeId && route.steps) {
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
              stepDetail.error = `Tool slug "${step.toolSlug}" not found`;
              results.errors.push(
                `Tool slug "${step.toolSlug}" not found in tools table (route: ${route.slug})`
              );
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
                is_best3: i < 3, // First 3 steps are Best3
                step_title: step.title,
                step_why: step.why,
                step_cta_label: step.ctaLabel,
                step_prompt_example: step.promptExample,
              });

            if (stepError) {
              if (stepError.code === "23505") {
                stepDetail.status = "duplicate";
              } else {
                stepDetail.status = "error";
                stepDetail.error = stepError.message;
                results.errors.push(
                  `Failed to insert step "${step.title}" for route "${route.slug}": ${stepError.message}`
                );
              }
            } else {
              stepDetail.status = "inserted";
              results.route_tools_inserted++;
            }

            routeDetail.steps.push(stepDetail);
          }
        }

        results.details.push(routeDetail);
      }

      return NextResponse.json({
        status: "seed_complete",
        results,
      });
    }

    // ============================================================
    // Action: all (check → create → seed 순차 실행)
    // ============================================================
    if (action === "all") {
      return NextResponse.json({
        status: "error",
        message:
          "Use individual actions: ?action=check, ?action=create, ?action=seed",
      });
    }

    return NextResponse.json({
      status: "error",
      message: "Invalid action. Use: check, create, seed, or all",
    });
  } catch (error) {
    console.error("[routes/migrate] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

