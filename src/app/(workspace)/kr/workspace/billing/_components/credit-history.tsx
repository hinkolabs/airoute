"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, TrendingDown, Gift, Loader2 } from "lucide-react";

interface CreditLedgerItem {
  id: string;
  workspace_id: string;
  user_id: string;
  action_type: string;
  feature_key: string;
  delta: number;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface CreditHistoryProps {
  workspaceId: string;
  onTopupClick?: () => void;
  isSystemAdmin?: boolean;
}

type FilterType = "all" | "topup" | "consume";
type Scope = "me" | "all";

// Feature key to label mapping
const FEATURE_LABELS: Record<string, string> = {
  topup_test: "크레딧 충전 (테스트)",
  topup_stripe: "크레딧 충전",
  ppt_generate: "PPT 생성",
  shortform_make: "숏폼 제작",
  meeting_assistant: "회의 비서",
  doc_summary: "문서 요약",
  panel_verdict: "AI 판정단",
  snap_generate: "스냅 생성",
  landing_generate: "랜딩페이지 생성",
  auto_posting: "자동 포스팅",
};

function getFeatureLabel(featureKey: string): string {
  return FEATURE_LABELS[featureKey] || featureKey;
}

function getTransactionType(delta: number, featureKey: string): "topup" | "consume" | "gift" {
  if (delta > 0) {
    if (featureKey.startsWith("topup")) {
      return "topup";
    }
    return "gift";
  }
  return "consume";
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function CreditHistory({ workspaceId, onTopupClick, isSystemAdmin = false }: CreditHistoryProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<CreditLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [scope, setScope] = useState<Scope>("me");

  const fetchHistory = async () => {
    if (!workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/credits/history?workspace_id=${workspaceId}&limit=50&scope=${scope}`);
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "내역을 불러오지 못했습니다");
      }

      const data = await res.json();
      setBalance(data.current_balance);
      setHistory(data.items || []);
    } catch (err) {
      console.error("[CreditHistory] Error:", err);
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [workspaceId, scope]);

  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    const type = getTransactionType(item.delta, item.feature_key);
    if (filter === "topup") return type === "topup" || type === "gift";
    if (filter === "consume") return type === "consume";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">현재 크레딧</p>
            {loading ? (
              <div className="h-9 w-32 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {balance !== null ? balance.toLocaleString() : "0"}
                </span>
                <span className="text-sm text-muted-foreground">P</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              워크스페이스 잔액은 팀 전체 사용량을 반영할 수 있습니다.
            </p>
          </div>
          <button
            onClick={onTopupClick}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            충전하기
          </button>
        </div>
      </div>

      {/* Privacy Notice & Scope Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {scope === "me" ? (
            <span>내 활동 내역만 표시됩니다. (개인정보 보호)</span>
          ) : (
            <span className="text-orange-600 dark:text-orange-400">
              관리자: 전체 내역 보기 중
            </span>
          )}
        </div>
        
        {isSystemAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScope("me")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                scope === "me"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              내 내역
            </button>
            <button
              onClick={() => setScope("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                scope === "all"
                  ? "bg-orange-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              전체 내역
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            filter === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter("topup")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            filter === "topup"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          충전/지급
        </button>
        <button
          onClick={() => setFilter("consume")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            filter === "consume"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          사용
        </button>
      </div>

      {/* History List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              아직 내역이 없습니다
            </p>
            <p className="text-sm text-muted-foreground">
              크레딧을 충전하거나 사용하면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const type = getTransactionType(item.delta, item.feature_key);
            const label = item.description || getFeatureLabel(item.feature_key);
            const isPositive = item.delta > 0;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      type === "topup"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : type === "gift"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    }`}
                  >
                    {type === "topup" || type === "gift" ? (
                      type === "gift" ? (
                        <Gift className="h-5 w-5" />
                      ) : (
                        <TrendingUp className="h-5 w-5" />
                      )
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      isPositive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {item.delta.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">P</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Placeholder for future payment history */}
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-1">
          결제 내역 (준비중)
        </p>
        <p className="text-xs text-muted-foreground">
          Stripe 결제 연동 후 여기에 표시됩니다
        </p>
      </div>
    </div>
  );
}
