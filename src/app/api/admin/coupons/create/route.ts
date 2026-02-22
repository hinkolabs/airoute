import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// POST /api/admin/coupons/create
// Body: { code, kind, credits_amount?, plan_key?, months?, max_redemptions?, expires_at? }
// System admin only
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
        { ok: false, code: "FORBIDDEN", message: "시스템 관리자만 쿠폰을 생성할 수 있습니다" },
        { status: 403 }
      );
    }

    // 3) Parse body
    const body = await request.json();
    const {
      code,
      kind,
      credits_amount,
      plan_key,
      months,
      max_redemptions,
      expires_at,
    } = body;

    if (!code || !kind) {
      return NextResponse.json(
        { ok: false, code: "MISSING_PARAMS", message: "code와 kind는 필수입니다" },
        { status: 400 }
      );
    }

    if (kind !== "credits" && kind !== "subscription") {
      return NextResponse.json(
        { ok: false, code: "INVALID_KIND", message: "kind는 'credits' 또는 'subscription'이어야 합니다" },
        { status: 400 }
      );
    }

    if (kind === "credits" && !credits_amount) {
      return NextResponse.json(
        { ok: false, code: "MISSING_CREDITS_AMOUNT", message: "credits 쿠폰은 credits_amount가 필요합니다" },
        { status: 400 }
      );
    }

    if (kind === "subscription" && (!plan_key || !months)) {
      return NextResponse.json(
        { ok: false, code: "MISSING_SUBSCRIPTION_PARAMS", message: "subscription 쿠폰은 plan_key와 months가 필요합니다" },
        { status: 400 }
      );
    }

    // 4) Use admin client
    const adminSupabase = createAdminSupabase();

    // 5) Check if code already exists
    const { data: existingCoupon } = await adminSupabase
      .from("coupons")
      .select("id")
      .eq("code", code.trim().toUpperCase())
      .limit(1)
      .maybeSingle();

    if (existingCoupon) {
      return NextResponse.json(
        { ok: false, code: "COUPON_ALREADY_EXISTS", message: "이미 존재하는 쿠폰 코드입니다" },
        { status: 409 }
      );
    }

    // 6) Insert coupon
    const { data: newCoupon, error: insertError } = await adminSupabase
      .from("coupons")
      .insert({
        code: code.trim().toUpperCase(),
        kind,
        credits_amount: kind === "credits" ? credits_amount : null,
        plan_key: kind === "subscription" ? plan_key : null,
        months: kind === "subscription" ? months : null,
        max_redemptions: max_redemptions || 1,
        redeemed_count: 0,
        expires_at: expires_at || null,
        is_active: true,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("[Admin Coupon Create] Failed to insert coupon:", insertError);
      return NextResponse.json(
        { ok: false, code: "INSERT_FAILED", message: "쿠폰 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      coupon: newCoupon,
    });
  } catch (error: any) {
    console.error("[API] POST /api/admin/coupons/create error:", {
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
