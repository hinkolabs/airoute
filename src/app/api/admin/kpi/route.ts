import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// POST /api/admin/kpi
// Body: { month_start: string (ISO date) }
export async function POST(request: NextRequest) {
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

    // 2) Check system_admin status
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!systemAdminRow) {
      return NextResponse.json(
        { ok: false, code: "FORBIDDEN", message: "시스템 관리자만 접근 가능합니다" },
        { status: 403 }
      );
    }

    // 3) Parse body
    const body = await request.json();
    const { month_start } = body;

    if (!month_start) {
      return NextResponse.json(
        { ok: false, code: "MISSING_PARAMS", message: "month_start는 필수입니다" },
        { status: 400 }
      );
    }

    // 4) Use admin client for queries
    const adminSupabase = createAdminSupabase();

    // Get KPI data in parallel
    const [
      subscriptionsResult,
      couponRedemptionsResult,
      creditsToppedUpResult,
      creditsConsumedResult,
      autopostingSuccessResult,
      autopostingFailResult,
    ] = await Promise.all([
      // Paid subscriptions (current_period_end > now)
      adminSupabase
        .from("workspace_subscriptions")
        .select("id", { count: "exact", head: true })
        .gt("current_period_end", new Date().toISOString())
        .in("plan_key", ["starter", "pro"]),

      // Coupon redemptions this month
      adminSupabase
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .gte("redeemed_at", month_start),

      // Credits topped up this month
      adminSupabase
        .from("credit_ledger")
        .select("delta")
        .eq("action_type", "topup")
        .gte("created_at", month_start),

      // Credits consumed this month
      adminSupabase
        .from("credit_ledger")
        .select("delta")
        .eq("action_type", "consume")
        .gte("created_at", month_start),

      // Autoposting success this month
      adminSupabase
        .from("event_logs")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "autoposting_success")
        .gte("created_at", month_start),

      // Autoposting fail this month
      adminSupabase
        .from("event_logs")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "autoposting_fail")
        .gte("created_at", month_start),
    ]);

    // Calculate totals
    const paidSubscriptions = subscriptionsResult.count || 0;
    const couponRedemptions = couponRedemptionsResult.count || 0;
    
    const totalCreditsToppedUp = (creditsToppedUpResult.data || []).reduce(
      (sum, row) => sum + (row.delta || 0),
      0
    );

    const totalCreditsConsumed = (creditsConsumedResult.data || []).reduce(
      (sum, row) => sum + (row.delta || 0),
      0
    );

    const autopostingSuccess = autopostingSuccessResult.count || 0;
    const autopostingFail = autopostingFailResult.count || 0;

    return NextResponse.json({
      paid_subscriptions: paidSubscriptions,
      coupon_redemptions: couponRedemptions,
      total_credits_topped_up: totalCreditsToppedUp,
      total_credits_consumed: totalCreditsConsumed,
      autoposting_success: autopostingSuccess,
      autoposting_fail: autopostingFail,
    });
  } catch (error: any) {
    console.error("[API] POST /api/admin/kpi error:", {
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
