import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { getDemoMode } from "@/lib/flags";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

type PlanKey = "starter" | "pro";
type BillingCycle = "monthly" | "yearly";

interface CheckoutRequestBody {
  workspace_id: string;
  plan_key: PlanKey;
  billing_cycle: BillingCycle;
}

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
        { error: "인증되지 않았습니다" },
        { status: 401 }
      );
    }

    // 2) Parse and validate body
    const body: CheckoutRequestBody = await request.json();
    const { workspace_id, plan_key, billing_cycle } = body;

    if (!workspace_id || typeof workspace_id !== "string") {
      return NextResponse.json(
        { error: "workspace_id가 필요합니다" },
        { status: 400 }
      );
    }

    if (!plan_key || !["starter", "pro"].includes(plan_key)) {
      return NextResponse.json(
        { error: "plan_key는 'starter' 또는 'pro'여야 합니다" },
        { status: 400 }
      );
    }

    if (!billing_cycle || !["monthly", "yearly"].includes(billing_cycle)) {
      return NextResponse.json(
        { error: "billing_cycle은 'monthly' 또는 'yearly'여야 합니다" },
        { status: 400 }
      );
    }

    // 3) Owner check
    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspace_id)
      .eq("user_id", user.id)
      .eq("role", "owner")
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "워크스페이스 소유자만 결제를 시작할 수 있습니다" },
        { status: 403 }
      );
    }

    // 4) Load plan from DB
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("stripe_price_id_monthly, stripe_price_id_yearly")
      .eq("plan_key", plan_key)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "플랜 정보를 찾을 수 없습니다" },
        { status: 400 }
      );
    }

    // 5) Pick the correct price ID
    const priceId =
      billing_cycle === "monthly"
        ? plan.stripe_price_id_monthly
        : plan.stripe_price_id_yearly;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price id가 설정되지 않았습니다" },
        { status: 400 }
      );
    }

    // 6) Determine origin for success/cancel URLs
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
      "http://localhost:3000";

    // 7) Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/kr/workspace/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/kr/workspace/billing/cancel`,
      metadata: {
        workspace_id,
        plan_key,
        billing_cycle,
        user_id: user.id,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe checkout URL을 생성하지 못했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[API] POST /api/stripe/checkout error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "결제 세션 생성에 실패했습니다",
      },
      { status: 500 }
    );
  }
}
