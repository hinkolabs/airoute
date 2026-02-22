"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";

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

interface InsightLetterSettingsProps {
  workspaceId: string;
}

export function InsightLetterSettings({ workspaceId }: InsightLetterSettingsProps) {
  const [loading, setLoading] = useState(true);
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

  // Fetch existing settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await fetch(`/api/workspaces/${workspaceId}/insight-letter-settings`);
        if (!res.ok) {
          if (res.status === 403) {
            setError("관리자 권한이 필요합니다");
          } else {
            setError("설정을 불러오는데 실패했습니다");
          }
          return;
        }
        const data = await res.json();
        if (data.settings) {
          const s = data.settings;
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
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("설정을 불러오는데 실패했습니다");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [workspaceId]);

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
        throw new Error(errData.error || "저장 실패");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "저장 실패");
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
        <div className="text-muted-foreground">로딩 중...</div>
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
        <h2 className="text-xl font-bold text-foreground mb-4">설정</h2>
        <p className="text-sm text-muted-foreground mb-6">
          인사이트 레터에 반영될 정보를 입력하세요. 이 설정은 워크스페이스 전체에 적용됩니다.
        </p>

        <div className="space-y-6">
          {/* Industry */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              산업 / 업종 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예) 여행, 물류, SaaS, 헬스케어"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              고객층 / 타겟 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예) B2B 중소기업, 2030 여성, 기업 마케터"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              지역 / 시장
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예) 한국, 글로벌, 동남아"
            />
          </div>

          {/* Offerings (Array) */}
          <ArrayInput
            label="제공 서비스/상품 (최대 3개)"
            items={offerings}
            onAdd={(val) => addToArray(offerings, setOfferings, val, 3)}
            onRemove={(idx) => removeFromArray(offerings, setOfferings, idx)}
            placeholder="예) 경로 최적화 솔루션"
            max={3}
          />

          {/* Price Tier */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              가격대
            </label>
            <input
              type="text"
              value={priceTier}
              onChange={(e) => setPriceTier(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예) 월 50만원대, 무료+유료, 엔터프라이즈"
            />
          </div>

          {/* Primary Channels (Array) */}
          <ArrayInput
            label="주요 마케팅 채널 (최대 10개)"
            items={primaryChannels}
            onAdd={(val) => addToArray(primaryChannels, setPrimaryChannels, val, 10)}
            onRemove={(idx) => removeFromArray(primaryChannels, setPrimaryChannels, idx)}
            placeholder="예) 블로그, 이메일, 인스타그램"
            max={10}
          />

          {/* Role */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              담당 역할
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예) 마케팅 매니저, CMO, 콘텐츠 기획자"
            />
          </div>

          {/* Quarterly Goal */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              분기 목표
            </label>
            <textarea
              value={quarterlyGoal}
              onChange={(e) => setQuarterlyGoal(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] leading-relaxed"
              placeholder="예) 가입자 2배 증가, 브랜드 인지도 30% 상승"
            />
          </div>

          {/* Weekly KPI */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              주간 KPI
            </label>
            <input
              type="text"
              value={weeklyKpi}
              onChange={(e) => setWeeklyKpi(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예) 블로그 방문자 1000명, 전환율 3%"
            />
          </div>

          {/* Forbidden Claims (Array) */}
          <ArrayInput
            label="사용 금지 문구 (최대 20개)"
            items={forbiddenClaims}
            onAdd={(val) => addToArray(forbiddenClaims, setForbiddenClaims, val, 20)}
            onRemove={(idx) => removeFromArray(forbiddenClaims, setForbiddenClaims, idx)}
            placeholder="예) 무조건, 최고의, 1등"
            max={20}
          />

          {/* Seed Keywords (Array) */}
          <ArrayInput
            label="핵심 키워드 (최대 10개)"
            items={seedKeywords}
            onAdd={(val) => addToArray(seedKeywords, setSeedKeywords, val, 10)}
            onRemove={(idx) => removeFromArray(seedKeywords, setSeedKeywords, idx)}
            placeholder="예) 여행, 물류, 자동화"
            max={10}
          />

          {/* Competitor URLs (Array) */}
          <ArrayInput
            label="경쟁사 URL (최대 3개)"
            items={competitorUrls}
            onAdd={(val) => addToArray(competitorUrls, setCompetitorUrls, val, 3)}
            onRemove={(idx) => removeFromArray(competitorUrls, setCompetitorUrls, idx)}
            placeholder="예) https://competitor.com"
            max={3}
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
              {saving ? "저장 중..." : "저장"}
            </Button>
            {saved && (
              <Badge tone="primary" className="text-xs">
                저장 완료
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
          추가
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
          최대 {max}개까지 입력 가능합니다.
        </p>
      )}
    </div>
  );
}
