import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDemoMode } from "@/lib/flags";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

// Credit packages: amount (credits) → KRW price
const CREDIT_PACKAGES: Record<string, { credits: number; amount_krw: number; label: string }> = {
  credit_200:  { credits: 200,   amount_krw: 2000,  label: "크레딧 200P" },
  credit_500:  { credits: 500,   amount_krw: 4500,  label: "크레딧 500P" },
  credit_1000: { credits: 1000,  amount_krw: 8500,  label: "크레딧 1,000P" },
  credit_5000: { credits: 5000,  amount_krw: 38000, label: "크레딧 5,000P" },
};

// POST /api/credits/topup
// Body: { workspace_id, package_key }
// Returns: { url } — Stripe Checkout URL for one-time credit purchase
export async function POST(request: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspace_id, package_key } = body;

    if (!workspace_id || !package_key) {
      return NextResponse.json(
        { error: "workspace_id and package_key are required" },
        { status: 400 }
      );
    }

    const pkg = CREDIT_PACKAGES[package_key];
    if (!pkg) {
      return NextResponse.json(
        { error: "invalid_package_key", allowed: Object.keys(CREDIT_PACKAGES) },
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

    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
      "http://localhost:3000";

    // Create Stripe Checkout Session for one-time credit purchase
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "krw",
            unit_amount: pkg.amount_krw,
            product_data: {
              name: `AIRoute ${pkg.label}`,
              description: `워크스페이스 크레딧 ${pkg.credits.toLocaleString()}P 충전`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/kr/workspace/billing?topup=success&credits=${pkg.credits}`,
      cancel_url: `${origin}/kr/workspace/billing?topup=cancelled`,
      metadata: {
        type: "credit_topup",
        workspace_id,
        user_id: user.id,
        package_key,
        credit_amount: String(pkg.credits),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "failed_to_create_checkout_session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[API] POST /api/credits/topup error:", {
      message: error?.message,
      code: error?.code,
    });
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
