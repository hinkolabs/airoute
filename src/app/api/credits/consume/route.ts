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

    // Ensure workspace_credits row exists
    let { data: creditsRow } = await adminSupabase
      .from("workspace_credits")
      .select("workspace_id, balance")
      .eq("workspace_id", workspace_id)
      .limit(1)
      .maybeSingle();

    if (!creditsRow) {
      const { data: newRow, error: insertError } = await adminSupabase
        .from("workspace_credits")
        .insert({ workspace_id, balance: 0 })
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

    // Check if balance is sufficient
    if (creditsRow.balance < amount) {
      return NextResponse.json(
        {
          error: "insufficient_credits",
          code: "INSUFFICIENT_CREDITS",
          balance: creditsRow.balance,
          required: amount,
        },
        { status: 402 }
      );
    }

    // Atomically update balance
    const newBalance = creditsRow.balance - amount;
    const { data: updatedRow, error: updateError } = await adminSupabase
      .from("workspace_credits")
      .update({ balance: newBalance })
      .eq("workspace_id", workspace_id)
      .eq("balance", creditsRow.balance) // optimistic lock
      .select("balance")
      .maybeSingle();

    if (updateError || !updatedRow) {
      console.error("[API] Failed to update workspace_credits balance:", updateError);
      return NextResponse.json(
        { error: "failed_to_update_balance" },
        { status: 500 }
      );
    }

    // Insert ledger entry
    const { error: ledgerError } = await adminSupabase
      .from("credit_ledger")
      .insert({
        workspace_id,
        user_id: user.id,
        action_type: "consume",
        feature_key,
        delta: -amount,
        description: description || null,
        metadata: {
          feature_key,
          amount,
        },
      });

    if (ledgerError) {
      console.error("[API] Failed to insert credit_ledger entry:", ledgerError);
      // Note: Balance was already updated. In production, consider using DB transaction or RPC.
    }

    return NextResponse.json({
      ok: true,
      workspace_id,
      new_balance: updatedRow.balance,
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
