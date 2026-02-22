"use client";

import { useState, useEffect } from "react";
import { Loader2, History, Ticket } from "lucide-react";

interface BillingHistoryClientProps {
  workspaceId: string;
  isSystemAdmin: boolean;
}

type TabType = "credits" | "coupons";

interface CreditLedgerItem {
  id: string;
  workspace_id: string;
  user_id?: string;
  action_type: string;
  feature_key: string;
  delta: number;
  description: string;
  metadata: any;
  created_at: string;
}

interface CouponRedemption {
  id: string;
  coupon_id: string;
  code: string;
  workspace_id: string;
  redeemed_by: string;
  redeemed_at: string;
  metadata: any;
}

export default function BillingHistoryClient({
  workspaceId,
  isSystemAdmin,
}: BillingHistoryClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("credits");
  const [creditsHistory, setCreditsHistory] = useState<CreditLedgerItem[]>([]);
  const [couponsHistory, setCouponsHistory] = useState<CouponRedemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  // Filters for system_admin
  const [filterUserId, setFilterUserId] = useState("");
  const [filterActionType, setFilterActionType] = useState("");
  const [filterFeatureKey, setFilterFeatureKey] = useState("");

  useEffect(() => {
    if (activeTab === "credits") {
      fetchCreditsHistory();
    } else {
      fetchCouponsHistory();
    }
  }, [activeTab, workspaceId]);

  const fetchCreditsHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const scope = isSystemAdmin ? "admin" : "me";
      let url = `/api/credits/history?workspace_id=${workspaceId}&scope=${scope}&limit=100`;

      if (isSystemAdmin) {
        if (filterUserId) url += `&user_id=${filterUserId}`;
        if (filterActionType) url += `&action_type=${filterActionType}`;
        if (filterFeatureKey) url += `&feature_key=${filterFeatureKey}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("내역 조회 실패");
      }

      const data = await res.json();
      setCreditsHistory(data.items || []);
      if (data.current_balance !== undefined) {
        setCurrentBalance(data.current_balance);
      }
    } catch (err) {
      console.error("[BillingHistory] Failed to fetch credits:", err);
      setError(err instanceof Error ? err.message : "내역 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponsHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `/api/coupons/redemptions?workspace_id=${workspaceId}&limit=100`;
      if (isSystemAdmin && filterUserId) {
        url += `&user_id=${filterUserId}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("쿠폰 내역 조회 실패");
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.message || "쿠폰 내역 조회 실패");
      }

      setCouponsHistory(data.items || []);
    } catch (err) {
      console.error("[BillingHistory] Failed to fetch coupons:", err);
      setError(err instanceof Error ? err.message : "쿠폰 내역 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (activeTab === "credits") {
      fetchCreditsHistory();
    } else {
      fetchCouponsHistory();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">결제 및 토큰 내역</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            워크스페이스의 토큰 충전/사용 내역과 쿠폰 등록 내역을 확인하세요
          </p>
          {currentBalance !== null && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2">
              <span className="text-sm font-medium text-muted-foreground">현재 잔액:</span>
              <span className="text-lg font-bold text-primary">{currentBalance.toLocaleString()}P</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex border-b border-border">
          <button
            onClick={() => setActiveTab("credits")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "credits"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4" />
            <span>토큰 내역</span>
          </button>
          <button
            onClick={() => setActiveTab("coupons")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition ${
              activeTab === "coupons"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span>쿠폰 내역</span>
          </button>
        </div>

        {/* System Admin Filters */}
        {isSystemAdmin && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">관리자 필터</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">User ID</label>
                <input
                  type="text"
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  placeholder="UUID"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              {activeTab === "credits" && (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Action Type</label>
                    <input
                      type="text"
                      value={filterActionType}
                      onChange={(e) => setFilterActionType(e.target.value)}
                      placeholder="topup, consume, etc."
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Feature Key</label>
                    <input
                      type="text"
                      value={filterFeatureKey}
                      onChange={(e) => setFilterFeatureKey(e.target.value)}
                      placeholder="coupon, autoposting, etc."
                      className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="mt-3">
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                필터 적용
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Credits History Table */}
        {!loading && activeTab === "credits" && (
          <div className="rounded-lg border border-border bg-card">
            {creditsHistory.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                토큰 내역이 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">일시</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">유형</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">기능</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">설명</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">변동량</th>
                      {isSystemAdmin && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User ID</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {creditsHistory.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(item.created_at).toLocaleString("ko-KR")}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{item.action_type}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.feature_key}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.description}</td>
                        <td className={`px-4 py-3 text-right text-sm font-semibold ${item.delta > 0 ? "text-green-600" : "text-red-600"}`}>
                          {item.delta > 0 ? "+" : ""}{item.delta.toLocaleString()}P
                        </td>
                        {isSystemAdmin && (
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                            {item.user_id?.slice(0, 8)}...
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Coupons History Table */}
        {!loading && activeTab === "coupons" && (
          <div className="rounded-lg border border-border bg-card">
            {couponsHistory.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                쿠폰 사용 내역이 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">일시</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">쿠폰 코드</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">유형</th>
                      {isSystemAdmin && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User ID</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {couponsHistory.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(item.redeemed_at).toLocaleString("ko-KR")}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-primary">{item.code}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {item.metadata?.kind === "credits" ? "토큰 쿠폰" : "구독 쿠폰"}
                        </td>
                        {isSystemAdmin && (
                          <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                            {item.redeemed_by.slice(0, 8)}...
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
