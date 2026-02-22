"use client";

import { Button } from "@/components/ui/button";
import Badge from "@/components/ui/Badge";

interface InsightLetterSettings {
  id?: string;
  workspace_id: string;
  industry: string;
  audience: string;
  region: string;
  offerings: string[];
  price_tier: string;
  primary_channels: string[];
  role: string;
  quarterly_goal: string;
  weekly_kpi: string;
  forbidden_claims: string[];
  seed_keywords: string[];
  competitor_urls: string[];
  created_at?: string;
  updated_at?: string;
}

interface InsightLetterOverviewProps {
  isAdmin: boolean;
  settings: InsightLetterSettings | null;
  onNavigateToSettings: () => void;
}

export function InsightLetterOverview({
  isAdmin,
  settings,
  onNavigateToSettings,
}: InsightLetterOverviewProps) {
  const hasSettings = settings && (settings.seed_keywords?.length > 0 || settings.industry);

  // Mock KPI data (computed from settings or defaults)
  const nextSendTime = "매주 금요일 오전 10시";
  const keywordsCount = settings?.seed_keywords?.length || 0;
  const actionCount = settings?.forbidden_claims?.length || 0;

  // Mock weekly summary items
  const weeklyItems = [
    { title: "주간 마케팅 트렌드 분석", date: "1월 17일", status: "발송완료" },
    { title: "경쟁사 동향 리포트", date: "1월 10일", status: "발송완료" },
    { title: "산업별 인사이트", date: "1월 3일", status: "발송완료" },
  ];

  return (
    <div className="space-y-6">
      {/* Settings Warning Card */}
      {!hasSettings && (
        <div className="rounded-lg border-2 border-orange-500/30 bg-orange-500/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground mb-2">
                설정이 필요합니다
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                인사이트 레터를 받으시려면 산업, 고객층, 키워드 등을 먼저 설정해주세요.
              </p>
            </div>
            {isAdmin ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToSettings}
              >
                설정하기
              </Button>
            ) : (
              <Badge tone="muted" className="text-xs whitespace-nowrap">
                관리자에게 요청하세요
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: 다음 발송 */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-2">다음 발송</p>
          <p className="text-base font-bold text-foreground">{nextSendTime}</p>
        </div>

        {/* Card 2: 핵심 키워드 */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-2">핵심 키워드 수</p>
          <p className="text-base font-bold text-foreground">
            {keywordsCount > 0 ? `${keywordsCount}개` : "-"}
          </p>
        </div>

        {/* Card 3: 액션 제안 */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground mb-2">액션 제안 수</p>
          <p className="text-base font-bold text-foreground">
            {actionCount > 0 ? `${actionCount}개` : "-"}
          </p>
        </div>
      </div>

      {/* 이번 주 요약 */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">이번 주 요약</h2>
          <Badge tone="muted" className="text-xs">
            {weeklyItems.length}개
          </Badge>
        </div>

        <div className="space-y-2">
          {weeklyItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
              <Badge
                tone={item.status === "발송완료" ? "primary" : "muted"}
                className="text-xs ml-2"
              >
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
        <h3 className="text-base font-bold text-foreground mb-3">
          인사이트 레터란?
        </h3>
        <div className="space-y-2 text-sm text-foreground leading-relaxed">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
            <p>매주 업계 트렌드와 마케팅 인사이트를 정리해서 보내드립니다.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
            <p>고객 행동 분석, 경쟁사 동향, 실전 액션 플랜까지 한눈에.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
            <p>설정한 키워드와 산업에 맞춰 맞춤형 콘텐츠를 제공합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
