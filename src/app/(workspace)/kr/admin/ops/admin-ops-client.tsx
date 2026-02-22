"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Users, Ticket, Coins, CheckCircle, XCircle } from "lucide-react";
import { createAdminSupabase } from "@/lib/supabase/admin";

interface KPIData {
  paid_subscriptions: number;
  coupon_redemptions: number;
  total_credits_topped_up: number;
  total_credits_consumed: number;
  autoposting_success: number;
  autoposting_fail: number;
}

export default function AdminOpsClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<KPIData | null>(null);

  useEffect(() => {
    fetchKPI();
  }, []);

  const fetchKPI = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get first day of current month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Note: These queries should ideally be in a server API route
      // For now, we'll make direct Supabase calls (requires service role key in browser env)
      // In production, create a GET /api/admin/kpi endpoint

      const res = await fetch("/api/admin/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month_start: monthStart }),
      });

      if (!res.ok) {
        throw new Error("KPI 조회 실패");
      }

      const data = await res.json();
      setKpi(data);
    } catch (err) {
      console.error("[AdminOps] Failed to fetch KPI:", err);
      setError(err instanceof Error ? err.message : "KPI 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-6 py-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">운영 대시보드</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            이번 달 주요 지표 (시스템 관리자 전용)
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Paid Subscriptions */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">유료 구독</h3>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {kpi?.paid_subscriptions?.toLocaleString() || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">활성 구독 수</p>
          </div>

          {/* Coupon Redemptions */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-green-500/10 p-2">
                <Ticket className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">쿠폰 사용</h3>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {kpi?.coupon_redemptions?.toLocaleString() || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">이번 달 리딤 수</p>
          </div>

          {/* Credits Topped Up */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-blue-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">토큰 충전</h3>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {kpi?.total_credits_topped_up?.toLocaleString() || 0}P
            </div>
            <p className="mt-1 text-xs text-muted-foreground">총 충전량</p>
          </div>

          {/* Credits Consumed */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-orange-500/10 p-2">
                <Coins className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">토큰 사용</h3>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {Math.abs(kpi?.total_credits_consumed || 0).toLocaleString()}P
            </div>
            <p className="mt-1 text-xs text-muted-foreground">총 사용량</p>
          </div>

          {/* Autoposting Success */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-green-500/10 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">자동포스팅 성공</h3>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {kpi?.autoposting_success?.toLocaleString() || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">성공 건수</p>
          </div>

          {/* Autoposting Fail */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-500/10 p-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground">자동포스팅 실패</h3>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {kpi?.autoposting_fail?.toLocaleString() || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">실패 건수</p>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={fetchKPI}
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "로딩 중..." : "새로고침"}
          </button>
        </div>
      </div>
    </div>
  );
}
