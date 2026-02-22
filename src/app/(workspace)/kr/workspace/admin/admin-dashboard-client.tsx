"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookText,
  Languages,
  MapIcon,
  Wrench,
  FlaskConical,
  ChevronRight,
} from "lucide-react";

interface DashboardMetrics {
  month: string;
  signups: number;
  paid: {
    starter: number;
    pro: number;
  };
  autoposting: {
    success: number | null;
    fail: number | null;
    source: string | null;
  };
  credits: {
    topup: number;
    consume: number;
  };
  recent: {
    subscriptions: any[];
    credits: any[];
    autoposting: any[];
  };
}

interface EventLog {
  id: string;
  created_at: string;
  event_type: string;
  target_type: string;
  target_slug: string;
  user_id: string | null;
  metadata: any;
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventLog[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    // Default to current month YYYY-MM
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch metrics
      const metricsRes = await fetch(`/api/admin/metrics?month=${selectedMonth}`);
      if (!metricsRes.ok) {
        throw new Error("Failed to fetch metrics");
      }
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

      // Fetch recent event logs (latest 20)
      const eventsRes = await fetch("/api/admin/event-logs?limit=20");
      if (!eventsRes.ok) {
        throw new Error("Failed to fetch event logs");
      }
      const eventsData = await eventsRes.json();
      setRecentEvents(eventsData.items || []);
    } catch (err: any) {
      console.error("[AdminDashboard] Fetch error:", err);
      setError(err.message || "데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-8 md:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 md:px-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          오류: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          운영자 대시보드
        </h1>
        <p className="text-sm text-muted-foreground">
          시스템 전체 지표 및 최근 활동을 확인하세요.
        </p>
      </div>

      {/* Month Selector */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">월 선택:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={() => router.push("/kr/workspace/admin/events")}
          className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          이벤트 로그 검색
        </button>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">빠른 작업</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <QuickActionCard
            icon={<BookText className="h-5 w-5" />}
            title="가이드 생성"
            href="/admin/guides"
          />
          <QuickActionCard
            icon={<Languages className="h-5 w-5" />}
            title="가이드 번역"
            href="/admin/guides/translate"
          />
          <QuickActionCard
            icon={<MapIcon className="h-5 w-5" />}
            title="루트 관리"
            href="/admin/routes-migrate"
          />
          <QuickActionCard
            icon={<Languages className="h-5 w-5" />}
            title="루트 번역"
            href="/admin/routes/translate"
          />
          <QuickActionCard
            icon={<Wrench className="h-5 w-5" />}
            title="툴 관리"
            href="/admin/tools"
          />
          <QuickActionCard
            icon={<FlaskConical className="h-5 w-5" />}
            title="테스트 도구"
            href="/admin#tests"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Signups */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">이번달 가입자</p>
          <p className="text-3xl font-bold text-foreground">{metrics?.signups || 0}</p>
        </div>

        {/* Card 2: Paid Subscriptions */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">유료 구독 (Starter)</p>
          <p className="text-3xl font-bold text-foreground">{metrics?.paid.starter || 0}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">유료 구독 (Pro)</p>
          <p className="text-3xl font-bold text-foreground">{metrics?.paid.pro || 0}</p>
        </div>

        {/* Card 3: Auto-posting */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">자동 포스팅</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              {metrics?.autoposting.success ?? "N/A"}
            </span>
            <span className="text-xs text-muted-foreground">성공</span>
            <span className="text-2xl font-bold text-red-600">
              {metrics?.autoposting.fail ?? "N/A"}
            </span>
            <span className="text-xs text-muted-foreground">실패</span>
          </div>
          {metrics?.autoposting.source && (
            <p className="text-xs text-muted-foreground mt-1">
              (출처: {metrics.autoposting.source})
            </p>
          )}
        </div>

        {/* Card 4: Credits */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">크레딧 충전</p>
          <p className="text-2xl font-bold text-foreground">{metrics?.credits.topup || 0}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-1">크레딧 사용</p>
          <p className="text-2xl font-bold text-foreground">{metrics?.credits.consume || 0}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">최근 활동 (event_logs)</h2>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">최근 이벤트가 없습니다.</p>
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
                    User ID
                  </th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">
                    Workspace ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => {
                  const workspaceId = event.metadata?.workspace_id || "-";
                  return (
                    <tr key={event.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-2 text-xs text-foreground">
                        {new Date(event.created_at).toLocaleString("ko-KR")}
                      </td>
                      <td className="py-2 px-2 text-xs text-foreground">{event.event_type}</td>
                      <td className="py-2 px-2 text-xs text-foreground">{event.target_type}</td>
                      <td className="py-2 px-2 text-xs text-foreground">{event.target_slug}</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground font-mono">
                        {event.user_id ? event.user_id.slice(0, 8) : "-"}
                      </td>
                      <td className="py-2 px-2 text-xs text-muted-foreground font-mono">
                        {typeof workspaceId === "string" ? workspaceId.slice(0, 8) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary/20">
        {icon}
      </div>
      <p className="text-center text-sm font-medium text-foreground">{title}</p>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}
