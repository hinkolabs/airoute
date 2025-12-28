import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { FALLBACK_TOOLS } from "@/lib/tool-fallback-data";

/**
 * Seed Missing Tools API
 * Checks route_tools references and adds missing tools to the tools table
 */

export async function GET() {
  try {
    const supabase = supabaseServerClient;

    // 1. Get all tool_ids referenced in route_tools
    const { data: routeTools, error: routeToolsError } = await supabase
      .from("route_tools")
      .select("tool_id");

    if (routeToolsError) {
      return NextResponse.json({
        status: "error",
        message: "Failed to fetch route_tools",
        error: routeToolsError.message,
      }, { status: 500 });
    }

    const referencedToolIds = new Set(routeTools?.map(rt => rt.tool_id) || []);

    // 2. Get all existing tools from tools table
    const { data: existingTools, error: toolsError } = await supabase
      .from("tools")
      .select("id, slug, name");

    if (toolsError) {
      return NextResponse.json({
        status: "error",
        message: "Failed to fetch tools",
        error: toolsError.message,
      }, { status: 500 });
    }

    const existingToolIds = new Set(existingTools?.map(t => t.id) || []);

    // 3. Find missing tool IDs
    const missingToolIds = Array.from(referencedToolIds).filter(
      id => !existingToolIds.has(id)
    );

    if (missingToolIds.length === 0) {
      return NextResponse.json({
        status: "success",
        message: "All tools exist in database",
        referenced_count: referencedToolIds.size,
        existing_count: existingToolIds.size,
        missing_count: 0,
      });
    }

    // 4. Try to add missing tools from fallback data
    const results = {
      added: [] as string[],
      not_found: [] as string[],
      errors: [] as string[],
    };

    for (const toolId of missingToolIds) {
      // Check if we have fallback data for this tool
      const fallbackTool = FALLBACK_TOOLS[toolId];
      
      if (!fallbackTool) {
        results.not_found.push(toolId);
        continue;
      }

      // Insert tool from fallback data
      const { error: insertError } = await supabase
        .from("tools")
        .insert({
          id: toolId,
          slug: fallbackTool.slug || toolId,
          name: fallbackTool.name || toolId,
          description: fallbackTool.desc_en || fallbackTool.description,
          category_id: fallbackTool.category_id,
          tags: fallbackTool.tags,
          badge: fallbackTool.badge,
          website_url: fallbackTool.url,
          affiliate_url: fallbackTool.affiliate_url,
          is_active: true,
          task_category: fallbackTool.task_category,
          best_for: fallbackTool.best_for,
          desc_en: fallbackTool.desc_en,
          desc_simple_en: fallbackTool.desc_simple_en,
        });

      if (insertError) {
        results.errors.push(`${toolId}: ${insertError.message}`);
      } else {
        results.added.push(toolId);
      }
    }

    return NextResponse.json({
      status: results.errors.length > 0 ? "partial" : "success",
      message: `Added ${results.added.length} missing tools`,
      referenced_count: referencedToolIds.size,
      existing_count: existingToolIds.size,
      missing_count: missingToolIds.length,
      results,
    });

  } catch (error) {
    console.error("[seed-missing-tools] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}








