"use client";

import { Heart, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResultCardItem {
  id?: string;
  platform: "douyin" | "xiaohongshu";
  canonical_url: string;
  title: string | null;
  author_name: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  like_count: number | null;
  published_at?: string | null;
  final_score: number | null;
  is_favorite?: boolean;
}

const PLATFORM_LABEL: Record<ResultCardItem["platform"], string> = {
  douyin: "더우인",
  xiaohongshu: "샤오홍슈",
};

function formatDuration(seconds: number | null): string | null {
  if (seconds === null || seconds === undefined) return null;
  const s = Math.round(seconds);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  return `${m}분 ${s % 60}초`;
}

function formatCount(count: number | null): string | null {
  if (count === null || count === undefined) return null;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export default function ResultCard({
  item,
  onToggleFavorite,
}: {
  item: ResultCardItem;
  onToggleFavorite?: (item: ResultCardItem) => void;
}) {
  const duration = formatDuration(item.duration_seconds);
  const likes = formatCount(item.like_count);
  const scorePercent = item.final_score !== null ? Math.round(item.final_score * 100) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[9/13] w-full bg-muted">
        {item.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnail_url} alt={item.title ?? "썸네일"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            미리보기 없음
          </div>
        )}
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(item)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <Heart className={cn("h-4 w-4", item.is_favorite ? "fill-red-500 text-red-500" : "text-white")} />
          </button>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">{PLATFORM_LABEL[item.platform]}</span>
          {scorePercent !== null && <span className="text-primary">추천 {scorePercent}%</span>}
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{item.title ?? "제목 없음"}</p>
        {item.author_name && <p className="truncate text-xs text-muted-foreground">@{item.author_name}</p>}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {likes && <span>♥ {likes}</span>}
          {duration && <span>{duration}</span>}
        </div>
        <a
          href={item.canonical_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          원본 보기 <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
