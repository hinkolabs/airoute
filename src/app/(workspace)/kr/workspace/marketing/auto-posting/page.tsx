"use client";

import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import { Sparkles, Clock, Target, Radio, Send } from "lucide-react";

// DEV mode flag
const __DEV__ = process.env.NODE_ENV !== "production";

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
  content_purpose: string;
  brand_intro: string;
  brand_strengths: string[];
  target_age: string;
  target_persona: string[];
  channels: string[];
  frequency: string;
  send_time: string;
  tone_profile_json?: string;
  created_at?: string;
  updated_at?: string;
}

// Content purpose options
const CONTENT_PURPOSES = [
  { value: "new_customer", label: "신규 유입", desc: "새로운 고객 유치" },
  { value: "repurchase", label: "재구매", desc: "기존 고객 재방문" },
  { value: "branding", label: "브랜드 인지", desc: "브랜드 알리기" },
  { value: "event", label: "이벤트", desc: "프로모션 홍보" },
  { value: "sales", label: "매출 증대", desc: "직접적인 판매" },
];

// Brand strengths options
const BRAND_STRENGTHS = [
  { value: "price", label: "가격 경쟁력" },
  { value: "quality", label: "품질" },
  { value: "speed", label: "빠른 배송/서비스" },
  { value: "trust", label: "신뢰도" },
  { value: "variety", label: "다양한 선택" },
  { value: "expertise", label: "전문성" },
];

// Target age options
const TARGET_AGES = [
  { value: "20s", label: "20대" },
  { value: "30s", label: "30대" },
  { value: "40s", label: "40대" },
  { value: "50plus", label: "50대 이상" },
  { value: "all", label: "전 연령" },
];

// Target persona options
const TARGET_PERSONAS = [
  { value: "practical", label: "실용적" },
  { value: "trendy", label: "트렌디" },
  { value: "cautious", label: "신중한" },
  { value: "impulsive", label: "즉흥적" },
];

// Channel options
const CHANNELS = [
  { value: "blog", label: "블로그", icon: "📝" },
  { value: "sns", label: "SNS", icon: "📱" },
  { value: "kakao", label: "카카오톡", icon: "💬" },
  { value: "sms", label: "문자", icon: "✉️" },
];

export default function KrWorkspaceMarketingAutoPostingPage() {
  const { activeWorkspace, loading, subscription, entitlement } = useWorkspace();
  
  const [managerSettings, setManagerSettings] = useState<ManagerSettings | null>(null);
  const [loadingManagerSettings, setLoadingManagerSettings] = useState(true);
  
  // User marketing settings state
  const [userSettings, setUserSettings] = useState<UserMarketingSettings | null>(null);
  const [loadingUserSettings, setLoadingUserSettings] = useState(true);
  const [savingUserSettings, setSavingUserSettings] = useState(false);
  const [userSettingsSaved, setUserSettingsSaved] = useState(false);
  
  // Form state
  const [contentPurpose, setContentPurpose] = useState("new_customer");
  const [brandIntro, setBrandIntro] = useState("");
  const [brandStrengths, setBrandStrengths] = useState<string[]>([]);
  const [targetAge, setTargetAge] = useState("30s");
  const [targetPersonas, setTargetPersonas] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>(["blog", "sns"]);
  // Note: frequency and send_time are fixed to "every2days" and "08:00" (no UI control)
  
  // Tone Profile Analyzer state (Premium feature)
  const [toneSourceText, setToneSourceText] = useState("");
  const [toneProfile, setToneProfile] = useState<{
    tone_summary: string;
    do_list: string[];
    dont_list: string[];
    sample_phrases: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Preview content state
  const [previewContent, setPreviewContent] = useState<string>("");
  const [generatingPreview, setGeneratingPreview] = useState(false);

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
            setContentPurpose(data.data.content_purpose || "new_customer");
            setBrandIntro(data.data.brand_intro || "");
            setBrandStrengths(data.data.brand_strengths || []);
            setTargetAge(data.data.target_age || "30s");
            setTargetPersonas(data.data.target_persona || []);
            setChannels(data.data.channels || ["blog", "sns"]);
            // Note: frequency and send_time are not loaded (fixed values)
            
            // Load tone profile if exists
            if (data.data.tone_profile_json) {
              try {
                const profile = JSON.parse(data.data.tone_profile_json);
                setToneProfile(profile);
              } catch (e) {
                console.error("Failed to parse tone_profile_json:", e);
              }
            }
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
  
  // PRO entitlement check
  const isPro = entitlement?.canUsePaidFeatures === true;

  // DEBUG: Pro gating verification
  if (__DEV__) {
    console.log("[AutoPosting][Pro Gating]", {
      isPro,
      subscription,
      entitlement,
      canUsePaidFeatures: entitlement?.canUsePaidFeatures,
      planKey: entitlement?.planKey,
      isActive: entitlement?.isActive,
    });
  }

  // Handler to analyze tone profile
  const handleAnalyzeTone = async () => {
    if (!activeWorkspace) return;
    if (toneSourceText.length < 500) {
      setAnalyzeError("500자 이상 입력해주세요.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalyzeError(null);

      const res = await fetch("/api/workspace/tone-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: activeWorkspace.workspace.id,
          text: toneSourceText,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "분석 실패");
      }

      if (data.profile) {
        setToneProfile(data.profile);
      }
    } catch (err: any) {
      console.error("Failed to analyze tone:", err);
      setAnalyzeError(err.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler to save settings
  const handleSaveSettings = async () => {
    if (!activeWorkspace) return;
    
    try {
      setSavingUserSettings(true);
      setUserSettingsSaved(false);
      
      const payload = {
        workspace_id: activeWorkspace.workspace.id,
        content_purpose: contentPurpose,
        brand_intro: brandIntro,
        brand_strengths: brandStrengths,
        target_age: targetAge,
        target_persona: targetPersonas,
        channels: channels,
        frequency: "every2days", // Fixed: 2일에 한 번
        send_time: "08:00", // Fixed: 오전 8시
        tone_profile_json: toneProfile ? JSON.stringify(toneProfile) : null,
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

  // Handler to generate preview
  const handleGeneratePreview = async () => {
    if (!activeWorkspace) return;
    
    try {
      setGeneratingPreview(true);
      
      // Mock preview generation
      setTimeout(() => {
        const mockContent = `[${CONTENT_PURPOSES.find(p => p.value === contentPurpose)?.label} 목적]

${brandIntro}

주요 강점: ${brandStrengths.map(s => BRAND_STRENGTHS.find(b => b.value === s)?.label).join(", ")}

타겟: ${TARGET_AGES.find(a => a.value === targetAge)?.label}, ${targetPersonas.map(p => TARGET_PERSONAS.find(tp => tp.value === p)?.label).join("/")} 성향

발송 채널: ${channels.map(c => CHANNELS.find(ch => ch.value === c)?.label).join(", ")}

이 설정을 바탕으로 자동 생성된 콘텐츠가 여기에 표시됩니다.
${toneProfile ? "\n✓ 내 말투가 적용되었습니다." : ""}`;
        
        setPreviewContent(mockContent);
        setGeneratingPreview(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to generate preview:", err);
      setGeneratingPreview(false);
    }
  };

  // Toggle helpers
  const toggleBrandStrength = (value: string) => {
    setBrandStrengths(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleTargetPersona = (value: string) => {
    setTargetPersonas(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleChannel = (value: string) => {
    setChannels(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  if (loading || loadingManagerSettings || loadingUserSettings) {
    return (
      <div className="px-4 py-8 md:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          자동 포스팅 설정
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          마케팅 목적 기반으로 콘텐츠를 자동 생성합니다
          <Badge tone="muted" className="text-xs">
            {workspaceType === "personal" ? "개인" : "팀"}
          </Badge>
        </p>
      </div>

      {/* Show baseline settings applied hint */}
      {managerSettings && managerSettings.brand_name && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm text-foreground">
            담당자 설정이 적용됨: {managerSettings.brand_name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            아래 설정과 함께 자동 생성에 반영됩니다.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {/* Section 1: 콘텐츠 목적 선택 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">① 콘텐츠 목적</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CONTENT_PURPOSES.map((purpose) => (
              <button
                key={purpose.value}
                onClick={() => setContentPurpose(purpose.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  contentPurpose === purpose.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div className="font-semibold text-sm text-foreground mb-1">
                  {purpose.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {purpose.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: 브랜드 정보 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">② 브랜드 정보</h2>
          </div>
          
          <div className="space-y-4">
            {/* Brand intro */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                브랜드 한 줄 소개
              </label>
              <input
                type="text"
                value={brandIntro}
                onChange={(e) => setBrandIntro(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="예) AI 기반 마케팅 자동화 도구"
              />
            </div>

            {/* Brand strengths */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                핵심 강점 (복수 선택 가능)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BRAND_STRENGTHS.map((strength) => (
                  <button
                    key={strength.value}
                    onClick={() => toggleBrandStrength(strength.value)}
                    className={`px-4 py-2 rounded-md border text-sm transition-all ${
                      brandStrengths.includes(strength.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    }`}
                  >
                    {strength.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: 타겟 고객 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">③ 타겟 고객</h2>
          </div>
          
          <div className="space-y-4">
            {/* Target age */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                연령대
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TARGET_AGES.map((age) => (
                  <button
                    key={age.value}
                    onClick={() => setTargetAge(age.value)}
                    className={`px-4 py-2 rounded-md border text-sm transition-all ${
                      targetAge === age.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    }`}
                  >
                    {age.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target persona */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                성향 (복수 선택 가능)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TARGET_PERSONAS.map((persona) => (
                  <button
                    key={persona.value}
                    onClick={() => toggleTargetPersona(persona.value)}
                    className={`px-4 py-2 rounded-md border text-sm transition-all ${
                      targetPersonas.includes(persona.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    }`}
                  >
                    {persona.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: 발송 채널 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">④ 발송 채널</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CHANNELS.map((channel) => (
              <button
                key={channel.value}
                onClick={() => toggleChannel(channel.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  channels.includes(channel.value)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div className="text-2xl mb-2">{channel.icon}</div>
                <div className="font-semibold text-sm text-foreground">
                  {channel.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 5: 발송 정책 (시스템 고정) */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">⑤ 발송 정책 (시스템 고정)</h2>
          </div>
          
          <div className="space-y-4">
            {/* Fixed schedule info */}
            <div className="rounded-lg bg-muted/30 p-5">
              <p className="text-base font-semibold text-foreground mb-3 text-center">
                자동 포스팅은<br />
                2일에 한 번, 오전 8시에 자동 발송됩니다.
              </p>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>콘텐츠 품질 유지</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>과도한 마케팅 방지</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>실제 운영 데이터 기반 최적화 주기</span>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-900">
                ※ 발송 주기는 변경할 수 없습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Section 6: Pro 전용 - 내 말투 자동 학습 */}
        <div className="rounded-lg border-2 border-emerald-400/30 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-foreground">
              내 말투 자동 학습
            </h3>
            <Badge tone="primary" className="text-xs font-bold px-3 py-1 bg-emerald-600 text-white">
              PRO
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            내가 쓴 글(500자 이상)을 붙여넣으면 AI가 문체를 분석해 자동으로 적용합니다.
          </p>

          <div className="space-y-4">
            {/* Textarea */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                여기에 본인이 쓴 글을 500자 이상 붙여넣어 주세요
              </label>
              <textarea
                value={toneSourceText}
                onChange={(e) => setToneSourceText(e.target.value)}
                disabled={!isPro}
                className="w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[180px] leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="블로그 글, 공지사항, SNS 포스트 등 내가 실제로 쓴 글을 붙여넣어주세요. 길수록 정확합니다."
              />
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${toneSourceText.length < 500 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                  {toneSourceText.length} / 500
                </p>
                {isPro && toneSourceText.length > 0 && toneSourceText.length < 500 && (
                  <p className="text-xs text-red-500 font-medium">
                    500자 이상 필요
                  </p>
                )}
              </div>
            </div>

            {/* Analyze Button */}
            <Button
              variant="primary"
              size="md"
              onClick={handleAnalyzeTone}
              disabled={!isPro || isAnalyzing || toneSourceText.length < 500}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? "분석 중..." : "내 말투 분석하기"}
            </Button>

            {/* Upgrade CTA for non-Pro users */}
            {!isPro && (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-blue-900">
                    Pro 플랜에서만 내 말투 자동 분석 기능을 사용할 수 있습니다.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      window.location.href = "/kr/workspace/billing";
                    }}
                    className="flex-shrink-0"
                  >
                    Pro로 업그레이드
                  </Button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {analyzeError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {analyzeError}
              </div>
            )}

            {/* Result Preview */}
            {toneProfile && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-bold text-foreground">분석 완료</h4>
                  <Badge tone="primary" className="text-xs bg-emerald-600">
                    적용됨
                  </Badge>
                </div>
                <div className="space-y-3 text-sm text-foreground leading-relaxed">
                  {/* Tone Summary */}
                  <div>
                    <span className="font-semibold">말투 특징:</span>
                    <p className="mt-1">{toneProfile.tone_summary}</p>
                  </div>
                  
                  {/* Do List */}
                  {toneProfile.do_list && toneProfile.do_list.length > 0 && (
                    <div>
                      <span className="font-semibold">추천 표현:</span>
                      <ul className="mt-1 space-y-1">
                        {toneProfile.do_list.slice(0, 2).map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Don't List */}
                  {toneProfile.dont_list && toneProfile.dont_list.length > 0 && (
                    <div>
                      <span className="font-semibold">피해야 할 표현:</span>
                      <ul className="mt-1 space-y-1">
                        {toneProfile.dont_list.slice(0, 1).map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 7: 자동 생성 미리보기 */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">⑥ 자동 생성 미리보기</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            위 설정을 바탕으로 생성될 콘텐츠를 미리 확인하세요.
          </p>

          <Button
            variant="secondary"
            size="md"
            onClick={handleGeneratePreview}
            disabled={generatingPreview || !brandIntro}
            className="w-full sm:w-auto mb-4"
          >
            {generatingPreview ? "생성 중..." : "미리보기 생성"}
          </Button>

          {previewContent && (
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {previewContent}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSaveSettings}
            disabled={savingUserSettings || !brandIntro}
            className="w-full sm:w-auto"
          >
            {savingUserSettings ? "저장 중..." : "설정 저장"}
          </Button>
          {userSettingsSaved && (
            <span className="text-sm text-primary font-medium">✓ 저장됨</span>
          )}
          {!brandIntro && (
            <span className="text-sm text-muted-foreground">
              브랜드 소개를 입력해주세요
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
