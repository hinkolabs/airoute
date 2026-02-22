import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getDemoMode } from "@/lib/flags";

// Force dynamic rendering to avoid caching auth state
export const dynamic = "force-dynamic";

// Allowed topup packages (amounts in credits)
const ALLOWED_AMOUNTS = [200, 500, 1000, 5000];

// POST /api/credits/topup
// Body: { workspace_id, amount, package_key? }
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
    const { workspace_id, amount, package_key } = body;

    if (!workspace_id || !amount) {
      return NextResponse.json(
        { error: "workspace_id and amount are required" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate amount is in allowed list
    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return NextResponse.json(
        { error: "invalid_amount", allowed: ALLOWED_AMOUNTS },
        { status: 400 }
      );
    }

    // Check workspace membership (any role can topup)
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

    // Atomically update balance (add credits)
    const newBalance = creditsRow.balance + amount;
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

    // Insert ledger entry for topup
    const { error: ledgerError } = await adminSupabase
      .from("credit_ledger")
      .insert({
        workspace_id,
        user_id: user.id,
        action_type: "topup",
        feature_key: "topup_test",
        delta: amount, // positive for topup
        description: package_key 
          ? `테스트 충전: ${package_key} 패키지 (+${amount}P)`
          : `테스트 충전 (+${amount}P)`,
        metadata: {
          package_key: package_key || null,
          amount,
          is_test: true,
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
      amount_added: amount,
    });
  } catch (error: any) {
    console.error("[API] POST /api/credits/topup error:", {
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
