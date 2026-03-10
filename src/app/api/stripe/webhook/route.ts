import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDemoMode } from "@/lib/flags";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

/**
 * Helper to make authenticated Supabase REST API calls using service role key.
 * This is used in webhook context where we cannot use user session.
 */
async function supabaseAdminFetch(path: string, init?: RequestInit) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for webhook"
    );
  }

  return fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...init?.headers,
    },
  });
}

export async function POST(req: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured"
    );
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get signature from header
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  // Get raw body (required for signature verification)
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error(
      "[Stripe Webhook] Signature verification failed:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log(
    `[Stripe Webhook] Received event: ${event.type} (${event.id})`
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type === "credit_topup") {
          await handleCreditTopup(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(
      `[Stripe Webhook] Error processing event ${event.id}:`,
      err instanceof Error ? err.message : err
    );
    // Still return 200 to Stripe to avoid retries for unrecoverable errors
    return NextResponse.json({ received: true });
  }
}

/**
 * Handle checkout.session.completed event.
 * For personal workspace: update workspace_subscriptions with Stripe IDs.
 * For team workspace: create workspace + membership + subscription.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  const kind = metadata?.kind;

  // Handle team workspace creation (pay-before-create flow)
  if (kind === "team") {
    await handleTeamWorkspaceCreation(session);
    return;
  }

  // Handle personal workspace subscription (existing flow)
  if (!metadata?.workspace_id) {
    console.log(
      `[Stripe Webhook] checkout.session.completed without workspace_id or kind, ignoring (session: ${session.id})`
    );
    return;
  }

  const workspaceId = metadata.workspace_id;
  const planKey = metadata.plan_key;
  const billingCycle = metadata.billing_cycle;

  // Retrieve subscription object if available
  let currentPeriodEnd: number | null = null;
  if (session.subscription && typeof session.subscription === "string") {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );
      currentPeriodEnd = (subscription as any).current_period_end;
    } catch (err) {
      console.error(
        `[Stripe Webhook] Failed to retrieve subscription ${session.subscription}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  const updateData: Record<string, any> = {
    status: "active",
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
    updated_at: new Date().toISOString(),
  };

  if (planKey) {
    updateData.plan_key = planKey;
  }
  if (billingCycle) {
    updateData.billing_cycle = billingCycle;
  }
  if (currentPeriodEnd) {
    updateData.current_period_end = new Date(
      currentPeriodEnd * 1000
    ).toISOString();
  }

  // Try to update existing row first
  const patchRes = await supabaseAdminFetch(
    `/workspace_subscriptions?workspace_id=eq.${workspaceId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updateData),
    }
  );

  if (!patchRes.ok) {
    // If row doesn't exist, insert a new one
    console.log(
      `[Stripe Webhook] PATCH failed (${patchRes.status}), attempting UPSERT`
    );

    const insertData = {
      workspace_id: workspaceId,
      ...updateData,
      seat_count: 1, // default
      created_at: new Date().toISOString(),
    };

    const postRes = await supabaseAdminFetch(`/workspace_subscriptions`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(insertData),
    });

    if (!postRes.ok) {
      const errText = await postRes.text();
      console.error(
        `[Stripe Webhook] Failed to upsert workspace_subscriptions for ${workspaceId}:`,
        errText
      );
      throw new Error(`Failed to upsert workspace_subscriptions: ${errText}`);
    }

    console.log(
      `[Stripe Webhook] Inserted workspace_subscriptions for ${workspaceId}`
    );
  } else {
    console.log(
      `[Stripe Webhook] Updated workspace_subscriptions for ${workspaceId}`
    );
  }
}

/**
 * Handle customer.subscription.updated event.
 * Update workspace_subscriptions status and current_period_end.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;

  let status: string;
  switch (subscription.status) {
    case "active":
    case "trialing":
      status = "active";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
    case "unpaid":
      status = "canceled";
      break;
    default:
      status = subscription.status;
  }

  const updateData = {
    status,
    current_period_end: new Date(
      (subscription as any).current_period_end * 1000
    ).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await supabaseAdminFetch(
    `/workspace_subscriptions?stripe_subscription_id=eq.${subscriptionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updateData),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(
      `[Stripe Webhook] Failed to update subscription ${subscriptionId}:`,
      errText
    );
    throw new Error(`Failed to update subscription: ${errText}`);
  }

  console.log(
    `[Stripe Webhook] Updated subscription ${subscriptionId} -> status=${status}`
  );
}

/**
 * Handle customer.subscription.deleted event.
 * Mark workspace_subscriptions as canceled.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;

  const updateData = {
    status: "canceled",
    current_period_end: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const res = await supabaseAdminFetch(
    `/workspace_subscriptions?stripe_subscription_id=eq.${subscriptionId}`,
    {
      method: "PATCH",
      body: JSON.stringify(updateData),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(
      `[Stripe Webhook] Failed to delete subscription ${subscriptionId}:`,
      errText
    );
    throw new Error(`Failed to delete subscription: ${errText}`);
  }

  console.log(
    `[Stripe Webhook] Deleted (canceled) subscription ${subscriptionId}`
  );
}

/**
 * Handle credit_topup checkout.session.completed event.
 * Adds credits to the workspace balance and records in ledger.
 */
async function handleCreditTopup(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  if (!metadata?.workspace_id || !metadata?.credit_amount || !metadata?.user_id) {
    console.error(
      `[Stripe Webhook] credit_topup missing required metadata (session: ${session.id})`,
      metadata
    );
    return;
  }

  const workspaceId = metadata.workspace_id;
  const userId = metadata.user_id;
  const packageKey = metadata.package_key ?? "unknown";
  const creditAmount = parseInt(metadata.credit_amount, 10);

  if (isNaN(creditAmount) || creditAmount <= 0) {
    console.error(
      `[Stripe Webhook] credit_topup invalid credit_amount: ${metadata.credit_amount}`
    );
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for webhook");
  }

  // Ensure workspace_credits row exists
  const checkRes = await supabaseAdminFetch(
    `/workspace_credits?workspace_id=eq.${workspaceId}&select=balance`,
    { method: "GET", headers: { Prefer: "return=representation" } }
  );

  if (checkRes.ok) {
    const rows = await checkRes.json();
    if (!rows || rows.length === 0) {
      await supabaseAdminFetch("/workspace_credits", {
        method: "POST",
        body: JSON.stringify({ workspace_id: workspaceId, balance: 0 }),
      });
    }
  }

  // Call consume_credits RPC in "topup" mode using raw Supabase REST RPC endpoint
  const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/add_credits`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_workspace_id: workspaceId,
      p_user_id: userId,
      p_amount: creditAmount,
      p_package_key: packageKey,
      p_stripe_payment_intent: (session.payment_intent as string) ?? null,
    }),
  });

  if (!rpcRes.ok) {
    const errText = await rpcRes.text();
    console.error(`[Stripe Webhook] add_credits RPC failed for workspace ${workspaceId}:`, errText);
    throw new Error(`add_credits RPC failed: ${errText}`);
  }

  console.log(
    `[Stripe Webhook] Added ${creditAmount} credits to workspace ${workspaceId} (package: ${packageKey})`
  );
}

/**
 * Handle team workspace creation after successful payment.
 * Creates workspace, membership, and subscription records.
 * Idempotent: safe for webhook retries and concurrent calls.
 */
async function handleTeamWorkspaceCreation(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  if (!metadata?.workspace_name || !metadata?.user_id || !metadata?.plan_key) {
    console.error(
      `[Stripe Webhook] Team workspace creation missing required metadata (session: ${session.id})`,
      metadata
    );
    return;
  }

  const workspaceName = metadata.workspace_name;
  const userId = metadata.user_id;
  const planKey = metadata.plan_key;
  const billingCycle = metadata.billing_cycle || "monthly";

  // Extract Stripe subscription ID
  const stripeSubscriptionId = session.subscription as string | undefined;
  if (!stripeSubscriptionId) {
    console.error(
      `[Stripe Webhook] Team workspace creation missing subscription ID (session: ${session.id})`
    );
    return;
  }

  // Idempotency check: verify if this subscription was already processed
  const checkRes = await supabaseAdminFetch(
    `/workspace_subscriptions?stripe_subscription_id=eq.${stripeSubscriptionId}&select=workspace_id`,
    {
      method: "GET",
      headers: {
        Prefer: "return=representation",
      },
    }
  );

  if (checkRes.ok) {
    const existing = await checkRes.json();
    if (existing && existing.length > 0) {
      const existingWorkspaceId = existing[0].workspace_id;
      console.log(
        JSON.stringify({
          kind: "team",
          stripeSubscriptionId,
          workspaceName,
          chosenWorkspaceId: existingWorkspaceId,
          result: "already_processed",
        })
      );
      return;
    }
  }

  // Generate workspace ID
  const workspaceId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  const now = new Date().toISOString();

  try {
    // 1. Create workspace (type='company')
    const workspaceRes = await supabaseAdminFetch("/workspaces", {
      method: "POST",
      body: JSON.stringify({
        id: workspaceId,
        type: "company",
        name: workspaceName,
        created_at: now,
      }),
    });

    if (!workspaceRes.ok) {
      const errText = await workspaceRes.text();
      throw new Error(`Failed to create workspace: ${errText}`);
    }

    console.log(
      `[Stripe Webhook] Created team workspace ${workspaceId} (${workspaceName})`
    );

    // 2. Create workspace member (owner)
    const memberRes = await supabaseAdminFetch("/workspace_members", {
      method: "POST",
      body: JSON.stringify({
        workspace_id: workspaceId,
        user_id: userId,
        role: "owner",
        display_name: "Owner", // TODO: fetch from user profile if needed
        created_at: now,
      }),
    });

    if (!memberRes.ok) {
      const errText = await memberRes.text();
      throw new Error(`Failed to create workspace member: ${errText}`);
    }

    console.log(
      `[Stripe Webhook] Created workspace member for user ${userId}`
    );

    // 3. Retrieve subscription for current_period_end
    let currentPeriodEnd: number | null = null;
    try {
      const subscription = await stripe.subscriptions.retrieve(
        stripeSubscriptionId
      );
      currentPeriodEnd = (subscription as any).current_period_end;
    } catch (err) {
      console.error(
        `[Stripe Webhook] Failed to retrieve subscription ${stripeSubscriptionId}:`,
        err instanceof Error ? err.message : err
      );
    }

    // 4. Create workspace subscription
    const subscriptionData = {
      workspace_id: workspaceId,
      plan_key: planKey,
      billing_cycle: billingCycle,
      status: "active",
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: stripeSubscriptionId,
      seat_count: 1, // default
      created_at: now,
      updated_at: now,
      ...(currentPeriodEnd && {
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      }),
    };

    const subscriptionRes = await supabaseAdminFetch(
      "/workspace_subscriptions",
      {
        method: "POST",
        body: JSON.stringify(subscriptionData),
      }
    );

    if (!subscriptionRes.ok) {
      const errText = await subscriptionRes.text();
      
      // Handle race condition: if unique constraint violation, re-fetch and return
      if (errText.includes("duplicate key") || errText.includes("unique constraint")) {
        console.log(
          `[Stripe Webhook] Detected race condition for ${stripeSubscriptionId}, re-fetching existing record`
        );
        
        const racedRes = await supabaseAdminFetch(
          `/workspace_subscriptions?stripe_subscription_id=eq.${stripeSubscriptionId}&select=workspace_id`,
          {
            method: "GET",
            headers: {
              Prefer: "return=representation",
            },
          }
        );
        
        if (racedRes.ok) {
          const racedData = await racedRes.json();
          if (racedData && racedData.length > 0) {
            const racedWorkspaceId = racedData[0].workspace_id;
            console.log(
              JSON.stringify({
                kind: "team",
                stripeSubscriptionId,
                workspaceName,
                chosenWorkspaceId: racedWorkspaceId,
                result: "raced",
              })
            );
            return;
          }
        }
      }
      
      throw new Error(`Failed to create workspace subscription: ${errText}`);
    }

    console.log(
      `[Stripe Webhook] Created workspace subscription for ${workspaceId}`
    );

    console.log(
      JSON.stringify({
        kind: "team",
        stripeSubscriptionId,
        workspaceName,
        chosenWorkspaceId: workspaceId,
        result: "created",
      })
    );
  } catch (error) {
    console.error(
      `[Stripe Webhook] Error creating team workspace:`,
      error instanceof Error ? error.message : error
    );
    // Note: We don't rollback here to avoid data inconsistency
    // Admin should manually check and fix if needed
    throw error;
  }
}
