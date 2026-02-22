"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import { Sparkles, Clock, Users2, TestTube2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AutoPostingClient() {
  const router = useRouter();
  const { activeWorkspace, loading, error } = useWorkspace();

  // Tab state
  const [activeTab, setActiveTab] = useState<"personal" | "global">("personal");

  // Form state
  const [brandOneLiner, setBrandOneLiner] = useState("");
  const [tone, setTone] = useState<"professional" | "casual" | "aggressive">("professional");
  const [mustInclude, setMustInclude] = useState("");
  const [resultEmail, setResultEmail] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Test run state
  const [testRunning, setTestRunning] = useState(false);
  const [lastEventLogId, setLastEventLogId] = useState<string | null>(null);

  // 워크스페이스 정보
  const workspaceName = activeWorkspace?.workspace?.name ?? "워크스페이스";
  const workspaceType = activeWorkspace?.workspaceType ?? "personal";
  const role = activeWorkspace?.role ?? "member";
  const isPersonal = workspaceType === "personal";
  const isTeam = workspaceType === "company";

  // 권한 판별
  const isPersonalWorkspace = isPersonal;
  const isOwner = isPersonalWorkspace || role === "owner";
  const canEditGlobal = isOwner;
  const canEditPersonal = true; // 로그인 사용자는 모두 개인 설정 편집 가능

  // 3단 상태 판별
  const hasGlobalSetup = brandOneLiner.trim().length > 0 && tone.length > 0;
  const hasMonthlyItems = false; // TODO: 실제 API 연동 시 서버에서 가져온 아이템 개수로 판단

  const handleStartAutoPosting = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleNavigateToBilling = () => {
    router.push("/kr/workspace/billing");
  };

  const handleTestRun = async (forceFail: boolean) => {
    if (!activeWorkspace?.workspace?.id) {
      alert("워크스페이스 정보가 없습니다.");
      return;
    }

    setTestRunning(true);
    setLastEventLogId(null);

    try {
      const res = await fetch("/api/workspace/autoposting/test-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: activeWorkspace.workspace.id,
          force_fail: forceFail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`테스트 실패: ${data.error || "알 수 없는 오류"}`);
        return;
      }

      if (data.event_log_id) {
        setLastEventLogId(data.event_log_id);
      }

      const statusText = forceFail ? "실패 (의도적)" : "성공";
      alert(`테스트 완료: ${statusText}\nevent_log_id: ${data.event_log_id}`);
    } catch (err) {
      console.error("[TestRun] Error:", err);
      alert("테스트 중 오류 발생");
    } finally {
      setTestRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 md:px-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          오류가 발생했습니다: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
      {/* Toast */}
      {showToast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
          <div className="rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-3 text-sm font-medium text-slate-100 shadow-lg backdrop-blur-md">
            결제 후 자동 실행됩니다
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">자동 포스팅</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <span>{workspaceName}</span>
          <span>·</span>
          <span>자동 포스팅</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          2일에 한 번, 브랜드 톤에 맞춘 홍보 콘텐츠를 자동으로 생성해드립니다.
        </p>
      </div>

      {/* Dev Test Section */}
      <div className="mb-8 rounded-lg border-2 border-dashed border-yellow-300 bg-yellow-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <TestTube2 className="h-5 w-5 text-yellow-700" />
          <h2 className="text-sm font-bold text-yellow-900">개발 테스트 (event_logs 검증용)</h2>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => handleTestRun(false)}
            disabled={testRunning}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testRunning ? "실행 중..." : "Test Run (Success)"}
          </button>
          <button
            onClick={() => handleTestRun(true)}
            disabled={testRunning}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {testRunning ? "실행 중..." : "Test Run (Fail)"}
          </button>
        </div>
        {lastEventLogId && (
          <div className="rounded bg-white px-3 py-2 text-xs font-mono text-slate-700">
            event_log_id: {lastEventLogId}
          </div>
        )}
      </div>

      {/* Value Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">자동 생성</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                홍보 문구 · 해시태그 자동 생성
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">정기 발송</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                2일 1회 이메일로 전달
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">팀 기준 관리</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                팀 워크스페이스 기준으로 콘텐츠 관리
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form with Tabs */}
      <div className="mb-8 rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">설정</h2>

        <Tabs defaultValue="personal" value={activeTab} onValueChange={(val) => setActiveTab(val as "personal" | "global")}>
          <TabsList className="mb-6">
            <TabsTrigger value="personal">개인 설정</TabsTrigger>
            <TabsTrigger value="global">전체 설정</TabsTrigger>
          </TabsList>

          {/* 개인 설정 탭 */}
          <TabsContent value="personal">
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              내 이메일/내 워터마크 문구를 관리합니다.
            </p>

            <div className="space-y-5">
              {/* Result email */}
              <div>
                <label htmlFor="resultEmail" className="block text-sm font-medium text-foreground mb-2">
                  결과 수신 이메일
                </label>
                <input
                  id="resultEmail"
                  type="email"
                  value={resultEmail}
                  onChange={(e) => setResultEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={!canEditPersonal}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Personal watermark / promotion phrase placeholder */}
              <div>
                <label htmlFor="personalWatermark" className="block text-sm font-medium text-foreground mb-2">
                  워터마크/홍보 문구 (개인)
                </label>
                <input
                  id="personalWatermark"
                  type="text"
                  placeholder="예: 문의는 이메일로 주세요"
                  disabled={!canEditPersonal}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Primary button */}
              <button
                onClick={handleStartAutoPosting}
                className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
              >
                자동 포스팅 시작하기
              </button>
            </div>
          </TabsContent>

          {/* 전체 설정 탭 */}
          <TabsContent value="global">
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              팀 공통 브랜드/톤/필수 문구를 관리합니다. (관리자 전용)
            </p>

            {/* Member read-only 안내 */}
            {!canEditGlobal && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                팀 워크스페이스의 전체 설정은 관리자만 수정할 수 있습니다.
              </div>
            )}

            <div className="space-y-5">
              {/* Brand one-liner */}
              <div>
                <label htmlFor="brandOneLiner" className="block text-sm font-medium text-foreground mb-2">
                  브랜드/서비스 한 줄 소개
                </label>
                <input
                  id="brandOneLiner"
                  type="text"
                  value={brandOneLiner}
                  onChange={(e) => setBrandOneLiner(e.target.value)}
                  placeholder="예: AI 기반 마케팅 자동화 플랫폼"
                  disabled={!canEditGlobal}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Tone select */}
              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-foreground mb-2">
                  톤 & 스타일
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as "professional" | "casual" | "aggressive")}
                  disabled={!canEditGlobal}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="professional">전문적</option>
                  <option value="casual">캐주얼</option>
                  <option value="aggressive">공격적</option>
                </select>
              </div>

              {/* Must-include phrase */}
              <div>
                <label htmlFor="mustInclude" className="block text-sm font-medium text-foreground mb-2">
                  필수 포함 문구 (선택)
                </label>
                <input
                  id="mustInclude"
                  type="text"
                  value={mustInclude}
                  onChange={(e) => setMustInclude(e.target.value)}
                  placeholder="예: 함께 성장하는 파트너"
                  disabled={!canEditGlobal}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Primary button */}
              <button
                onClick={canEditGlobal ? handleStartAutoPosting : () => alert("관리자만 전체 설정을 저장할 수 있습니다.")}
                disabled={!canEditGlobal}
                className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                자동 포스팅 시작하기
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 3단 상태 분기 UI: 이번 달 아이템 영역 */}
      <div className="mb-8">
        {!hasGlobalSetup ? (
          // 상태 A) 전체 설정 미입력
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-bold text-amber-900 mb-2">
              자동 포스팅을 시작하려면 전체 설정이 필요합니다
            </h2>
            <p className="text-sm text-amber-800 leading-relaxed mb-4">
              이 설정은 이번 달 아이템 생성 기준이 됩니다.
            </p>
            <button
              onClick={() => setActiveTab("global")}
              disabled={!canEditGlobal}
              className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canEditGlobal ? "전체 설정 입력하기" : "관리자만 설정할 수 있습니다"}
            </button>
          </div>
        ) : !hasMonthlyItems ? (
          // 상태 B) 전체 설정 입력됨 + 아이템 없음
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-2">
              이번 달 아이템이 아직 없습니다
            </h2>
            <p className="text-sm text-blue-800 leading-relaxed mb-4">
              전체 설정을 바탕으로 15개 아이템을 생성합니다.
            </p>
            <button
              onClick={canEditGlobal ? handleStartAutoPosting : () => alert("관리자만 아이템을 생성할 수 있습니다.")}
              disabled={!canEditGlobal}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canEditGlobal ? "이번 달 아이템 생성하기 (15개)" : "관리자만 생성할 수 있습니다"}
            </button>
          </div>
        ) : (
          // 상태 C) 운영 중
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">이번 달 아이템</h2>
              <span className="text-xs text-muted-foreground">운영 중</span>
            </div>
            <div className="space-y-2">
              {/* 샘플 5개 아이템 (실제로는 서버에서 가져온 데이터) */}
              {[
                { title: "겨울 여행지 추천 TOP 5", status: "발송완료", date: "1월 11일" },
                { title: "주말 특별 이벤트 안내", status: "발송완료", date: "1월 9일" },
                { title: "신상품 출시 소식", status: "발송완료", date: "1월 7일" },
                { title: "고객 리뷰 수집 캠페인", status: "예정", date: "1월 15일" },
                { title: "이번 주 추천 콘텐츠", status: "예정", date: "1월 17일" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <span
                    className={`text-xs ml-2 px-2 py-1 rounded ${
                      item.status === "발송완료"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            <button
              className="mt-4 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              전체 보기
            </button>
          </div>
        )}
      </div>

      {/* Subscription guidance block */}
      <div className="rounded-lg border border-border bg-card p-6">
        {isPersonal ? (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              개인 워크스페이스에서는 자동 생성 결과를 미리보기로만 제공합니다.
              <br />
              정기 발송을 원하시면 구독이 필요합니다.
            </p>
            <button
              onClick={handleNavigateToBilling}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              개인 플랜 구독하기
            </button>
          </>
        ) : isTeam ? (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              팀 자동 포스팅은 팀 플랜에서 제공됩니다.
              <br />
              팀원 전체 기준으로 콘텐츠가 관리됩니다.
            </p>
            <button
              onClick={handleNavigateToBilling}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
              팀 플랜 구독 및 설정
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
