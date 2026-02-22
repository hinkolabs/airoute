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
  topup_test: "Credit Top-up (Test)",
  topup_stripe: "Credit Top-up",
  ppt_generate: "PPT Generation",
  shortform_make: "Short-form Creation",
  meeting_assistant: "Meeting Assistant",
  doc_summary: "Document Summary",
  panel_verdict: "AI Verdict",
  snap_generate: "Snap Generation",
  landing_generate: "Landing Page Generation",
  auto_posting: "Auto Posting",
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

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
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
        throw new Error(data.error || "Failed to load history");
      }

      const data = await res.json();
      setBalance(data.current_balance);
      setHistory(data.items || []);
    } catch (err) {
      console.error("[CreditHistory] Error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
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
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
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
              Workspace balance reflects total team usage.
            </p>
          </div>
          <button
            onClick={onTopupClick}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Top Up
          </button>
        </div>
      </div>

      {/* Privacy Notice & Scope Toggle */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {scope === "me" ? (
            <span>Showing only your activity. (Privacy protection)</span>
          ) : (
            <span className="text-orange-600 dark:text-orange-400">
              Admin: Viewing all activity
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
              My History
            </button>
            <button
              onClick={() => setScope("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                scope === "all"
                  ? "bg-orange-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All History
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
          All
        </button>
        <button
          onClick={() => setFilter("topup")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            filter === "topup"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Top-ups / Gifts
        </button>
        <button
          onClick={() => setFilter("consume")}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
            filter === "consume"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Usage
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
              No history yet
            </p>
            <p className="text-sm text-muted-foreground">
              Top-up or use credits to see activity here
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
          Payment History (Coming Soon)
        </p>
        <p className="text-xs text-muted-foreground">
          Will be displayed after Stripe integration
        </p>
      </div>
    </div>
  );
}
