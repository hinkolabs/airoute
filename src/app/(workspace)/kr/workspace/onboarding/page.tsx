"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/_providers/auth-provider";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { Sparkles, Building2, Target, ArrowRight, Check, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, label: "브랜드", icon: Building2 },
  { id: 2, label: "타겟 · 업종", icon: Target },
  { id: 3, label: "시작하기", icon: Sparkles },
] as const;

const INDUSTRY_OPTIONS = [
  "여행/관광", "보험/금융", "렌탈/리스", "부동산", "교육/학원",
  "뷰티/미용", "음식/식음료", "의류/패션", "건강/헬스케어", "IT/소프트웨어", "기타",
];

const KEYWORD_SUGGESTIONS = [
  "가격 경쟁력", "품질", "빠른 응대", "전문성", "신뢰도",
  "다양한 옵션", "맞춤 서비스", "A/S 보장",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeWorkspace, refreshWorkspace } = useWorkspace();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Brand
  const [brandName, setBrandName] = useState("");
  const [companyProfile, setCompanyProfile] = useState("");

  // Step 2: Target & Industry
  const [industry, setIndustry] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState("");

  useEffect(() => {
    if (!user) router.replace("/kr/login?next=/kr/workspace/onboarding");
  }, [user, router]);

  // Redirect if already onboarded (brand_name is set)
  useEffect(() => {
    if (!activeWorkspace) return;
    const checkOnboarded = async () => {
      const res = await fetch(
        `/api/workspace/manager-settings?workspace_id=${activeWorkspace.workspace.id}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.brand_name) {
          router.replace("/kr/workspace");
        }
      }
    };
    checkOnboarded();
  }, [activeWorkspace, router]);

  const toggleKeyword = (kw: string) => {
    setKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  const addCustomKeyword = () => {
    const trimmed = customKeyword.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
    }
    setCustomKeyword("");
  };

  const handleSaveAndNext = async () => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/workspace/manager-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: activeWorkspace.workspace.id,
          brand_name: brandName.trim(),
          company_profile: companyProfile.trim(),
          industry,
          seed_keywords: keywords,
        }),
      });

      if (!res.ok) {
        throw new Error("설정 저장에 실패했습니다");
      }

      await refreshWorkspace?.();
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const canGoStep2 = brandName.trim().length >= 2;
  const canSave = canGoStep2 && industry.length > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AIRoute 시작하기</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            브랜드 정보를 입력하면 AI가 자동으로 콘텐츠를 만들어드립니다
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, idx) => {
            const isCompleted = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                    isCompleted
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span className={`text-xs ${isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 ${step > s.id ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">

          {/* Step 1: Brand */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">브랜드 정보</h2>
                <p className="text-sm text-muted-foreground">AI가 콘텐츠를 만들 때 사용합니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  브랜드명 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="예: 제주 한라 여행사"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  브랜드 소개 <span className="text-muted-foreground text-xs">(선택)</span>
                </label>
                <textarea
                  value={companyProfile}
                  onChange={(e) => setCompanyProfile(e.target.value)}
                  placeholder="예: 제주도 전문 소규모 여행사로, 맞춤형 일정과 현지 가이드로 차별화합니다."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed resize-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Step 2: Target & Industry */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">업종 · 키워드</h2>
                <p className="text-sm text-muted-foreground">AI가 관련 콘텐츠를 추천합니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  업종 <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setIndustry(opt)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        industry === opt
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  핵심 키워드 <span className="text-muted-foreground text-xs">(선택, 복수 선택)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {KEYWORD_SUGGESTIONS.map((kw) => (
                    <button
                      key={kw}
                      onClick={() => toggleKeyword(kw)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        keywords.includes(kw)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {keywords.includes(kw) && <span className="mr-1">✓</span>}
                      {kw}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customKeyword}
                    onChange={(e) => setCustomKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomKeyword()}
                    placeholder="직접 입력 후 Enter"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    onClick={addCustomKeyword}
                    className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition"
                  >
                    추가
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition"
                >
                  이전
                </button>
                <button
                  onClick={handleSaveAndNext}
                  disabled={!canSave || isSaving}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      저장하기 <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Complete & CTA */}
          {step === 3 && (
            <>
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">설정 완료!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>{brandName}</strong>의 브랜드 정보가 저장되었습니다.
                  <br />
                  구독을 시작하면 2일마다 AI 콘텐츠가 자동으로 생성됩니다.
                </p>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">스타터 플랜 · ₩49,000/월</p>
                <ul className="space-y-1.5">
                  {[
                    "월 15개 마케팅 콘텐츠 자동 생성",
                    "2일마다 이메일로 콘텐츠 배달",
                    "블로그용 + SNS용 동시 생성",
                    "언제든 해지 가능",
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/kr/workspace/billing")}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  구독 시작하기
                </button>
                <button
                  onClick={() => router.push("/kr/workspace")}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition"
                >
                  나중에 하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
