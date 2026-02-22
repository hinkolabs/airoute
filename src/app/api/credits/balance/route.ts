import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getDemoMode } from "@/lib/flags";

// Force dynamic rendering to avoid caching auth state
export const dynamic = "force-dynamic";

// GET /api/credits/balance?workspace_id=xxx
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

    // Get workspace_id from query
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspace_id");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspace_id is required" },
        { status: 400 }
      );
    }

    // Check workspace membership
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

    // Get workspace_credits (or create if not exists)
    const adminSupabase = createAdminSupabase();
    
    let { data: creditsRow, error: creditsError } = await adminSupabase
      .from("workspace_credits")
      .select("workspace_id, balance")
      .eq("workspace_id", workspaceId)
      .limit(1)
      .maybeSingle();

    // If row doesn't exist, create it with balance = 0 (idempotent)
    if (!creditsRow) {
      const { data: newRow, error: insertError } = await adminSupabase
        .from("workspace_credits")
        .insert({ workspace_id: workspaceId, balance: 0 })
        .select("workspace_id, balance")
        .single();

      if (insertError) {
        console.error("[API] Failed to create workspace_credits row:", insertError);
        return NextResponse.json(
          { error: "failed_to_create_credits" },
          { status: 500 }
        );
      }

      creditsRow = newRow;
    }

    return NextResponse.json({
      workspace_id: creditsRow.workspace_id,
      balance: creditsRow.balance,
    });
  } catch (error: any) {
    console.error("[API] GET /api/credits/balance error:", {
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
