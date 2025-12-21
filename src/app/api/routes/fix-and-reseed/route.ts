import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { FALLBACK_TOOLS } from "@/lib/tool-fallback-data";
import { ROUTES } from "@/lib/routes";

/**
 * Fix and Reseed Routes API
 * 1. Add missing tools from fallback data
 * 2. Clear and reseed route_tools with correct tool IDs
 */

export async function GET() {
  try {
    const supabase = supabaseServerClient;
    const results = {
      tools_added: 0,
      route_tools_deleted: 0,
      route_tools_added: 0,
      errors: [] as string[],
    };

    // ============================================================
    // Step 1: Add tools from fallback data
    // ============================================================
    const toolSlugs = ['opus-clip', 'filmora', 'chatgpt', 'prowritingaid', 'mubert', 'slidesai', 'fliki'];
    
    for (const slug of toolSlugs) {
      const fallback = FALLBACK_TOOLS[slug];
      if (!fallback) continue;

      const { error } = await supabase
        .from("tools")
        .insert({
          slug: fallback.slug || slug,
          name: fallback.name || slug,
          description: fallback.desc_en || fallback.description,
          category_id: fallback.category_id,
          tags: fallback.tags,
          badge: fallback.badge,
          website_url: fallback.url,
          affiliate_url: fallback.affiliate_url,
          is_active: true,
          task_category: fallback.task_category,
          best_for: fallback.best_for,
          desc_en: fallback.desc_en,
          desc_simple_en: fallback.desc_simple_en,
        })
        .select("id")
        .single();

      if (error) {
        if (error.code !== "23505") { // Not duplicate error
          results.errors.push(`Tool ${slug}: ${error.message}`);
        }
      } else {
        results.tools_added++;
      }
    }

    // ============================================================
    // Step 2: Get tool slug to ID mapping
    // ============================================================
    const { data: tools } = await supabase
      .from("tools")
      .select("id, slug");

    const toolMap = new Map(tools?.map(t => [t.slug, t.id]) || []);

    if (toolMap.size === 0) {
      return NextResponse.json({
        status: "error",
        message: "No tools found in database. Cannot proceed with route_tools seeding.",
        results,
      }, { status: 500 });
    }

    // ============================================================
    // Step 3: Clear existing route_tools
    // ============================================================
    const { error: deleteError } = await supabase
      .from("route_tools")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (deleteError) {
      results.errors.push(`Delete route_tools: ${deleteError.message}`);
    } else {
      results.route_tools_deleted = -1; // Success flag
    }

    // ============================================================
    // Step 4: Reseed route_tools for each route
    // ============================================================
    const { data: routes } = await supabase
      .from("routes")
      .select("id, slug");

    const routeMap = new Map(routes?.map(r => [r.slug, r.id]) || []);

    for (const route of ROUTES) {
      const routeId = routeMap.get(route.slug);
      if (!routeId) continue;

      for (let i = 0; i < route.steps.length; i++) {
        const step = route.steps[i];
        const toolId = toolMap.get(step.toolSlug);

        if (!toolId) {
          results.errors.push(`Tool ${step.toolSlug} not found for route ${route.slug}`);
          continue;
        }

        const { error } = await supabase
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

        if (error) {
          results.errors.push(`Step ${i + 1} for ${route.slug}: ${error.message}`);
        } else {
          results.route_tools_added++;
        }
      }
    }

    return NextResponse.json({
      status: results.errors.length > 0 ? "partial" : "success",
      message: "Fix and reseed completed",
      results,
    });

  } catch (error) {
    console.error("[fix-and-reseed] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}





