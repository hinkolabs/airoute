/**
 * Routes DB queries
 * Replaces hardcoded src/lib/routes.ts with Supabase data
 */

import { supabaseServerClient } from "@/lib/supabase/server";

// ============================================================
// Types (matching DB schema)
// ============================================================

export type DbRoute = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  tags: string[] | null;
  guide_bullets: string[] | null;
  manual_order: number | null;
  created_at: string;
  updated_at: string | null;
};

export type DbRouteTool = {
  id: string;
  route_id: string;
  tool_id: string | null;
  position: number;
  is_best3: boolean;
  step_title: string | null;
  step_why: string | null;
  step_cta_label: string | null;
  step_prompt_example: string | null;
  step_input_type: "settings" | "action" | "prompt" | null;
  created_at: string;
};

export type DbRouteWithTools = DbRoute & {
  tools: Array<
    DbRouteTool & {
      tool: {
        id: string;
        name: string;
        slug: string | null;
        website_url: string | null;
        image: string | null;
        affiliate_url: string | null;
      };
    }
  >;
};

// ============================================================
// Query functions
// ============================================================

/**
 * Get route by slug with all metadata
 */
export async function getRouteBySlug(
  slug: string
): Promise<DbRoute | null> {
  const supabase = supabaseServerClient;

  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error) {
    console.error("[getRouteBySlug] Error:", error);
    return null;
  }

  return data;
}

/**
 * Get route Best3 tools (position 1, 2, 3 with is_best3 = true)
 */
export async function getRouteBest3(slug: string): Promise<
  Array<
    DbRouteTool & {
      tool: {
        id: string;
        name: string;
        slug: string | null;
        website_url: string | null;
        image: string | null;
        affiliate_url: string | null;
        url: string | null;
      };
    }
  >
> {
  const supabase = supabaseServerClient;

  // First get route_id
  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!route) {
    console.error("[getRouteBest3] Route not found:", slug);
    return [];
  }

  // Get Best3 route_tools
  const { data: routeTools, error: routeToolsError } = await supabase
    .from("route_tools")
    .select("*")
    .eq("route_id", route.id)
    .eq("is_best3", true)
    .order("position", { ascending: true })
    .limit(3);

  if (routeToolsError) {
    console.error("[getRouteBest3] Error fetching route_tools:", routeToolsError);
    return [];
  }

  if (!routeTools || routeTools.length === 0) {
    return [];
  }

  // Get tool data for each route_tool
  const toolIds = routeTools.map((rt: any) => rt.tool_id).filter(Boolean);
  const { data: tools, error: toolsError } = await supabase
    .from("tools")
    .select("id, name, slug, website_url, image, affiliate_url, url")
    .in("id", toolIds);

  if (toolsError) {
    console.error("[getRouteBest3] Error fetching tools:", toolsError);
  }

  // Merge route_tools with tool data
  const toolsById = new Map(tools?.map(t => [t.id, t]) || []);
  
  return routeTools.map((rt: any) => {
    const tool = rt.tool_id ? toolsById.get(rt.tool_id) : null;
    
    // Dev-only warning when tool cannot be resolved
    if (!tool && process.env.NODE_ENV !== 'production') {
      console.warn(`[getRouteBest3] Tool not found for route_tool.id=${rt.id}, tool_id=${rt.tool_id}`);
    }
    
    return {
      ...rt,
      tool: tool || {
        id: rt.tool_id || 'unknown',
        name: "Unknown Tool",
        slug: null,
        website_url: null,
        image: null,
        affiliate_url: null,
        url: null,
      },
    };
  }) as any;
}

/**
 * Get all routes (for list page)
 */
export async function getAllRoutes(options: { limit?: number } = {}): Promise<DbRoute[]> {
  const supabase = supabaseServerClient;

  let query = supabase
    .from("routes")
    .select("*")
    .eq("status", "active")
    .order("featured", { ascending: false })
    .order("manual_order", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (typeof options.limit === "number") {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getAllRoutes] Error:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Get featured routes (for home page)
 * Ordered by: manual_order asc (nulls last), then created_at desc
 */
export async function getFeaturedRoutes(): Promise<DbRoute[]> {
  const supabase = supabaseServerClient;

  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("status", "active")
    .eq("featured", true)
    .order("manual_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getFeaturedRoutes] Error:", error);
    return [];
  }

  return data ?? [];
}

