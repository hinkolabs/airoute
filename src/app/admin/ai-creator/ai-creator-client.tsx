"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  MapIcon,
  BookText,
  Wrench,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  ExternalLink,
  Save,
  Globe,
  Zap,
  TrendingUp,
  Flame,
  Calendar,
  Star,
  RefreshCw,
  DollarSign,
  Activity,
  Layers,
} from "lucide-react";

/* ──────────────────────────────────────────────────────── */
/* Types                                                    */
/* ──────────────────────────────────────────────────────── */

type LangOption = "en" | "kr" | "both";
type DifficultyLevel = "beginner" | "intermediate" | "advanced";
type CreatorMode = "route" | "tool";

type Step = {
  position: number;
  tool_slug: string;
  is_existing_tool: boolean;
  is_best3: boolean;
  step_title: string;
  step_title_kr?: string;
  step_why: string;
  step_why_kr?: string;
  step_cta_label: string;
  step_cta_label_kr?: string;
  step_prompt_example?: string;
  step_prompt_example_en?: string;
  step_prompt_example_kr?: string;
  step_input_type: "prompt" | "settings" | "action";
  new_tool?: {
    name: string;
    slug: string;
    description: string;
    category: string;
    website_url: string;
    tags: string[];
  } | null;
};

type RouteData = {
  title: string;
  title_kr?: string;
  slug: string;
  description: string;
  description_kr?: string;
  icon: string;
  tags: string[];
  guide_bullets?: string[];
  guide_bullets_en?: string[];
  guide_bullets_kr?: string[];
  steps: Step[];
};

type GuideData = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  taxonomy: string;
  primary_intent: string;
};

type ToolData = {
  slug: string;
  name: string;
  name_kr?: string;
  description: string;
  description_kr?: string;
  url: string;
  category: string;
  pricing: string;
  is_existing: boolean;
};

type Preview = {
  route?: RouteData;
  tool?: ToolData;
  guide_en?: GuideData;
  guide_kr?: GuideData;
};

type GuideResult = { id: string; slug: string; quality_score: number };

type ConfirmResult = {
  route_id?: string;
  route_slug?: string;
  tool_slug?: string;
  tool_created?: boolean;
  guide_en: GuideResult | null;
  guide_kr: GuideResult | null;
  tools_created?: string[];
  tools_matched?: string[];
};

type Suggestion = {
  prompt: string;
  title: string;
  reason: string;
  category: string;
  trend_type: "viral" | "seasonal" | "evergreen" | "meme";
};

type UsageData = {
  model: string;
  today: { tokens: number; calls: number; cost_usd: number; suggests: number; creates: number };
  month: { tokens: number; calls: number; cost_usd: number; suggests: number; creates: number };
};

type Phase = "input" | "analyzing" | "preview" | "saving" | "done";
type GuideTab = "en" | "kr";

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  title: string;
  message: string;
};

/* ──────────────────────────────────────────────────────── */
/* Main Component                                           */
/* ──────────────────────────────────────────────────────── */

export default function AiCreatorClient() {
  const [phase, setPhase] = useState<Phase>("input");
  const [mode, setMode] = useState<CreatorMode>("route");
  const [prompt, setPrompt] = useState("");
  const [lang, setLang] = useState<LangOption>("both");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("beginner");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState(0);
  const [usedModel, setUsedModel] = useState("");
  const [usage, setUsage] = useState<UsageData | null>(null);

  const [editingRoute, setEditingRoute] = useState(false);
  const [editingTool, setEditingTool] = useState(false);
  const [editingGuide, setEditingGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<GuideTab>("kr");
  const [routeTab, setRouteTab] = useState<"kr" | "en">("kr");
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(type: Toast["type"], title: string, message: string) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  useEffect(() => {
    fetch("/api/admin/ai-creator/usage")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setUsage(j); })
      .catch(() => {});
  }, [phase]);

  async function handleRegenerate(target: "route_en" | "route_kr" | "guide_en" | "guide_kr") {
    if (!preview || regenerating) return;
    setRegenerating(target);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-creator/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          prompt,
          difficulty,
          mode,
          ...(preview.route ? { route: preview.route } : {}),
          ...(preview.tool ? { tool: preview.tool } : {}),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      const d = json.data;
      if (target === "guide_en" && d.guide_en) {
        setPreview({ ...preview, guide_en: d.guide_en });
      } else if (target === "guide_kr" && d.guide_kr) {
        setPreview({ ...preview, guide_kr: d.guide_kr });
      } else if (target === "route_en" && preview.route) {
        const updated = { ...preview.route };
        if (d.title) updated.title = d.title;
        if (d.description) updated.description = d.description;
        if (d.guide_bullets) updated.guide_bullets_en = d.guide_bullets;
        if (d.steps) {
          updated.steps = updated.steps.map((s, i) => {
            const regen = d.steps?.[i];
            if (!regen) return s;
            return {
              ...s,
              step_title: regen.step_title ?? s.step_title,
              step_why: regen.step_why ?? s.step_why,
              step_cta_label: regen.step_cta_label ?? s.step_cta_label,
              step_prompt_example_en: regen.step_prompt_example ?? s.step_prompt_example_en,
              step_prompt_example: regen.step_prompt_example ?? s.step_prompt_example,
            };
          });
        }
        setPreview({ ...preview, route: updated });
      } else if (target === "route_kr" && preview.route) {
        const updated = { ...preview.route };
        if (d.title_kr) updated.title_kr = d.title_kr;
        if (d.description_kr) updated.description_kr = d.description_kr;
        if (d.guide_bullets_kr) updated.guide_bullets_kr = d.guide_bullets_kr;
        if (d.steps) {
          updated.steps = updated.steps.map((s, i) => {
            const regen = d.steps?.[i];
            if (!regen) return s;
            return {
              ...s,
              step_title_kr: regen.step_title_kr ?? s.step_title_kr,
              step_why_kr: regen.step_why_kr ?? s.step_why_kr,
              step_cta_label_kr: regen.step_cta_label_kr ?? s.step_cta_label_kr,
              step_prompt_example_kr: regen.step_prompt_example_kr ?? s.step_prompt_example_kr,
            };
          });
        }
        setPreview({ ...preview, route: updated });
      }
      setTokens((prev) => prev + (json.tokens ?? 0));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setRegenerating(null);
    }
  }

  async function handleAnalyze() {
    if (!prompt.trim()) return;
    setPhase("analyzing");
    setError(null);

    try {
      const res = await fetch("/api/admin/ai-creator/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), lang, difficulty, mode }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      setPreview(json.preview);
      setTokens(json.tokens ?? 0);
      setUsedModel(json.model ?? "");
      setGuideTab(json.preview.guide_kr ? "kr" : "en");
      setRouteTab(json.preview.route?.title_kr ? "kr" : "en");
      setPhase("preview");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "분석 실패";
      setError(msg);
      setPhase("input");
      addToast("error", "분석 실패", msg);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setPhase("saving");
    setError(null);

    try {
      const res = await fetch("/api/admin/ai-creator/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          mode,
          ...(mode === "route" ? { route: preview.route } : { tool: preview.tool }),
          guide_en: preview.guide_en ?? null,
          guide_kr: preview.guide_kr ?? null,
        }),
      });

      let json: Record<string, unknown>;
      try {
        json = await res.json();
      } catch {
        throw new Error(`서버 응답 파싱 실패 (HTTP ${res.status})`);
      }

      if (!json.ok) {
        const debugInfo = json.debug ? `\n\n[Debug] ${JSON.stringify(json.debug)}` : "";
        throw new Error(`${json.error || "알 수 없는 오류"}${debugInfo}`);
      }

      setResult(json.results as ConfirmResult);
      setPhase("done");
      addToast("success", "저장 완료!", "루트, 가이드, 툴이 성공적으로 등록되었습니다.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      setError(msg);
      setPhase("preview");
      addToast("error", "저장 실패", msg.split("\n")[0]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleReset() {
    setPhase("input");
    setPreview(null);
    setResult(null);
    setError(null);
    setPrompt("");
    setTokens(0);
  }

  function updateRouteField(field: keyof RouteData, value: any) {
    if (!preview?.route) return;
    setPreview({ ...preview, route: { ...preview.route, [field]: value } });
  }

  function updateGuideField(which: GuideTab, field: keyof GuideData, value: any) {
    if (!preview) return;
    const key = which === "en" ? "guide_en" : "guide_kr";
    const guide = preview[key];
    if (!guide) return;
    setPreview({ ...preview, [key]: { ...guide, [field]: value } });
  }

  function updateToolField(field: keyof ToolData, value: any) {
    if (!preview?.tool) return;
    setPreview({ ...preview, tool: { ...preview.tool, [field]: value } });
  }

  function updateStep(index: number, field: keyof Step, value: any) {
    if (!preview?.route) return;
    const steps = [...preview.route.steps];
    steps[index] = { ...steps[index], [field]: value };
    setPreview({ ...preview, route: { ...preview.route, steps } });
  }

  const hasEn = !!preview?.guide_en;
  const hasKr = !!preview?.guide_kr;
  const hasBoth = hasEn && hasKr;

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed right-4 top-4 z-[100] flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-5 duration-300 max-w-sm ${
                toast.type === "success"
                  ? "border-green-500/30 bg-green-50/95 dark:bg-green-950/95"
                  : toast.type === "error"
                    ? "border-red-500/30 bg-red-50/95 dark:bg-red-950/95"
                    : "border-blue-500/30 bg-blue-50/95 dark:bg-blue-950/95"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              ) : toast.type === "error" ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              ) : (
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${
                  toast.type === "success" ? "text-green-700 dark:text-green-300" :
                  toast.type === "error" ? "text-red-700 dark:text-red-300" :
                  "text-blue-700 dark:text-blue-300"
                }`}>{toast.title}</p>
                <p className={`mt-0.5 text-xs leading-relaxed ${
                  toast.type === "success" ? "text-green-600/80 dark:text-green-400/80" :
                  toast.type === "error" ? "text-red-600/80 dark:text-red-400/80" :
                  "text-blue-600/80 dark:text-blue-400/80"
                }`}>{toast.message}</p>
              </div>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">AI 콘텐츠 크리에이터</h1>
                  <p className="text-xs text-muted-foreground">프롬프트 하나로 루트 + 가이드 + 툴 통합 생성</p>
                </div>
              </div>
            </div>
            {usage && <UsageBanner usage={usage} />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-600">오류 발생</p>
              <p className="mt-1 text-sm text-red-500/80 whitespace-pre-wrap break-all">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="shrink-0 rounded p-1 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Phase: Input */}
        {(phase === "input" || phase === "analyzing") && (
          <InputPhase
            prompt={prompt}
            setPrompt={setPrompt}
            lang={lang}
            setLang={setLang}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            mode={mode}
            setMode={setMode}
            onAnalyze={handleAnalyze}
            loading={phase === "analyzing"}
          />
        )}

        {/* Phase: Preview */}
        {(phase === "preview" || phase === "saving") && preview && (
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <Sparkles className="h-4 w-4 text-violet-500" />
                AI 생성 완료
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${mode === "route" ? "bg-blue-500/10 text-blue-600" : "bg-teal-500/10 text-teal-600"}`}>
                  {mode === "route" ? "루트+가이드" : "툴+가이드"}
                </span>
                {usedModel && <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">{usedModel}</span>}
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  difficulty === "beginner" ? "bg-green-500/10 text-green-600" :
                  difficulty === "intermediate" ? "bg-yellow-500/10 text-yellow-600" :
                  "bg-red-500/10 text-red-600"
                }`}>
                  {difficulty === "beginner" ? "초급" : difficulty === "intermediate" ? "중급" : "고급"}
                </span>
                — 토큰: <strong>{tokens.toLocaleString()}</strong>
                {hasBoth && " · EN + KR"}
                {hasEn && !hasKr && " · EN"}
                {hasKr && !hasEn && " · KR"}
              </div>
              <button onClick={handleReset} className="text-sm text-muted-foreground hover:text-foreground">다시 시작</button>
            </div>

            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
              <p className="text-xs font-medium text-violet-600 mb-1">원본 프롬프트</p>
              <p className="text-sm text-foreground">{prompt}</p>
            </div>

            {/* Route Preview (route mode only) */}
            {mode === "route" && preview.route && (
              <div className="rounded-xl border border-blue-500/20 bg-card overflow-hidden">
                <div className="flex items-center justify-between bg-blue-500/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <MapIcon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-foreground">루트 (Route)</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasBoth && (
                      <LangTabs active={routeTab} onChange={setRouteTab} color="blue" />
                    )}
                    <RegenButton
                      label={routeTab === "kr" ? "KR 재생성" : "EN 재생성"}
                      loading={regenerating === `route_${routeTab}`}
                      disabled={!!regenerating}
                      onClick={() => handleRegenerate(`route_${routeTab}`)}
                    />
                    <button onClick={() => setEditingRoute(!editingRoute)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                      {editingRoute ? "닫기" : "수정"}
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <RoutePreview
                    route={preview.route}
                    viewLang={routeTab}
                    editing={editingRoute}
                    onUpdate={updateRouteField}
                    onUpdateStep={updateStep}
                  />
                </div>
              </div>
            )}

            {/* Tool Preview (tool mode only) */}
            {mode === "tool" && preview.tool && (
              <div className="rounded-xl border border-teal-500/20 bg-card overflow-hidden">
                <div className="flex items-center justify-between bg-teal-500/5 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-teal-600" />
                    <h3 className="font-semibold text-foreground">툴 (Tool)</h3>
                    {preview.tool.is_existing ? (
                      <span className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">기존 DB 매칭</span>
                    ) : (
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">신규 등록</span>
                    )}
                  </div>
                  <button onClick={() => setEditingTool(!editingTool)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    {editingTool ? "닫기" : "수정"}
                  </button>
                </div>
                <div className="p-5">
                  <ToolPreview tool={preview.tool} editing={editingTool} onUpdate={updateToolField} />
                </div>
              </div>
            )}

            {/* Guide Preview with EN/KR Tabs */}
            <div className="rounded-xl border border-purple-500/20 bg-card overflow-hidden">
              <div className="flex items-center justify-between bg-purple-500/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <BookText className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-foreground">가이드 (Guide)</h3>
                </div>
                <div className="flex items-center gap-2">
                  {hasBoth && (
                    <LangTabs active={guideTab} onChange={setGuideTab} color="purple" />
                  )}
                  <RegenButton
                    label={guideTab === "kr" ? "KR 재생성" : "EN 재생성"}
                    loading={regenerating === `guide_${guideTab}`}
                    disabled={!!regenerating}
                    onClick={() => handleRegenerate(`guide_${guideTab}`)}
                  />
                  <button
                    onClick={() => setEditingGuide(!editingGuide)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    {editingGuide ? "닫기" : "수정"}
                  </button>
                </div>
              </div>

              {guideTab === "kr" && hasKr && (
                <GuideContent guide={preview.guide_kr!} lang="kr" editing={editingGuide} onUpdate={(f, v) => updateGuideField("kr", f, v)} />
              )}
              {guideTab === "en" && hasEn && (
                <GuideContent guide={preview.guide_en!} lang="en" editing={editingGuide} onUpdate={(f, v) => updateGuideField("en", f, v)} />
              )}
              {guideTab === "kr" && !hasKr && hasEn && (
                <GuideContent guide={preview.guide_en!} lang="en" editing={editingGuide} onUpdate={(f, v) => updateGuideField("en", f, v)} />
              )}
              {guideTab === "en" && !hasEn && hasKr && (
                <GuideContent guide={preview.guide_kr!} lang="kr" editing={editingGuide} onUpdate={(f, v) => updateGuideField("kr", f, v)} />
              )}
            </div>

            {mode === "route" && preview.route && (
              <ToolsSummary steps={preview.route.steps} />
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button onClick={handleReset} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted">
                취소
              </button>
              <button
                onClick={handleConfirm}
                disabled={phase === "saving"}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
              >
                {phase === "saving" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> 저장 중...</>
                ) : (
                  <><Save className="h-4 w-4" /> 전체 등록하기</>
                )}
              </button>
            </div>
          </div>
        )}

        {phase === "done" && result && (
          <DonePhase result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* InputPhase                                               */
/* ──────────────────────────────────────────────────────── */

function InputPhase({
  prompt, setPrompt, lang, setLang, difficulty, setDifficulty, mode, setMode, onAnalyze, loading,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  lang: LangOption;
  setLang: (v: LangOption) => void;
  difficulty: DifficultyLevel;
  setDifficulty: (v: DifficultyLevel) => void;
  mode: CreatorMode;
  setMode: (v: CreatorMode) => void;
  onAnalyze: () => void;
  loading: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const langOptions: { id: LangOption; label: string; desc: string }[] = [
    { id: "both", label: "🌐 둘 다", desc: "EN + KR 루트·가이드·툴 동시 생성" },
    { id: "kr", label: "🇰🇷 한국어만", desc: "KR 루트·가이드·툴만 생성" },
    { id: "en", label: "🇺🇸 영문만", desc: "EN 루트·가이드·툴만 생성" },
  ];

  async function fetchSuggestions(force = false) {
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const res = await fetch("/api/admin/ai-creator/suggest-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force, mode }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setSuggestions(json.suggestions ?? []);
      setIsCached(!!json.cached);
    } catch (e) {
      console.error("Failed to fetch suggestions:", e);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  const prevModeRef = useRef(mode);
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode;
      setSuggestions([]);
      setShowSuggestions(false);
      setIsCached(false);
    }
  }, [mode]);

  const trendIcon = (type: string) => {
    switch (type) {
      case "viral": return <Flame className="h-3.5 w-3.5 text-red-500" />;
      case "meme": return <Zap className="h-3.5 w-3.5 text-yellow-500" />;
      case "seasonal": return <Calendar className="h-3.5 w-3.5 text-blue-500" />;
      case "evergreen": return <Star className="h-3.5 w-3.5 text-green-500" />;
      default: return <TrendingUp className="h-3.5 w-3.5 text-violet-500" />;
    }
  };

  const trendLabel = (type: string) => {
    switch (type) {
      case "viral": return "바이럴";
      case "meme": return "밈/트렌드";
      case "seasonal": return "시즌";
      case "evergreen": return "에버그린";
      default: return type;
    }
  };

  const trendBadgeColor = (type: string) => {
    switch (type) {
      case "viral": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "meme": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "seasonal": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "evergreen": return "bg-green-500/10 text-green-600 border-green-500/20";
      default: return "bg-violet-500/10 text-violet-600 border-violet-500/20";
    }
  };

  const categoryEmoji = (cat: string) => {
    switch (cat) {
      case "video": return "🎬";
      case "image": return "🖼️";
      case "audio": return "🎵";
      case "writing": return "✍️";
      case "productivity": return "⚡";
      default: return "🤖";
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
          <Sparkles className="h-8 w-8 text-violet-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">어떤 콘텐츠를 만들까요?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "route"
            ? "원하는 작업을 자유롭게 설명해주세요. AI가 분석해서 루트, 가이드, 필요한 툴을 자동으로 구성합니다."
            : "소개할 AI 툴 이름이나 용도를 입력해주세요. AI가 툴 정보와 사용법 가이드를 생성합니다."}
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === "route"
            ? "예: 크리스마스에 산타가 우리집 사진에 합성해서 들어와서 선물주는 영상 만드는법"
            : "예: Kling AI - 사진 한장으로 고퀄리티 AI 영상 만드는 툴"}
          className="w-full rounded-xl border border-border bg-card p-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          rows={4}
          disabled={loading}
        />

        {/* Mode Selector */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">생성 모드</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("route")}
              disabled={loading}
              className={`rounded-lg border p-4 text-left transition ${
                mode === "route"
                  ? "border-violet-500 bg-violet-500/5 ring-2 ring-violet-500/20"
                  : "border-border bg-card hover:border-violet-500/40"
              }`}
            >
              <p className="text-sm font-bold text-foreground">🗺️ 루트 + 가이드</p>
              <p className="mt-1 text-xs text-muted-foreground">
                3단계 워크플로우(루트) + 루트 가이드 생성
              </p>
              <p className="mt-0.5 text-[11px] text-violet-500">기존/신규 툴 자동 매칭</p>
            </button>
            <button
              onClick={() => setMode("tool")}
              disabled={loading}
              className={`rounded-lg border p-4 text-left transition ${
                mode === "tool"
                  ? "border-violet-500 bg-violet-500/5 ring-2 ring-violet-500/20"
                  : "border-border bg-card hover:border-violet-500/40"
              }`}
            >
              <p className="text-sm font-bold text-foreground">🔧 툴 + 가이드</p>
              <p className="mt-1 text-xs text-muted-foreground">
                단일 AI 툴 소개 + 사용법 가이드 생성
              </p>
              <p className="mt-0.5 text-[11px] text-violet-500">기존 툴 선택 또는 신규 등록</p>
            </button>
          </div>
        </div>

        {/* Language Selector */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">콘텐츠 생성 언어</span>
            <span className="text-xs text-muted-foreground">({mode === "route" ? "루트 · 가이드 · 툴" : "툴 · 가이드"} 전체 적용)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {langOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setLang(opt.id)}
                disabled={loading}
                className={`rounded-lg border p-3 text-left transition ${
                  lang === opt.id
                    ? "border-violet-500 bg-violet-500/5 ring-2 ring-violet-500/20"
                    : "border-border bg-card hover:border-violet-500/40"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">AI 툴 난이도</span>
            <span className="text-xs text-muted-foreground">(타겟 사용자의 수준에 맞게)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "beginner" as const, label: "🟢 초급", desc: "ChatGPT, Canva, CapCut 등 쉬운 도구 위주" },
              { id: "intermediate" as const, label: "🟡 중급", desc: "Leonardo, Runway, ElevenLabs 등 혼합" },
              { id: "advanced" as const, label: "🔴 고급", desc: "Midjourney, ComfyUI, FaceSwap 등 전문 도구" },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setDifficulty(opt.id)}
                disabled={loading}
                className={`rounded-lg border p-3 text-left transition ${
                  difficulty === opt.id
                    ? "border-violet-500 bg-violet-500/5 ring-2 ring-violet-500/20"
                    : "border-border bg-card hover:border-violet-500/40"
                }`}
              >
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onAnalyze}
          disabled={loading || !prompt.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> AI 콘텐츠 생성 중... ({lang === "both" ? "30~60초" : "15~30초"} 소요)</>
          ) : (
            <><Sparkles className="h-5 w-5" /> AI 콘텐츠 생성 시작</>
          )}
        </button>
      </div>

      {/* AI Trend Suggestions */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">프롬프트 추천</h3>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {mode === "tool" ? "🔧 툴 + 가이드" : "🗺️ 루트 + 가이드"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">AI가 현재 트렌드를 분석해서 추천합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCached && suggestions.length > 0 && (
              <span className="text-[10px] text-muted-foreground">캐시됨</span>
            )}
            <button
              onClick={() => fetchSuggestions(suggestions.length > 0)}
              disabled={loadingSuggestions || loading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:shadow-md disabled:opacity-50"
            >
              {loadingSuggestions ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 분석 중...</>
              ) : suggestions.length > 0 ? (
                <><RefreshCw className="h-3.5 w-3.5" /> 새로 추천</>
              ) : (
                <><Zap className="h-3.5 w-3.5" /> AI 추천 받기</>
              )}
            </button>
          </div>
        </div>

        {loadingSuggestions && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">SNS 트렌드와 인기 밈을 분석하고 있습니다...</p>
          </div>
        )}

        {!loadingSuggestions && showSuggestions && suggestions.length === 0 && (
          <div className="px-5 py-6 text-center text-sm text-muted-foreground">
            추천 결과를 불러올 수 없습니다. 다시 시도해 주세요.
          </div>
        )}

        {!loadingSuggestions && suggestions.length > 0 && (
          <div className="p-4 space-y-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setPrompt(s.prompt)}
                disabled={loading}
                className={`group block w-full rounded-xl border p-4 text-left transition ${
                  prompt === s.prompt
                    ? "border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20"
                    : "border-border bg-background hover:border-amber-500/40 hover:bg-amber-500/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg">{categoryEmoji(s.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{s.title}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${trendBadgeColor(s.trend_type)}`}>
                        {trendIcon(s.trend_type)}
                        {trendLabel(s.trend_type)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">{s.prompt}</p>
                    <div className="flex items-start gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{s.reason}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {!showSuggestions && (
          <div className="px-5 py-5">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              기본 예시 — {mode === "tool" ? "🔧 툴 + 가이드" : "🗺️ 루트 + 가이드"}
            </p>
            <div className="space-y-1.5">
              {(mode === "tool"
                ? [
                    "Kling AI - 사진 한장으로 고퀄리티 AI 영상 만드는 툴",
                    "Suno - 텍스트만 입력하면 AI가 작곡해주는 음악 생성 툴",
                    "ElevenLabs - 내 목소리를 복제해서 다국어 더빙하는 AI 음성 툴",
                    "Midjourney - 프롬프트로 상업용 고퀄 이미지 만드는 AI 그림 툴",
                    "Gamma - 텍스트만 넣으면 프레젠테이션 자동 생성하는 AI 슬라이드 툴",
                  ]
                : [
                    "크리스마스에 산타가 우리집 사진에 합성해서 들어와서 선물주는 영상 만드는법",
                    "유튜브 쇼츠용 AI 아바타가 뉴스 읽어주는 영상 자동 제작",
                    "블로그 글 쓰고 대표 이미지까지 AI로 한번에 만들기",
                    "팟캐스트 녹음을 AI로 편집하고 자막과 숏폼 클립까지 자동 생성",
                    "제품 사진에서 배경 제거하고 쇼핑몰용 이미지 자동 생성",
                  ]
              ).map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(example)}
                  disabled={loading}
                  className="block w-full rounded-lg border border-border bg-background p-3 text-left text-sm text-muted-foreground transition hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Route Preview (language-aware)                          */
/* ──────────────────────────────────────────────────────── */

function RoutePreview({
  route, viewLang, editing, onUpdate, onUpdateStep,
}: {
  route: RouteData;
  viewLang: "en" | "kr";
  editing: boolean;
  onUpdate: (field: keyof RouteData, value: any) => void;
  onUpdateStep: (index: number, field: keyof Step, value: any) => void;
}) {
  const isKr = viewLang === "kr";
  const title = isKr ? (route.title_kr || route.title) : route.title;
  const description = isKr ? (route.description_kr || route.description) : route.description;
  const bullets = isKr
    ? (route.guide_bullets_kr ?? route.guide_bullets ?? [])
    : (route.guide_bullets_en ?? route.guide_bullets ?? []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
        {editing ? (
          <div className="space-y-3">
            {isKr ? (
              <>
                <EditField label="제목 (KR)" value={route.title_kr ?? ""} onChange={(v) => onUpdate("title_kr", v)} />
                <EditField label="설명 (KR)" value={route.description_kr ?? ""} onChange={(v) => onUpdate("description_kr", v)} multiline />
              </>
            ) : (
              <>
                <EditField label="Title (EN)" value={route.title} onChange={(v) => onUpdate("title", v)} />
                <EditField label="Description (EN)" value={route.description} onChange={(v) => onUpdate("description", v)} multiline />
              </>
            )}
            <EditField label="Slug" value={route.slug} onChange={(v) => onUpdate("slug", v)} />
            <EditField label="아이콘 (이모지)" value={route.icon} onChange={(v) => onUpdate("icon", v)} />
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">{route.icon}</div>
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            {route.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {route.tags.map((tag, i) => (
                  <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/70 border border-border">#{tag}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-bold text-foreground">{isKr ? "이 루트에 최적화된 도구" : "Optimized Tools"}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase font-semibold tracking-wide">{isKr ? "추천" : "BEST"}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[...new Set(route.steps.map((s) => s.new_tool?.name || s.tool_slug))].map((name) => (
            <span key={name} className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
              {name}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-bold text-foreground">{isKr ? "워크플로우 단계" : "Workflow Steps"}</h3>
        <div className="space-y-6">
          {route.steps.map((step, idx) => (
            <StepCard key={step.position} step={step} index={idx} viewLang={viewLang} editing={editing} onUpdate={onUpdateStep} />
          ))}
        </div>
      </div>

      {bullets.length > 0 && (
        <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">{isKr ? "프로 팁" : "Pro Tips"}</h3>
          <ul className="space-y-3">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">✓</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Step Card (language-aware)                              */
/* ──────────────────────────────────────────────────────── */

function getInputLabel(inputType: string): string {
  switch (inputType) {
    case "settings": return "SETTINGS";
    case "action": return "ACTION GUIDE";
    case "prompt": return "PROMPT";
    default: return "PROMPT";
  }
}

function StepCard({ step, index, viewLang, editing, onUpdate }: {
  step: Step; index: number; viewLang: "en" | "kr"; editing: boolean;
  onUpdate: (index: number, field: keyof Step, value: any) => void;
}) {
  const isKr = viewLang === "kr";
  const stepTitle = isKr ? (step.step_title_kr || step.step_title) : step.step_title;
  const stepWhy = isKr ? (step.step_why_kr || step.step_why) : step.step_why;
  const promptText = isKr
    ? (step.step_prompt_example_kr || step.step_prompt_example || "")
    : (step.step_prompt_example_en || step.step_prompt_example || "");
  const ctaLabel = isKr
    ? (step.step_cta_label_kr || step.step_cta_label || `${step.new_tool?.name || step.tool_slug} 사용해보기`)
    : (step.step_cta_label || `Try ${step.new_tool?.name || step.tool_slug}`);

  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{step.position}</div>
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              {isKr ? (
                <EditField label="스텝 제목 (KR)" value={step.step_title_kr ?? ""} onChange={(v) => onUpdate(index, "step_title_kr", v)} />
              ) : (
                <EditField label="Step Title (EN)" value={step.step_title} onChange={(v) => onUpdate(index, "step_title", v)} />
              )}
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-foreground">{stepTitle}</h3>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{step.new_tool?.name || step.tool_slug}</span>
            {step.is_existing_tool ? (
              <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" /> 기존 툴</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-orange-600"><PlusCircle className="h-3 w-3" /> 신규 등록</span>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="mb-4">
          {isKr ? (
            <EditField label="이유 (KR)" value={step.step_why_kr || ""} onChange={(v) => onUpdate(index, "step_why_kr", v)} multiline />
          ) : (
            <EditField label="Why (EN)" value={step.step_why} onChange={(v) => onUpdate(index, "step_why", v)} multiline />
          )}
        </div>
      ) : (
        stepWhy && (
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{stepWhy}</p>
        )
      )}

      {editing ? (
        <div className="mb-4 space-y-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">입력 타입</label>
            <select value={step.step_input_type} onChange={(e) => onUpdate(index, "step_input_type", e.target.value)}
              className="rounded-lg border border-border bg-background p-2 text-sm text-foreground">
              <option value="settings">SETTINGS</option>
              <option value="action">ACTION GUIDE</option>
              <option value="prompt">PROMPT</option>
            </select>
          </div>
          {isKr ? (
            <EditField label="내용 (KR)" value={step.step_prompt_example_kr ?? ""}
              onChange={(v) => onUpdate(index, "step_prompt_example_kr", v)} multiline />
          ) : (
            <EditField label="Content (EN)" value={step.step_prompt_example_en ?? step.step_prompt_example ?? ""}
              onChange={(v) => onUpdate(index, "step_prompt_example_en", v)} multiline />
          )}
          {isKr ? (
            <EditField label="CTA (KR)" value={step.step_cta_label_kr ?? ""}
              onChange={(v) => onUpdate(index, "step_cta_label_kr", v)} />
          ) : (
            <EditField label="CTA (EN)" value={step.step_cta_label ?? ""}
              onChange={(v) => onUpdate(index, "step_cta_label", v)} />
          )}
        </div>
      ) : (
        promptText && (
          <div className="relative mb-4 rounded-lg bg-muted/50 p-4 border border-border">
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{getInputLabel(step.step_input_type)}</p>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{promptText}</p>
          </div>
        )
      )}

      {!editing && (
        <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20">
          <ExternalLink className="h-4 w-4" />
          {ctaLabel}
        </div>
      )}

      {step.new_tool && !editing && (
        <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
          <p className="text-xs font-semibold text-orange-600 mb-2">신규 툴 등록 정보</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">이름:</span> <span className="text-foreground">{step.new_tool.name}</span></div>
            <div><span className="text-muted-foreground">카테고리:</span> <span className="text-foreground">{step.new_tool.category}</span></div>
            <div className="col-span-2"><span className="text-muted-foreground">설명:</span> <span className="text-foreground">{step.new_tool.description}</span></div>
            {step.new_tool.website_url && (
              <div className="col-span-2">
                <a href={step.new_tool.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                  {step.new_tool.website_url} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Guide Content (used inside tabs)                         */
/* ──────────────────────────────────────────────────────── */

function GuideContent({ guide, lang, editing, onUpdate }: {
  guide: GuideData; lang: "en" | "kr"; editing: boolean;
  onUpdate: (field: keyof GuideData, value: any) => void;
}) {
  const charCount = guide.content.length;
  const charColor = charCount >= 3000 ? "text-green-600" : charCount >= 2000 ? "text-yellow-600" : "text-red-500";
  const langLabel = lang === "kr" ? "🇰🇷 한국어" : "🇺🇸 English";

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{langLabel} · <span className={charColor}>{charCount.toLocaleString()}자</span></span>
      </div>

      {editing ? (
        <div className="space-y-3">
          <EditField label="제목" value={guide.title} onChange={(v) => onUpdate("title", v)} />
          <EditField label="Slug" value={guide.slug} onChange={(v) => onUpdate("slug", v)} />
          <EditField label="요약" value={guide.excerpt} onChange={(v) => onUpdate("excerpt", v)} multiline />
          <EditField label="카테고리" value={guide.category} onChange={(v) => onUpdate("category", v)} />
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-xs font-medium text-muted-foreground">본문 (Markdown)</label>
              <span className={`text-xs ${charColor}`}>{charCount.toLocaleString()}자 (목표: 3,000~5,000자)</span>
            </div>
            <textarea value={guide.content} onChange={(e) => onUpdate("content", e.target.value)} rows={30}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm font-mono text-foreground focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
          </div>
        </div>
      ) : (
        <div>
          <h4 className="text-xl font-bold text-foreground mb-1">{guide.title}</h4>
          <p className="text-xs text-muted-foreground mb-3">/{guide.slug}</p>
          <p className="text-sm text-muted-foreground mb-5 rounded-lg bg-muted/30 p-3 border border-border">{guide.excerpt}</p>
          <div className="rounded-lg border border-border bg-card p-5 max-h-[600px] overflow-y-auto">
            {renderMarkdownSimple(guide.content)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Markdown Renderer                                        */
/* ──────────────────────────────────────────────────────── */

function renderMarkdownSimple(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="mt-5 mb-2 text-base font-semibold text-foreground">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="mt-6 mb-3 text-lg font-bold text-foreground border-b border-border pb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("- [ ] ")) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 py-0.5">
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border" />
          <span className="text-sm text-foreground">{line.slice(6)}</span>
        </div>
      );
    } else if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/);
      if (match) {
        elements.push(
          <div key={key++} className="flex items-start gap-2 py-1">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
            <span className="text-sm text-foreground"><strong>{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}</span>
          </div>
        );
      } else {
        elements.push(
          <div key={key++} className="flex items-start gap-2 py-0.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
            <span className="text-sm text-foreground">{line.slice(2)}</span>
          </div>
        );
      }
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 py-0.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
          <span className="text-sm text-foreground">{line.slice(2)}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(<p key={key++} className="text-sm leading-relaxed text-foreground/90">{line}</p>);
    }
  }

  return elements;
}

/* ──────────────────────────────────────────────────────── */
/* Tool Preview (tool mode)                                 */
/* ──────────────────────────────────────────────────────── */

function ToolPreview({
  tool,
  editing,
  onUpdate,
}: {
  tool: ToolData;
  editing: boolean;
  onUpdate: (field: keyof ToolData, value: any) => void;
}) {
  const pricingLabel: Record<string, string> = {
    free: "무료",
    freemium: "프리미엄",
    paid: "유료",
    enterprise: "엔터프라이즈",
  };

  if (editing) {
    return (
      <div className="space-y-3">
        <EditField label="Slug" value={tool.slug} onChange={(v) => onUpdate("slug", v)} />
        <EditField label="Name (EN)" value={tool.name} onChange={(v) => onUpdate("name", v)} />
        {tool.name_kr !== undefined && (
          <EditField label="Name (KR)" value={tool.name_kr ?? ""} onChange={(v) => onUpdate("name_kr", v)} />
        )}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Description (EN)</label>
          <textarea
            value={tool.description}
            onChange={(e) => onUpdate("description", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
          />
        </div>
        {tool.description_kr !== undefined && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description (KR)</label>
            <textarea
              value={tool.description_kr ?? ""}
              onChange={(e) => onUpdate("description_kr", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm"
            />
          </div>
        )}
        <EditField label="URL" value={tool.url} onChange={(v) => onUpdate("url", v)} />
        <EditField label="Category" value={tool.category} onChange={(v) => onUpdate("category", v)} />
        <EditField label="Pricing" value={tool.pricing} onChange={(v) => onUpdate("pricing", v)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-xl font-bold text-teal-600">
          {tool.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h4 className="text-lg font-bold text-foreground">{tool.name}</h4>
          {tool.name_kr && <p className="text-sm text-muted-foreground">{tool.name_kr}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-600">{tool.category}</span>
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600">{pricingLabel[tool.pricing] ?? tool.pricing}</span>
        <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs text-muted-foreground">{tool.slug}</span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{tool.description}</p>
      {tool.description_kr && (
        <p className="text-sm text-muted-foreground leading-relaxed">{tool.description_kr}</p>
      )}
      {tool.url && (
        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline">
          <ExternalLink className="h-3 w-3" /> {tool.url}
        </a>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Tools Summary                                            */
/* ──────────────────────────────────────────────────────── */

function ToolsSummary({ steps }: { steps: Step[] }) {
  const existing = steps.filter((s) => s.is_existing_tool);
  const newTools = steps.filter((s) => !s.is_existing_tool && s.new_tool);

  return (
    <div className="rounded-xl border border-orange-500/20 bg-card overflow-hidden">
      <div className="bg-orange-500/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <Wrench className="h-5 w-5 text-orange-600" />
          <div>
            <h3 className="font-semibold text-foreground">툴 (Tools)</h3>
            <p className="text-xs text-muted-foreground">기존 {existing.length}개 · 신규 {newTools.length}개</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {steps.map((step) => (
            <div key={step.position} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{step.position}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{step.new_tool?.name || step.tool_slug}</p>
                <p className="text-xs text-muted-foreground">{step.is_existing_tool ? "DB 기존 툴" : step.new_tool?.category ?? "신규"}</p>
              </div>
              {step.is_existing_tool ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" /> : <PlusCircle className="h-4 w-4 shrink-0 text-orange-500" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Done Phase                                               */
/* ──────────────────────────────────────────────────────── */

function DonePhase({ result, onReset }: { result: ConfirmResult; onReset: () => void }) {
  const isToolMode = !!result.tool_slug && !result.route_id;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">등록 완료!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isToolMode ? "툴과 가이드가" : "루트, 가이드, 툴이"} 성공적으로 등록되었습니다.
          {result.guide_en && result.guide_kr ? " (EN + KR)" : result.guide_kr ? " (KR)" : " (EN)"}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {isToolMode && result.tool_slug && (
          <ResultRow
            label={`툴${result.tool_created ? " (신규)" : " (기존)"}`}
            slug={result.tool_slug}
            href={`/tools/${result.tool_slug}`}
          />
        )}

        {!isToolMode && result.route_slug && (
          <ResultRow
            label={`루트${result.guide_en && result.guide_kr ? " (EN+KR)" : result.guide_kr ? " (EN base + KR i18n)" : " (EN)"}`}
            slug={result.route_slug}
            href={`/routes/${result.route_slug}`}
          />
        )}

        {result.guide_en && (
          <div>
            <ResultRow label="가이드 (EN)" slug={result.guide_en.slug} href={`/guides/${result.guide_en.slug}`} />
            <QualityBar score={result.guide_en.quality_score} />
          </div>
        )}

        {result.guide_kr && (
          <div>
            <ResultRow label="가이드 (KR)" slug={result.guide_kr.slug} href={`/guides/${result.guide_kr.slug}`} />
            <QualityBar score={result.guide_kr.quality_score} />
          </div>
        )}

        {(result.tools_created?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">신규 등록 툴</p>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(result.tools_created!)].map((slug) => (
                <span key={slug} className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs text-orange-600">{slug}</span>
              ))}
            </div>
          </div>
        )}

        {(result.tools_matched?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">매칭된 기존 툴</p>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(result.tools_matched!)].map((slug) => (
                <span key={slug} className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs text-green-600">{slug}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={onReset} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg">
          <Sparkles className="h-4 w-4" /> 새로운 콘텐츠 만들기
        </button>
        <Link href="/admin" className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted">관리자 홈으로</Link>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Shared                                                   */
/* ──────────────────────────────────────────────────────── */

function QualityBar({ score }: { score: number }) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-muted-foreground">{score}</span>
    </div>
  );
}

function ResultRow({ label, slug, href }: { label: string; slug: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">/{slug}</p>
      </div>
      <Link href={href} target="_blank" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground">
        보기 <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}

function EditField({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Usage Banner                                            */
/* ──────────────────────────────────────────────────────── */

function UsageBanner({ usage }: { usage: UsageData }) {
  const [open, setOpen] = useState(false);

  const formatCost = (usd: number) => {
    if (usd < 0.01) return "<$0.01";
    return `$${usd.toFixed(2)}`;
  };

  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs transition hover:bg-muted"
      >
        <Activity className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-muted-foreground">오늘</span>
        <span className="font-semibold text-foreground">{formatCost(usage.today.cost_usd)}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{formatTokens(usage.today.tokens)} 토큰</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">OpenAI 사용량</h4>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{usage.model}</span>
            </div>

            <div className="space-y-3">
              {/* Today */}
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">오늘</span>
                  <span className="text-sm font-bold text-foreground">{formatCost(usage.today.cost_usd)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{usage.today.calls}</p>
                    <p className="text-[10px] text-muted-foreground">API 호출</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{usage.today.creates}</p>
                    <p className="text-[10px] text-muted-foreground">콘텐츠 생성</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{usage.today.suggests}</p>
                    <p className="text-[10px] text-muted-foreground">추천</p>
                  </div>
                </div>
                <p className="mt-1 text-center text-[10px] text-muted-foreground">{formatTokens(usage.today.tokens)} 토큰 사용</p>
              </div>

              {/* This Month */}
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">이번 달</span>
                  <span className="text-sm font-bold text-foreground">{formatCost(usage.month.cost_usd)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{usage.month.calls}</p>
                    <p className="text-[10px] text-muted-foreground">API 호출</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{usage.month.creates}</p>
                    <p className="text-[10px] text-muted-foreground">콘텐츠 생성</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{usage.month.suggests}</p>
                    <p className="text-[10px] text-muted-foreground">추천</p>
                  </div>
                </div>
                <p className="mt-1 text-center text-[10px] text-muted-foreground">{formatTokens(usage.month.tokens)} 토큰 사용</p>
              </div>
            </div>

            <div className="mt-3 border-t border-border pt-3">
              <a
                href="https://platform.openai.com/settings/organization/billing/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <DollarSign className="h-3.5 w-3.5" />
                OpenAI 잔액 확인 (대시보드)
                <ExternalLink className="h-3 w-3" />
              </a>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                잔액 조회 API가 없어 대시보드에서 직접 확인해 주세요
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Language Tabs                                           */
/* ──────────────────────────────────────────────────────── */

function LangTabs({ active, onChange, color }: {
  active: "en" | "kr";
  onChange: (v: "en" | "kr") => void;
  color: "blue" | "purple";
}) {
  const activeClass = color === "blue" ? "bg-blue-600 text-white" : "bg-purple-600 text-white";
  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => onChange("kr")}
        className={`px-3 py-1.5 text-xs font-medium transition ${active === "kr" ? activeClass : "bg-card text-muted-foreground hover:bg-muted"}`}
      >
        🇰🇷 한국어
      </button>
      <button
        onClick={() => onChange("en")}
        className={`px-3 py-1.5 text-xs font-medium transition ${active === "en" ? activeClass : "bg-card text-muted-foreground hover:bg-muted"}`}
      >
        🇺🇸 English
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Regenerate Button                                       */
/* ──────────────────────────────────────────────────────── */

function RegenButton({ label, loading, disabled, onClick }: {
  label: string; loading: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-xs font-medium text-amber-600 transition hover:bg-amber-500/10 disabled:opacity-50"
    >
      {loading ? (
        <><Loader2 className="h-3 w-3 animate-spin" /> 재생성 중...</>
      ) : (
        <><RefreshCw className="h-3 w-3" /> {label}</>
      )}
    </button>
  );
}
