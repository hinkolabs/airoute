"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type I18nRow = {
  locale: string;
  name: string | null;
  description: string | null;
  task_category?: string | null;
  best_for?: string | null;
  why_pick?: string | null;
  detail_content?: unknown;
};

type ToolData = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category_id: string | null;
  url: string | null;
  affiliate_url: string | null;
  badge: string | null;
  tags: string[] | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string | null;
  tools_i18n: I18nRow[];
};

export default function AdminToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toolId = params.id as string;

  const [tool, setTool] = useState<ToolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [badge, setBadge] = useState("");
  const [isActive, setIsActive] = useState(false);

  const loadTool = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/tools/${toolId}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      const t = json.tool as ToolData;
      setTool(t);
      setName(t.name || "");
      setSlug(t.slug || "");
      setDescription(t.description || "");
      setUrl(t.url || "");
      setAffiliateUrl(t.affiliate_url || "");
      setBadge(t.badge || "");
      setIsActive(t.is_active === true);
    } catch (e) {
      console.error("Failed to load tool:", e);
    } finally {
      setLoading(false);
    }
  }, [toolId]);

  useEffect(() => {
    loadTool();
  }, [loadTool]);

  async function handleSave() {
    if (saving) return;
    if (!name.trim()) {
      setSaveMessage({ type: "error", text: "툴 이름을 입력해주세요." });
      return;
    }
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/admin/tools/${toolId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          url: url.trim() || null,
          affiliate_url: affiliateUrl.trim() || null,
          badge: badge || null,
          is_active: isActive,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "저장 실패");

      setSaveMessage({ type: "ok", text: "저장되었습니다." });
      await loadTool();
    } catch (e: unknown) {
      setSaveMessage({
        type: "error",
        text: e instanceof Error ? e.message : "저장 실패",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`"${name}" 툴을 삭제하시겠습니까?\ni18n 데이터도 함께 삭제됩니다.`))
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "삭제 실패");
      router.push("/admin/tools");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "삭제 실패");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-destructive">툴을 찾을 수 없습니다.</p>
          <Link href="/admin/tools" className="text-primary hover:underline text-sm mt-2 inline-block">
            ← 툴 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const krI18n = tool.tools_i18n?.find((i) => i.locale === "kr");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/admin/tools"
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          ← 툴 목록으로
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">툴 편집</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ID: {tool.id}
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
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 border border-red-500/30 bg-red-500/5 text-red-600 rounded-lg hover:bg-red-500/10 disabled:opacity-50 font-medium"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>

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

        {/* KR i18n info */}
        {krI18n?.name && (
          <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
              KR 번역 데이터
            </h3>
            <p className="text-sm text-foreground font-medium">{krI18n.name}</p>
            {krI18n.description && (
              <p className="text-xs text-muted-foreground mt-1">{krI18n.description}</p>
            )}
            {krI18n.task_category && (
              <p className="text-xs text-muted-foreground mt-0.5">카테고리: {krI18n.task_category}</p>
            )}
            {krI18n.best_for && (
              <p className="text-xs text-muted-foreground mt-0.5">Best For: {krI18n.best_for}</p>
            )}
            {krI18n.why_pick && (
              <p className="text-xs text-muted-foreground mt-0.5">Why Pick: {krI18n.why_pick}</p>
            )}
          </div>
        )}

        {/* ── Basic Info ── */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            기본 정보
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  툴 이름 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                rows={4}
                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  웹사이트 URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  제휴 URL
                </label>
                <input
                  type="url"
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  placeholder="https://example.com/aff"
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  배지
                </label>
                <select
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">없음</option>
                  <option value="featured">Featured</option>
                  <option value="new">New</option>
                  <option value="popular">Popular</option>
                  <option value="kr-best">KR Best</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-card-foreground">
                  활성 상태
                </label>
                <select
                  value={isActive ? "active" : "inactive"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="inactive">비활성 (Inactive)</option>
                  <option value="active">활성 (Active)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Meta Info ── */}
        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            메타 정보
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">생성일</span>
              <p className="text-foreground font-medium">
                {new Date(tool.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">수정일</span>
              <p className="text-foreground font-medium">
                {tool.updated_at
                  ? new Date(tool.updated_at).toLocaleString("ko-KR")
                  : "-"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">KR 번역</span>
              <p className="text-foreground font-medium">
                {krI18n?.name ? "번역됨" : "미번역"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">카테고리 ID</span>
              <p className="text-foreground font-medium">
                {tool.category_id || "-"}
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
              href="/admin/tools"
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
