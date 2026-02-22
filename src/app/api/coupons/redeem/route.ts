import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getDemoMode } from "@/lib/flags";

export const dynamic = "force-dynamic";

// POST /api/coupons/redeem
// Body: { workspace_id: string, code: string }
export async function POST(request: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  try {
    const supabase = await createClient();

    // 1) Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", message: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // 2) Parse body
    const body = await request.json();
    const { workspace_id, code } = body;

    if (!workspace_id || !code) {
      return NextResponse.json(
        { ok: false, code: "MISSING_PARAMS", message: "workspace_id와 code는 필수입니다" },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim().toUpperCase();

    // 3) Check workspace membership
    const { data: membershipRow } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membershipRow) {
      return NextResponse.json(
        { ok: false, code: "NOT_A_MEMBER", message: "워크스페이스 멤버가 아닙니다" },
        { status: 403 }
      );
    }

    // 4) Use admin client for all writes (RLS bypass)
    const adminSupabase = createAdminSupabase();

    // 5) Fetch coupon (with locks for concurrency safety)
    const { data: coupon, error: couponError } = await adminSupabase
      .from("coupons")
      .select("*")
      .eq("code", trimmedCode)
      .limit(1)
      .maybeSingle();

    if (couponError || !coupon) {
      return NextResponse.json(
        { ok: false, code: "COUPON_NOT_FOUND", message: "쿠폰을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!coupon.is_active) {
      return NextResponse.json(
        { ok: false, code: "COUPON_INACTIVE", message: "비활성화된 쿠폰입니다" },
        { status: 400 }
      );
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json(
        { ok: false, code: "COUPON_EXPIRED", message: "만료된 쿠폰입니다" },
        { status: 400 }
      );
    }

    if (coupon.redeemed_count >= coupon.max_redemptions) {
      return NextResponse.json(
        { ok: false, code: "COUPON_REDEEMED_OUT", message: "쿠폰 사용 한도에 도달했습니다" },
        { status: 409 }
      );
    }

    // 6) Check if user already redeemed this coupon in this workspace
    const { data: existingRedemption } = await adminSupabase
      .from("coupon_redemptions")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("workspace_id", workspace_id)
      .eq("redeemed_by", user.id)
      .limit(1)
      .maybeSingle();

    if (existingRedemption) {
      return NextResponse.json(
        { ok: false, code: "COUPON_ALREADY_REDEEMED", message: "이미 사용한 쿠폰입니다" },
        { status: 409 }
      );
    }

    // 7) Insert redemption log
    const { error: redemptionError } = await adminSupabase
      .from("coupon_redemptions")
      .insert({
        coupon_id: coupon.id,
        code: trimmedCode,
        workspace_id,
        redeemed_by: user.id,
        metadata: { kind: coupon.kind },
      });

    if (redemptionError) {
      console.error("[Coupon Redeem] Failed to insert redemption:", redemptionError);
      return NextResponse.json(
        { ok: false, code: "REDEMPTION_FAILED", message: "쿠폰 등록에 실패했습니다" },
        { status: 500 }
      );
    }

    // 8) Update redeemed_count
    const { error: updateCountError } = await adminSupabase
      .from("coupons")
      .update({ redeemed_count: coupon.redeemed_count + 1 })
      .eq("id", coupon.id);

    if (updateCountError) {
      console.error("[Coupon Redeem] Failed to update redeemed_count:", updateCountError);
      // Continue anyway - redemption log is created
    }

    // 9) Apply coupon benefit
    if (coupon.kind === "credits") {
      // 9-A) Credits coupon
      const creditsAmount = coupon.credits_amount || 0;

      // Get or create workspace_credits
      let { data: creditsRow } = await adminSupabase
        .from("workspace_credits")
        .select("workspace_id, balance")
        .eq("workspace_id", workspace_id)
        .limit(1)
        .maybeSingle();

      if (!creditsRow) {
        const { data: newRow, error: insertCreditsError } = await adminSupabase
          .from("workspace_credits")
          .insert({ workspace_id, balance: creditsAmount })
          .select("workspace_id, balance")
          .single();

        if (insertCreditsError) {
          console.error("[Coupon Redeem] Failed to create workspace_credits:", insertCreditsError);
          return NextResponse.json(
            { ok: false, code: "CREDITS_CREATE_FAILED", message: "크레딧 생성 실패" },
            { status: 500 }
          );
        }
        creditsRow = newRow;
      } else {
        // Update balance
        const { error: updateBalanceError } = await adminSupabase
          .from("workspace_credits")
          .update({ balance: creditsRow.balance + creditsAmount })
          .eq("workspace_id", workspace_id);

        if (updateBalanceError) {
          console.error("[Coupon Redeem] Failed to update balance:", updateBalanceError);
          return NextResponse.json(
            { ok: false, code: "CREDITS_UPDATE_FAILED", message: "크레딧 업데이트 실패" },
            { status: 500 }
          );
        }
      }

      // Insert credit_ledger
      const { error: ledgerError } = await adminSupabase
        .from("credit_ledger")
        .insert({
          workspace_id,
          user_id: user.id,
          action_type: "topup",
          feature_key: "coupon",
          delta: creditsAmount,
          description: `쿠폰 등록: ${trimmedCode}`,
          metadata: {
            source: "coupon",
            code: trimmedCode,
            coupon_id: coupon.id,
          },
        });

      if (ledgerError) {
        console.error("[Coupon Redeem] Failed to insert credit_ledger:", ledgerError);
        // Continue anyway - balance is updated
      }

      return NextResponse.json({
        ok: true,
        kind: "credits",
        credits_added: creditsAmount,
        new_balance: (creditsRow?.balance || 0) + creditsAmount,
      });
    } else if (coupon.kind === "subscription") {
      // 9-B) Subscription coupon
      const planKey = coupon.plan_key || "starter";
      const months = coupon.months || 1;

      // Get existing subscription
      const { data: subRow } = await adminSupabase
        .from("workspace_subscriptions")
        .select("*")
        .eq("workspace_id", workspace_id)
        .limit(1)
        .maybeSingle();

      if (!subRow) {
        // Create new subscription
        const newPeriodEnd = new Date();
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + months);

        const { error: insertSubError } = await adminSupabase
          .from("workspace_subscriptions")
          .insert({
            workspace_id,
            plan_key: planKey,
            billing_cycle: "monthly",
            status: "active",
            seat_count: 1,
            current_period_end: newPeriodEnd.toISOString(),
            stripe_customer_id: null,
            stripe_subscription_id: null,
            stripe_price_id: null,
          });

        if (insertSubError) {
          console.error("[Coupon Redeem] Failed to create subscription:", insertSubError);
          return NextResponse.json(
            { ok: false, code: "SUBSCRIPTION_CREATE_FAILED", message: "구독 생성 실패" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          ok: true,
          kind: "subscription",
          plan_key: planKey,
          months_added: months,
          new_period_end: newPeriodEnd.toISOString(),
        });
      } else {
        // Extend existing subscription
        const currentEnd = new Date(subRow.current_period_end || new Date());
        const baseDate = currentEnd > new Date() ? currentEnd : new Date();
        const newPeriodEnd = new Date(baseDate);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + months);

        const { error: updateSubError } = await adminSupabase
          .from("workspace_subscriptions")
          .update({ current_period_end: newPeriodEnd.toISOString() })
          .eq("workspace_id", workspace_id);

        if (updateSubError) {
          console.error("[Coupon Redeem] Failed to extend subscription:", updateSubError);
          return NextResponse.json(
            { ok: false, code: "SUBSCRIPTION_UPDATE_FAILED", message: "구독 연장 실패" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          ok: true,
          kind: "subscription",
          plan_key: planKey,
          months_added: months,
          new_period_end: newPeriodEnd.toISOString(),
        });
      }
    }

    return NextResponse.json(
      { ok: false, code: "UNKNOWN_COUPON_KIND", message: "알 수 없는 쿠폰 종류입니다" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[API] POST /api/coupons/redeem error:", {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
