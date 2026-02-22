import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getDemoMode } from "@/lib/flags";

// Force dynamic rendering to avoid caching auth state
export const dynamic = "force-dynamic";

type Scope = "me" | "admin";

// GET /api/credits/history?workspace_id=xxx&limit=50&scope=me&cursor=xxx
// scope: 'me' (default) - only current user's history
// scope: 'admin' - audit mode with filters (system_admin only)
//
// Admin filters (scope='admin' only):
// - workspace_id: uuid (optional in admin mode)
// - user_id: uuid (optional)
// - action_type: text (optional)
// - feature_key: text (optional)
// - date_from: ISO date (optional)
// - date_to: ISO date (optional)
export async function GET(request: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspace_id");
    const limitParam = searchParams.get("limit");
    const scopeParam = searchParams.get("scope") || "me";
    const cursor = searchParams.get("cursor"); // ISO timestamp for pagination
    
    // Admin filters
    const filterUserId = searchParams.get("user_id");
    const filterActionType = searchParams.get("action_type");
    const filterFeatureKey = searchParams.get("feature_key");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    // Validate scope
    const scope: Scope = scopeParam === "admin" ? "admin" : "me";
    if (scopeParam && scopeParam !== "me" && scopeParam !== "admin") {
      return NextResponse.json(
        { error: "invalid scope, must be 'me' or 'admin'" },
        { status: 400 }
      );
    }

    // Check system_admin status early (needed for both scope validation and workspace_id requirement)
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isSystemAdmin = !!systemAdminRow;

    // Scope='admin' requires system_admin
    if (scope === "admin" && !isSystemAdmin) {
      return NextResponse.json(
        { error: "FORBIDDEN_SCOPE", message: "scope='admin' requires system_admin permission" },
        { status: 403 }
      );
    }

    // workspace_id validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // For scope='me', workspace_id is required
    if (scope === "me" && !workspaceId) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    // Validate workspace_id format if provided
    if (workspaceId && !uuidRegex.test(workspaceId)) {
      return NextResponse.json(
        { error: "invalid workspace_id format" },
        { status: 400 }
      );
    }

    // Validate user_id format if provided (admin filter)
    if (filterUserId && !uuidRegex.test(filterUserId)) {
      return NextResponse.json(
        { error: "invalid user_id format" },
        { status: 400 }
      );
    }

    // Parse and validate limit (default: 50, max: 200 for admin, 100 for regular)
    let limit = 50;
    const maxLimit = scope === "admin" ? 200 : 100;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: "limit must be a positive number" },
          { status: 400 }
        );
      }
      limit = Math.min(parsedLimit, maxLimit);
    }

    // Check workspace membership for scope='me'
    if (scope === "me" && workspaceId) {
      const { data: membershipRow } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!membershipRow) {
        return NextResponse.json({ error: "not_a_member" }, { status: 403 });
      }
    }

    // Use admin client for reading credit_ledger
    const adminSupabase = createAdminSupabase();

    // Build query with cursor-based pagination
    // For scope='me': exclude user_id from response (privacy)
    // For scope='admin': include user_id (audit purpose)
    const selectFields = scope === "admin"
      ? "id, workspace_id, user_id, action_type, feature_key, delta, description, metadata, created_at"
      : "id, workspace_id, action_type, feature_key, delta, description, metadata, created_at";

    let query = adminSupabase
      .from("credit_ledger")
      .select(selectFields)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply filters based on scope
    if (scope === "me") {
      // Privacy: only show current user's history
      if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      }
      query = query.eq("user_id", user.id);
    } else {
      // Admin mode: apply audit filters
      if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      }
      if (filterUserId) {
        query = query.eq("user_id", filterUserId);
      }
      if (filterActionType) {
        query = query.eq("action_type", filterActionType);
      }
      if (filterFeatureKey) {
        query = query.eq("feature_key", filterFeatureKey);
      }
      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lt("created_at", dateTo);
      }
    }

    // Apply cursor if provided (pagination)
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: ledgerRows, error: ledgerError } = await query;

    if (ledgerError) {
      console.error("[API] Failed to fetch credit_ledger:", ledgerError);
      return NextResponse.json(
        { error: "failed_to_fetch_history" },
        { status: 500 }
      );
    }

    // Get current balance (only if workspace_id provided)
    let currentBalance = 0;
    if (workspaceId) {
      const { data: creditsRow } = await adminSupabase
        .from("workspace_credits")
        .select("balance")
        .eq("workspace_id", workspaceId)
        .limit(1)
        .maybeSingle();
      
      currentBalance = creditsRow?.balance ?? 0;
    }

    // Determine next cursor (last item's created_at)
    const nextCursor = ledgerRows && ledgerRows.length > 0
      ? (ledgerRows[ledgerRows.length - 1] as any).created_at
      : null;

    // Build applied filters object for admin transparency
    const appliedFilters: Record<string, any> = {};
    if (scope === "admin") {
      if (workspaceId) appliedFilters.workspace_id = workspaceId;
      if (filterUserId) appliedFilters.user_id = filterUserId;
      if (filterActionType) appliedFilters.action_type = filterActionType;
      if (filterFeatureKey) appliedFilters.feature_key = filterFeatureKey;
      if (dateFrom) appliedFilters.date_from = dateFrom;
      if (dateTo) appliedFilters.date_to = dateTo;
    }

    return NextResponse.json({
      scope: scope,
      ...(workspaceId && { workspace_id: workspaceId }),
      ...(scope === "me" && { current_balance: currentBalance }),
      ...(scope === "admin" && { applied_filters: appliedFilters }),
      items: ledgerRows || [],
      next_cursor: nextCursor,
      has_more: ledgerRows && ledgerRows.length === limit,
    });
  } catch (error: any) {
    console.error("[API] GET /api/credits/history error:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
