"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import type { BillingCycle } from "@/lib/billing/plans";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workspaceId: string) => void;
}

// Team plans (simplified for modal display)
const TEAM_PLANS = [
  {
    id: 'team-starter',
    name: 'Starter',
    price_monthly_usd: 29,
    features: ['멤버당 월 1,000 토큰', '자동화 템플릿 3개', '기본 지원'],
    badge: undefined,
  },
  {
    id: 'team-pro',
    name: 'Pro',
    badge: '추천',
    price_monthly_usd: 79,
    features: ['멤버당 월 10,000 토큰', '자동화 템플릿 무제한', '우선 지원', 'API 액세스'],
  },
] as const;

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkspaceModalProps) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePlanSelect = async (planId: string) => {
    // Validate workspace name
    const trimmedName = workspaceName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 40) {
      setError("워크스페이스 이름은 2~40자 사이여야 합니다");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create checkout session for team workspace
      const response = await fetch("/api/billing/team/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceName: trimmedName,
          planKey: planId,
          billingCycle,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "결제 세션 생성에 실패했습니다");
      }

      const { url } = await response.json();
      
      if (!url) {
        throw new Error("결제 URL을 받지 못했습니다");
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error("[CreateWorkspaceModal] Error:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
      setIsCreating(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isCreating) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl rounded-lg bg-card border border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              팀 워크스페이스 만들기
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              팀 워크스페이스는 멤버 2명 이상부터 사용합니다. 결제 후 생성됩니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground transition hover:text-foreground"
            disabled={isCreating}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="mb-5">
            <label
              htmlFor="workspace-name"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              워크스페이스 이름
            </label>
            <input
              id="workspace-name"
              type="text"
              value={workspaceName}
              onChange={(e) => {
                setWorkspaceName(e.target.value);
                setError(null);
              }}
              placeholder="예: 마케팅팀"
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              maxLength={40}
              disabled={isCreating}
              autoFocus
            />
            <p className="mt-1 text-xs text-muted-foreground">
              2~40자 사이로 입력해주세요
            </p>
          </div>

          <div className="mb-5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
            <p className="leading-relaxed">
              개인 워크스페이스는 1개만 사용할 수 있습니다.<br />
              새 워크스페이스는 팀 워크스페이스로 생성되며, 별도 구독이 필요합니다.
            </p>
          </div>

          {/* Pricing Section */}
          <div className="border-t border-border pt-5">
            <h3 className="mb-4 text-base font-semibold text-foreground">
              팀 요금제
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              {TEAM_PLANS.map((plan) => {
                const isRecommended = !!plan.badge;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-lg border p-4 transition-all ${
                      isRecommended
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <div className="mb-3">
                      <h4 className="text-base font-bold text-foreground">
                        {plan.name}
                      </h4>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">
                          ${plan.price_monthly_usd}
                        </span>
                        <span className="text-xs text-muted-foreground">/ 월</span>
                      </div>
                    </div>

                    <ul className="mb-4 flex-1 space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="text-xs text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handlePlanSelect(plan.id)}
                      disabled={isCreating || workspaceName.trim().length < 2}
                      className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? "결제 페이지로 이동 중..." : "결제 후 팀 워크스페이스 생성"}
                    </button>
                  </div>
                );
              })}
            </div>

            {workspaceName.trim().length < 2 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                워크스페이스 이름을 먼저 입력해주세요
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
