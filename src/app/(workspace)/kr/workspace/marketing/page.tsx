/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useMemo, useState } from "react";
import { useWorkspace } from "@/app/_providers/workspace-provider";

// ========================================
// Types
// ========================================
type TabType = "instant" | "history" | "settings";

type HistoryItemType = "regular" | "instant";
type HistoryItemStatus = "success" | "failed";

interface HistoryItem {
  id: string;
  date: string;
  time: string;
  type: HistoryItemType;
  title: string;
  status: HistoryItemStatus;
  blogSnippet?: string;
  snsSnippet?: string;
  errorMessage?: string;
}

// ========================================
// Main Component
// ========================================
export default function MarketingAutomationPage() {
  const { activeWorkspace, loading } = useWorkspace();

  // ---- Role / workspace guards (UI only)
  const workspaceType = activeWorkspace?.workspaceType ?? "personal";
  const role = activeWorkspace?.role ?? "member";

  const isTeamWorkspace = workspaceType === "company";
  const isPersonalWorkspace = workspaceType === "personal";
  const isAdminCapable = useMemo(() => {
    if (isPersonalWorkspace) return true;
    if (isTeamWorkspace && role === "owner") return true;
    return false;
  }, [isPersonalWorkspace, isTeamWorkspace, role]);

  // ---- Tab state (3 tabs)
  const [activeTab, setActiveTab] = useState<TabType>("instant");

  // ---- Mock role for settings (can be 'member' or 'owner')
  const mockRole: "member" | "owner" = role === "owner" ? "owner" : "member";

  // ---- Instant Send State
  const [availableTokens] = useState(7);
  const [selectedItem, setSelectedItem] = useState("1");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // ---- History State
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([
    {
      id: "h8",
      date: "2026-01-11",
      time: "14:20",
      type: "regular",
      title: "주간 블로그 포스팅 #2",
      status: "success",
      blogSnippet: "이번 주 AI 트렌드를 정리했습니다...",
      snsSnippet: "AI 트렌드 요약 🚀 #AI #블로그",
    },
    {
      id: "h7",
      date: "2026-01-10",
      time: "09:15",
      type: "instant",
      title: "긴급 홍보 - 신제품 론칭",
      status: "success",
      blogSnippet: "드디어 신제품을 공개합니다...",
      snsSnippet: "신제품 공개! 🎉 #신제품 #론칭",
    },
    {
      id: "h6",
      date: "2026-01-09",
      time: "18:30",
      type: "regular",
      title: "주간 블로그 포스팅 #1",
      status: "failed",
      errorMessage: "이메일 발송 실패 (SMTP 오류)",
    },
    {
      id: "h5",
      date: "2026-01-08",
      time: "11:00",
      type: "instant",
      title: "이벤트 공지 - 신규 가입 할인",
      status: "success",
      blogSnippet: "신규 가입 시 20% 할인...",
      snsSnippet: "신규 가입 할인 이벤트 🎁 #할인 #이벤트",
    },
    {
      id: "h4",
      date: "2026-01-07",
      time: "16:45",
      type: "regular",
      title: "월간 리뷰 - 12월 결산",
      status: "success",
      blogSnippet: "12월 한 달을 돌아봅니다...",
      snsSnippet: "12월 결산 리뷰 📊 #월간리뷰",
    },
    {
      id: "h3",
      date: "2026-01-06",
      time: "10:30",
      type: "instant",
      title: "고객 후기 공유",
      status: "success",
      blogSnippet: "고객님들의 따뜻한 후기를 공유합니다...",
      snsSnippet: "고객 후기 감사합니다 💙 #고객후기",
    },
    {
      id: "h2",
      date: "2026-01-05",
      time: "14:00",
      type: "regular",
      title: "주간 뉴스레터 #52",
      status: "success",
      blogSnippet: "이번 주 업계 뉴스를 정리했습니다...",
      snsSnippet: "주간 뉴스레터 발송 📰 #뉴스레터",
    },
    {
      id: "h1",
      date: "2026-01-04",
      time: "09:00",
      type: "instant",
      title: "신년 인사",
      status: "success",
      blogSnippet: "새해 복 많이 받으세요!",
      snsSnippet: "2026년 새해 인사 🎊 #새해 #인사",
    },
  ]);

  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | HistoryItemType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | HistoryItemStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ---- Settings State
  const [companyRole, setCompanyRole] = useState("");

  // ---- Handlers
  const handleInstantSend = () => {
    if (!recipientEmail.trim()) {
      setToastMessage("이메일 주소를 입력해주세요.");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    const newItem: HistoryItem = {
      id: `h-new-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      type: "instant",
      title: `즉시 발송 - 아이템 ${selectedItem}`,
      status: "success",
      blogSnippet: `아이템 ${selectedItem}에 대한 블로그 콘텐츠가 생성되었습니다...`,
      snsSnippet: `아이템 ${selectedItem} SNS 요약 ✨`,
    };

    setHistoryItems((prev) => [newItem, ...prev]);
    setToastMessage("즉시 발송 요청이 기록되었습니다 (mock).");
    setTimeout(() => setToastMessage(""), 3000);
  };

  const toggleExpandHistory = (id: string) => {
    setExpandedHistoryId((prev) => (prev === id ? null : id));
  };

  // Filtered history
  const filteredHistory = historyItems.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    return true;
  });

  if (loading) {
    return (
      <div className="w-full px-6 py-8">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-24 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="w-full px-6 py-8">
        <h1 className="text-xl font-semibold">자동 포스팅</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          워크스페이스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">자동 포스팅</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            이메일로 블로그 글 + SNS 글을 받아보고 그대로 올리면 됩니다.
          </p>
        </div>

        {/* Tabs Navigation (3 tabs) */}
        <div className="mb-8 border-b border-border">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("instant")}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "instant"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              즉시 발송
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              히스토리
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              전체 설정
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "instant" && (
          <div className="space-y-6">
            {/* Toast Message */}
            {toastMessage && (
              <div className="rounded-lg border border-green-500/50 bg-green-50 p-4 text-sm text-green-900 dark:bg-green-950 dark:text-green-100">
                {toastMessage}
              </div>
            )}

            {/* Instant Send Card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">즉시 발송</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    정기 발송 외에 바로 1건을 생성해 이메일로 받습니다.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                  <span className="text-sm text-muted-foreground">사용 가능 토큰</span>
                  <span className="text-lg font-semibold text-foreground">{availableTokens}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Item Select */}
                <div>
                  <label className="mb-2 block text-sm font-medium">아이템 선택</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={String(num)}>
                        아이템 {num}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Channel (fixed) */}
                <div>
                  <label className="mb-2 block text-sm font-medium">채널</label>
                  <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                    Blog + SNS
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="mb-2 block text-sm font-medium">받을 이메일</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="example@domain.com"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleInstantSend}
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  즉시 발송하기 (토큰 1 사용)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Type Filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium">유형</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">전체</option>
                    <option value="regular">정기</option>
                    <option value="instant">즉시</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium">상태</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">전체</option>
                    <option value="success">성공</option>
                    <option value="failed">실패</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="mb-2 block text-sm font-medium">제목 검색</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="제목으로 검색..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
                </div>
              ) : (
                filteredHistory.map((item) => {
                  const isExpanded = expandedHistoryId === item.id;
                  return (
                    <div key={item.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {item.date} {item.time}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                item.type === "regular"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              }`}
                            >
                              {item.type === "regular" ? "정기" : "즉시"}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                item.status === "success"
                                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                                  : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              }`}
                            >
                              {item.status === "success" ? "성공" : "실패"}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium">{item.title}</h3>
                        </div>
                        <button
                          onClick={() => toggleExpandHistory(item.id)}
                          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                        >
                          {isExpanded ? "닫기" : "상세"}
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4 border-t border-border pt-4">
                          {item.status === "success" ? (
                            <>
                              {/* Blog Snippet */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                  블로그 스니펫
                                </h4>
                                <p className="rounded-md bg-muted p-3 text-sm leading-relaxed">
                                  {item.blogSnippet}
                                </p>
                              </div>

                              {/* SNS Snippet */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                  SNS 스니펫
                                </h4>
                                <p className="rounded-md bg-muted p-3 text-sm leading-relaxed">
                                  {item.snsSnippet}
                                </p>
                              </div>

                              {/* Image Placeholders */}
                              <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                  생성 이미지
                                </h4>
                                <div className="flex gap-3">
                                  <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-border bg-muted text-xs text-muted-foreground">
                                    이미지 1
                                  </div>
                                  <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-border bg-muted text-xs text-muted-foreground">
                                    이미지 2
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="rounded-md bg-red-50 p-3 dark:bg-red-950">
                              <h4 className="mb-1 text-xs font-semibold uppercase text-red-700 dark:text-red-300">
                                오류 메시지
                              </h4>
                              <p className="text-sm text-red-900 dark:text-red-100">
                                {item.errorMessage}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Permission Notice */}
            {mockRole !== "owner" && (
              <div className="rounded-lg border border-orange-500/50 bg-orange-50 p-4 dark:bg-orange-950">
                <div className="flex items-start gap-2">
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                    관리자만 가능
                  </span>
                  <p className="text-sm text-orange-900 dark:text-orange-100">
                    팀 워크스페이스에서는 관리자만 수정할 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* Settings Card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">전체 설정</h2>

              <div className="space-y-6">
                {/* Company Role */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    회사 롤 (Brand Role)
                  </label>
                  <textarea
                    value={companyRole}
                    onChange={(e) => setCompanyRole(e.target.value)}
                    disabled={mockRole !== "owner"}
                    placeholder="회사/브랜드의 전반적인 정보를 입력하세요..."
                    rows={5}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Logo Upload Placeholder */}
                <div>
                  <label className="mb-2 block text-sm font-medium">로고 업로드</label>
                  <div
                    className={`flex h-32 items-center justify-center rounded-md border-2 border-dashed border-border bg-muted text-sm text-muted-foreground ${
                      mockRole !== "owner" ? "opacity-50" : ""
                    }`}
                  >
                    로고 업로드 UI (준비 중)
                  </div>
                </div>

                {/* Tone Selector Placeholder */}
                <div>
                  <label className="mb-2 block text-sm font-medium">톤 & 스타일</label>
                  <select
                    disabled={mockRole !== "owner"}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option>기본 (친근함)</option>
                    <option>전문적</option>
                    <option>캐주얼</option>
                  </select>
                </div>

                {/* Save Button */}
                {mockRole === "owner" && (
                  <button className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    저장하기
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
