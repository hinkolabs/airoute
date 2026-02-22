"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EventLog {
  id: string;
  created_at: string;
  event_type: string;
  target_type: string;
  target_slug: string;
  source: string;
  user_id: string | null;
  metadata: any;
}

interface Filters {
  from: string;
  to: string;
  event_type: string;
  target_type: string;
  user_id: string;
  workspace_id: string;
  limit: number;
}

export default function AdminEventsClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    from: "",
    to: "",
    event_type: "",
    target_type: "",
    user_id: "",
    workspace_id: "",
    limit: 50,
  });

  async function handleSearch() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.event_type) params.append("event_type", filters.event_type);
      if (filters.target_type) params.append("target_type", filters.target_type);
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.workspace_id) params.append("workspace_id", filters.workspace_id);
      params.append("limit", String(filters.limit));

      const res = await fetch(`/api/admin/event-logs?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch events");
      }

      const data = await res.json();
      setEvents(data.items || []);
    } catch (err: any) {
      console.error("[AdminEvents] Fetch error:", err);
      setError(err.message || "이벤트 로그를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFilters({
      from: "",
      to: "",
      event_type: "",
      target_type: "",
      user_id: "",
      workspace_id: "",
      limit: 50,
    });
    setEvents([]);
    setError(null);
  }

  return (
    <div className="px-4 py-8 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">이벤트 로그 검색</h1>
          <p className="text-sm text-muted-foreground">
            시스템 전체 이벤트를 검색하고 조회하세요.
          </p>
        </div>
        <button
          onClick={() => router.push("/kr/workspace/admin")}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          대시보드로
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground mb-4">필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* From Date */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              시작일 (From)
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              종료일 (To)
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Event Type
            </label>
            <input
              type="text"
              value={filters.event_type}
              onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
              placeholder="예: autoposting_success"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Target Type */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Target Type
            </label>
            <input
              type="text"
              value={filters.target_type}
              onChange={(e) => setFilters({ ...filters, target_type: e.target.value })}
              placeholder="예: autoposting"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              User ID (UUID)
            </label>
            <input
              type="text"
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Workspace ID */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Workspace ID (UUID)
            </label>
            <input
              type="text"
              value={filters.workspace_id}
              onChange={(e) => setFilters({ ...filters, workspace_id: e.target.value })}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Limit */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              결과 개수 (최대 200)
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={filters.limit}
              onChange={(e) =>
                setFilters({ ...filters, limit: Math.min(200, Math.max(1, parseInt(e.target.value) || 50)) })
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
          <button
            onClick={handleReset}
            className="rounded-md border border-border bg-background px-6 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            초기화
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          오류: {error}
        </div>
      )}

      {/* Results Table */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">
          검색 결과 ({events.length}건)
        </h2>

        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다. 필터를 설정하고 검색하세요.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    생성일시
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Event Type
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Target Type
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Target Slug
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Source
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    User ID
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Workspace ID
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Metadata
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const workspaceId = event.metadata?.workspace_id || "-";
                  return (
                    <tr key={event.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-2 text-xs text-foreground">
                        {new Date(event.created_at).toLocaleString("ko-KR")}
                      </td>
                      <td className="py-2 px-2 text-xs text-foreground">{event.event_type}</td>
                      <td className="py-2 px-2 text-xs text-foreground">{event.target_type}</td>
                      <td className="py-2 px-2 text-xs text-foreground">{event.target_slug}</td>
                      <td className="py-2 px-2 text-xs text-foreground">{event.source}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground font-mono">
                        {event.user_id ? event.user_id.slice(0, 8) : "-"}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground font-mono">
                        {typeof workspaceId === "string" ? workspaceId.slice(0, 8) : "-"}
                      </td>
                      <td className="py-2 px-2 text-xs">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="text-primary hover:underline"
                        >
                          보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metadata Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="max-w-2xl w-full rounded-lg border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Metadata</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <pre className="overflow-auto rounded-md bg-muted/30 p-4 text-xs text-foreground">
              {JSON.stringify(selectedEvent.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
