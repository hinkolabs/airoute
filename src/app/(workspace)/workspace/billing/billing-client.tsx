"use client";

import { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import CreditHistory from "./_components/credit-history";
import CreditTopupModal from "../_components/credit-topup-modal";

type BillingCycle = "monthly" | "yearly";
type PlanId = "standard" | "premium";

interface PlanData {
  id: PlanId;
  name: string;
  badge?: string;
  monthly: number;
  yearly: {
    perMonth: number;
    total: number;
  };
  features: string[];
}

const PERSONAL_PLANS: PlanData[] = [
  {
    id: "standard",
    name: "Starter",
    monthly: 49,
    yearly: {
      perMonth: 41,
      total: 490,
    },
    features: [
      "1,000 Credits / month",
      "3 basic tones (Friendly / Casual / Professional)",
      "Free stock images",
      "Manual plan settings",
      "AI Verdict standard mode (5/day)",
    ],
  },
  {
    id: "premium",
    name: "Pro",
    badge: "Recommended",
    monthly: 99,
    yearly: {
      perMonth: 83,
      total: 990,
    },
    features: [
      "5,000 Credits / month",
      "Custom Tone (clone your voice)",
      "DALL·E image generation",
      "AI auto-suggested plans (trend-aware)",
      "AI Verdict business mode (20/day)",
    ],
  },
];

const TEAM_PLANS: PlanData[] = [
  {
    id: "standard",
    name: "Standard",
    monthly: 149,
    yearly: {
      perMonth: 124,
      total: 1490,
    },
    features: [
      "3,000 Credits / month",
      "3 basic tones (Friendly / Casual / Professional)",
      "Free stock images",
      "Manual plan settings",
      "AI Verdict standard mode (10/day)",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    badge: "Recommended",
    monthly: 299,
    yearly: {
      perMonth: 249,
      total: 2990,
    },
    features: [
      "10,000 Credits / month",
      "Custom Tone (clone your voice)",
      "DALL·E image generation",
      "AI auto-suggested plans (trend-aware)",
      "AI Verdict business mode (30/day)",
    ],
  },
];

function formatUsd(amount: number): string {
  return "$" + amount.toLocaleString("en-US");
}

interface BillingPageClientProps {
  workspace: {
    id: string;
    name: string;
    workspaceType: "personal" | "company";
  };
  isSystemAdmin?: boolean;
  subscription?: {
    status: string;
    plan_key: string;
  } | null;
}

export default function BillingPageClient({ workspace, isSystemAdmin = false, subscription = null }: BillingPageClientProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"plans" | "credits">("plans");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isCompanyWorkspace = workspace.workspaceType === "company";
  const PLANS = isCompanyWorkspace ? TEAM_PLANS : PERSONAL_PLANS;

  // TODO: subscription info from server. Currently based on subscription prop
  const currentPlanKey = subscription?.plan_key ?? null;
  const isActiveSub = subscription?.status === "active";

  const handleSelectPlan = (plan: PlanData) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPlan(null);
  };

  const handleCheckout = () => {
    // TODO: Implement actual checkout logic
    console.log("Checkout:", selectedPlan?.id, billingCycle);
    handleCloseModal();
  };

  const handleToppedUp = (newBalance: number) => {
    setIsTopupModalOpen(false);
    // Refresh credit history component by toggling tab
    if (activeTab === "credits") {
      setActiveTab("plans");
      setTimeout(() => setActiveTab("credits"), 10);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    setCancelError(null);

    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspace.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Failed to cancel subscription");
      }

      // Close modal and show success
      setIsCancelModalOpen(false);
      alert("Subscription cancelled. Refreshing page.");
      window.location.reload();
    } catch (err) {
      console.error("[Billing] Cancel subscription error:", err);
      setCancelError(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="px-4 py-8 md:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>{workspace.name}</span>
          <span>/</span>
          <span>Billing & Subscription</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-6 py-3 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === "plans"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Plans
          </button>
          <button
            onClick={() => setActiveTab("credits")}
            className={`px-6 py-3 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === "credits"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Credit History
          </button>
        </div>

        {/* Plans Tab Content */}
        {activeTab === "plans" && (
          <>
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                {isCompanyWorkspace ? "Team Plans" : "Choose a Plan"}
              </h1>
              <p className="text-muted-foreground">
                Boost your productivity with AI automation
              </p>
              {/* Cancel Subscription - subtle secondary action */}
              {isActiveSub && (
                <div className="pt-2">
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="h-4 w-4" />
                    Cancel subscription
                  </button>
                </div>
              )}
            </div>

            {/* Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card p-1">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    billingCycle === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                    billingCycle === "yearly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yearly <span className="ml-1 text-xs">(2 months free)</span>
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {PLANS.map((plan) => {
                const isPremium = plan.id === "premium";
                const price =
                  billingCycle === "monthly" ? plan.monthly : plan.yearly.perMonth;
                const isCurrent = isActiveSub && currentPlanKey === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border-2 p-6 transition-all ${
                      isCurrent
                        ? "border-primary shadow-lg shadow-primary/20"
                        : isPremium
                        ? "border-primary/50 shadow-lg shadow-primary/10"
                        : "border-border"
                    } bg-card`}
                  >
                    {plan.badge && !isCurrent && (
                      <div className="absolute -top-3 left-6">
                        <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                          {plan.badge}
                        </span>
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 right-6">
                        <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                          Current plan
                        </span>
                      </div>
                    )}

                    {/* Plan name */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-foreground">
                        {plan.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground">
                          {formatUsd(price)}
                        </span>
                        <span className="text-muted-foreground">/ month</span>
                      </div>
                      {billingCycle === "yearly" && (
                        <div className="mt-2 space-y-0.5">
                          <p className="text-sm text-muted-foreground">
                            {formatUsd(plan.yearly.total)} billed annually
                          </p>
                          <p className="text-sm text-muted-foreground">
                            2 months free included
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="mb-8 space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                          <span className="text-sm text-foreground leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => !isCurrent && handleSelectPlan(plan)}
                      disabled={isCurrent}
                      className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
                        isCurrent
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : isPremium
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-card text-foreground border-2 border-border hover:border-primary"
                      }`}
                    >
                      {isCurrent ? "Current plan" : "Select"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Credits Tab Content */}
        {activeTab === "credits" && (
          <CreditHistory
            workspaceId={workspace.id}
            onTopupClick={() => setIsTopupModalOpen(true)}
            isSystemAdmin={isSystemAdmin}
          />
        )}
      </div>

      {/* Modal */}
      {modalOpen && selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {selectedPlan.name}
                </h3>
                <div>
                  {billingCycle === "monthly" ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        {formatUsd(selectedPlan.monthly)}
                      </span>
                      <span className="text-muted-foreground">/ month</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          {formatUsd(selectedPlan.yearly.perMonth)}
                        </span>
                        <span className="text-muted-foreground">/ month</span>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-sm text-muted-foreground">
                          {formatUsd(selectedPlan.yearly.total)} billed annually
                        </p>
                        <p className="text-sm text-muted-foreground">
                          2 months free included
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Features */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  What&apos;s included
                </h4>
                <ul className="space-y-2.5">
                  {selectedPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                      <span className="text-sm text-foreground leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Notice */}
              <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1">
                <p className="text-sm text-foreground">
                  Secure payment via Stripe.
                </p>
                <p className="text-sm text-foreground">
                  Cancel anytime from your dashboard.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-border px-6 py-4">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-lg border-2 border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Topup Modal */}
      <CreditTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        workspaceId={workspace.id}
        onToppedUp={handleToppedUp}
      />

      {/* Cancel Subscription Modal */}
      {isCancelModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !isCancelling && setIsCancelModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-card border border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <h3 className="text-lg font-semibold text-foreground">
                  Cancel Subscription
                </h3>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="text-muted-foreground hover:text-foreground transition disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-foreground leading-relaxed">
                Are you sure you want to cancel? Your subscription will end immediately and you will lose access to paid features.
              </p>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Workspace: <span className="font-medium text-foreground">{workspace.name}</span>
                </p>
              </div>

              {cancelError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
                  {cancelError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-white transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
