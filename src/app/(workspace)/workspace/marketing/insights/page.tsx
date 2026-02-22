/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
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
    day: "Monday",
    time: "08:00",
  },
  keywords: [
    {
      keyword: "AI Agent",
      reason: "All 5 global big tech companies announced agents",
      channel: "Blog",
    },
    {
      keyword: "Subscription Fatigue",
      reason: "Subscription cancellation rate +18% vs 2023 (KR)",
      channel: "SNS",
    },
    {
      keyword: "Influencer ROI",
      reason: "Micro-influencer conversion rate 3.2x higher than mega",
      channel: "Blog",
    },
  ],
  moneyFlow: [
    {
      title: "Exchange rate breaks 1,450 KRW → Foreign SaaS price increases ahead",
      actions: [
        "Emphasize annual payment discount promo (currency hedge)",
        "KR alternative comparison content (target price-sensitive users)",
      ],
    },
    {
      title: "B2B purchase decision delay: Average review period +22% increase",
      actions: [
        "Free trial → strengthen onboarding care",
        "Deploy ROI calculator + customer testimonial content",
      ],
    },
  ],
  history: [
    { date: "2026-01-06", title: "5 New Year Marketing Trends", status: "sent" },
    { date: "2025-12-30", title: "2025 Wrap-up & 2026 Strategy", status: "sent" },
    { date: "2025-12-23", title: "7 Year-end Promotion Ideas", status: "sent" },
    { date: "2025-12-16", title: "B2B SaaS Subscription Optimization", status: "sent" },
    { date: "2025-12-09", title: "Latest Social Commerce Trends", status: "sent" },
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

const TAB_KEYS = ["overview", "settings"] as const;
type TabKey = typeof TAB_KEYS[number];

function normalizeTab(value: string | null): TabKey {
  return TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : "overview";
}

function InsightsLetterContent() {
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
        <h1 className="text-xl font-semibold">Weekly Briefing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Unable to load workspace. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Page Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl font-semibold">Weekly Briefing</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every Monday at 8 AM, receive industry trends + this week's actions via email.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={safeActiveTab} onValueChange={handleTabChange} defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start gap-2 mb-6">
            <TabsTrigger value="overview" className="min-w-[80px]">
              Overview
            </TabsTrigger>
            {isManager ? (
              <TabsTrigger value="settings" className="min-w-[80px]">
                Settings
              </TabsTrigger>
            ) : (
              <div className="min-w-[80px] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
                Settings
                <Badge tone="muted" className="text-xs">
                  Admin only
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
                Settings required
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To receive insight letters, please configure industry, audience, keywords, etc.
              </p>
            </div>
            {isManager ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToSettings}
              >
                Configure
              </Button>
            ) : (
              <Badge tone="muted" className="text-xs whitespace-nowrap">
                Ask admin
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Top Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
          title="Next Send"
          value={`${SAMPLE_REPORT.nextSend.day} ${SAMPLE_REPORT.nextSend.time}`}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          title="Key Keywords This Week"
          value={`${SAMPLE_REPORT.keywords.length} items`}
        />
      </div>

      {/* Section A: This Week Summary */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold">This Week Summary</h2>

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
                
                {/* CTA buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Link
                    href={`/workspace/marketing/auto-posting?intent=keyword&value=${encodeURIComponent(item.keyword)}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Apply to Auto Posting
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
                
                {/* CTA buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Link
                    href={`/workspace/marketing/auto-posting?intent=trigger&value=${encodeURIComponent(item.title)}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Apply to Auto Posting
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section B: Recent Send History */}
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Send History</h2>
          <Link
            href="/workspace/marketing/history"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            View All History →
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
                  {item.status === "sent" ? "Sent" : "Scheduled"}
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
}

function SettingsTab({ workspaceId, settings: initialSettings, onSettingsUpdate }: SettingsTabProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [region, setRegion] = useState("");
  const [offerings, setOfferings] = useState<string[]>([]);
  const [priceTier, setPriceTier] = useState("");
  const [primaryChannels, setPrimaryChannels] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [quarterlyGoal, setQuarterlyGoal] = useState("");
  const [weeklyKpi, setWeeklyKpi] = useState("");
  const [forbiddenClaims, setForbiddenClaims] = useState<string[]>([]);
  const [seedKeywords, setSeedKeywords] = useState<string[]>([]);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);

  // Load initial settings
  useEffect(() => {
    if (initialSettings) {
      const s = initialSettings;
      setIndustry(s.industry || "");
      setAudience(s.audience || "");
      setRegion(s.region || "");
      setOfferings(s.offerings || []);
      setPriceTier(s.price_tier || "");
      setPrimaryChannels(s.primary_channels || []);
      setRole(s.role || "");
      setQuarterlyGoal(s.quarterly_goal || "");
      setWeeklyKpi(s.weekly_kpi || "");
      setForbiddenClaims(s.forbidden_claims || []);
      setSeedKeywords(s.seed_keywords || []);
      setCompetitorUrls(s.competitor_urls || []);
    }
  }, [initialSettings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError(null);

      const payload: Omit<InsightLetterSettings, "id" | "created_at" | "updated_at"> = {
        workspace_id: workspaceId,
        industry,
        audience,
        region,
        offerings,
        price_tier: priceTier,
        primary_channels: primaryChannels,
        role,
        quarterly_goal: quarterlyGoal,
        weekly_kpi: weeklyKpi,
        forbidden_claims: forbiddenClaims,
        seed_keywords: seedKeywords,
        competitor_urls: competitorUrls,
      };

      const res = await fetch(`/api/workspaces/${workspaceId}/insight-letter-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Save failed");
      }

      const data = await res.json();
      onSettingsUpdate(data.settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Helper functions for array inputs
  const addToArray = (
    arr: string[],
    setter: (arr: string[]) => void,
    value: string,
    max: number
  ) => {
    if (!value.trim() || arr.length >= max) return;
    setter([...arr, value.trim()]);
  };

  const removeFromArray = (arr: string[], setter: (arr: string[]) => void, idx: number) => {
    setter(arr.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error && !industry) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Settings</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure information to be reflected in insight letters. These settings apply to the entire workspace.
        </p>

        <div className="space-y-6">
          {/* Industry */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Industry / Sector <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g.) Travel, Logistics, SaaS, Healthcare"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Audience / Target <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g.) B2B SMEs, 20-30 females, Corporate marketers"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Region / Market
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g.) Korea, Global, Southeast Asia"
            />
          </div>

          {/* Seed Keywords */}
          <ArrayInput
            label="Key Keywords (max 10)"
            items={seedKeywords}
            onAdd={(val) => addToArray(seedKeywords, setSeedKeywords, val, 10)}
            onRemove={(idx) => removeFromArray(seedKeywords, setSeedKeywords, idx)}
            placeholder="e.g.) Travel, Logistics, Automation"
            max={10}
          />

          {/* Error */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              disabled={saving || !industry || !audience}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            {saved && (
              <Badge tone="primary" className="text-xs">
                Saved
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for array inputs
interface ArrayInputProps {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  max: number;
}

function ArrayInput({ label, items, onAdd, onRemove, placeholder, max }: ArrayInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    onAdd(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-2">{label}</label>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
          disabled={items.length >= max}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!inputValue.trim() || items.length >= max}
        >
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <Badge
              key={idx}
              tone="primary"
              className="text-xs flex items-center gap-1 cursor-pointer hover:bg-primary/80"
              onClick={() => onRemove(idx)}
            >
              {item}
              <span className="ml-1 font-bold">×</span>
            </Badge>
          ))}
        </div>
      )}
      {items.length >= max && (
        <p className="text-xs text-muted-foreground mt-2">
          Maximum {max} items allowed.
        </p>
      )}
    </div>
  );
}

export default function InsightsLetterPage() {
  return (
    <Suspense fallback={
      <div className="w-full px-6 py-8">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-24 w-full animate-pulse rounded bg-muted" />
      </div>
    }>
      <InsightsLetterContent />
    </Suspense>
  );
}

