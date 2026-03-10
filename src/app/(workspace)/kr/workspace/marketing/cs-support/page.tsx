"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TAB_KEYS = ["overview", "instant", "history", "settings"] as const;
type TabKey = typeof TAB_KEYS[number];

function normalizeTab(value: string | null): TabKey {
  return TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : "overview";
}

// Manager Settings structure
interface ManagerSettings {
  brand_name?: string;
  logo_url?: string;
  company_profile?: string;
  attachments?: { name: string; size: number; type: string }[];
}

// User Marketing Settings structure
interface UserMarketingSettings {
  id?: string;
  workspace_id: string;
  user_id: string;
  tone_preset: string;
  tone_example: string;
  personal_keywords: string[];
  exclude_keywords: string[];
  personal_notes: string;
  created_at?: string;
  updated_at?: string;
}

const TONE_PRESETS = {
  practical: {
    labelKr: "실무형",
    previewKr: "안녕하세요, 고객님의 문의에 답변드립니다.",
  },
  friendly: {
    labelKr: "친근한",
    previewKr: "안녕하세요! 문의 주셔서 감사합니다.",
  },
  luxury: {
    labelKr: "고급스러운",
    previewKr: "고객님의 소중한 의견에 감사드립니다.",
  },
  witty: {
    labelKr: "위트있는",
    previewKr: "안녕하세요! 궁금하신 점을 해결해드릴게요.",
  },
} as const;

type ToneKey = keyof typeof TONE_PRESETS;

export default function KrWorkspaceMarketingCsSupportPage() {
  const { activeWorkspace, loading } = useWorkspace();
  const searchParams = useSearchParams();
  
  const [managerSettings, setManagerSettings] = useState<ManagerSettings | null>(null);
  const [loadingManagerSettings, setLoadingManagerSettings] = useState(true);
  
  // User marketing settings state
  const [userSettings, setUserSettings] = useState<UserMarketingSettings | null>(null);
  const [loadingUserSettings, setLoadingUserSettings] = useState(true);
  const [savingUserSettings, setSavingUserSettings] = useState(false);
  const [userSettingsSaved, setUserSettingsSaved] = useState(false);
  
  const [instantQuery, setInstantQuery] = useState("");
  const [instantContext, setInstantContext] = useState("");
  const [instantType, setInstantType] = useState<"review_reply" | "inquiry_reply" | "claim_response">("inquiry_reply");
  const [instantGenerating, setInstantGenerating] = useState(false);
  const [instantResult, setInstantResult] = useState<string | null>(null);
  const [instantError, setInstantError] = useState<string | null>(null);
  const [instantCopied, setInstantCopied] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"personal" | "global">("personal");
  
  // Personal settings form state
  const [personalTone, setPersonalTone] = useState<ToneKey>("practical");
  const [personalToneExample, setPersonalToneExample] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [personalIncludeKeywords, setPersonalIncludeKeywords] = useState("");
  const [personalExcludeKeywords, setPersonalExcludeKeywords] = useState("");

  // Tab state from query string
  const activeTab = useMemo(() => normalizeTab(searchParams.get("tab")), [searchParams]);

  // Handle tab change
  const handleTabChange = useCallback((next: string) => {
    const newTab = normalizeTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.replaceState(null, "", url.toString());
  }, []);

  // Load manager settings from DB
  useEffect(() => {
    if (!activeWorkspace) return;
    
    const loadSettings = async () => {
      try {
        setLoadingManagerSettings(true);
        const res = await fetch(`/api/workspace/manager-settings?workspace_id=${activeWorkspace.workspace.id}`);
        if (res.ok) {
          const data = await res.json();
          setManagerSettings(data.settings || null);
        }
      } catch (err) {
        console.error("Failed to load manager settings:", err);
      } finally {
        setLoadingManagerSettings(false);
      }
    };

    loadSettings();
  }, [activeWorkspace]);

  // Load user marketing settings from DB
  useEffect(() => {
    if (!activeWorkspace) return;
    
    const loadUserSettings = async () => {
      try {
        setLoadingUserSettings(true);
        const res = await fetch(`/api/workspace/user-marketing-settings?workspace_id=${activeWorkspace.workspace.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data) {
            setUserSettings(data.data);
            // Pre-fill form
            setPersonalTone((data.data.tone_preset as ToneKey) || "practical");
            setPersonalToneExample(data.data.tone_example || "");
            setPersonalNotes(data.data.personal_notes || "");
            setPersonalIncludeKeywords((data.data.personal_keywords || []).join(", "));
            setPersonalExcludeKeywords((data.data.exclude_keywords || []).join(", "));
          }
        }
      } catch (err) {
        console.error("Failed to load user marketing settings:", err);
      } finally {
        setLoadingUserSettings(false);
      }
    };

    const timer = setTimeout(() => {
      loadUserSettings();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeWorkspace]);

  // Role-based access control
  const workspaceName = activeWorkspace?.workspace.name || "워크스페이스";
  const workspaceType = activeWorkspace?.workspaceType || "personal";
  const userRole = activeWorkspace?.role || "member";
  const canManageSettings = userRole !== "member";
  
  const isPersonalWorkspace = workspaceType === "personal";
  const canEditGlobal = isPersonalWorkspace || userRole === "owner" || userRole === "admin";
  
  // Safe active tab: members cannot access settings
  const safeActiveTab = useMemo(() => {
    if (!canManageSettings && activeTab === "settings") {
      return "overview";
    }
    return activeTab;
  }, [activeTab, canManageSettings]);

  if (loading || loadingManagerSettings) {
    return (
      <div className="px-4 py-8 md:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-6 max-w-7xl">
      {/* Top Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          CS 지원 · {workspaceName}
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          고객 문의에 대한 답변을 AI가 작성해드립니다
          <Badge tone="muted" className="text-xs">
            {workspaceType === "personal" ? "개인" : "팀"}
          </Badge>
        </p>
      </div>

      {/* Show baseline settings applied hint */}
      {managerSettings && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm text-foreground">
            현재 적용중: {managerSettings.brand_name ? `${managerSettings.brand_name} · ` : ""}
            {managerSettings.logo_url ? "로고 · " : ""}
            {managerSettings.company_profile ? "회사 소개" : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            담당자 셋팅(공용) + 내 개인설정이 합쳐져 적용됩니다.
          </p>
        </div>
      )}

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={safeActiveTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start gap-2 mb-6">
          <TabsTrigger value="overview" className="min-w-[80px]">
            한눈에 보기
          </TabsTrigger>
          <TabsTrigger value="instant" className="min-w-[80px]">
            즉시 생성
          </TabsTrigger>
          <TabsTrigger value="history" className="min-w-[80px]">
            기록
          </TabsTrigger>
          {canManageSettings ? (
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
          {renderOverviewTab()}
        </TabsContent>

        {/* Instant Tab */}
        <TabsContent value="instant" className="pt-2">
          {renderInstantTab()}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="pt-2">
          <HistoryTab />
        </TabsContent>

        {/* Settings Tab */}
        {canManageSettings && (
          <TabsContent value="settings" className="pt-2">
            {renderSettingsTab()}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  // ============================================================
  // TAB RENDER FUNCTIONS
  // ============================================================

  function renderOverviewTab() {
    // Mock data
    const monthResponses = 45;
    const avgResponseTime = "2분";

    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="rounded-lg border-2 border-primary/20 bg-card p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">이번 달 CS 현황</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">생성한 답변</p>
              <p className="text-3xl font-bold text-foreground">{monthResponses}개</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">평균 생성 시간</p>
              <p className="text-2xl font-bold text-foreground">{avgResponseTime}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-semibold">답변 형식:</span> 친절한 톤앤매너로 고객 맞춤 답변
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-semibold">활용:</span> 이메일, 채팅, 게시판 등 다양한 채널에서 사용 가능
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleTabChange("instant")}
            className="w-full"
          >
            지금 바로 답변 생성
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleTabChange("history")}
            className="w-full"
          >
            답변 기록 보기
          </Button>
        </div>

        {/* Recent Responses Preview */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">최근 생성한 답변</h2>
            <Badge tone="muted" className="text-xs">5개</Badge>
          </div>

          <div className="space-y-2">
            {[
              { query: "배송이 언제 되나요?", date: "1월 26일", type: "이메일" },
              { query: "환불 가능한가요?", date: "1월 25일", type: "채팅" },
              { query: "제품 사용법 문의", date: "1월 24일", type: "이메일" },
              { query: "계정 삭제 요청", date: "1월 23일", type: "게시판" },
              { query: "결제 오류 문의", date: "1월 22일", type: "이메일" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.query}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <Badge tone="muted" className="text-xs ml-2">
                  {item.type}
                </Badge>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => handleTabChange("history")}
          >
            전체 보기
          </Button>
        </div>
      </div>
    );
  }

  async function handleInstantGenerate() {
    if (!activeWorkspace || !instantQuery.trim()) return;

    setInstantGenerating(true);
    setInstantResult(null);
    setInstantError(null);

    const inputText = instantContext.trim()
      ? `${instantQuery.trim()}\n\n[추가 정보]\n${instantContext.trim()}`
      : instantQuery.trim();

    try {
      const res = await fetch("/api/workspace/cs-support/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: activeWorkspace.workspace.id,
          type: instantType,
          input_text: inputText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "INSUFFICIENT_CREDITS") {
          setInstantError(`크레딧이 부족합니다. 현재 잔액: ${data.balance ?? 0}P (필요: 10P)`);
        } else {
          setInstantError(data.error ?? "생성 중 오류가 발생했습니다.");
        }
        return;
      }

      setInstantResult(data.generated_text ?? "");
    } catch {
      setInstantError("네트워크 오류가 발생했습니다.");
    } finally {
      setInstantGenerating(false);
    }
  }

  async function handleCopyResult() {
    if (!instantResult) return;
    try {
      await navigator.clipboard.writeText(instantResult);
      setInstantCopied(true);
      setTimeout(() => setInstantCopied(false), 2000);
    } catch {}
  }

  function renderInstantTab() {
    const TYPE_OPTIONS = [
      { value: "inquiry_reply", label: "고객 문의 답변" },
      { value: "review_reply", label: "리뷰 답변" },
      { value: "claim_response", label: "컴플레인 대응" },
    ] as const;

    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
          <h2 className="text-xl font-bold text-foreground mb-3">즉시 답변 생성</h2>
          <p className="text-sm text-foreground leading-relaxed">
            고객 문의를 입력하면 AI가 즉시 답변을 작성해드립니다. (10 크레딧 소모)
          </p>
        </div>

        {/* CS Response Generator */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">답변 생성</h3>

          <div className="space-y-4">
            {/* Type Selector */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                유형 선택
              </label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setInstantType(opt.value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      instantType === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input: Customer Query */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                고객 문의 내용
              </label>
              <textarea
                value={instantQuery}
                onChange={(e) => setInstantQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px] leading-relaxed"
                placeholder="예) 배송이 언제 되나요? 3일 전에 주문했는데 아직 배송 안 됐어요."
              />
            </div>

            {/* Input: Additional Context */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                추가 정보 (선택)
              </label>
              <textarea
                value={instantContext}
                onChange={(e) => setInstantContext(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] leading-relaxed"
                placeholder="예) 주문번호 12345, 배송 예정일 1월 28일"
              />
            </div>

            {instantError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {instantError}
              </div>
            )}

            {/* CTA Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleInstantGenerate}
              disabled={instantGenerating || !instantQuery.trim()}
            >
              {instantGenerating ? "생성 중..." : "즉시 생성 (10 크레딧)"}
            </Button>
          </div>
        </div>

        {/* Result */}
        {(instantGenerating || instantResult) && (
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">생성된 답변</h3>
              {instantResult && (
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  {instantCopied ? "복사됨!" : "복사"}
                </button>
              )}
            </div>
            {instantGenerating ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                답변을 생성하고 있습니다...
              </div>
            ) : (
              <div className="rounded-lg bg-muted/40 p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {instantResult}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function HistoryTab() {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">답변 기록</h2>
          </div>
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              아직 생성된 CS 답변 기록이 없습니다.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              즉시 생성 탭에서 답변을 만들어보세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderSettingsTab() {
    // Handler to save personal settings
    const handleSavePersonalSettings = async () => {
      if (!activeWorkspace) return;
      
      try {
        setSavingUserSettings(true);
        setUserSettingsSaved(false);
        
        const payload = {
          workspace_id: activeWorkspace.workspace.id,
          tone_preset: personalTone,
          tone_example: personalToneExample,
          personal_keywords: personalIncludeKeywords.split(",").map(k => k.trim()).filter(Boolean),
          exclude_keywords: personalExcludeKeywords.split(",").map(k => k.trim()).filter(Boolean),
          personal_notes: personalNotes,
        };
        
        const res = await fetch("/api/workspace/user-marketing-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "저장 실패");
        }
        
        const data = await res.json();
        if (data.ok && data.data) {
          setUserSettings(data.data);
          setUserSettingsSaved(true);
          setTimeout(() => setUserSettingsSaved(false), 3000);
        }
      } catch (err) {
        console.error("Failed to save user marketing settings:", err);
        alert("저장 중 오류가 발생했습니다.");
      } finally {
        setSavingUserSettings(false);
      }
    };
    
    return (
      <div className="space-y-6">
        {/* Settings Tabs */}
        <Tabs defaultValue="personal" value={settingsTab} onValueChange={(val) => setSettingsTab(val as "personal" | "global")}>
          <TabsList className="mb-6">
            <TabsTrigger value="personal">개인 설정</TabsTrigger>
            {(isPersonalWorkspace || canEditGlobal) && (
              <TabsTrigger value="global">전체 설정</TabsTrigger>
            )}
          </TabsList>

          {/* 개인 설정 탭 - Personal Settings */}
          <TabsContent value="personal">
            <div className="space-y-6">
              {/* Main Personal Settings Card */}
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">개인 설정</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  CS 답변에 사용될 개인 말투를 설정하세요. 모든 워크스페이스 멤버가 수정할 수 있습니다.
                </p>

                {loadingUserSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground text-sm">개인 설정 불러오는 중...</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 톤앤매너 */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        답변 톤앤매너
                      </label>
                      <select
                        value={personalTone}
                        onChange={(e) => setPersonalTone(e.target.value as ToneKey)}
                        className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {Object.entries(TONE_PRESETS).map(([key, preset]) => (
                          <option key={key} value={key}>
                            {preset.labelKr}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        예시: {TONE_PRESETS[personalTone].previewKr}
                      </p>
                    </div>

                    {/* Tone Example */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        원하는 말투 예시 (선택)
                      </label>
                      <textarea
                        value={personalToneExample}
                        onChange={(e) => setPersonalToneExample(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] leading-relaxed"
                        placeholder="원하는 말투 예시를 2~3문장으로 적어주세요"
                      />
                    </div>

                    {/* Personal Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        담당자 메모 (선택)
                      </label>
                      <textarea
                        value={personalNotes}
                        onChange={(e) => setPersonalNotes(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] leading-relaxed"
                        placeholder="CS 답변 시 주의사항 / 금지 표현 등"
                      />
                    </div>

                    {/* Include Keywords */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        포함 키워드 (선택)
                      </label>
                      <input
                        type="text"
                        value={personalIncludeKeywords}
                        onChange={(e) => setPersonalIncludeKeywords(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="쉼표(,)로 구분해서 입력하세요"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        예) 감사합니다, 도와드리겠습니다
                      </p>
                    </div>

                    {/* Exclude Keywords */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        제외 키워드 (선택)
                      </label>
                      <input
                        type="text"
                        value={personalExcludeKeywords}
                        onChange={(e) => setPersonalExcludeKeywords(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="쉼표(,)로 구분해서 입력하세요"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        예) 죄송합니다, 불가능합니다
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleSavePersonalSettings}
                        disabled={savingUserSettings}
                      >
                        {savingUserSettings ? "저장 중..." : "저장"}
                      </Button>
                      {userSettingsSaved && (
                        <span className="text-sm text-primary">저장됨</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 전체 설정 탭 - Team Settings (Read-Only Summary + CTA) */}
          {(isPersonalWorkspace || canEditGlobal) && (
            <TabsContent value="global">
              {!canEditGlobal && !isPersonalWorkspace && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  팀 워크스페이스의 전체 설정은 관리자만 수정할 수 있습니다.
                </div>
              )}
              
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">전체 설정 (Team Settings)</h2>
                    <p className="text-sm text-muted-foreground">
                      워크스페이스 전체에 적용되는 설정입니다.
                    </p>
                  </div>
                  {!canEditGlobal && !isPersonalWorkspace && (
                    <Badge tone="muted" className="text-xs">관리자만</Badge>
                  )}
                </div>

                {/* Read-only summary of manager settings */}
                {managerSettings ? (
                  <div className="space-y-4 mb-6">
                    <div className="rounded-md border border-border bg-muted/20 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">브랜드명</span>
                        <span className="text-sm text-foreground">{managerSettings.brand_name || "미설정"}</span>
                      </div>
                      {managerSettings.logo_url && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">로고</span>
                          <span className="text-sm text-foreground">등록됨</span>
                        </div>
                      )}
                      {managerSettings.company_profile && (
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm font-semibold text-foreground">회사 소개</span>
                          <span className="text-sm text-foreground text-right flex-1 line-clamp-2">
                            {managerSettings.company_profile.substring(0, 60)}
                            {managerSettings.company_profile.length > 60 && "..."}
                          </span>
                        </div>
                      )}
                      {managerSettings.attachments && managerSettings.attachments.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">첨부파일</span>
                          <span className="text-sm text-foreground">{managerSettings.attachments.length}개</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm text-amber-800">
                      전체 설정이 아직 입력되지 않았습니다.
                    </p>
                  </div>
                )}

                {/* CTA to manager-settings page */}
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      window.location.href = "/kr/workspace/marketing/manager-settings";
                    }}
                  >
                    담당자 셋팅에서 수정
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  }
}
