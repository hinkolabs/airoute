"use client";

import { useEffect, useState } from "react";
import { Heart, ExternalLink } from "lucide-react";
import { PageContainer, PageHeader, EmptyState, SkeletonRow, Card } from "../_components/ui";
import ShortsSourcingNav from "../_components/shorts-nav";

interface FavoriteRow {
  id: string;
  note: string | null;
  usage_status: "unreviewed" | "approved" | "rejected";
  created_at: string;
  source_item: {
    id: string;
    session_id: string;
    platform: "douyin" | "xiaohongshu";
    canonical_url: string;
    title: string | null;
    author_name: string | null;
    thumbnail_url: string | null;
    like_count: number | null;
    duration_seconds: number | null;
    session: { product_name_ko: string | null } | null;
  } | null;
}

const STATUS_LABEL: Record<FavoriteRow["usage_status"], string> = {
  unreviewed: "검토 전",
  approved: "채택",
  rejected: "보류",
};

export default function FavoritesClient() {
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/shorts-sourcing/favorites");
      const data = await res.json();
      if (res.ok) setFavorites(data.favorites ?? []);
      setLoading(false);
    })();
  }, []);

  async function removeFavorite(sourceItemId: string) {
    setFavorites((prev) => prev.filter((f) => f.source_item?.id !== sourceItemId));
    await fetch(`/api/shorts-sourcing/favorites/${sourceItemId}`, { method: "DELETE" }).catch(() => {});
  }

  async function updateStatus(sourceItemId: string, status: FavoriteRow["usage_status"]) {
    setFavorites((prev) =>
      prev.map((f) => (f.source_item?.id === sourceItemId ? { ...f, usage_status: status } : f))
    );
    await fetch(`/api/shorts-sourcing/favorites/${sourceItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usage_status: status }),
    }).catch(() => {});
  }

  return (
    <PageContainer>
      <PageHeader title="소싱함" subtitle="찜한 영상 후보를 모아보고 채택 여부를 관리하세요." />
      <ShortsSourcingNav />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <SkeletonRow />
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState icon={<Heart className="h-6 w-6" />} title="아직 찜한 영상이 없습니다" description="새 소싱에서 마음에 드는 영상을 찜해보세요." />
      ) : (
        <div className="space-y-3">
          {favorites.map((fav) => {
            const item = fav.source_item;
            if (!item) return null;
            return (
              <Card key={fav.id} className="flex gap-4">
                <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/shorts-sourcing/thumbnail-proxy?platform=${item.platform}&url=${encodeURIComponent(item.thumbnail_url)}`}
                      alt={item.title ?? ""}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      {item.platform === "douyin" ? "더우인" : "샤오홍슈"}
                    </span>
                    {item.session?.product_name_ko && <span>· {item.session.product_name_ko}</span>}
                  </div>
                  <p className="line-clamp-2 text-sm font-medium">{item.title ?? "제목 없음"}</p>
                  {item.author_name && <p className="text-xs text-muted-foreground">@{item.author_name}</p>}
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={fav.usage_status}
                      onChange={(e) => updateStatus(item.id, e.target.value as FavoriteRow["usage_status"])}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    >
                      {(Object.keys(STATUS_LABEL) as FavoriteRow["usage_status"][]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                    <a
                      href={item.canonical_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      원본 보기 <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => removeFavorite(item.id)}
                      className="ml-auto text-xs text-muted-foreground hover:text-red-500"
                    >
                      찜 해제
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
