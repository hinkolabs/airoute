import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getDemoMode } from "@/lib/flags";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export const dynamic = "force-dynamic";

// POST /api/subscription/cancel
// Body: { workspace_id: string }
// Sets current_period_end = now() to immediately cancel subscription
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
    const { workspace_id } = body;

    if (!workspace_id) {
      return NextResponse.json(
        { ok: false, code: "MISSING_WORKSPACE_ID", message: "workspace_id는 필수입니다" },
        { status: 400 }
      );
    }

    // 3) Check system_admin status
    const { data: systemAdminRow } = await supabase
      .from("system_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isSystemAdmin = !!systemAdminRow;

    // 4) Check workspace membership and role
    if (!isSystemAdmin) {
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

      if (membershipRow.role !== "owner" && membershipRow.role !== "admin") {
        return NextResponse.json(
          { ok: false, code: "FORBIDDEN", message: "owner 또는 admin만 구독을 취소할 수 있습니다" },
          { status: 403 }
        );
      }
    }

    // 5) Use admin client for write
    const adminSupabase = createAdminSupabase();

    // 6) Get current subscription
    const { data: subRow } = await adminSupabase
      .from("workspace_subscriptions")
      .select("*")
      .eq("workspace_id", workspace_id)
      .limit(1)
      .maybeSingle();

    if (!subRow) {
      return NextResponse.json(
        { ok: false, code: "NO_SUBSCRIPTION", message: "활성화된 구독이 없습니다" },
        { status: 404 }
      );
    }

    // 7) Cancel via Stripe API if stripe_subscription_id exists, otherwise DB-only
    const stripeSubId = subRow.stripe_subscription_id as string | null;

    let cancelledAt: string;

    if (stripeSubId) {
      // Stripe 구독 취소: 현재 결제 기간 만료 시 자동 해지 (즉시 차단 아님)
      let stripeUpdated: Stripe.Subscription;
      try {
        stripeUpdated = await stripe.subscriptions.update(stripeSubId, {
          cancel_at_period_end: true,
        });
      } catch (stripeErr: any) {
        console.error("[Subscription Cancel] Stripe API error:", stripeErr?.message);
        return NextResponse.json(
          { ok: false, code: "STRIPE_ERROR", message: "Stripe 취소 요청에 실패했습니다" },
          { status: 500 }
        );
      }

      // current_period_end = 사용자가 실제로 사용 가능한 만료일
      const periodEnd = (stripeUpdated as any).current_period_end as number;
      cancelledAt = new Date(periodEnd * 1000).toISOString();

      const { error: updateError } = await adminSupabase
        .from("workspace_subscriptions")
        .update({
          status: "cancelled",
          current_period_end: cancelledAt,
        })
        .eq("workspace_id", workspace_id);

      if (updateError) {
        console.error("[Subscription Cancel] Failed to update DB after Stripe cancel:", updateError);
        return NextResponse.json(
          { ok: false, code: "UPDATE_FAILED", message: "구독 상태 업데이트에 실패했습니다" },
          { status: 500 }
        );
      }
    } else {
      // Stripe 구독 ID 없는 경우 (쿠폰 구독 등) — DB만 즉시 취소
      cancelledAt = new Date().toISOString();

      const { error: updateError } = await adminSupabase
        .from("workspace_subscriptions")
        .update({
          status: "cancelled",
          current_period_end: cancelledAt,
        })
        .eq("workspace_id", workspace_id);

      if (updateError) {
        console.error("[Subscription Cancel] Failed to update subscription:", updateError);
        return NextResponse.json(
          { ok: false, code: "UPDATE_FAILED", message: "구독 취소에 실패했습니다" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "구독이 취소되었습니다",
      cancelled_at: cancelledAt,
    });
  } catch (error: any) {
    console.error("[API] POST /api/subscription/cancel error:", {
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
