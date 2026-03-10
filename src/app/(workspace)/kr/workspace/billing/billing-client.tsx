"use client";

import { useState } from "react";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";
import CreditHistory from "./_components/credit-history";
import CreditTopupModal from "../_components/credit-topup-modal";

type BillingCycle = "monthly" | "yearly";
type PlanId = "starter" | "pro";

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
    id: "starter",
    name: "스타터",
    monthly: 49000,
    yearly: {
      perMonth: 40833,
      total: 490000,
    },
    features: [
      "Credit 1,000 P / 월",
      "기본 말투 3종 (친절 / 발랄 / 전문)",
      "무료 스톡 이미지",
      "수동 플랜 설정",
      "판정단 일반 모드 (일 5회)",
    ],
  },
  {
    id: "pro",
    name: "프로",
    badge: "추천",
    monthly: 99000,
    yearly: {
      perMonth: 82500,
      total: 990000,
    },
    features: [
      "Credit 5,000 P / 월",
      "Custom Tone (내 말투 복제)",
      "DALL·E 이미지 생성",
      "AI 자동 추천 플랜 (트렌드 반영)",
      "판정단 비즈니스 모드 (일 20회)",
    ],
  },
];

const TEAM_PLANS: PlanData[] = [
  {
    id: "starter",
    name: "Standard",
    monthly: 149000,
    yearly: {
      perMonth: 124167,
      total: 1490000,
    },
    features: [
      "Credit 3,000 P / 월",
      "기본 말투 3종 (친절 / 발랄 / 전문)",
      "무료 스톡 이미지",
      "수동 플랜 설정",
      "판정단 일반 모드 (일 10회)",
    ],
  },
  {
    id: "pro",
    name: "Premium",
    badge: "추천",
    monthly: 299000,
    yearly: {
      perMonth: 249167,
      total: 2990000,
    },
    features: [
      "Credit 10,000 P / 월",
      "Custom Tone (내 말투 복제)",
      "DALL·E 이미지 생성",
      "AI 자동 추천 플랜 (트렌드 반영)",
      "판정단 비즈니스 모드 (일 30회)",
    ],
  },
];

function formatKrw(amount: number): string {
  return "₩" + Math.round(amount).toLocaleString("ko-KR");
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
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isCompanyWorkspace = workspace.workspaceType === "company";
  const PLANS = isCompanyWorkspace ? TEAM_PLANS : PERSONAL_PLANS;

  // TODO: subscription 정보가 서버에서 내려오면 사용. 현재는 subscription prop 기반으로 판별
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

  const handleCheckout = async () => {
    if (!selectedPlan) return;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspace.id,
          plan_key: selectedPlan.id,
          billing_cycle: billingCycle,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "결제 세션 생성에 실패했습니다");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("[Billing] Checkout error:", err);
      setCheckoutError(err instanceof Error ? err.message : "결제 중 오류가 발생했습니다");
      setIsCheckingOut(false);
    }
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
        throw new Error(data.message || "구독 취소에 실패했습니다");
      }

      // Close modal and show success
      setIsCancelModalOpen(false);
      alert("구독이 취소되었습니다. 페이지를 새로고침합니다.");
      window.location.reload();
    } catch (err) {
      console.error("[Billing] Cancel subscription error:", err);
      setCancelError(err instanceof Error ? err.message : "구독 취소에 실패했습니다");
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
          <span>구독 및 결제</span>
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
            플랜 선택
          </button>
          <button
            onClick={() => setActiveTab("credits")}
            className={`px-6 py-3 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === "credits"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            크레딧 내역
          </button>
        </div>
        {/* Plans Tab Content */}
        {activeTab === "plans" && (
          <>
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                {isCompanyWorkspace ? "팀 플랜" : "플랜 선택"}
              </h1>
              <p className="text-muted-foreground">
                AI 자동화로 업무를 효율화하세요
              </p>
              {/* Cancel Subscription - subtle secondary action */}
              {isActiveSub && (
                <div className="pt-2">
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="h-4 w-4" />
                    구독 취소
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
              월간
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              연간 <span className="ml-1 text-xs">(2개월 무료)</span>
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
                      나의 현재 플랜
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
                      {formatKrw(price)}
                    </span>
                    <span className="text-muted-foreground">/ 월</span>
                  </div>
                  {billingCycle === "yearly" && (
                    <div className="mt-2 space-y-0.5">
                      <p className="text-sm text-muted-foreground">
                        연 {formatKrw(plan.yearly.total)} 결제
                      </p>
                      <p className="text-sm text-muted-foreground">
                        2개월 무료 적용
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
                  {isCurrent ? "현재 플랜" : "선택하기"}
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
                        {formatKrw(selectedPlan.monthly)}
                      </span>
                      <span className="text-muted-foreground">/ 월</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          {formatKrw(selectedPlan.yearly.perMonth)}
                        </span>
                        <span className="text-muted-foreground">/ 월</span>
                      </div>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-sm text-muted-foreground">
                          연 {formatKrw(selectedPlan.yearly.total)} 결제
                        </p>
                        <p className="text-sm text-muted-foreground">
                          2개월 무료 적용
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
                  포함 사항
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
                  Stripe로 안전하게 결제됩니다.
                </p>
                <p className="text-sm text-foreground">
                  언제든지 해지 예약이 가능합니다.
                </p>
              </div>

              {checkoutError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
                  {checkoutError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-border px-6 py-4">
              <button
                onClick={handleCloseModal}
                disabled={isCheckingOut}
                className="flex-1 rounded-lg border-2 border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                닫기
              </button>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  "결제 계속하기"
                )}
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
                  구독 취소
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
                구독을 취소하시겠습니까? 구독이 즉시 종료되며, 이후 유료 기능을 사용할 수 없습니다.
              </p>
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  워크스페이스: <span className="font-medium text-foreground">{workspace.name}</span>
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
                돌아가기
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-white transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? "취소 중..." : "구독 취소"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
