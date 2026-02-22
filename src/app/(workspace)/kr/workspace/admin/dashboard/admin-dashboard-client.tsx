"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CreditCard,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  ChevronRight,
  MapIcon,
  Languages,
  BookText,
  Wrench,
  FlaskConical,
} from "lucide-react";

interface MetricsResponse {
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
    subscriptions: Array<{
      id: string;
      workspace_id: string;
      plan_key: string;
      status: string;
      created_at: string;
    }>;
    credits: Array<{
      id: string;
      workspace_id: string;
      user_id: string;
      action_type: string;
      delta: number;
      created_at: string;
    }>;
    autoposting: Array<{
      id: string;
      workspace_id: string;
      status: string;
      created_at: string;
    }>;
  };
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
}

function KPICard({ title, value, subtitle, icon: Icon, trend }: KPICardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="rounded-full bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          {trend === "up" && (
            <>
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500">증가</span>
            </>
          )}
          {trend === "down" && (
            <>
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">감소</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardClient() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate month options (last 12 months)
  const generateMonthOptions = () => {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      options.push(`${year}-${month}`);
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Fetch metrics
  const fetchMetrics = async (month?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = month
        ? `/api/admin/metrics?month=${month}`
        : "/api/admin/metrics";
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch metrics");
      }
      const data: MetricsResponse = await res.json();
      setMetrics(data);
      if (!selectedMonth) {
        setSelectedMonth(data.month);
      }
    } catch (err: any) {
      console.error("Failed to fetch metrics:", err);
      setError(err.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    fetchMetrics(newMonth);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-semibold text-foreground">
            데이터를 불러올 수 없습니다
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchMetrics(selectedMonth)}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const hasAutopostingData = metrics.autoposting.source !== null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">운영 대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            system_admin 전용 KPI 모니터링 및 콘텐츠 관리
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <select
            value={selectedMonth}
            onChange={handleMonthChange}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Actions for Content Management */}
      <div>
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
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">이번 달 주요 지표</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="회원가입자 수"
          value={metrics.signups}
          subtitle="이번 달"
          icon={Users}
        />
        <KPICard
          title="유료 구독 (Starter)"
          value={metrics.paid.starter}
          subtitle="이번 달"
          icon={CreditCard}
        />
        <KPICard
          title="유료 구독 (Pro)"
          value={metrics.paid.pro}
          subtitle="이번 달"
          icon={CreditCard}
        />
        <KPICard
          title="크레딧 충전/사용"
          value={`+${metrics.credits.topup} / -${metrics.credits.consume}`}
          subtitle="이번 달"
          icon={TrendingUp}
        />
      </div>
      </div>

      {/* Auto-posting KPI */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Megaphone className="h-6 w-6 shrink-0 text-primary" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              자동 포스팅 현황
            </h3>
            {hasAutopostingData ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">성공</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {metrics.autoposting.success ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">실패</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">
                    {metrics.autoposting.fail ?? 0}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-md bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground">
                  ⚠️ auto_posting_runs 테이블이 없습니다
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  자동 포스팅 로그를 기록하려면 다음 컬럼을 포함한 테이블을
                  생성하세요:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• id (uuid, primary key)</li>
                  <li>• workspace_id (uuid, references workspaces)</li>
                  <li>• status (text, "success" | "fail")</li>
                  <li>• created_at (timestamp)</li>
                  <li>• provider (text, optional)</li>
                  <li>• error (text, optional)</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">최근 활동</h2>

        {/* Recent Subscriptions */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-medium text-foreground">
            최근 구독 (10개)
          </h3>
          {metrics.recent.subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Workspace ID</th>
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metrics.recent.subscriptions.map((sub) => (
                    <tr key={sub.id} className="text-foreground">
                      <td className="py-2 font-mono text-xs">
                        {sub.workspace_id.slice(0, 8)}...
                      </td>
                      <td className="py-2">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {sub.plan_key}
                        </span>
                      </td>
                      <td className="py-2">{sub.status}</td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(sub.created_at).toLocaleString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">데이터 없음</p>
          )}
        </div>

        {/* Recent Credits */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-medium text-foreground">
            최근 크레딧 활동 (10개)
          </h3>
          {metrics.recent.credits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Workspace ID</th>
                    <th className="pb-2 font-medium">Action</th>
                    <th className="pb-2 font-medium">Delta</th>
                    <th className="pb-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metrics.recent.credits.map((cred) => (
                    <tr key={cred.id} className="text-foreground">
                      <td className="py-2 font-mono text-xs">
                        {cred.workspace_id.slice(0, 8)}...
                      </td>
                      <td className="py-2">{cred.action_type}</td>
                      <td
                        className={`py-2 font-semibold ${
                          cred.delta > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {cred.delta > 0 ? "+" : ""}
                        {cred.delta}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(cred.created_at).toLocaleString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">데이터 없음</p>
          )}
        </div>

        {/* Recent Auto-posting (if available) */}
        {hasAutopostingData && metrics.recent.autoposting.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-medium text-foreground">
              최근 자동 포스팅 (10개)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Workspace ID</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metrics.recent.autoposting.map((ap) => (
                    <tr key={ap.id} className="text-foreground">
                      <td className="py-2 font-mono text-xs">
                        {ap.workspace_id.slice(0, 8)}...
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            ap.status === "success"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {ap.status}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(ap.created_at).toLocaleString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
