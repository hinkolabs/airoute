"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Globe, Check, AlertCircle, Copy } from "lucide-react";

const TAB_KEYS = ["overview", "edit", "preview", "publish"] as const;
type TabKey = typeof TAB_KEYS[number];

function normalizeTab(value: string | null): TabKey {
  return TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : "overview";
}

const TEMPLATES = [
  { id: "A", name: "상담/문의 중심", description: "큰 CTA + 핵심 포인트" },
  { id: "B", name: "상품/프로모션", description: "프로모션 배지 + 혜택" },
  { id: "C", name: "신뢰/경력 중심", description: "프로필 + 신뢰 증거" },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

interface LandingState {
  status: "draft" | "published";
  templateId: TemplateId;
  slug: string;
  title: string;
  subtitle: string;
  highlightsText: string;
  ctaLabel: string;
  ctaValue: string;
}

const INITIAL_STATE: LandingState = {
  status: "draft",
  templateId: "A",
  slug: "my-landing",
  title: "",
  subtitle: "",
  highlightsText: "",
  ctaLabel: "상담 문의하기",
  ctaValue: "",
};

export default function KrWorkspaceMarketingLandingClient() {
  const { activeWorkspace, loading } = useWorkspace();
  const searchParams = useSearchParams();

  const [landingState, setLandingState] = useState<LandingState>(INITIAL_STATE);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Tab state from query string
  const activeTab = useMemo(
    () => normalizeTab(searchParams.get("tab")),
    [searchParams]
  );

  // Handle tab change
  const handleTabChange = useCallback((next: string) => {
    const newTab = normalizeTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    window.history.replaceState(null, "", url.toString());
  }, []);

  // Validation
  const isValid = useMemo(() => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return (
      landingState.slug.trim() !== "" &&
      slugRegex.test(landingState.slug) &&
      landingState.title.trim() !== "" &&
      landingState.ctaValue.trim() !== ""
    );
  }, [landingState]);

  // Handlers
  const handleFieldChange = useCallback(
    (field: keyof LandingState, value: string | TemplateId) => {
      setLandingState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSaveLocal = useCallback(() => {
    setSaveMessage("로컬 상태에 저장되었습니다 (UI only)");
    setTimeout(() => setSaveMessage(""), 3000);
  }, []);

  const handlePublish = useCallback(() => {
    if (isValid) {
      setLandingState((prev) => ({ ...prev, status: "published" }));
    }
  }, [isValid]);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/kr/l/${landingState.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [landingState.slug]);

  // Role check
  const workspaceName = activeWorkspace?.workspace.name || "워크스페이스";

  if (loading) {
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
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Globe className="h-6 w-6" />
            랜딩페이지
          </h1>
          <p className="text-sm text-muted-foreground">
            상담/문의 전환용 미니 랜딩 + QR (UI 초안)
          </p>
        </div>
        <Badge tone="muted" className="text-xs">
          UI only
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full justify-start gap-2 mb-6">
          <TabsTrigger value="overview" className="min-w-[80px]">
            개요
          </TabsTrigger>
          <TabsTrigger value="edit" className="min-w-[80px]">
            편집
          </TabsTrigger>
          <TabsTrigger value="preview" className="min-w-[80px]">
            미리보기
          </TabsTrigger>
          <TabsTrigger value="publish" className="min-w-[80px]">
            Publish
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <OverviewTab
            landingState={landingState}
            isValid={isValid}
            onTabChange={handleTabChange}
          />
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit">
          <EditTab
            landingState={landingState}
            saveMessage={saveMessage}
            onChange={handleFieldChange}
            onSave={handleSaveLocal}
            onTabChange={handleTabChange}
          />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <PreviewTab
            landingState={landingState}
            onTabChange={handleTabChange}
          />
        </TabsContent>

        {/* Publish Tab */}
        <TabsContent value="publish">
          <PublishTab
            landingState={landingState}
            isValid={isValid}
            copySuccess={copySuccess}
            onPublish={handlePublish}
            onCopyLink={handleCopyLink}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Overview Tab Component
// ============================================================
function OverviewTab({
  landingState,
  isValid,
  onTabChange,
}: {
  landingState: LandingState;
  isValid: boolean;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">내 랜딩 (초안)</h2>
          <Badge tone={landingState.status === "published" ? "success" : "muted"}>
            {landingState.status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground mb-1">URL 미리보기</div>
            <div className="rounded bg-muted px-3 py-2 text-sm font-mono text-foreground">
              /kr/l/{landingState.slug || "my-landing"}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              size="md"
              onClick={() => onTabChange("edit")}
            >
              템플릿 선택 & 편집
            </Button>
            <Button
              variant="outline"
              size="md"
              disabled={!isValid}
              onClick={() => onTabChange("preview")}
            >
              미리보기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Edit Tab Component
// ============================================================
function EditTab({
  landingState,
  saveMessage,
  onChange,
  onSave,
  onTabChange,
}: {
  landingState: LandingState;
  saveMessage: string;
  onChange: (field: keyof LandingState, value: string | TemplateId) => void;
  onSave: () => void;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Template selector */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">템플릿 선택</h2>
        <div className="space-y-3">
          {TEMPLATES.map((tpl) => {
            const isActive = landingState.templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => onChange("templateId", tpl.id)}
                className={`w-full text-left rounded-lg border p-4 transition ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-foreground mb-1">
                      {tpl.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tpl.description}
                    </div>
                  </div>
                  {isActive && <Check className="h-5 w-5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Form */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">랜딩 내용</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Landing Slug</label>
          <input
            type="text"
            value={landingState.slug}
            onChange={(e) => onChange("slug", e.target.value)}
            placeholder="my-landing"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="text-xs text-muted-foreground mt-1">
            소문자, 숫자, 하이픈만 사용
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">메인 헤드라인</label>
          <input
            type="text"
            value={landingState.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="예: 지금 무료 상담 받으세요"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">서브타이틀</label>
          <input
            type="text"
            value={landingState.subtitle}
            onChange={(e) => onChange("subtitle", e.target.value)}
            placeholder="예: 전문가가 직접 답변드립니다"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">핵심 포인트</label>
          <textarea
            value={landingState.highlightsText}
            onChange={(e) => onChange("highlightsText", e.target.value)}
            placeholder="줄바꿈으로 항목 구분&#10;예:&#10;빠른 응답 (24h 이내)&#10;맞춤 솔루션 제안&#10;무료 초기 상담"
            rows={5}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CTA 버튼 텍스트</label>
          <input
            type="text"
            value={landingState.ctaLabel}
            onChange={(e) => onChange("ctaLabel", e.target.value)}
            placeholder="상담 문의하기"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CTA 링크/연락처</label>
          <input
            type="text"
            value={landingState.ctaValue}
            onChange={(e) => onChange("ctaValue", e.target.value)}
            placeholder="카카오 채널 링크 또는 전화번호 또는 예약 링크"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        {saveMessage && (
          <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
            {saveMessage}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onSave}>
            저장 (로컬 상태)
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => onTabChange("preview")}
          >
            미리보기로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Preview Tab Component
// ============================================================
function PreviewTab({
  landingState,
  onTabChange,
}: {
  landingState: LandingState;
  onTabChange: (tab: string) => void;
}) {
  const highlights = useMemo(() => {
    return landingState.highlightsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }, [landingState.highlightsText]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">미리보기</h2>
        <Badge tone="muted">Template {landingState.templateId}</Badge>
      </div>

      {/* Mock Landing Page */}
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-8">
        {landingState.templateId === "A" && (
          <TemplateAPreview
            title={landingState.title}
            subtitle={landingState.subtitle}
            highlights={highlights}
            ctaLabel={landingState.ctaLabel}
          />
        )}
        {landingState.templateId === "B" && (
          <TemplateBPreview
            title={landingState.title}
            subtitle={landingState.subtitle}
            highlights={highlights}
            ctaLabel={landingState.ctaLabel}
          />
        )}
        {landingState.templateId === "C" && (
          <TemplateCPreview
            title={landingState.title}
            subtitle={landingState.subtitle}
            highlights={highlights}
            ctaLabel={landingState.ctaLabel}
          />
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="md" onClick={() => onTabChange("edit")}>
          편집으로 돌아가기
        </Button>
        <Button variant="primary" size="md" onClick={() => onTabChange("publish")}>
          Publish 화면
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Publish Tab Component
// ============================================================
function PublishTab({
  landingState,
  isValid,
  copySuccess,
  onPublish,
  onCopyLink,
}: {
  landingState: LandingState;
  isValid: boolean;
  copySuccess: boolean;
  onPublish: () => void;
  onCopyLink: () => void;
}) {
  const finalUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/kr/l/${landingState.slug}`;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            DB/QR은 다음 단계에서 연결됩니다. 현재는 UI 초안만 로컬 상태로
            관리됩니다.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">최종 URL</div>
          <div className="rounded-md bg-muted border border-border px-3 py-2 text-sm font-mono text-foreground">
            {finalUrl}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">QR 코드</div>
          <div className="rounded-md border-2 border-dashed border-border bg-muted/30 flex items-center justify-center h-48">
            <div className="text-center text-muted-foreground">
              <div className="text-sm">QR will appear after publish</div>
              <div className="text-xs mt-1">(UI-only 단계에서는 표시 안 됨)</div>
            </div>
          </div>
        </div>

        {landingState.status === "published" && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-900">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                랜딩이 Publish 되었습니다 (UI-only 상태). 링크를 복사하여 테스트해보세요.
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {landingState.status !== "published" ? (
            <Button
              variant="primary"
              size="md"
              disabled={!isValid}
              onClick={onPublish}
            >
              Publish (UI-only)
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={onCopyLink}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copySuccess ? "복사됨!" : "링크 복사"}
              </Button>
              <Button variant="outline" size="md" disabled>
                QR 다운로드 (비활성)
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Template Preview Components
// ============================================================
function TemplateAPreview({
  title,
  subtitle,
  highlights,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  highlights: string[];
  ctaLabel: string;
}) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {title || "메인 헤드라인"}
        </h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {highlights.length > 0 && (
        <ul className="space-y-2 text-left max-w-md mx-auto">
          {highlights.map((hl, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span className="text-sm">{hl}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-4">
        <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold">
          {ctaLabel || "상담 문의하기"}
        </button>
      </div>
    </div>
  );
}

function TemplateBPreview({
  title,
  subtitle,
  highlights,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  highlights: string[];
  ctaLabel: string;
}) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6">
      <Badge tone="success" className="text-sm px-3 py-1">
        🎁 특별 프로모션
      </Badge>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {title || "메인 헤드라인"}
        </h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {highlights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {highlights.map((hl, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card p-3 text-sm"
            >
              ✨ {hl}
            </div>
          ))}
        </div>
      )}
      <div className="pt-4">
        <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold">
          {ctaLabel || "상담 문의하기"}
        </button>
      </div>
    </div>
  );
}

function TemplateCPreview({
  title,
  subtitle,
  highlights,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  highlights: string[];
  ctaLabel: string;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center text-2xl">
          👤
        </div>
        <div className="text-left">
          <h1 className="text-2xl font-bold text-foreground">
            {title || "메인 헤드라인"}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {highlights.length > 0 && (
        <ul className="space-y-2 text-left">
          {highlights.map((hl, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">{hl}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-4 text-center">
        <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg text-lg font-semibold">
          {ctaLabel || "상담 문의하기"}
        </button>
      </div>
    </div>
  );
}
