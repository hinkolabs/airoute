"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, X, ShieldCheck } from "lucide-react";
import {
  PERSONAL_PLANS,
  type BillingCycle,
  type PersonalPlanId,
  formatUsd,
} from "@/lib/billing/plans";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { getEntitlements } from "@/lib/billing/entitlements";
import { useAuthOptional } from "@/app/_providers/use-auth-optional";

type PaymentProvider = 'toss' | 'stripe';

function formatKrw(amount: number): string {
  return '₩' + Math.round(amount).toLocaleString('ko-KR');
}

function calculateYearlyPricing(monthlyKrw: number) {
  const includedMonthsFree = 2;
  const discountedYearTotal = monthlyKrw * (12 - includedMonthsFree);
  const originalYearTotal = monthlyKrw * 12;
  const effectiveMonthly = discountedYearTotal / 12;
  return {
    discountedYearTotal,
    originalYearTotal,
    effectiveMonthly,
  };
}

export default function PricingTableKr() {
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const { user } = useAuthOptional();
  
  // All hooks at the top - fixed order
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [selectedPlan, setSelectedPlan] = useState<PersonalPlanId | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState<PersonalPlanId | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('toss');
  const [faqOpen, setFaqOpen] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<{
    plan_key: string;
    billing_cycle: BillingCycle;
    status: string;
    seat_count: number;
  } | null>(null);

  // Fetch existing subscription on mount
  useEffect(() => {
    if (workspaceLoading || !activeWorkspace?.workspace?.id) {
      return;
    }

    const fetchSubscription = async () => {
      try {
        const res = await fetch(
          `/api/workspace/subscription?workspace_id=${activeWorkspace.workspace.id}`
        );
        if (!res.ok) {
          console.warn("Failed to fetch subscription");
          return;
        }
        const data = await res.json();
        if (data.subscription) {
          setCurrentSubscription(data.subscription);
          setBillingCycle(data.subscription.billing_cycle as BillingCycle);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscription();
  }, [activeWorkspace?.workspace?.id, workspaceLoading]);

  const entitlement = getEntitlements({
    workspaceType: activeWorkspace?.workspace?.type ?? null,
    subscription: currentSubscription,
  });

  // Open modal when card is clicked
  const handleCardClick = (planId: PersonalPlanId) => {
    setModalPlan(planId);
    setSelectedPlan(planId);
    setPaymentProvider('toss'); // Reset to default
    setModalOpen(true);
    setSaveError(null);
  };

  // Close modal
  const handleCloseModal = () => {
    if (!isSaving) {
      setModalOpen(false);
      setModalPlan(null);
      setPaymentProvider('toss');
      setSaveError(null);
    }
  };

  // Toggle features in card
  const toggleFeatures = (planId: string) => {
    setExpandedFeatures(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  // Handle checkout from modal
  const handleCheckout = async () => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login with return url including plan selection
      const returnUrl = `/kr/workspace/billing?plan=${modalPlan}&cycle=${billingCycle}&provider=${paymentProvider}`;
      window.location.href = `/login?next=${encodeURIComponent(returnUrl)}`;
      return;
    }

    if (!activeWorkspace?.workspace?.id || !modalPlan) {
      setSaveError("워크스페이스 또는 플랜 정보가 없습니다");
      return;
    }

    // Remember workspace id for success page fallback
    try {
      window.sessionStorage.setItem("ar_last_workspace_id", activeWorkspace.workspace.id);
    } catch {}

    setIsSaving(true);
    setSaveError(null);

    try {
      // Step 1: Save subscription choice
      const saveRes = await fetch("/api/workspace/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: activeWorkspace.workspace.id,
          plan_key: modalPlan,
          billing_cycle: billingCycle,
        }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json();
        throw new Error(errorData.error || "저장에 실패했습니다");
      }

      // Step 2: Create Checkout Session based on provider
      if (paymentProvider === 'toss') {
        const checkoutRes = await fetch("/api/billing/toss/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_id: activeWorkspace.workspace.id,
            plan_key: modalPlan,
            billing_cycle: billingCycle,
          }),
        });

        if (!checkoutRes.ok) {
          const errorData = await checkoutRes.json();
          // Handle 501 (Not Implemented) gracefully
          if (checkoutRes.status === 501) {
            throw new Error("토스 결제는 곧 지원 예정입니다. 잠시만 기다려 주세요.");
          }
          throw new Error(errorData.error || "결제 세션 생성에 실패했습니다");
        }

        const { url } = await checkoutRes.json();
        
        if (!url) {
          throw new Error("결제 URL을 받지 못했습니다");
        }

        // Redirect to Toss Checkout
        window.location.href = url;
      } else {
        // Stripe checkout
        const checkoutRes = await fetch("/api/billing/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_id: activeWorkspace.workspace.id,
            plan_key: modalPlan,
            billing_cycle: billingCycle,
          }),
        });

        if (!checkoutRes.ok) {
          const errorData = await checkoutRes.json();
          if (checkoutRes.status === 501) {
            throw new Error("Stripe 결제는 곧 지원 예정입니다. 잠시만 기다려 주세요.");
          }
          throw new Error(errorData.error || "결제 세션 생성에 실패했습니다");
        }

        const { url } = await checkoutRes.json();
        
        if (!url) {
          throw new Error("결제 URL을 받지 못했습니다");
        }

        // Redirect to Stripe Checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      setSaveError(error instanceof Error ? error.message : "결제 시작 중 오류가 발생했습니다");
      setIsSaving(false);
    }
  };

  // Get plan details for modal
  const modalPlanData = modalPlan ? PERSONAL_PLANS.find(p => p.id === modalPlan) : null;
  const isCurrentPlanInModal = modalPlan === currentSubscription?.plan_key && entitlement.isActive;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
          플랜 선택
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          AI 자동화로 업무를 효율화하세요
        </p>
      </div>

      {/* Active Subscription Notice */}
      {entitlement.isActive && (
        <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card px-4 py-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">
              현재: {entitlement.planKey === 'starter' ? '스타터' : '프로'} · {entitlement.billingCycle === 'yearly' ? '연간 결제' : '월간 결제'}
            </span>
            {entitlement.currentPeriodEnd && (
              <span className="text-xs text-muted-foreground">
                갱신일: {new Date(entitlement.currentPeriodEnd).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
              billingCycle === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`relative rounded-full px-5 py-1.5 text-sm font-medium transition ${
              billingCycle === "yearly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            연간
            <span className="ml-1.5 text-xs opacity-80">
              (2개월 무료)
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-4xl gap-5 md:gap-6 md:grid-cols-2 px-4">
        {PERSONAL_PLANS.map((plan) => {
          const isRecommended = !!plan.badge_kr;
          const isCurrentPlan = currentSubscription?.plan_key === plan.id && entitlement.isActive;
          
          // Split features: first 3 core, rest extra
          const coreFeatures = plan.features_kr.slice(0, 3);
          const extraFeatures = plan.features_kr.slice(3);
          const hasExtraFeatures = extraFeatures.length > 0;
          const showingExtra = expandedFeatures[plan.id];

          // Calculate yearly pricing
          const yearlyPricing = calculateYearlyPricing(plan.price_monthly_krw);

          // Button label logic
          let buttonLabel = "선택하기";
          let buttonDisabled = false;

          if (user) {
            if (isCurrentPlan) {
              buttonLabel = "현재 이용 중";
              buttonDisabled = true;
            } else if (plan.id === 'pro' && currentSubscription?.plan_key === 'starter') {
              buttonLabel = "프로로 업그레이드";
            } else if (!currentSubscription || currentSubscription.status !== 'active') {
              buttonLabel = "시작하기";
            } else {
              buttonLabel = "변경하기";
            }
          }

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border-2 p-6 transition-all ${
                isRecommended
                  ? "border-primary/50 bg-card"
                  : "border-border bg-card"
              }`}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="absolute -top-2.5 left-6">
                  <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                    {plan.badge_kr}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  {plan.name_kr}
                </h3>
              </div>

              {/* Price - Monthly: show monthly, Yearly: show effective monthly as main */}
              <div className="mb-6">
                {billingCycle === "yearly" ? (
                  // Yearly: Show effective monthly as main price
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground tracking-tight">
                        {formatKrw(yearlyPricing.effectiveMonthly)}
                      </span>
                      <span className="text-base text-muted-foreground">/ 월</span>
                    </div>
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        연 {formatKrw(yearlyPricing.discountedYearTotal)} 결제 · 2개월 무료
                      </p>
                      <p className="text-xs text-muted-foreground line-through">
                        정가 연 {formatKrw(yearlyPricing.originalYearTotal)}
                      </p>
                    </div>
                  </>
                ) : (
                  // Monthly: Show monthly price as main
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground tracking-tight">
                        {formatKrw(plan.price_monthly_krw)}
                      </span>
                      <span className="text-base text-muted-foreground">/ 월</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      월 단위 결제
                    </p>
                  </>
                )}
              </div>

              {/* Core Features */}
              <div className="flex-1 mb-6">
                <ul className="space-y-2.5">
                  {coreFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Extra features - Collapsible */}
                {hasExtraFeatures && (
                  <div className="mt-4">
                    {showingExtra && (
                      <ul className="space-y-2.5 mb-3">
                        {extraFeatures.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                            <span className="text-sm text-muted-foreground leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      onClick={() => toggleFeatures(plan.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                      <span>{showingExtra ? '간단히 보기' : '자세히 보기'}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${showingExtra ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <div className="mt-auto">
                <button
                  onClick={() => handleCardClick(plan.id)}
                  disabled={buttonDisabled}
                  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    buttonDisabled
                      ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                      : isRecommended
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-card text-foreground border-2 border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {buttonLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mx-auto max-w-4xl px-4">
        <button
          onClick={() => setFaqOpen(!faqOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-left transition hover:bg-muted/50"
        >
          <span className="text-sm font-medium text-foreground">
            결제 방식 안내
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              faqOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {faqOpen && (
          <div className="mt-2 rounded-lg border border-border bg-card px-4 py-3">
            <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                <span>
                  연간 결제는 2개월 무료(10개월치 결제)입니다.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                <span>
                  개인 플랜(스타터/프로)은 Personal Workspace에서만 사용됩니다.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                <span>
                  비즈 플랜은 Biz Workspace에서만 표시되며(좌석/인원 기반), 추후 추가됩니다.
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Confirmation Modal - ChatGPT style */}
      {modalOpen && modalPlanData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {modalPlanData.name_kr} 플랜
                </h3>
                <div className="mt-2">
                  {billingCycle === "yearly" ? (
                    // Yearly: Show effective monthly as main
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          {formatKrw(calculateYearlyPricing(modalPlanData.price_monthly_krw).effectiveMonthly)}
                        </span>
                        <span className="text-muted-foreground">/ 월</span>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-sm text-muted-foreground">
                          연 {formatKrw(calculateYearlyPricing(modalPlanData.price_monthly_krw).discountedYearTotal)} 결제 · 2개월 무료
                        </p>
                        <p className="text-xs text-muted-foreground line-through">
                          정가 연 {formatKrw(calculateYearlyPricing(modalPlanData.price_monthly_krw).originalYearTotal)}
                        </p>
                      </div>
                    </>
                  ) : (
                    // Monthly: Show monthly price as main
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          {formatKrw(modalPlanData.price_monthly_krw)}
                        </span>
                        <span className="text-muted-foreground">/ 월</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        월 단위 결제
                      </p>
                    </>
                  )}
                  {paymentProvider === 'stripe' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      ({formatUsd(modalPlanData.price_monthly_usd)} / mo)
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSaving}
                className="text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Current plan notice */}
              {isCurrentPlanInModal && (
                <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
                  <p className="text-sm text-foreground font-medium">
                    현재 이용 중인 플랜입니다
                  </p>
                </div>
              )}

              {/* Features */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  포함 사항
                </h4>
                <ul className="space-y-2.5">
                  {modalPlanData.features_kr.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-foreground leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Provider Selection */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  결제 수단
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 rounded-lg border-2 border-border bg-card px-4 py-3 cursor-pointer transition hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="payment-provider"
                      value="toss"
                      checked={paymentProvider === 'toss'}
                      onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}
                      className="h-4 w-4 text-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">토스페이먼츠 (원화)</p>
                      <p className="text-xs text-muted-foreground">국내 카드/계좌이체</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border-2 border-border bg-card px-4 py-3 cursor-pointer transition hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input
                      type="radio"
                      name="payment-provider"
                      value="stripe"
                      checked={paymentProvider === 'stripe'}
                      onChange={(e) => setPaymentProvider(e.target.value as PaymentProvider)}
                      className="h-4 w-4 text-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Stripe (USD, 해외 결제)</p>
                      <p className="text-xs text-muted-foreground">해외 카드 지원</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-4 py-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {paymentProvider === 'toss' 
                    ? '토스 페이먼츠로 안전하게 결제됩니다. 언제든지 취소할 수 있습니다.'
                    : 'Stripe로 안전하게 결제됩니다. 언제든지 취소할 수 있습니다.'}
                </p>
              </div>

              {/* Error message */}
              {saveError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <p className="text-sm text-destructive">{saveError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-border px-6 py-4">
              <button
                onClick={handleCloseModal}
                disabled={isSaving}
                className="flex-1 rounded-lg border-2 border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                닫기
              </button>
              <button
                onClick={handleCheckout}
                disabled={isSaving || isCurrentPlanInModal}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving 
                  ? "처리 중..." 
                  : isCurrentPlanInModal 
                  ? "현재 플랜" 
                  : "결제 계속하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
