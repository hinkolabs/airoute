"use client";

import { useState } from "react";
import { Check, Users } from "lucide-react";

interface PersonalPricingProps {
  currentPlan?: string;
}

export default function PersonalPricing({ currentPlan = "starter" }: PersonalPricingProps) {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "무료",
      description: "개인 사용자를 위한 기본 플랜",
      features: [
        "월 100개 토큰",
        "기본 자동화 템플릿",
        "이메일 지원",
        "1개 워크스페이스",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "₩9,900/월",
      description: "파워 유저를 위한 프로 플랜",
      features: [
        "월 1,000개 토큰",
        "모든 자동화 템플릿",
        "우선 지원",
        "무제한 워크스페이스",
        "고급 분석",
        "API 액세스",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">개인 플랜</h2>
        <p className="mt-2 text-muted-foreground">
          개인 사용자를 위한 플랜을 선택하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isRecommended = plan.id === "pro";

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border p-6 transition ${
                isRecommended
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    추천
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="mb-6 space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isCurrent
                    ? "border border-border bg-muted text-muted-foreground cursor-default"
                    : isRecommended
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-transparent text-foreground hover:bg-muted"
                }`}
                disabled={isCurrent}
              >
                {isCurrent ? "현재 플랜" : plan.id === "starter" ? "현재 플랜" : "업그레이드"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
