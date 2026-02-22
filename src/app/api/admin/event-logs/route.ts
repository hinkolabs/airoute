import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/event-logs
// Query params:
// - from (ISO date)
// - to (ISO date)
// - event_type (text)
// - target_type (text)
// - user_id (uuid)
// - workspace_id (uuid) -> filters metadata->>'workspace_id'
// - limit (default 50, max 200)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2. system_admin check (REQUIRED)
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isSystemAdmin = !!systemAdminRow;

    if (!isSystemAdmin) {
      return NextResponse.json(
        { error: "forbidden", message: "system_admin permission required" },
        { status: 403 }
      );
    }

    // 3. Parse query params
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const eventType = searchParams.get("event_type");
    const targetType = searchParams.get("target_type");
    const userId = searchParams.get("user_id");
    const workspaceId = searchParams.get("workspace_id");
    const limitParam = searchParams.get("limit");

    const limit = Math.min(
      Math.max(1, parseInt(limitParam || "50", 10)),
      200
    );

    // 4. Build query
    const adminSupabase = createAdminSupabase();
    let query = adminSupabase
      .from("event_logs")
      .select("id, created_at, event_type, target_type, target_slug, source, user_id, metadata")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (from) {
      query = query.gte("created_at", from);
    }
    if (to) {
      query = query.lt("created_at", to);
    }
    if (eventType) {
      query = query.eq("event_type", eventType);
    }
    if (targetType) {
      query = query.eq("target_type", targetType);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (workspaceId) {
      // Filter by metadata->>'workspace_id'
      // Note: This uses JSONB operator, ensure RLS allows it
      query = query.eq("metadata->>workspace_id", workspaceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API] event-logs query error:", error);
      return NextResponse.json(
        { error: "query_failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      filters: {
        from: from || null,
        to: to || null,
        event_type: eventType || null,
        target_type: targetType || null,
        user_id: userId || null,
        workspace_id: workspaceId || null,
        limit,
      },
      items: data || [],
    });
  } catch (error: any) {
    console.error("[API] GET /api/admin/event-logs error:", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
