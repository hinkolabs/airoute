import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/my/saved-tools?limit=3
 * Returns saved tools for authenticated user
 * Used by home page to avoid client-side timeout
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  const supabase = supabaseServerClient;

  // Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Query saved_tools with limit
    const { data, error } = await supabase
      .from('saved_tools')
      .select('tool_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[API /my/saved-tools] DB error:', error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err) {
    console.error('[API /my/saved-tools] Unexpected error:', err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
