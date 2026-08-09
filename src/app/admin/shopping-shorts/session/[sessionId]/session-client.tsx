"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, InfoBanner, EmptyState } from "../../_components/ui";
import ShortsSourcingNav from "../../_components/shorts-nav";
import ResultCard, { ResultCardItem } from "../../_components/result-card";

interface JobStatus {
  id: string;
  platform: "douyin" | "xiaohongshu";
  keyword: string;
  status: "pending" | "running" | "succeeded" | "failed";
  error_message: string | null;
  result_count: number | null;
}

type SortOption = "recommended" | "likes" | "recent";
type PlatformOption = "all" | "douyin" | "xiaohongshu";

const POLL_INTERVAL_MS = 3000;

export default function SessionResultsClient({ sessionId }: { sessionId: string }) {
  const [productName, setProductName] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [items, setItems] = useState<ResultCardItem[]>([]);
  const [allJobsDone, setAllJobsDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [platformFilter, setPlatformFilter] = useState<PlatformOption>("all");
  const [ranking, setRanking] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [maxResultsReached, setMaxResultsReached] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/shorts-sourcing/session/${sessionId}/status`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "결과를 불러오지 못했습니다.");

      setProductName(data.session?.product_name_ko ?? null);
      setJobs(data.jobs ?? []);
      setItems(data.items ?? []);
      setAllJobsDone(!!data.all_jobs_done);
      setError(null);
    } catch (err: any) {
      setError(err.message || "결과를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (allJobsDone) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }
    pollTimerRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [allJobsDone, fetchStatus]);

  async function toggleFavorite(item: ResultCardItem) {
    if (!item.id) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_favorite: !i.is_favorite } : i)));
    if (item.is_favorite) {
      await fetch(`/api/shorts-sourcing/favorites/${item.id}`, { method: "DELETE" }).catch(() => {});
    } else {
      await fetch("/api/shorts-sourcing/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_item_id: item.id }),
      }).catch(() => {});
    }
  }

  async function runPreciseRank() {
    setRanking(true);
    try {
      const res = await fetch("/api/shorts-sourcing/rank/precise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI 정밀 정렬에 실패했습니다.");
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || "AI 정밀 정렬에 실패했습니다.");
    } finally {
      setRanking(false);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const res = await fetch(`/api/shorts-sourcing/session/${sessionId}/load-more`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "max_results_reached") {
          setMaxResultsReached(true);
        } else {
          throw new Error(data.message || "추가 검색을 시작하지 못했습니다.");
        }
        return;
      }
      if (data.next_limit_per_keyword >= data.max_limit_per_keyword) {
        setMaxResultsReached(true);
      }
      setAllJobsDone(false); // resume polling — new jobs were just started
      await fetchStatus();
    } catch (err: any) {
      setLoadMoreError(err.message || "추가 검색을 시작하지 못했습니다.");
    } finally {
      setLoadingMore(false);
    }
  }

  const runningJobs = jobs.filter((j) => j.status === "pending" || j.status === "running");
  const failedJobs = jobs.filter((j) => j.status === "failed");

  const filtered = items.filter((i) => platformFilter === "all" || i.platform === platformFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "likes") return (b.like_count ?? 0) - (a.like_count ?? 0);
    if (sortBy === "recent") return new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime();
    return (b.final_score ?? 0) - (a.final_score ?? 0);
  });

  const douyinCount = items.filter((i) => i.platform === "douyin").length;
  const xhsCount = items.filter((i) => i.platform === "xiaohongshu").length;

  return (
    <PageContainer>
      <Link
        href="/admin/shopping-shorts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 새 소싱으로 돌아가기
      </Link>

      <PageHeader
        title={productName ?? "검색 결과"}
        subtitle={`총 ${items.length}개 결과 · 더우인 ${douyinCount} · 샤오홍슈 ${xhsCount}`}
      />
      <ShortsSourcingNav />

      {runningJobs.length > 0 && (
        <InfoBanner variant="info">
          검색 중... {runningJobs.map((j) => `${j.platform === "douyin" ? "더우인" : "샤오홍슈"}(${j.keyword})`).join(", ")}
          {" "}({runningJobs.length}건 진행 중, 완료된 결과부터 바로 표시됩니다)
        </InfoBanner>
      )}

      {failedJobs.length > 0 && (
        <InfoBanner variant="warning">
          일부 검색에 실패했습니다: {failedJobs.map((j) => `${j.platform === "douyin" ? "더우인" : "샤오홍슈"}(${j.keyword})`).join(", ")}
          {" "}— 다른 검색어/플랫폼 결과는 정상적으로 표시됩니다.
        </InfoBanner>
      )}

      {error && <InfoBanner variant="error">{error}</InfoBanner>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {([
            { key: "all", label: "전체" },
            { key: "douyin", label: "더우인" },
            { key: "xiaohongshu", label: "샤오홍슈" },
          ] as { key: PlatformOption; label: string }[]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPlatformFilter(opt.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                platformFilter === opt.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="recommended">추천순</option>
            <option value="likes">좋아요순</option>
            <option value="recent">최신순</option>
          </select>
          <Button variant="outline" size="sm" onClick={runPreciseRank} disabled={ranking || items.length === 0}>
            {ranking ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
            AI 정밀 정렬
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">AI 정밀 정렬은 추가 API 호출이 발생합니다 (상위 20개 대상)</p>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[9/13] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title={runningJobs.length > 0 ? "검색 결과를 기다리는 중입니다" : "표시할 결과가 없습니다"}
          description={runningJobs.length > 0 ? "완료되는 대로 이 화면에 바로 표시됩니다." : "검색어나 플랫폼을 바꿔서 다시 시도해보세요."}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((item) => (
              <ResultCard key={item.id} item={item} onToggleFavorite={toggleFavorite} />
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            {maxResultsReached ? (
              <p className="text-xs text-muted-foreground">검색어당 최대 결과 수까지 모두 찾았습니다.</p>
            ) : (
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore || runningJobs.length > 0}
              >
                {loadingMore || runningJobs.length > 0 ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 더 찾는 중...
                  </>
                ) : (
                  "더 찾기"
                )}
              </Button>
            )}
            {loadMoreError && <InfoBanner variant="error">{loadMoreError}</InfoBanner>}
          </div>
        </>
      )}
    </PageContainer>
  );
}
