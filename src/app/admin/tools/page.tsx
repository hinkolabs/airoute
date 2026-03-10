"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type I18nRow = {
  locale: string;
  name: string | null;
  description: string | null;
  task_category?: string | null;
  best_for?: string | null;
  why_pick?: string | null;
  detail_content?: unknown;
};

type Tool = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  url: string | null;
  affiliate_url: string | null;
  badge: string | null;
  is_active: boolean | null;
  created_at: string;
  tools_i18n?: I18nRow[];
};

type ToolFormData = {
  name: string;
  slug: string;
  description: string;
};

const EMPTY_FORM: ToolFormData = {
  name: "",
  slug: "",
  description: "",
};

const MIGRATION_SQL = `-- tools_i18n 확장 컬럼 추가 (Supabase SQL Editor에서 실행)
ALTER TABLE tools_i18n
  ADD COLUMN IF NOT EXISTS task_category TEXT,
  ADD COLUMN IF NOT EXISTS best_for TEXT,
  ADD COLUMN IF NOT EXISTS why_pick TEXT,
  ADD COLUMN IF NOT EXISTS detail_content JSONB;`;

type TranslateResultItem = {
  toolId: string;
  toolName: string;
  status: string;
  error?: string;
};

type TranslateResponse = {
  ok: boolean;
  processed: number;
  total: number;
  remaining: number;
  hasMore: boolean;
  results: TranslateResultItem[];
};

type SeedContentResultItem = {
  toolId: string;
  name: string;
  status: string;
  error?: string;
};

type SeedContentResponse = {
  ok: boolean;
  message: string;
  processed: number;
  total: number;
  remaining: number;
  hasMore: boolean;
  results: SeedContentResultItem[];
};

export default function AdminToolsPage() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [forceRetranslate, setForceRetranslate] = useState(false);
  const [batchSize, setBatchSize] = useState(3);
  const [translateModel, setTranslateModel] = useState("gpt-4o-mini");
  const [toolListFilter, setToolListFilter] = useState<"untranslated" | "all">("untranslated");
  const [migrationStatus, setMigrationStatus] = useState<
    "checking" | "applied" | "needed" | "error"
  >("checking");
  const [sqlCopied, setSqlCopied] = useState(false);
  const [translateResult, setTranslateResult] = useState<TranslateResponse | null>(null);
  const [seedingContent, setSeedingContent] = useState(false);
  const [seedContentBatchSize, setSeedContentBatchSize] = useState(5);
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [seedContentResult, setSeedContentResult] = useState<SeedContentResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Quick create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState<ToolFormData>(EMPTY_FORM);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const checkMigration = useCallback(async () => {
    setMigrationStatus("checking");
    try {
      const res = await fetch("/api/admin/tools/check-i18n-migration");
      const json = await res.json();
      setMigrationStatus(json.migrated ? "applied" : "needed");
    } catch {
      setMigrationStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchTools();
    checkMigration();
  }, [checkMigration]);

  async function fetchTools() {
    try {
      const res = await fetch("/api/admin/tools/list-all");
      const json = await res.json();
      if (json.ok) setTools(json.tools || []);
    } catch (e) {
      console.error("Failed to fetch tools:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedContent() {
    if (seedingContent) return;
    setSeedingContent(true);
    setSeedContentResult(null);
    try {
      const res = await fetch("/api/admin/tools/seed-detail-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          forceRegenerate,
          batchSize: seedContentBatchSize,
          delayMs: 2000,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Content generation failed");
      setSeedContentResult(json as SeedContentResponse);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "생성 실패";
      setSeedContentResult({
        ok: false,
        message: message,
        processed: 0,
        total: 0,
        remaining: 0,
        hasMore: false,
        results: [{ toolId: "", name: "오류", status: "error", error: message }],
      });
    } finally {
      setSeedingContent(false);
    }
  }

  async function handleTranslate() {
    if (translating) return;
    setTranslating(true);
    setTranslateResult(null);

    try {
      const res = await fetch("/api/admin/tools/translate-to-kr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: selectedToolId || null,
          forceRetranslate,
          batchSize: selectedToolId ? 1 : batchSize,
          delayMs: 3000,
          model: translateModel,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Translation failed");
      setTranslateResult(json as TranslateResponse);
      fetchTools();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "번역 실패";
      setTranslateResult({
        ok: false,
        processed: 0,
        total: 0,
        remaining: 0,
        hasMore: false,
        results: [{ toolId: "", toolName: "오류", status: "error", error: message }],
      });
    } finally {
      setTranslating(false);
    }
  }

  async function handleCreate() {
    if (creating) return;
    if (!createFormData.name.trim()) {
      alert("툴 이름을 입력해주세요.");
      return;
    }
    setCreating(true);

    try {
      const res = await fetch("/api/admin/tools/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createFormData),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "생성 실패");
      router.push(`/admin/tools/${json.tool.id}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "생성 실패");
      setCreating(false);
    }
  }

  async function handleDelete(toolId: string, toolName: string) {
    if (!confirm(`"${toolName}" 툴을 삭제하시겠습니까?\ni18n 데이터도 함께 삭제됩니다.`)) return;

    setDeletingId(toolId);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "삭제 실패");
      fetchTools();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopySQL() {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  }

  const filteredTools = tools.filter((tool) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(q) ||
      (tool.slug || "").toLowerCase().includes(q) ||
      (tool.description || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <a href="/admin" className="mb-4 inline-block text-sm text-primary hover:underline">
          ← 관리자 대시보드로 돌아가기
        </a>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">툴 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            툴 등록, 수정, 삭제 및 한글 번역을 관리합니다.
          </p>
        </div>

        {/* ── Step 1: Migration Status ── */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">
              Step 1. DB 마이그레이션
            </h2>
            <MigrationBadge status={migrationStatus} />
          </div>

          {migrationStatus === "needed" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <code>tools_i18n</code> 테이블에 확장 컬럼이 필요합니다.
                아래 SQL을 <strong>Supabase Dashboard → SQL Editor</strong>에서 실행해주세요.
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs text-foreground">
                  {MIGRATION_SQL}
                </pre>
                <button
                  onClick={handleCopySQL}
                  className="absolute right-3 top-3 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  {sqlCopied ? "복사됨!" : "SQL 복사"}
                </button>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://supabase.com/dashboard/project/_/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                >
                  Supabase SQL Editor 열기 →
                </a>
                <button
                  onClick={checkMigration}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  적용 확인
                </button>
              </div>
            </div>
          )}
          {migrationStatus === "applied" && (
            <p className="text-sm text-green-600">확장 컬럼이 적용되어 있습니다.</p>
          )}
          {migrationStatus === "checking" && (
            <p className="text-sm text-muted-foreground">확인 중...</p>
          )}
        </div>

        {/* ── Step 2: English Guide Content Generation ── */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1 text-card-foreground">
            Step 2. 영문 가이드 생성 (detail_content)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            OpenAI로 각 툴의 intro, features, bestFor, whyPicked, tips 영문 콘텐츠를 자동 생성합니다.
            <br />
            <span className="text-yellow-600 dark:text-yellow-400">이미 detail_content가 있는 툴은 자동으로 건너뜁니다.</span>
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="force-regenerate"
                checked={forceRegenerate}
                onChange={(e) => setForceRegenerate(e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="force-regenerate" className="text-sm text-card-foreground">
                기존 콘텐츠 덮어쓰기 (Force Regenerate)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                배치 처리 개수
              </label>
              <select
                value={seedContentBatchSize}
                onChange={(e) => setSeedContentBatchSize(Number(e.target.value))}
                disabled={seedingContent}
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={3}>3개씩</option>
                <option value={5}>5개씩 (권장)</option>
                <option value={10}>10개씩</option>
              </select>
            </div>

            <button
              onClick={handleSeedContent}
              disabled={seedingContent}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {seedingContent ? "생성 중... (OpenAI 호출)" : "영문 가이드 생성 시작"}
            </button>

            {seedContentResult && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {seedContentResult.message}
                  {seedContentResult.hasMore && (
                    <span className="ml-2 text-yellow-600">남은 툴: {seedContentResult.remaining}개 (다시 실행 필요)</span>
                  )}
                </p>
                <div className="space-y-1.5">
                  {seedContentResult.results.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        item.status === "success"
                          ? "border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400"
                          : "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400"
                      }`}
                    >
                      <span>{item.name}</span>
                      <span className="text-xs">
                        {item.status === "success" ? "✓ 생성완료" : `✗ ${item.error?.slice(0, 60)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 3: Translation ── */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">
            Step 3. 툴 한글 번역 (KR i18n)
          </h2>

          {migrationStatus === "needed" && (
            <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                마이그레이션 미적용 상태입니다. name/description만 번역됩니다.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-1">
              <label className="block text-sm font-medium text-card-foreground">
                번역할 툴 선택 (선택 사항)
              </label>
              <div className="flex items-center gap-3 text-xs">
                <label className={`flex items-center gap-1.5 cursor-pointer rounded-full px-3 py-1 transition ${toolListFilter === "untranslated" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                  <input
                    type="radio"
                    name="toolFilter"
                    checked={toolListFilter === "untranslated"}
                    onChange={() => { setToolListFilter("untranslated"); setSelectedToolId(""); }}
                    className="sr-only"
                  />
                  미번역만
                </label>
                <label className={`flex items-center gap-1.5 cursor-pointer rounded-full px-3 py-1 transition ${toolListFilter === "all" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
                  <input
                    type="radio"
                    name="toolFilter"
                    checked={toolListFilter === "all"}
                    onChange={() => { setToolListFilter("all"); setSelectedToolId(""); }}
                    className="sr-only"
                  />
                  전체보기
                </label>
              </div>
            </div>
            <select
              value={selectedToolId}
              onChange={(e) => setSelectedToolId(e.target.value)}
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">
                {toolListFilter === "untranslated" ? "미번역 툴 전체 번역" : "전체 툴 번역"}
              </option>
              {tools
                .filter((tool) => {
                  if (toolListFilter === "all") return true;
                  const kr = tool.tools_i18n?.find((r) => r.locale === "kr");
                  return getKrStatus(kr) !== "done";
                })
                .map((tool) => {
                  const kr = tool.tools_i18n?.find((r) => r.locale === "kr");
                  const status = getKrStatus(kr);
                  return (
                    <option key={tool.id} value={tool.id}>
                      {status === "done" ? "✅ " : "❌ "}{tool.name} ({tool.slug || tool.id})
                    </option>
                  );
                })}
            </select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="force-retranslate"
                checked={forceRetranslate}
                onChange={(e) => setForceRetranslate(e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="force-retranslate" className="text-sm text-card-foreground">
                기존 번역 덮어쓰기 (Force Re-translate)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                번역 모델
              </label>
              <select
                value={translateModel}
                onChange={(e) => setTranslateModel(e.target.value)}
                disabled={translating}
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (빠름, 저비용)</option>
                <option value="gpt-4o">gpt-4o (고품질, 자연스러운 한국어)</option>
              </select>
            </div>

            {!selectedToolId && (
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  배치 처리 개수
                </label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  disabled={translating}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={3}>3개씩 (안전, 약 30초)</option>
                  <option value={5}>5개씩 (권장, 약 50초)</option>
                  <option value={10}>10개씩 (빠름, 약 2분)</option>
                </select>
              </div>
            )}

            <button
              onClick={handleTranslate}
              disabled={translating}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {translating ? "번역 중... (OpenAI 호출)" : selectedToolId ? "선택한 툴 번역" : "번역 시작"}
            </button>

            {translateResult && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-muted-foreground">
                    처리: <strong className="text-foreground">{translateResult.processed}개</strong>
                  </span>
                  {translateResult.total > 0 && (
                    <span className="text-muted-foreground">
                      전체 미번역: <strong className="text-foreground">{translateResult.total}개</strong>
                    </span>
                  )}
                </div>
                {translateResult.hasMore && (
                  <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ 남은 미번역: <strong>{translateResult.remaining}개</strong>
                  </div>
                )}
                <div className="space-y-1.5">
                  {translateResult.results
                    .filter((r) => r.status !== "skipped")
                    .map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        item.status === "success"
                          ? "border-green-500/20 bg-green-500/5 text-green-700 dark:text-green-400"
                          : item.status === "error"
                          ? "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400"
                          : "border-border bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <span>{item.toolName}</span>
                      <span className="text-xs">
                        {item.status === "success" ? "✓ 번역완료" : item.status === "error" ? `✗ ${item.error?.slice(0, 60)}` : item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Tools List with CRUD ── */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">
              등록된 툴 목록 ({tools.length}개)
            </h2>
            <div className="flex items-center gap-3">
              <TranslationSummary tools={tools} />
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"
              >
                {showCreateForm ? "취소" : "+ 새 툴 추가"}
              </button>
            </div>
          </div>

          {/* Quick Create Form */}
          {showCreateForm && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                새 툴 빠른 생성
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="툴 이름 *"
                  className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  value={createFormData.slug}
                  onChange={(e) => setCreateFormData({ ...createFormData, slug: e.target.value })}
                  placeholder="Slug (비우면 자동 생성)"
                  className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="간단한 설명"
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium text-sm"
              >
                {creating ? "생성 중..." : "생성 후 편집 페이지로 이동"}
              </button>
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="툴 이름, slug, 설명으로 검색..."
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            {filteredTools.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">
                {searchQuery ? "검색 결과가 없습니다." : "등록된 툴이 없습니다."}
              </p>
            ) : (
              filteredTools.map((tool) => {
                const kr = tool.tools_i18n?.find((r) => r.locale === "kr");
                const krStatus = getKrStatus(kr);
                return (
                  <div
                    key={tool.id}
                    className="flex items-start justify-between gap-4 p-4 border border-border rounded-lg hover:bg-accent group"
                  >
                    <Link href={`/admin/tools/${tool.id}`} className="flex-1 min-w-0 block">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-card-foreground group-hover:text-primary transition">{tool.name}</h3>
                        <KrBadge status={krStatus} />
                        {tool.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600">Active</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Inactive</span>
                        )}
                        {tool.badge && (
                          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Slug: {tool.slug || tool.id}
                      </p>
                      {tool.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          EN: {tool.description}
                        </p>
                      )}
                      {kr?.name && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5 line-clamp-1">
                          KR: {kr.name} — {kr.description || "(설명 없음)"}
                        </p>
                      )}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">
                        {new Date(tool.created_at).toLocaleDateString("ko-KR")}
                      </span>
                      <Link
                        href={`/admin/tools/${tool.id}`}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background text-foreground hover:bg-muted transition"
                      >
                        수정
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(tool.id, tool.name);
                        }}
                        disabled={deletingId === tool.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 bg-red-500/5 text-red-600 hover:bg-red-500/10 transition disabled:opacity-50"
                      >
                        {deletingId === tool.id ? "삭제중..." : "삭제"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type KrStatusType = "none" | "done";

function getKrStatus(kr?: I18nRow | null): KrStatusType {
  if (!kr) return "none";
  const hasExtended = kr.task_category || kr.best_for || kr.why_pick || kr.detail_content;
  return hasExtended ? "done" : "none";
}

function KrBadge({ status }: { status: KrStatusType }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600">
        KR 번역됨
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-500">
      미번역
    </span>
  );
}

function TranslationSummary({ tools }: { tools: Tool[] }) {
  const done = tools.filter((t) => getKrStatus(t.tools_i18n?.find((r) => r.locale === "kr")) === "done").length;
  const none = tools.length - done;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-green-600">번역됨 {done}</span>
      <span className="text-red-500">미번역 {none}</span>
    </div>
  );
}

function MigrationBadge({ status }: { status: string }) {
  if (status === "checking") {
    return <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">확인 중...</span>;
  }
  if (status === "applied") {
    return <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">적용 완료</span>;
  }
  if (status === "needed") {
    return <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600">미적용</span>;
  }
  return <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-600">오류</span>;
}
