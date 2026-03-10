import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getDemoMode } from "@/lib/flags";

// Force dynamic rendering to avoid caching auth state
export const dynamic = "force-dynamic";

// POST /api/credits/consume
// Body: { workspace_id, feature_key, amount, description }
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { workspace_id, feature_key, amount, description } = body;

    if (!workspace_id || !feature_key || !amount) {
      return NextResponse.json(
        { error: "workspace_id, feature_key, and amount are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    // Check workspace membership
    const { data: membershipRow } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membershipRow) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    // Use admin client for DB writes
    const adminSupabase = createAdminSupabase();

    // Ensure workspace_credits row exists (RPC requires the row to be present)
    const { data: creditsRow } = await adminSupabase
      .from("workspace_credits")
      .select("workspace_id")
      .eq("workspace_id", workspace_id)
      .limit(1)
      .maybeSingle();

    if (!creditsRow) {
      const { error: insertError } = await adminSupabase
        .from("workspace_credits")
        .insert({ workspace_id, balance: 0 });

      if (insertError) {
        console.error("[API] Failed to create workspace_credits row:", insertError);
        return NextResponse.json(
          { error: "failed_to_create_credits" },
          { status: 500 }
        );
      }
    }

    // Atomically consume credits via RPC (balance update + ledger insert in one transaction)
    const { data: rpcResult, error: rpcError } = await adminSupabase.rpc("consume_credits", {
      p_workspace_id: workspace_id,
      p_user_id: user.id,
      p_feature_key: feature_key,
      p_amount: amount,
      p_description: description || null,
    });

    if (rpcError) {
      console.error("[API] consume_credits RPC error:", rpcError);
      return NextResponse.json(
        { error: "failed_to_consume_credits" },
        { status: 500 }
      );
    }

    const result = rpcResult as { ok: boolean; code?: string; balance?: number; new_balance?: number };

    if (!result.ok) {
      if (result.code === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          {
            error: "insufficient_credits",
            code: "INSUFFICIENT_CREDITS",
            balance: result.balance,
            required: amount,
          },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: result.code ?? "consume_failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      workspace_id,
      new_balance: result.new_balance,
    });
  } catch (error: any) {
    console.error("[API] POST /api/credits/consume error:", {
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
