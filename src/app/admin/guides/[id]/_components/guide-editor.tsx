"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Guide = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  status: string;
  lang: string | null;
  taxonomy: string | null;
  cta_type: string | null;
  cta_route_slug: string | null;
  cta_tool_slug: string | null;
  cta_partner: string | null;
  guide_type: string | null;
  primary_intent: string | null;
  primary_route: string | null;
  generation_version: string | null;
  created_at: string;
  published_at: string | null;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "초안" },
  { value: "review", label: "검토중" },
  { value: "approved", label: "승인됨" },
  { value: "rejected", label: "반려됨" },
];

const GUIDE_TYPE_OPTIONS = [
  { value: "", label: "선택 안함" },
  { value: "route_based", label: "Route Based" },
  { value: "tool_based", label: "Tool Based" },
  { value: "safety", label: "Safety" },
];

const CTA_TYPE_OPTIONS = [
  { value: "", label: "선택 안함" },
  { value: "route", label: "Route" },
  { value: "tool", label: "Tool" },
  { value: "mixed", label: "Mixed" },
];

const LANG_OPTIONS = [
  { value: "en", label: "English (EN)" },
  { value: "kr", label: "한국어 (KR)" },
];

interface GuideEditorProps {
  guideId: string;
}

export default function GuideEditorClient({ guideId }: GuideEditorProps) {
  const router = useRouter();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    status: "draft",
    lang: "en",
    taxonomy: "",
    cta_type: "",
    cta_route_slug: "",
    cta_tool_slug: "",
    cta_partner: "",
    guide_type: "",
    primary_intent: "",
    primary_route: "",
    generation_version: "",
  });

  useEffect(() => {
    async function fetchGuide() {
      try {
        const res = await fetch(`/api/admin/guides/${guideId}`);
        const json = await res.json();
        if (json.ok && json.guide) {
          setGuide(json.guide);
          setForm({
            slug: json.guide.slug || "",
            title: json.guide.title || "",
            excerpt: json.guide.excerpt || "",
            content: json.guide.content || "",
            status: json.guide.status || "draft",
            lang: json.guide.lang || "en",
            taxonomy: json.guide.taxonomy || "",
            cta_type: json.guide.cta_type || "",
            cta_route_slug: json.guide.cta_route_slug || "",
            cta_tool_slug: json.guide.cta_tool_slug || "",
            cta_partner: json.guide.cta_partner || "",
            guide_type: json.guide.guide_type || "",
            primary_intent: json.guide.primary_intent || "",
            primary_route: json.guide.primary_route || "",
            generation_version: json.guide.generation_version || "",
          });
        }
      } catch {
        setMsg({ type: "error", text: "가이드를 불러오지 못했습니다." });
      } finally {
        setLoading(false);
      }
    }
    fetchGuide();
  }, [guideId]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/guides/${guideId}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.ok) {
        setMsg({ type: "success", text: "저장되었습니다." });
        if (json.guide) setGuide(json.guide);
      } else {
        setMsg({ type: "error", text: json.error || "저장 실패" });
      }
    } catch {
      setMsg({ type: "error", text: "저장 중 오류 발생" });
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!confirm("이 가이드를 승인하시겠습니까?")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/guides/${guideId}/approve`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.ok) {
        setMsg({ type: "success", text: "승인되었습니다." });
        setForm((prev) => ({ ...prev, status: "approved" }));
        if (json.guide) setGuide(json.guide);
      } else {
        setMsg({ type: "error", text: json.error || "승인 실패" });
      }
    } catch {
      setMsg({ type: "error", text: "승인 중 오류 발생" });
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    const note = prompt("반려 사유를 입력하세요 (선택):");
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/guides/${guideId}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const json = await res.json();
      if (json.ok) {
        setMsg({ type: "success", text: "반려되었습니다." });
        setForm((prev) => ({ ...prev, status: "rejected" }));
        if (json.guide) setGuide(json.guide);
      } else {
        setMsg({ type: "error", text: json.error || "반려 실패" });
      }
    } catch {
      setMsg({ type: "error", text: "반려 중 오류 발생" });
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishNow() {
    if (!confirm("긴급 발행하시겠습니까?\n(KST 기준 하루 2개 제한)")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/guides/${guideId}/publish-now`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.ok) {
        setMsg({
          type: "success",
          text: `발행 완료! (오늘 남은 횟수: ${json.remainingToday})`,
        });
        setForm((prev) => ({ ...prev, status: "approved" }));
        if (json.guide) setGuide(json.guide);
      } else {
        setMsg({ type: "error", text: json.error || "발행 실패" });
      }
    } catch {
      setMsg({ type: "error", text: "발행 중 오류 발생" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/guides/${guideId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.ok) {
        router.push("/admin/guides");
      } else {
        setMsg({ type: "error", text: json.error || "삭제 실패" });
      }
    } catch {
      setMsg({ type: "error", text: "삭제 중 오류 발생" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/60">로딩 중...</div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-300">가이드를 찾을 수 없습니다.</p>
        <Link href="/admin/guides" className="mt-4 inline-block text-sm text-white/60 underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/guides"
            className="text-sm text-white/60 hover:text-white"
          >
            ← 목록으로
          </Link>
          <h1 className="mt-2 text-xl font-bold text-white">가이드 편집</h1>
        </div>
        <div className="flex items-center gap-2">
          {guide.published_at && (
            <span className="text-xs text-white/40">
              발행일: {new Date(guide.published_at).toLocaleString("ko-KR")}
            </span>
          )}
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm ${
            msg.type === "success"
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">기본 정보</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-white/60">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/60">상태</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/60">언어 (Lang)</label>
              <select
                value={form.lang}
                onChange={(e) => handleChange("lang", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
              >
                {LANG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/60">Taxonomy</label>
              <input
                type="text"
                value={form.taxonomy}
                onChange={(e) => handleChange("taxonomy", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                placeholder="e.g. video-editing, content-writing"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm text-white/60">제목</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
              placeholder="가이드 제목"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm text-white/60">요약 (Excerpt)</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
              placeholder="짧은 설명"
            />
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">본문 (Markdown)</h2>
          <textarea
            value={form.content}
            onChange={(e) => handleChange("content", e.target.value)}
            rows={15}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white outline-none focus:border-emerald-500/50"
            placeholder="Markdown 본문..."
          />
        </div>

        {/* Meta & CTA */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 text-base font-semibold text-white">메타 정보 & CTA</h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-white/60">Guide Type</label>
              <select
                value={form.guide_type}
                onChange={(e) => handleChange("guide_type", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
              >
                {GUIDE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/60">Primary Intent</label>
              <input
                type="text"
                value={form.primary_intent}
                onChange={(e) => handleChange("primary_intent", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/60">Primary Route</label>
              <input
                type="text"
                value={form.primary_route}
                onChange={(e) => handleChange("primary_route", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/60">Generation Version</label>
              <input
                type="text"
                value={form.generation_version}
                onChange={(e) => handleChange("generation_version", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="mb-3 text-sm font-medium text-white/80">CTA 설정</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-white/60">CTA Type</label>
                <select
                  value={form.cta_type}
                  onChange={(e) => handleChange("cta_type", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                >
                  {CTA_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60">CTA Route Slug</label>
                <input
                  type="text"
                  value={form.cta_route_slug}
                  onChange={(e) => handleChange("cta_route_slug", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60">CTA Tool Slug</label>
                <input
                  type="text"
                  value={form.cta_tool_slug}
                  onChange={(e) => handleChange("cta_tool_slug", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/60">CTA Partner</label>
                <input
                  type="text"
                  value={form.cta_partner}
                  onChange={(e) => handleChange("cta_partner", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>

          {form.status !== "approved" && (
            <button
              onClick={handleApprove}
              disabled={saving}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-6 py-2.5 font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              승인
            </button>
          )}

          {form.status !== "rejected" && (
            <button
              onClick={handleReject}
              disabled={saving}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-2.5 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              반려
            </button>
          )}

          {form.status !== "approved" && (
            <button
              onClick={handlePublishNow}
              disabled={saving}
              className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-6 py-2.5 font-semibold text-yellow-300 transition hover:bg-yellow-500/20 disabled:opacity-50"
            >
              긴급 발행
            </button>
          )}

          <div className="flex-1" />

          <button
            onClick={handleDelete}
            disabled={saving}
            className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

