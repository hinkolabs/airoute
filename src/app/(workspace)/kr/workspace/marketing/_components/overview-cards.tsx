"use client";

export type BriefState = "none" | "ready" | "generated";

interface OverviewCardsProps {
  briefState?: BriefState;
}

// STUB: 추후 DB 연결 타입
interface MarketingMetrics {
  sentCount: number;
  monthlyQuota: number;
  openRate?: number;
  inquiriesCount: number;
  nextSendAt: string;
  focusTopics: string[];
}

export function OverviewCards({ briefState = "none" }: OverviewCardsProps) {
  // STUB: Hard-coded data
  const metrics: MarketingMetrics = {
    sentCount: 8,
    monthlyQuota: 15,
    openRate: undefined, // 아직 수집 안됨
    inquiriesCount: 3,
    nextSendAt: "1월 23일",
    focusTopics: ["신메뉴 홍보", "매장 이벤트"],
  };

  const handleActionClick = () => {
    // STUB: 추천 액션 클릭
    console.log("추천 액션 실행");
  };

  const cards = [
    {
      label: "이번 달 발송 성과",
      value: `${metrics.sentCount} / ${metrics.monthlyQuota}`,
      description: metrics.openRate
        ? `오픈율 ${metrics.openRate}%`
        : "오픈율 수집 중",
      action: null,
    },
    {
      label: "이번 주 추천 액션",
      value: briefState === "ready" ? "아이템 생성 가능" : "준비 중",
      description: briefState === "ready" ? "메인 정보 입력 완료" : "메인 정보를 먼저 입력하세요",
      action: briefState === "ready" ? (
        <button
          type="button"
          onClick={handleActionClick}
          className="mt-2 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          아이템 생성하기
        </button>
      ) : null,
    },
    {
      label: "리드/문의",
      value: String(metrics.inquiriesCount),
      description: "이번 달 문의 건수",
      action: null,
    },
    {
      label: "핫 제품/서비스 TOP",
      value: metrics.focusTopics[0] || "—",
      description: metrics.focusTopics[1] || "—",
      action: null,
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-lg border border-border bg-card p-4"
        >
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {card.description}
          </p>
          {card.action}
        </div>
      ))}
    </div>
  );
}
