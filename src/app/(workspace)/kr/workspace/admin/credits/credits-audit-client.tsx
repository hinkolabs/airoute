"use client";

import { useState } from "react";
import { Search, Download, Loader2, AlertCircle } from "lucide-react";

interface CreditLedgerItem {
  id: string;
  workspace_id: string;
  user_id?: string;
  action_type: string;
  feature_key: string;
  delta: number;
  description: string | null;
  metadata: any;
  created_at: string;
}

interface AuditFilters {
  workspace_id: string;
  user_id: string;
  action_type: string;
  feature_key: string;
  date_from: string;
  date_to: string;
  limit: number;
}

const ACTION_TYPES = ["grant", "consume", "topup", "refund", "adjust"];

export default function CreditsAuditClient() {
  const [filters, setFilters] = useState<AuditFilters>({
    workspace_id: "",
    user_id: "",
    action_type: "",
    feature_key: "",
    date_from: "",
    date_to: "",
    limit: 50,
  });

  const [items, setItems] = useState<CreditLedgerItem[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (cursor?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams({ scope: "admin" });
      
      if (filters.workspace_id) params.set("workspace_id", filters.workspace_id);
      if (filters.user_id) params.set("user_id", filters.user_id);
      if (filters.action_type) params.set("action_type", filters.action_type);
      if (filters.feature_key) params.set("feature_key", filters.feature_key);
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to) params.set("date_to", filters.date_to);
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/credits/history?${params.toString()}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed to fetch audit data");
      }

      const data = await res.json();
      
      if (cursor) {
        // Append to existing items (pagination)
        setItems((prev) => [...prev, ...(data.items || [])]);
      } else {
        // New search
        setItems(data.items || []);
        setAppliedFilters(data.applied_filters || {});
      }
      
      setNextCursor(data.next_cursor);
    } catch (err) {
      console.error("[CreditsAudit] Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (items.length === 0) return;

    // Build CSV
    const headers = [
      "created_at",
      "workspace_id",
      "user_id",
      "action_type",
      "feature_key",
      "delta",
      "description",
    ];

    const rows = items.map((item) => [
      item.created_at,
      item.workspace_id,
      item.user_id || "",
      item.action_type,
      item.feature_key,
      item.delta.toString(),
      item.description || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `credits_audit_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="px-4 py-8 md:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span>Admin</span>
          <span>/</span>
          <span>Credits Audit</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">크레딧 감사</h1>
        <p className="text-sm text-muted-foreground mt-2">
          시스템 관리자 전용 - 크레딧 히스토리 전체 조회 및 감사
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">필터</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Workspace ID */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Workspace ID
            </label>
            <input
              type="text"
              value={filters.workspace_id}
              onChange={(e) => setFilters({ ...filters, workspace_id: e.target.value })}
              placeholder="UUID (선택사항)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              User ID
            </label>
            <input
              type="text"
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              placeholder="UUID (선택사항)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Action Type
            </label>
            <select
              value={filters.action_type}
              onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">전체</option>
              {ACTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Feature Key */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Feature Key
            </label>
            <input
              type="text"
              value={filters.feature_key}
              onChange={(e) => setFilters({ ...filters, feature_key: e.target.value })}
              placeholder="예: topup_test"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            검색
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={items.length === 0}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            CSV 다운로드
          </button>
        </div>
      </div>

      {/* Applied Filters Info */}
      {Object.keys(appliedFilters).length > 0 && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 mb-4">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
            적용된 필터:
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(appliedFilters).map(([key, value]) => (
              <span
                key={key}
                className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400"
              >
                {key}: {value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 mb-4 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">오류</p>
            <p className="text-sm text-destructive/90 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && items.length === 0 && !error && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            검색 버튼을 눌러 크레딧 내역을 조회하세요
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Created At</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Workspace ID</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">User ID</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Feature</th>
                    <th className="px-4 py-3 text-right font-medium text-foreground">Delta</th>
                    <th className="px-4 py-3 text-left font-medium text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(item.created_at).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.workspace_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.user_id ? `${item.user_id.slice(0, 8)}...` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                          {item.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{item.feature_key}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-bold ${
                            item.delta > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {item.delta > 0 ? "+" : ""}
                          {item.delta.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {nextCursor && (
            <div className="flex justify-center">
              <button
                onClick={() => handleSearch(nextCursor)}
                disabled={loading}
                className="rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                {loading ? "로딩 중..." : "다음 페이지"}
              </button>
            </div>
          )}

          {/* Result Count */}
          <div className="text-center text-sm text-muted-foreground">
            총 {items.length}개 항목 표시
            {nextCursor && " (더 많은 항목이 있습니다)"}
          </div>
        </div>
      )}
    </div>
  );
}
