import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Debug API: Sync DB favorites to localStorage format
 * GET /api/debug/sync-favorites?guest_id=xxx
 * 
 * This helps when localStorage is empty but DB has data
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guest_id");

  if (!guestId) {
    return NextResponse.json({
      error: "guest_id parameter required",
    }, { status: 400 });
  }

  const supabase = supabaseServerClient;

  // Get routes from DB
  const { data: routesData } = await supabase
    .from("favorites_routes")
    .select("route_slug")
    .eq("guest_id", guestId);

  // Get tools from DB
  const { data: toolsData } = await supabase
    .from("favorites_tools")
    .select("tool_slug")
    .eq("guest_id", guestId);

  const routeSlugs = routesData?.map(r => r.route_slug) || [];
  const toolSlugs = toolsData?.map(t => t.tool_slug) || [];

  return NextResponse.json({
    guest_id: guestId,
    db_data: {
      routes: routeSlugs,
      tools: toolSlugs,
    },
    instructions: {
      step1: "Copy the JavaScript below",
      step2: "Paste and run it in your browser console (F12)",
      script: `
// Sync DB data to localStorage
localStorage.setItem('airoute_fav_routes', '${JSON.stringify(routeSlugs)}');
localStorage.setItem('airoute_fav_tools', '${JSON.stringify(toolSlugs)}');
console.log('✅ Synced! Refresh the page.');
      `.trim(),
    },
  });
}





