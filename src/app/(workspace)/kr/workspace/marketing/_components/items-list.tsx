"use client";

import { useState, useEffect } from "react";
import { SectionShell } from "./section-shell";

interface MarketingItem {
  id: string;
  title: string;
  status: "completed" | "scheduled";
  scheduledDate: string;
  blogRules: {
    minChars: number;
    keywordCount: number;
  };
  snsRules: {
    maxLength: number;
    hashtags: string[];
  };
  imageKeywords: string[];
}

export function ItemsList() {
  const [selectedItem, setSelectedItem] = useState<MarketingItem | null>(null);
  const [activeTab, setActiveTab] = useState<"blog" | "sns">("blog");

  // ESC key handler
  useEffect(() => {
    if (!selectedItem) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedItem(null);
      }
    };
    
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedItem]);

  // STUB: Hard-coded items
  const items: MarketingItem[] = Array.from({ length: 15 }, (_, i) => ({
    id: `item-${i + 1}`,
    title: `마케팅 아이템 #${i + 1}`,
    status: i < 8 ? ("completed" as const) : ("scheduled" as const),
    scheduledDate: i < 8 ? `1월 ${i + 1}일` : `1월 ${i + 9}일`,
    blogRules: {
      minChars: 800,
      keywordCount: 5,
    },
    snsRules: {
      maxLength: 280,
      hashtags: ["#마케팅", "#자동화", "#블로그"],
    },
    imageKeywords: ["비즈니스", "성장", "디지털마케팅"],
  }));

  return (
    <>
      <SectionShell title="이번 달 아이템 (15개)">
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition hover:bg-muted"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  발송 예정: {item.scheduledDate}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  item.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {item.status === "completed" ? "발송 완료" : "예정"}
              </span>
            </button>
          ))}
        </div>
      </SectionShell>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground"
              aria-label="닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Header */}
            <div className="border-b border-border p-6">
              <h2 className="text-xl font-bold text-foreground pr-8">{selectedItem.title}</h2>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    selectedItem.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {selectedItem.status === "completed" ? "발송 완료" : "예정"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {selectedItem.scheduledDate}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border px-6">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("blog")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === "blog"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  블로그용
                </button>
                <button
                  onClick={() => setActiveTab("sns")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                    activeTab === "sns"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  SNS용
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 space-y-6">
              {activeTab === "blog" ? (
                <>
                  {/* Blog Rules Box */}
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">작성 규칙</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• 최소 글자 수: {selectedItem.blogRules.minChars}자</p>
                      <p>• 키워드 반복: 최소 {selectedItem.blogRules.keywordCount}회</p>
                      <p>• 이미지 키워드: {selectedItem.imageKeywords.join(", ")}</p>
                    </div>
                  </div>

                  {/* Blog Draft Content */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">초안 (더미)</h3>
                    <div className="space-y-4 text-sm leading-relaxed text-foreground">
                      <h4 className="text-base font-bold">
                        {selectedItem.title}: 효과적인 디지털 마케팅 전략
                      </h4>
                      <p>
                        디지털 마케팅은 현대 비즈니스에서 필수적인 요소입니다. 
                        이번 글에서는 {selectedItem.imageKeywords[0]}를 중심으로 한 
                        효과적인 마케팅 전략을 소개합니다.
                      </p>
                      <p>
                        첫 번째로, 타겟 고객을 명확히 정의하는 것이 중요합니다. 
                        고객의 니즈를 파악하고 그에 맞는 콘텐츠를 제공해야 합니다.
                      </p>
                      <p>
                        두 번째로, 일관된 브랜드 메시지를 유지하세요. 
                        모든 채널에서 통일된 목소리를 내는 것이 신뢰를 구축합니다.
                      </p>
                      <p>
                        세 번째로, 데이터 기반 의사결정을 실천하세요. 
                        분석 도구를 활용하여 캠페인 성과를 측정하고 개선합니다.
                      </p>
                      <p>
                        네 번째로, 콘텐츠 마케팅에 집중하세요. 
                        가치 있는 정보를 제공하면 자연스럽게 고객이 모입니다.
                      </p>
                      <p>
                        마지막으로, 지속적인 실험과 최적화가 필요합니다. 
                        시장은 계속 변하므로 유연하게 대응해야 합니다.
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        (읽기 전용: 팀 멤버는 조회만 가능합니다)
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* SNS Rules Box */}
                  <div className="rounded-lg bg-muted p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">작성 규칙</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• 최대 길이: {selectedItem.snsRules.maxLength}자</p>
                      <p>• 해시태그: {selectedItem.snsRules.hashtags.join(", ")}</p>
                    </div>
                  </div>

                  {/* SNS Draft Content */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">초안 (더미)</h3>
                    <div className="space-y-4 text-sm leading-relaxed text-foreground">
                      <div className="space-y-2">
                        <p>🚀 {selectedItem.title}로 비즈니스를 성장시키세요!</p>
                        <p>✨ 효과적인 전략으로 고객과 소통하고</p>
                        <p>📈 데이터 기반 의사결정으로 성과를 극대화하세요</p>
                        <p>💡 지금 바로 시작해보세요!</p>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {selectedItem.snsRules.hashtags.map((tag, idx) => (
                          <span key={idx} className="text-blue-600">
                            {tag}
                          </span>
                        ))}
                        <span className="text-blue-600">#디지털전환</span>
                        <span className="text-blue-600">#비즈니스성장</span>
                        <span className="text-blue-600">#콘텐츠마케팅</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic pt-2">
                        (읽기 전용: 팀 멤버는 조회만 가능합니다)
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Image Placeholders */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">무료 이미지 (2장)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="aspect-video rounded-lg border border-border bg-muted flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mx-auto mb-2"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p className="text-sm">무료 이미지 1</p>
                    </div>
                  </div>
                  <div className="aspect-video rounded-lg border border-border bg-muted flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mx-auto mb-2"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p className="text-sm">무료 이미지 2</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  • 워터마크 자동 적용 (우측 하단)
                  <br />
                  • 로고 오버레이 (투명도 20%)
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-6">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
