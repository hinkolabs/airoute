/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, TrendingUp, Mail, ExternalLink } from "lucide-react";

// Sample data for the page
const SAMPLE_REPORT = {
  nextSend: {
    day: "월요일",
    time: "08:00",
  },
  keywords: [
    {
      keyword: "AI 에이전트",
      reason: "글로벌 빅테크 5곳이 모두 에이전트 발표",
      channel: "Blog",
    },
    {
      keyword: "구독경제 피로도",
      reason: "23년 대비 구독취소율 +18% 증가 (KR)",
      channel: "SNS",
    },
    {
      keyword: "인플루언서 ROI",
      reason: "마이크로 인플루언서 전환율이 메가보다 3.2배 높음",
      channel: "Blog",
    },
  ],
  moneyFlow: [
    {
      title: "환율 1,450원 돌파 → 해외 SaaS 가격 인상 예고",
      actions: [
        "연간 결제 할인 프로모션 강조 (환율 방어)",
        "KR 대체재 비교 콘텐츠 (가격 민감층 공략)",
      ],
    },
    {
      title: "B2B 구매 결정 지연: 평균 검토 기간 +22% 증가",
      actions: [
        "무료 체험 → 온보딩 케어 강화",
        "ROI 계산기 + 고객 후기 콘텐츠 배포",
      ],
    },
  ],
  history: [
    { date: "2026-01-06", title: "신년 마케팅 트렌드 5가지", status: "sent" },
    { date: "2025-12-30", title: "2025 결산 & 2026 전략", status: "sent" },
    { date: "2025-12-23", title: "연말 프로모션 아이디어 7선", status: "sent" },
    { date: "2025-12-16", title: "B2B SaaS 구독 최적화", status: "sent" },
    { date: "2025-12-09", title: "소셜 커머스 최신 트렌드", status: "sent" },
  ],
};

interface InsightLetterSettings {
  id?: string;
  workspace_id: string;
  industry: string;
  audience: string;
  region: string;
  offerings: string[];
  price_tier: string;
  primary_channels: string[];
  role: string;
  quarterly_goal: string;
  weekly_kpi: string;
  forbidden_claims: string[];
  seed_keywords: string[];
  competitor_urls: string[];
  created_at?: string;
  updated_at?: string;
}

// New interface for insight letter settings UI
interface InsightLetterSettingsUI {
  industry: string;
  region: string;
  business_desc: string;
  target_audience: string;
  product_keywords: string[];
  exclude_keywords: string[];
  competitors: string[];
  enabled: boolean;
  send_day_of_week: number;
  send_time: string;
  timezone: string;
  preferred_channels: string[];
}


const TAB_KEYS = ["overview", "settings"] as const;
type TabKey = typeof TAB_KEYS[number];

function normalizeTab(value: string | null): TabKey {
  return TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : "overview";
}


export default function InsightsLetterPage() {
  const { activeWorkspace, loading } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settings, setSettings] = useState<InsightLetterSettings | null>(null);

  // Tab state from query string
  const activeTab = useMemo(() => normalizeTab(searchParams.get("tab")), [searchParams]);

  // Role-based access control
  const userRole = activeWorkspace?.role || "member";
  const isManager = userRole === "owner" || userRole === "admin";
  const isPersonalWorkspace = activeWorkspace?.workspaceType === "personal";
  const canEditGlobal = isPersonalWorkspace || isManager;

  // Safe active tab: non-managers cannot access settings
  const safeActiveTab = useMemo(() => {
    if (!isManager && activeTab === "settings") {
      return "overview";
    }
    return activeTab;
  }, [activeTab, isManager]);

  // Fetch settings
  useEffect(() => {
    if (loading || !activeWorkspace) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(
          `/api/workspaces/${activeWorkspace.workspace.id}/insight-letter-settings`
        );
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, [activeWorkspace, loading]);

  // Handle tab change
  const handleTabChange = useCallback((next: string) => {
    const newTab = normalizeTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const handleNavigateToSettings = useCallback(() => {
    handleTabChange("settings");
  }, [handleTabChange]);

  if (loading || settingsLoading) {
    return (
      <div className="w-full px-6 py-8">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-24 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="w-full px-6 py-8">
        <h1 className="text-xl font-semibold">주간 브리핑</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          워크스페이스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Page Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold">주간 브리핑</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            워크스페이스 전체가 공유하는 업계 인사이트 + 전략 리포트를 매주 이메일로 받아보세요.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={safeActiveTab} onValueChange={handleTabChange} defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start gap-2 mb-6">
            <TabsTrigger value="overview" className="min-w-[80px]">
              한눈에 보기
            </TabsTrigger>
            {isManager ? (
              <TabsTrigger value="settings" className="min-w-[80px]">
                설정
              </TabsTrigger>
            ) : (
              <div className="min-w-[80px] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
                설정
                <Badge tone="muted" className="text-xs">
                  관리자만
                </Badge>
              </div>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="pt-2">
            <OverviewTab
              settings={settings}
              isManager={isManager}
              onNavigateToSettings={handleNavigateToSettings}
            />
          </TabsContent>

          {/* Settings Tab */}
          {isManager && (
            <TabsContent value="settings" className="pt-2">
              <SettingsTab 
                workspaceId={activeWorkspace.workspace.id}
                settings={settings}
                onSettingsUpdate={setSettings}
                isPersonalWorkspace={isPersonalWorkspace}
                canEditGlobal={canEditGlobal}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================
// Overview Tab Component
// ============================================================
interface OverviewTabProps {
  settings: InsightLetterSettings | null;
  isManager: boolean;
  onNavigateToSettings: () => void;
}

function OverviewTab({ settings, isManager, onNavigateToSettings }: OverviewTabProps) {
  const hasSettings = settings && settings.industry;

  return (
    <div className="space-y-8">
      {/* Settings Warning Card */}
      {!hasSettings && (
        <div className="rounded-lg border-2 border-orange-500/30 bg-orange-500/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground mb-2">
                설정이 필요합니다
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                인사이트 레터를 받으시려면 산업, 고객층, 키워드 등을 먼저 설정해주세요.
              </p>
            </div>
            {isManager ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToSettings}
              >
                설정하기
              </Button>
            ) : (
              <Badge tone="muted" className="text-xs whitespace-nowrap">
                관리자에게 요청하세요
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          title="다음 발송"
          value={`${SAMPLE_REPORT.nextSend.day} ${SAMPLE_REPORT.nextSend.time}`}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          title="이번 주 핵심 키워드"
          value={`${SAMPLE_REPORT.keywords.length}개`}
        />
      </div>

      {/* Section A: 이번 주 요약 */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold">이번 주 요약</h2>

        {/* Hot Keywords */}
        <div className="mb-8">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            🔥 Hot Keyword
          </h3>
          <div className="space-y-3">
            {SAMPLE_REPORT.keywords.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-background p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{item.keyword}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {item.reason}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                      {item.channel}
                    </span>
                  </div>
                </div>
                
                {/* CTA 버튼 2개 */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Link
                    href={`/kr/workspace/marketing/auto-posting?intent=keyword&value=${encodeURIComponent(item.keyword)}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    <ExternalLink className="h-3 w-3" />
                    자동포스팅으로 적용
                  </Link>
                  <Link
                    href={`/kr/workspace/marketing/landing?intent=keyword&value=${encodeURIComponent(item.keyword)}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    <ExternalLink className="h-3 w-3" />
                    랜딩페이지에 반영
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Money Flow */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            💰 Money Flow / Market Trigger
          </h3>
          <div className="space-y-4">
            {SAMPLE_REPORT.moneyFlow.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-background p-4 space-y-3"
              >
                <div className="font-medium">{item.title}</div>
                <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                  {item.actions.map((action, aIdx) => (
                    <li key={aIdx} className="leading-relaxed">
                      {action}
                    </li>
                  ))}
                </ul>
                
                {/* CTA 버튼 2개 */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Link
                    href={`/kr/workspace/marketing/auto-posting?intent=trigger&value=${encodeURIComponent(item.title)}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    <ExternalLink className="h-3 w-3" />
                    자동포스팅으로 적용
                  </Link>
                  <Link
                    href={`/kr/workspace/marketing/landing?intent=trigger&value=${encodeURIComponent(item.title)}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    <ExternalLink className="h-3 w-3" />
                    랜딩페이지에 반영
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section B: 최근 발송 히스토리 */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 발송 히스토리</h2>
          <Link
            href="/kr/workspace/marketing/history"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            전체 히스토리 보기 →
          </Link>
        </div>
        <div className="space-y-2">
          {SAMPLE_REPORT.history.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.date}
                  </div>
                </div>
              </div>
              <div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    item.status === "sent"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {item.status === "sent" ? "발송됨" : "예약됨"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">{icon}</div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{title}</div>
    </div>
  );
}

// ============================================================
// Settings Tab Component
// ============================================================
interface SettingsTabProps {
  workspaceId: string;
  settings: InsightLetterSettings | null;
  onSettingsUpdate: (settings: InsightLetterSettings | null) => void;
  isPersonalWorkspace: boolean;
  canEditGlobal: boolean;
}

function SettingsTab({
  workspaceId,
  settings: initialSettings,
  onSettingsUpdate,
  isPersonalWorkspace,
  canEditGlobal,
}: SettingsTabProps) {
  // Form state for insight letter settings
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("KR");
  const [businessDesc, setBusinessDesc] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [productKeywords, setProductKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [sendDayOfWeek, setSendDayOfWeek] = useState(1); // Monday
  const [sendTime, setSendTime] = useState("08:00");
  const [timezone, setTimezone] = useState("Asia/Seoul");
  const [preferredChannels, setPreferredChannels] = useState<string[]>(["email"]);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing settings
  useEffect(() => {
    if (initialSettings) {
      setIndustry(initialSettings.industry || "");
      setRegion(initialSettings.region || "KR");
      setBusinessDesc(initialSettings.quarterly_goal || ""); // Map to business_desc
      setTargetAudience(initialSettings.audience || "");
      setProductKeywords((initialSettings.seed_keywords || []).join(", "));
      setExcludeKeywords((initialSettings.forbidden_claims || []).join(", "));
      setCompetitors((initialSettings.competitor_urls || []).join(", "));
    }
  }, [initialSettings]);

  // Handler to save global settings
  const handleSaveGlobalSettings = async () => {
    try {
      setSaving(true);
      setSaved(false);
      
      const payload = {
        industry,
        audience: targetAudience,
        region,
        offerings: [], // Not used for insights
        price_tier: "", // Not used for insights
        primary_channels: preferredChannels,
        role: "", // Not used for insights
        quarterly_goal: businessDesc, // Map business_desc to quarterly_goal
        weekly_kpi: "", // Not used for insights
        forbidden_claims: excludeKeywords.split(",").map(k => k.trim()).filter(Boolean),
        seed_keywords: productKeywords.split(",").map(k => k.trim()).filter(Boolean),
        competitor_urls: competitors.split(",").map(k => k.trim()).filter(Boolean),
      };
      
      const res = await fetch(`/api/workspaces/${workspaceId}/insight-letter-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "저장 실패");
      }
      
      const data = await res.json();
      if (data.settings) {
        onSettingsUpdate(data.settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save insight letter settings:", err);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Permission Warning */}
      {!canEditGlobal && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          워크스페이스 설정은 관리자만 수정할 수 있습니다.
        </div>
      )}
      
      {/* Main Settings Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">브리핑 설정</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              워크스페이스 전체에 적용되는 인사이트 브리핑 설정입니다. 대표와 팀원 모두에게 같은 내용이 발송됩니다.
            </p>
          </div>
          {!canEditGlobal && (
            <Badge tone="muted" className="text-xs">관리자만</Badge>
          )}
        </div>

        <div className="space-y-6">
          {/* Section 1: 기본 정보 */}
          <div className="space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">기본 정보</h3>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                업종 선택 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                placeholder="예) SaaS, 이커머스, 교육, 여행, 금융"
                disabled={!canEditGlobal}
              />
              <p className="text-xs text-muted-foreground mt-1">
                추적할 업계를 입력하세요. 이 업종의 최신 트렌드를 분석합니다.
              </p>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                주요 시장 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                placeholder="예) KR, US, Global"
                disabled={!canEditGlobal}
              />
              <p className="text-xs text-muted-foreground mt-1">
                주로 사업하는 지역 또는 추적할 시장을 입력하세요.
              </p>
            </div>

            {/* Business Description */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                사업 소개
              </label>
              <textarea
                value={businessDesc}
                onChange={(e) => setBusinessDesc(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] leading-relaxed disabled:opacity-50"
                placeholder="예) B2B SaaS 마케팅 자동화 플랫폼. 중소기업/스타트업 대상으로 이메일 마케팅과 SNS 포스팅을 자동화하는 서비스입니다."
                disabled={!canEditGlobal}
              />
              <p className="text-xs text-muted-foreground mt-1">
                사업 내용을 간단히 설명해주세요. AI가 맞춤형 인사이트를 제공하는데 활용됩니다.
              </p>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                타겟 고객
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                placeholder="예) 스타트업 마케터, 1인 사업자, 중소기업 대표"
                disabled={!canEditGlobal}
              />
              <p className="text-xs text-muted-foreground mt-1">
                주요 고객층을 입력하세요. 이 고객층의 트렌드를 우선적으로 분석합니다.
              </p>
            </div>
          </div>

          {/* Section 2: 추적 주제 */}
          <div className="space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">추적 주제</h3>
            </div>

            {/* Product Keywords */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                관심 키워드 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={productKeywords}
                onChange={(e) => setProductKeywords(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                placeholder="쉼표(,)로 구분해서 입력하세요"
                disabled={!canEditGlobal}
              />
              <p className="text-xs text-muted-foreground mt-1">
                추적하고 싶은 키워드를 입력하세요. 예) 마케팅 자동화, AI 에이전트, n8n, 콘텐츠 마케팅
              </p>
            </div>

            {/* Exclude Keywords */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                제외 키워드
              </label>
              <input
                type="text"
                value={excludeKeywords}
                onChange={(e) => setExcludeKeywords(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                placeholder="쉼표(,)로 구분해서 입력하세요"
                disabled={!canEditGlobal}
              />
              <p className="text-xs text-muted-foreground mt-1">
                브리핑에서 제외할 키워드를 입력하세요. 예) 할인, 이벤트, 쿠폰
              </p>
            </div>

            {/* Competitors */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                경쟁사 추적
              </label>
              <input
                type="text"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                placeholder="경쟁사 이름 또는 URL (쉼표로 구분)"
                disabled={!canEditGlobal}
              />
              <p className="text-xs text-muted-foreground mt-1">
                경쟁사를 입력하면 해당 업체의 동향도 함께 분석해드립니다. 예) 경쟁사A, https://competitor.com
              </p>
            </div>
          </div>

          {/* Section 3: 발송 설정 */}
          <div className="space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground">발송 설정</h3>
            </div>

            {/* Send Schedule */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  발송 요일
                </label>
                <select
                  value={sendDayOfWeek}
                  onChange={(e) => setSendDayOfWeek(Number(e.target.value))}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  disabled={!canEditGlobal}
                >
                  <option value={1}>월요일</option>
                  <option value={2}>화요일</option>
                  <option value={3}>수요일</option>
                  <option value={4}>목요일</option>
                  <option value={5}>금요일</option>
                  <option value={6}>토요일</option>
                  <option value={0}>일요일</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  발송 시각
                </label>
                <input
                  type="time"
                  value={sendTime}
                  onChange={(e) => setSendTime(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  disabled={!canEditGlobal}
                />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                시간대
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                placeholder="Asia/Seoul"
                disabled={!canEditGlobal}
              />
            </div>

            {/* Preferred Channels */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                수신 채널
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferredChannels.includes("email")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPreferredChannels([...preferredChannels, "email"]);
                      } else {
                        setPreferredChannels(preferredChannels.filter(ch => ch !== "email"));
                      }
                    }}
                    className="rounded border-border focus:ring-2 focus:ring-primary disabled:opacity-50"
                    disabled={!canEditGlobal}
                  />
                  <span className="text-sm text-foreground">이메일</span>
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                현재는 이메일만 지원합니다. (추후 Slack, 카카오톡 추가 예정)
              </p>
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-border focus:ring-2 focus:ring-primary disabled:opacity-50"
                  disabled={!canEditGlobal}
                />
                <span className="text-sm font-semibold text-foreground">주간 브리핑 활성화</span>
              </label>
            </div>
          </div>

          {/* Save Button */}
          {canEditGlobal && (
            <div className="flex items-center gap-3 pt-6 border-t border-border">
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveGlobalSettings}
                disabled={saving || !industry || !region || !productKeywords}
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
              {saved && (
                <span className="text-sm text-primary">저장되었습니다</span>
              )}
              {(!industry || !region || !productKeywords) && (
                <span className="text-xs text-muted-foreground">
                  * 필수 항목을 입력해주세요
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Premium Features - Coming Soon */}
      <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-foreground">고급 인사이트 엔진</h3>
            <Badge tone="muted" className="text-xs">Premium · Coming Soon</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            더 깊이있는 분석과 실행 전략을 제공하는 프리미엄 기능이 곧 추가됩니다.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <span className="text-xs text-primary">✓</span>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">경쟁사 자동 분석</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                경쟁사의 마케팅 전략, 신규 기능, 고객 반응을 자동으로 추적하고 비교 분석합니다.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <span className="text-xs text-primary">✓</span>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">실행 전략 추천</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                단순 트렌드 정보가 아닌, 우리 비즈니스에 적용 가능한 구체적인 액션 플랜을 제안합니다.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <span className="text-xs text-primary">✓</span>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">자동포스팅 연계</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                인사이트 키워드를 클릭 한 번으로 자동포스팅 또는 랜딩페이지에 즉시 반영할 수 있습니다.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <span className="text-xs text-primary">✓</span>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">맞춤형 리포트</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                업종별, 직무별 특화 템플릿으로 더 정확한 인사이트를 제공합니다.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Premium 플랜 출시 시 기존 사용자에게 우선 안내드립니다.
          </p>
        </div>
      </div>
    </div>
  );
}
