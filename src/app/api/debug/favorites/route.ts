import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * Debug API: Check favorites_routes data for a guest_id
 * GET /api/debug/favorites?guest_id=xxx
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guest_id");

  if (!guestId) {
    return NextResponse.json({
      error: "guest_id parameter required",
      example: "/api/debug/favorites?guest_id=guest_1234567890_abc123",
    }, { status: 400 });
  }

  const supabase = supabaseServerClient;

  // Check favorites_routes table
  const { data: routes, error: routesError } = await supabase
    .from("favorites_routes")
    .select("*")
    .eq("guest_id", guestId);

  // Check favorites_tools table
  const { data: tools, error: toolsError } = await supabase
    .from("favorites_tools")
    .select("*")
    .eq("guest_id", guestId);

  return NextResponse.json({
    guest_id: guestId,
    favorites_routes: {
      count: routes?.length || 0,
      data: routes || [],
      error: routesError?.message,
    },
    favorites_tools: {
      count: tools?.length || 0,
      data: tools || [],
      error: toolsError?.message,
    },
  });
}





