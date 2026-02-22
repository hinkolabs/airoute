import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { getDemoMode } from "@/lib/flags";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

type PlanKey = "starter" | "pro";
type BillingCycle = "monthly" | "yearly";

/**
 * Resolves the Stripe Price ID for team checkout based on plan and billing cycle.
 * Throws an error with the missing env var name if not found.
 */
function resolveTeamPriceId(planKey: PlanKey, billingCycle: BillingCycle): string {
  const envVarName = `STRIPE_TEAM_${planKey.toUpperCase()}_${billingCycle.toUpperCase()}_PRICE_ID`;
  const priceId = process.env[envVarName];

  if (!priceId) {
    throw new Error(`Missing environment variable: ${envVarName}`);
  }

  return priceId;
}

export async function POST(request: Request) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { workspaceName, planKey, billingCycle } = body;

    // Validate inputs
    if (typeof workspaceName !== "string" || workspaceName.trim().length < 2 || workspaceName.trim().length > 40) {
      return NextResponse.json(
        { error: "워크스페이스 이름은 2~40자 사이여야 합니다" },
        { status: 400 }
      );
    }

    if (!planKey || !["starter", "pro"].includes(planKey)) {
      return NextResponse.json(
        { error: "유효하지 않은 플랜입니다" },
        { status: 400 }
      );
    }

    if (!billingCycle || !["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json(
        { error: "유효하지 않은 결제 주기입니다" },
        { status: 400 }
      );
    }

    // Resolve Stripe price ID from environment variables
    let priceId: string;
    try {
      priceId = resolveTeamPriceId(planKey as PlanKey, billingCycle as BillingCycle);
    } catch (error) {
      console.error(`[Team Checkout] Price ID resolution failed:`, error);
      return NextResponse.json(
        { 
          error: "플랜 가격 정보가 설정되지 않았습니다",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/kr/workspace?team_created=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/kr/workspace`,
      metadata: {
        kind: "team",
        workspace_name: workspaceName.trim(),
        plan_key: planKey,
        billing_cycle: billingCycle,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          kind: "team",
          workspace_name: workspaceName.trim(),
          plan_key: planKey,
          user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("[Team Checkout] Error:", error);
    return NextResponse.json(
      { error: "결제 세션 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
