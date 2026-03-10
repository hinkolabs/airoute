"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { Copy, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";

interface ContentItem {
  id: string;
  topic: string;
  blog_content: string | null;
  sns_content: string | null;
  image_urls: string[] | null;
  generated_at: string | null;
  status: string;
}

export default function InboxPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const wsId = activeWorkspace?.workspace?.id;
    if (!wsId) return;

    setLoading(true);
    fetch(`/api/autoposting/items?workspace_id=${wsId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.items) setItems(data.items); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeWorkspace]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text ?? "");
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-[900px] p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">콘텐츠 보관함</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          생성된 홍보 콘텐츠 전체 내역 (최근 15개)
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">아직 생성된 콘텐츠가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const dateStr = item.generated_at
              ? new Date(item.generated_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "";

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/30 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.topic}
                    </p>
                    {dateStr && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{dateStr}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.status === "used"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {item.status === "used" ? "사용됨" : "준비"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-5 pt-4 space-y-5">
                    {/* Blog content */}
                    {item.blog_content && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            블로그 콘텐츠
                          </span>
                          <button
                            onClick={() => handleCopy(item.blog_content!, `blog-${item.id}`)}
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copiedKey === `blog-${item.id}` ? "복사됨!" : "복사"}
                          </button>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {item.blog_content}
                        </div>
                      </div>
                    )}

                    {/* SNS content */}
                    {item.sns_content && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            SNS 콘텐츠
                          </span>
                          <button
                            onClick={() => handleCopy(item.sns_content!, `sns-${item.id}`)}
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copiedKey === `sns-${item.id}` ? "복사됨!" : "복사"}
                          </button>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                          {item.sns_content}
                        </div>
                      </div>
                    )}

                    {/* Image thumbnails */}
                    {item.image_urls && item.image_urls.length > 0 && (
                      <div>
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          이미지
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {item.image_urls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`이미지 ${i + 1}`}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition">
                                <ImageIcon className="h-5 w-5 text-white" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
