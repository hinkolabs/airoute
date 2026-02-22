"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type ToolOption = { id: string; name: string; slug: string | null };

type RouteTool = {
  id?: string;
  tool_id: string | null;
  position: number;
  is_best3: boolean;
  step_title: string | null;
  step_why: string | null;
  step_cta_label: string | null;
  step_prompt_example: string | null;
  step_input_type: string | null;
  _delete?: boolean;
  _isNew?: boolean;
};

type RouteI18n = {
  locale: string;
  title: string | null;
  description: string | null;
  guide_bullets: string[] | null;
};

type RouteData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  tags: string[] | null;
  guide_bullets: string[] | null;
  manual_order: number | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  routes_i18n: RouteI18n[];
  route_tools: RouteTool[];
};

export default function AdminRouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params.id as string;

  const [route, setRoute] = useState<RouteData | null>(null);
  const [allTools, setAllTools] = useState<ToolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [fkBlock, setFkBlock] = useState<{ message: string; guideCount?: number; sqlFix: string } | null>(null);

  // Editable fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [featured, setFeatured] = useState(false);
  const [tags, setTags] = useState("");
  const [guideBullets, setGuideBullets] = useState("");
  const [manualOrder, setManualOrder] = useState("");
  const [status, setStatus] = useState("active");
  const [routeTools, setRouteTools] = useState<RouteTool[]>([]);

  const loadRoute = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/routes/${routeId}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      const r = json.route as RouteData;
      setRoute(r);
      setAllTools(json.allTools || []);

      setTitle(r.title || "");
      setSlug(r.slug || "");
      setDescription(r.description || "");
      setIcon(r.icon || "");
      setFeatured(r.featured ?? false);
      setTags((r.tags || []).join(", "));
      setGuideBullets((r.guide_bullets || []).join("\n"));
      setManualOrder(r.manual_order != null ? String(r.manual_order) : "");
      setStatus(r.status || "active");
      setRouteTools(
        (r.route_tools || []).map((rt) => ({ ...rt, _delete: false, _isNew: false }))
      );
    } catch (e) {
      console.error("Failed to load route:", e);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  async function handleSave() {
    if (saving) return;
    if (!title.trim()) {
      setSaveMessage({ type: "error", text: "제목을 입력해주세요." });
      return;
    }
    setSaving(true);
    setSaveMessage(null);

    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        icon: icon.trim() || null,
        featured,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        guide_bullets: guideBullets
          .split("\n")
          .map((b) => b.trim())
          .filter(Boolean),
        manual_order: manualOrder ? Number(manualOrder) : null,
        status,
        route_tools: routeTools.map((rt, idx) => ({
          id: rt._isNew ? undefined : rt.id,
          tool_id: rt.tool_id || null,
          position: idx + 1,
          is_best3: rt.is_best3,
          step_title: rt.step_title,
          step_why: rt.step_why,
          step_cta_label: rt.step_cta_label,
          step_prompt_example: rt.step_prompt_example,
          step_input_type: rt.step_input_type,
          _delete: rt._delete,
        })),
      };

      const res = await fetch(`/api/admin/routes/${routeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "저장 실패");

      setSaveMessage({ type: "ok", text: "저장되었습니다." });
      // Reload to get fresh data (new IDs for newly created route_tools)
      await loadRoute();
    } catch (e: unknown) {
      setSaveMessage({
        type: "error",
        text: e instanceof Error ? e.message : "저장 실패",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(hard = false) {
    const confirmMsg = hard
      ? `"${title}" 루트를 완전 삭제(Hard Delete)하시겠습니까?\nroute_tools, i18n 데이터도 함께 삭제됩니다. 복구 불가.`
      : `"${title}" 루트를 숨김 처리(Soft Delete)하시겠습니까?\n목록에서 숨겨지며, 데이터는 보존됩니다.`;
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    try {
      const qs = hard ? "?hard=true" : "";
      const res = await fetch(`/api/admin/routes/${routeId}${qs}`, { method: "DELETE" });
      const json = await res.json();

      if (json.code === "FK_BLOCKED") {
        setFkBlock({
          message: json.message,
          guideCount: json.guideCount,
          sqlFix: json.sqlFix,
        });
        setDeleting(false);
        return;
      }

      if (!json.ok) throw new Error(json.message || json.error || "삭제 실패");

      if (json.mode === "soft") {
        alert(`"${slug}" 루트가 숨김 처리되었습니다. (status: ${json.newStatus})`);
        await loadRoute();
        setDeleting(false);
        return;
      }

      router.push("/admin/routes");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "삭제 실패");
      setDeleting(false);
    }
  }

  function addRouteTool() {
    setRouteTools((prev) => [
      ...prev,
      {
        tool_id: null,
        position: prev.length + 1,
        is_best3: false,
        step_title: "",
        step_why: "",
        step_cta_label: "",
        step_prompt_example: "",
        step_input_type: null,
        _isNew: true,
        _delete: false,
      },
    ]);
  }

  function updateRouteTool(index: number, field: string, value: unknown) {
    setRouteTools((prev) =>
      prev.map((rt, i) => (i === index ? { ...rt, [field]: value } : rt))
    );
  }

  function markRouteToolDelete(index: number) {
    setRouteTools((prev) =>
      prev.map((rt, i) => (i === index ? { ...rt, _delete: !rt._delete } : rt))
    );
  }

  function moveRouteTool(index: number, direction: "up" | "down") {
    setRouteTools((prev) => {
      const arr = [...prev];
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return prev;
      [arr[index], arr[targetIdx]] = [arr[targetIdx], arr[index]];
      return arr;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-destructive">루트를 찾을 수 없습니다.</p>
          <Link href="/admin/routes" className="text-primary hover:underline text-sm mt-2 inline-block">
            ← 루트 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const krI18n = route.routes_i18n?.find((i) => i.locale === "kr");
  const activeRouteTools = routeTools.filter((rt) => !rt._delete);
  const deletedRouteTools = routeTools.filter((rt) => rt._delete);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <Link
          href="/admin/routes"
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          ← 루트 목록으로
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">루트 편집</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ID: {route.id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={() => handleDelete(false)}
              disabled={deleting}
              className="px-4 py-2.5 border border-orange-500/30 bg-orange-500/5 text-orange-600 rounded-lg hover:bg-orange-500/10 disabled:opacity-50 font-medium"
              title="목록에서 숨김 처리 (데이터 보존)"
            >
              {deleting ? "처리 중..." : "숨김"}
            </button>
            <button
              onClick={() => handleDelete(true)}
              disabled={deleting}
              className="px-4 py-2.5 border border-red-500/30 bg-red-500/5 text-red-600 rounded-lg hover:bg-red-500/10 disabled:opacity-50 font-medium"
              title="완전 삭제 (복구 불가)"
            >
              {deleting ? "처리 중..." : "완전삭제"}
            </button>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 rounded-lg border p-3 text-sm ${
              saveMessage.type === "ok"
                ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {saveMessage.text}
          </div>
        )}

        {/* FK Block Banner */}
        {fkBlock && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/5 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                  완전 삭제 불가 — FK 참조 충돌
                </h3>
                <p className="text-sm text-foreground mt-1">{fkBlock.message}</p>
                {fkBlock.guideCount != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    참조 가이드 수: {fkBlock.guideCount}개
                  </p>
                )}
              </div>
              <button
                onClick={() => setFkBlock(null)}
                className="text-muted-foreground hover:text-foreground transition shrink-0 ml-2"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Supabase SQL Editor에서 아래 SQL을 실행하면 FK가 ON DELETE SET NULL로 변경되어 삭제가 가능해집니다.
            </p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs text-foreground whitespace-pre-wrap">
                {fkBlock.sqlFix}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fkBlock.sqlFix);
                  alert("SQL이 클립보드에 복사되었습니다.");
                }}
                className="absolute right-3 top-3 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
              >
                SQL 복사
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href="https://supabase.com/dashboard/project/_/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
              >
                Supabase SQL Editor 열기 →
              </a>
              <button
                onClick={() => handleDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-2 text-xs font-medium text-orange-600 transition hover:bg-orange-500/10 disabled:opacity-50"
              >
                대신 숨김 처리하기
              </button>
            </div>
          </div>
        )}

        {/* KR Translation Status */}
        {krI18n?.title && (
          <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
              KR 번역 데이터
            </h3>
            <p className="text-sm text-foreground">{krI18n.title}</p>
            {krI18n.description && (
              <p className="text-xs text-muted-foreground mt-1">{krI18n.description}</p>
            )}
          </div>
        )}

        {/* ── Section 1: Basic Info ── */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            기본 정보
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  제목 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  아이콘
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="🚀"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  정렬 순서
                </label>
                <input
                  type="number"
                  value={manualOrder}
                  onChange={(e) => setManualOrder(e.target.value)}
                  placeholder="숫자"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  상태
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  Featured
                </label>
                <select
                  value={featured ? "yes" : "no"}
                  onChange={(e) => setFeatured(e.target.value === "yes")}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="no">아니오</option>
                  <option value="yes">예</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">
                태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="blog, writing, AI"
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-card-foreground">
                가이드 팁 (줄바꿈으로 구분)
              </label>
              <textarea
                value={guideBullets}
                onChange={(e) => setGuideBullets(e.target.value)}
                rows={4}
                placeholder={"각 줄이 하나의 팁이 됩니다"}
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Route Tools (Steps) ── */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              워크플로우 단계 ({activeRouteTools.length}개)
            </h2>
            <button
              onClick={addRouteTool}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"
            >
              + 단계 추가
            </button>
          </div>

          {activeRouteTools.length === 0 && (
            <p className="text-muted-foreground text-sm py-4 text-center">
              등록된 워크플로우 단계가 없습니다. &quot;+ 단계 추가&quot; 버튼을 클릭하세요.
            </p>
          )}

          <div className="space-y-4">
            {routeTools.map((rt, index) => {
              if (rt._delete) return null;
              const realIndex = activeRouteTools.indexOf(rt);
              return (
                <div
                  key={rt.id || `new-${index}`}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  {/* Step header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {realIndex + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {rt.step_title || "(제목 없음)"}
                      </span>
                      {rt.is_best3 && (
                        <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-600">
                          Best3
                        </span>
                      )}
                      {rt._isNew && (
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                          새 단계
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveRouteTool(index, "up")}
                        disabled={realIndex === 0}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition"
                        title="위로"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveRouteTool(index, "down")}
                        disabled={realIndex === activeRouteTools.length - 1}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition"
                        title="아래로"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => markRouteToolDelete(index)}
                        className="p-1.5 rounded text-red-500 hover:text-red-600 hover:bg-red-500/10 transition ml-2"
                        title="삭제"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Step fields */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          단계 제목
                        </label>
                        <input
                          type="text"
                          value={rt.step_title || ""}
                          onChange={(e) => updateRouteTool(index, "step_title", e.target.value)}
                          placeholder="e.g. Research with Perplexity"
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          연결 툴
                        </label>
                        <select
                          value={rt.tool_id || ""}
                          onChange={(e) => updateRouteTool(index, "tool_id", e.target.value || null)}
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">툴 선택 (선택사항)</option>
                          {allTools.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.slug})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">
                        단계 설명 (Why)
                      </label>
                      <textarea
                        value={rt.step_why || ""}
                        onChange={(e) => updateRouteTool(index, "step_why", e.target.value)}
                        rows={2}
                        placeholder="이 단계가 왜 필요한지 설명"
                        className="w-full px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          CTA 라벨
                        </label>
                        <input
                          type="text"
                          value={rt.step_cta_label || ""}
                          onChange={(e) => updateRouteTool(index, "step_cta_label", e.target.value)}
                          placeholder="e.g. Try now"
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-muted-foreground">
                          입력 타입
                        </label>
                        <select
                          value={rt.step_input_type || ""}
                          onChange={(e) => updateRouteTool(index, "step_input_type", e.target.value || null)}
                          className="w-full px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="">없음</option>
                          <option value="prompt">Prompt</option>
                          <option value="settings">Settings</option>
                          <option value="action">Action</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-muted-foreground">
                        프롬프트 예시
                      </label>
                      <textarea
                        value={rt.step_prompt_example || ""}
                        onChange={(e) => updateRouteTool(index, "step_prompt_example", e.target.value)}
                        rows={2}
                        placeholder="e.g. Write a blog post about..."
                        className="w-full px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rt.is_best3}
                        onChange={(e) => updateRouteTool(index, "is_best3", e.target.checked)}
                        id={`best3-${index}`}
                        className="rounded border-input"
                      />
                      <label
                        htmlFor={`best3-${index}`}
                        className="text-xs font-medium text-card-foreground"
                      >
                        Best3 (메인 단계로 표시)
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deleted items indicator */}
          {deletedRouteTools.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                삭제 예정: {deletedRouteTools.length}개 단계 (저장 시 적용)
              </p>
              <button
                onClick={() =>
                  setRouteTools((prev) =>
                    prev.map((rt) => ({ ...rt, _delete: false }))
                  )
                }
                className="mt-1 text-xs text-red-500 hover:underline"
              >
                삭제 취소
              </button>
            </div>
          )}
        </div>

        {/* ── Section 3: Meta Info ── */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            메타 정보
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">생성일</span>
              <p className="text-foreground font-medium">
                {new Date(route.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">수정일</span>
              <p className="text-foreground font-medium">
                {route.updated_at
                  ? new Date(route.updated_at).toLocaleString("ko-KR")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">KR 번역</span>
              <p className="text-foreground font-medium">
                {krI18n?.title ? "번역됨" : "미번역"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">워크플로우 단계</span>
              <p className="text-foreground font-medium">
                {activeRouteTools.length}개
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Save bar */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border py-4 -mx-4 px-4 flex items-center justify-between">
          <div>
            {saveMessage && (
              <span
                className={`text-sm ${
                  saveMessage.type === "ok" ? "text-green-600" : "text-red-500"
                }`}
              >
                {saveMessage.text}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/routes"
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted font-medium text-sm"
            >
              목록으로
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium text-sm"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
