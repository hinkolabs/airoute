"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type GuideItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  status: string;
  guide_type: string | null;
  primary_intent: string | null;
  lang: string | null;
  taxonomy: string | null;
  created_at: string;
  published_at: string | null;
};

type TabStatus = "all" | "draft" | "review" | "approved" | "rejected";

type Quota = {
  usedToday: number;
  limit: number;
  remainingToday: number;
};

const TABS: { key: TabStatus; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "draft", label: "초안" },
  { key: "review", label: "검토중" },
  { key: "approved", label: "승인됨" },
  { key: "rejected", label: "반려됨" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-300",
  approved: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
  rejected: "bg-red-500/20 text-red-600 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  review: "검토중",
  approved: "승인됨",
  rejected: "반려됨",
};

type Lang = "en" | "kr";

export default function AdminGuidesListClient() {
  const [items, setItems] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabStatus>("all");
  const [lang, setLang] = useState<Lang>("en");
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingOpenAI, setGeneratingOpenAI] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/guides/list", window.location.origin);
      if (tab !== "all") {
        url.searchParams.set("status", tab);
      }
      const res = await fetch(url.toString());
      const json = await res.json();
      setItems(json.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guides/quota");
      const json = await res.json();
      if (json.ok) {
        setQuota({
          usedToday: json.usedToday,
          limit: json.limit,
          remainingToday: json.remainingToday,
        });
      }
    } catch {
      // Silently fail quota fetch
    }
  }, []);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  async function handleCreate() {
    // 중복 호출 방지
    if (creating) return;
    setCreating(true);
    
    try {
      const res = await fetch("/api/admin/guides/create", { method: "POST" });
      const json = await res.json();
      
      if (!res.ok || !json?.ok || !json?.id) {
        throw new Error(json?.error || "Create failed");
      }
      
      // 성공 시 에디터 페이지로 이동
      location.href = `/admin/guides/${json.id}`;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "생성에 실패했습니다.";
      alert(message);
    } finally {
      setCreating(false);
    }
  }

  async function handleGenerate() {
    // 중복 호출 방지
    if (generating) return;
    setGenerating(true);
    
    try {
      const res = await fetch("/api/admin/guides/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      const json = await res.json();
      
      // 에러 처리 - 실패 시 quota 갱신하지 않음
      if (res.status === 401) {
        alert("Authentication required. Redirecting to login.");
        location.href = "/kr/login";
        return;
      }
      
      if (res.status === 429) {
        alert(json?.error || "Daily auto-generation limit (2) reached.");
        return;
      }
      
      if (res.status === 409) {
        alert(json?.error || "No available recipes. Please try again tomorrow.");
        return;
      }
      
      if (!res.ok || !json?.ok || !json?.id) {
        throw new Error(json?.error || "Generate failed");
      }
      
      // 성공 시에만 quota 새로고침 (ok:true 확인됨)
      await fetchQuota();
      
      const remaining = json.remainingToday ?? 0;
      alert(`AI draft generated! (Remaining today: ${remaining})`);
      location.href = `/admin/guides/${json.id}`;
    } catch (e: unknown) {
      // catch 블록: quota 갱신하지 않음
      const message = e instanceof Error ? e.message : "Generation failed";
      alert(message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateOpenAI() {
    // Confirm dialog with warning
    const confirmed = confirm(
      "⚠️ OpenAI 유료 생성을 실행합니다.\n\n" +
      "- API 호출 비용이 발생합니다.\n" +
      "- 하루 제한 횟수가 있습니다.\n\n" +
      "계속하시겠습니까?"
    );
    if (!confirmed) return;

    if (generatingOpenAI) return;
    setGeneratingOpenAI(true);

    try {
      const res = await fetch("/api/admin/guides/generate-openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      const json = await res.json();

      if (res.status === 401) {
        alert("Authentication required. Redirecting to login.");
        location.href = "/kr/login";
        return;
      }

      if (res.status === 403) {
        alert(json?.error || "OpenAI generation is disabled.");
        return;
      }

      if (res.status === 429) {
        alert(json?.error || "Daily OpenAI limit reached.");
        return;
      }

      if (res.status === 409) {
        alert(json?.error || "No available recipes.");
        return;
      }

      if (!res.ok || !json?.ok || !json?.id) {
        throw new Error(json?.error || "OpenAI generation failed");
      }

      const remaining = json.remainingToday ?? 0;
      alert(`✅ OpenAI 가이드 생성 완료!\n모델: ${json.model}\n오늘 남은 횟수: ${remaining}`);
      location.href = `/admin/guides/${json.id}`;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "OpenAI generation failed";
      alert(message);
    } finally {
      setGeneratingOpenAI(false);
    }
  }

  return (
    <div>
      {/* Header Actions */}
      <div className="mb-6 space-y-3">
        {/* Row 1: Status Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === t.key
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Row 2: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lang Toggle */}
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            <button
              onClick={() => setLang("en")}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                lang === "en"
                  ? "bg-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("kr")}
              className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                lang === "kr"
                  ? "bg-emerald-500/30 text-emerald-600 dark:text-emerald-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              KR
            </button>
          </div>

          {/* Quota Widget */}
          {quota && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1">
              <span className="text-[10px] text-muted-foreground">오늘(KST)</span>
              <span className={`text-[10px] font-semibold ${
                quota.remainingToday > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}>
                {quota.usedToday}/{quota.limit}
              </span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || creating || generatingOpenAI || (quota?.remainingToday === 0)}
            className="rounded-lg border border-purple-500/50 bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-300 transition hover:bg-purple-500/30 disabled:opacity-50"
          >
            {generating ? "..." : "🤖 AI"}
          </button>

          <button
            onClick={handleGenerateOpenAI}
            disabled={generating || creating || generatingOpenAI}
            className="rounded-lg border border-orange-500/50 bg-orange-500/20 px-3 py-1.5 text-xs font-semibold text-orange-600 dark:text-orange-300 transition hover:bg-orange-500/30 disabled:opacity-50"
          >
            {generatingOpenAI ? "..." : "💸 OpenAI"}
          </button>

          <button
            onClick={handleCreate}
            disabled={creating || generating || generatingOpenAI}
            className="ml-auto rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            {creating ? "..." : "+ 신규"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">가이드가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-emerald-500/50 hover:bg-accent"
            >
              <Link
                href={`/admin/guides/${item.id}`}
                className="flex-1 min-w-0 block"
              >
                {/* TOP ROW: Status (left) + Language (right) */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      STATUS_COLORS[item.status] || STATUS_COLORS.draft
                    }`}
                  >
                    {STATUS_LABELS[item.status] || item.status}
                  </span>
                  {item.lang && (
                    <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.lang.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* SECOND ROW: Title */}
                <h3 className="text-sm font-semibold text-foreground truncate leading-snug">
                  {item.title || "(제목 없음)"}
                </h3>

                {/* THIRD ROW: Excerpt (max 2 lines) */}
                {item.excerpt && (
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.excerpt}
                  </p>
                )}

                {/* FOOTER ROW: Type + Intent + Date */}
                <div className="mt-3 flex items-center gap-2 text-[10px] overflow-hidden">
                  {item.guide_type && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
                      {item.guide_type.replace("_", " ")}
                    </span>
                  )}
                  {item.primary_intent && (
                    <span className="truncate rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground max-w-[140px]">
                      {item.primary_intent}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    }).replace(/\. /g, ".").replace(/\.$/, "")}
                  </span>
                </div>
              </Link>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!confirm(`"${item.title || "제목 없음"}" 가이드를 삭제하시겠습니까?`)) return;
                  setDeletingId(item.id);
                  try {
                    const res = await fetch(`/api/admin/guides/${item.id}`, { method: "DELETE" });
                    const json = await res.json();
                    if (!res.ok || !json.ok) throw new Error(json.error || "삭제 실패");
                    fetchGuides();
                  } catch (err: unknown) {
                    alert(err instanceof Error ? err.message : "삭제 실패");
                  } finally {
                    setDeletingId(null);
                  }
                }}
                disabled={deletingId === item.id}
                className="shrink-0 mt-1 px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 bg-red-500/5 text-red-600 hover:bg-red-500/10 transition disabled:opacity-50"
              >
                {deletingId === item.id ? "..." : "삭제"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

