"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/_providers/auth-provider";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import {
  ensurePersonalWorkspace,
  getActiveWorkspace,
  type ActiveWorkspace,
} from "@/lib/workspace/getActiveWorkspace";
import { TrendingUp, Mail, Calendar, CheckCircle2, Sparkles, Send, Copy, ChevronRight } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// System admin user IDs (temporary hardcoded allowlist)
const ADMIN_USER_IDS: string[] = [
  // Add admin user IDs here when needed
  // Example: "00000000-0000-0000-0000-000000000000"
];

type UserRole = "system_admin" | "personal_owner" | "team_admin" | "team_member" | "guest";

function calculateUserRole(
  user: any | null,
  activeWorkspace: ActiveWorkspace | null
): UserRole {
  // Guest: not logged in
  if (!user) {
    return "guest";
  }

  // System admin: hardcoded allowlist
  if (ADMIN_USER_IDS.includes(user.id)) {
    return "system_admin";
  }

  // No workspace: treat as guest
  if (!activeWorkspace) {
    return "guest";
  }

  const { workspaceType, role } = activeWorkspace;

  // Personal workspace: owner
  if (workspaceType === "personal") {
    return "personal_owner";
  }

  // Team/company workspace: check role
  if (workspaceType === "company" || workspaceType === "business") {
    if (role === "owner" || role === "admin") {
      return "team_admin";
    }
    return "team_member";
  }

  // Unknown workspace type: fallback to guest
  return "guest";
}

function SearchParamsHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    activeWorkspace: providerWorkspace, 
    loading: workspaceLoading,
    switchWorkspace,
    workspaces 
  } = useWorkspace();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle next param redirect: if workspace is loaded and next param exists, redirect to that path
  useEffect(() => {
    if (!mounted) return;
    
    const nextParam = searchParams?.get("next");
    if (nextParam && !workspaceLoading && providerWorkspace) {
      // Workspace is ready, redirect to the requested path
      const targetPath = decodeURIComponent(nextParam);
      // Preserve workspace_id if present
      const wsParam = searchParams?.get("workspace_id");
      const finalPath = wsParam 
        ? `${targetPath}${targetPath.includes('?') ? '&' : '?'}workspace_id=${wsParam}`
        : targetPath;
      router.replace(finalPath);
    }
  }, [mounted, searchParams, workspaceLoading, providerWorkspace, router]);

  // Handle team_created=1 redirect: refresh and switch to newest company workspace
  useEffect(() => {
    if (!mounted) return;
    
    const teamCreated = searchParams?.get("team_created");
    if (teamCreated === "1" && !workspaceLoading && workspaces.length > 0) {
      // Find the newest company workspace (most recent created_at or highest in list)
      const companyWorkspaces = workspaces.filter(ws => ws.type === "company");
      if (companyWorkspaces.length > 0) {
        const newestTeamWorkspace = companyWorkspaces[0]; // Assuming workspaces are sorted by creation date
        
        // Remove query param
        router.replace("/kr/workspace", { scroll: false });
        
        // Switch to the new team workspace
        switchWorkspace(newestTeamWorkspace.id);
      }
    }
  }, [mounted, searchParams, workspaceLoading, workspaces, router, switchWorkspace]);

  return null;
}

function WorkspaceDashboardContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { 
    activeWorkspace: providerWorkspace, 
    entitlement, 
    loading: workspaceLoading,
    refreshWorkspace,
    switchWorkspace,
    workspaces 
  } = useWorkspace();
  const [workspace, setWorkspace] = useState<ActiveWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapDone, setBootstrapDone] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [bootstrappedUserId, setBootstrappedUserId] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [contentItems, setContentItems] = useState<Array<{
    id: string;
    topic: string;
    blog_content: string | null;
    sns_content: string | null;
    image_urls: string[] | null;
    generated_at: string | null;
    status: string;
  }>>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/kr/login?next=/kr/workspace");
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) {
      setBootstrappedUserId(null);
      setBootstrapDone(false);
      setBootstrapError(null);
      return;
    }

    if (user.id !== bootstrappedUserId) {
      setBootstrappedUserId(user.id);
      setBootstrapDone(false);
      setBootstrapError(null);
    }
  }, [user, bootstrappedUserId]);

  useEffect(() => {
    if (authLoading || !user || bootstrapDone || isBootstrapping) return;

    const runBootstrap = async () => {
      setIsBootstrapping(true);
      try {
        await ensurePersonalWorkspace(user);
        setBootstrapError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "알 수 없는 오류";
        setBootstrapError(message);
      } finally {
        setIsBootstrapping(false);
        setBootstrapDone(true);
      }
    };

    runBootstrap();
  }, [authLoading, user, bootstrapDone, isBootstrapping]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      if (authLoading) return;
      if (isBootstrapping || !bootstrapDone) return;
      const userId = user?.id;
      if (!userId) return;

      try {
        setLoading(true);
        setWorkspaceError(null);
        const activeWorkspace = await getActiveWorkspace(user);
        if (!cancelled) {
          setWorkspace(activeWorkspace);
        }
      } catch (err) {
        console.error("[Workspace] Failed to load workspace:", {
          message: (err as any)?.message,
          details: (err as any)?.details,
          hint: (err as any)?.hint,
          code: (err as any)?.code,
          raw: err,
          json: (() => {
            try {
              return JSON.stringify(err);
            } catch {
              return "[unstringifiable]";
            }
          })(),
        });
        if (cancelled) return;
        const typedErr = err as {
          code?: string;
        };
        const code = typedErr.code;
        if (code === "NO_AUTH_USER" || code === "NO_SESSION") {
          return;
        }
        setWorkspaceError("개인 워크스페이스 초기화 중 오류가 발생했습니다.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, isBootstrapping, bootstrapDone]);

  // Fetch real credit balance
  useEffect(() => {
    const wsId = (providerWorkspace || workspace)?.workspace?.id;
    if (!wsId) return;

    fetch(`/api/credits/balance?workspace_id=${wsId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.balance != null) setCreditBalance(data.balance); })
      .catch(() => {});
  }, [providerWorkspace, workspace]);

  // Fetch recent content items
  useEffect(() => {
    const wsId = (providerWorkspace || workspace)?.workspace?.id;
    if (!wsId) return;

    fetch(`/api/autoposting/items?workspace_id=${wsId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.items) setContentItems(data.items.slice(0, 3)); })
      .catch(() => {});
  }, [providerWorkspace, workspace]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // Redirect to onboarding if brand_name not set (personal workspace only)
  useEffect(() => {
    const wsId = (providerWorkspace || workspace)?.workspace?.id;
    const wsType = (providerWorkspace || workspace)?.workspaceType;
    if (!wsId || wsType !== "personal") return;

    fetch(`/api/workspace/manager-settings?workspace_id=${wsId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.settings?.brand_name) {
          router.replace("/kr/workspace/onboarding");
        }
      })
      .catch(() => {});
  }, [providerWorkspace, workspace, router]);

  // Show loading state
  if (authLoading || loading || workspaceLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Show error if no user (shouldn't happen due to redirect)
  if (!user) {
    return null;
  }

  // Use provider workspace if available, fallback to local state
  const effectiveWorkspace = providerWorkspace || workspace;

  // Show error if no workspace
  if (!effectiveWorkspace) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">
            워크스페이스를 찾을 수 없습니다
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            워크스페이스 생성 기능이 곧 추가됩니다.
          </p>
          {bootstrapError && (
            <p className="mt-3 text-sm text-red-600">
              개인 워크스페이스 초기화 중 오류가 발생했습니다: {bootstrapError}
            </p>
          )}
        </div>
      </div>
    );
  }

  const { workspace: ws, workspaceType } = effectiveWorkspace;

  const isCompanyWorkspace = workspaceType === "company";
  const isPersonalWorkspace = workspaceType === "personal";

  // Calculate user role
  const userRole = calculateUserRole(user, effectiveWorkspace);
  const isAdmin = userRole === "system_admin" || userRole === "team_admin" || userRole === "personal_owner";
  const canManage = isAdmin;

  // Plan display name
  const planName = entitlement.planKey === "pro"
    ? "프로"
    : entitlement.planKey === "starter"
    ? "스타터"
    : "무료";

  // Both company and personal workspaces show the same dashboard UI
  const shouldShowLock = !isCompanyWorkspace && !isPersonalWorkspace;

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>
      <div className="relative h-full">
        {/* Lock overlay - only for unknown workspace types */}
        {shouldShowLock && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-lg">
            <div className="mb-4 text-4xl">🔒</div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              비즈니스 플랜 전용 기능
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              워크스페이스 대시보드는 비즈니스 플랜에서만 사용할 수 있습니다.
            </p>
            <button className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
              비즈니스 플랜으로 업그레이드
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="mx-auto max-w-[1100px] p-6 lg:p-8">
        {bootstrapError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            개인 워크스페이스 준비 중 오류가 발생했습니다: {bootstrapError}
          </div>
        )}
        {workspaceError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {workspaceError}
          </div>
        )}
        
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {ws.name} · 이번 주 영업/마케팅 현황
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={<Send className="h-5 w-5 text-blue-500" />}
            title={entitlement.isActive ? "자동 포스팅" : "미활성"}
            description={entitlement.isActive ? "구독 활성 상태" : "구독을 시작해보세요"}
          />
          <KPICard
            icon={<Calendar className="h-5 w-5 text-emerald-500" />}
            title={entitlement.currentPeriodEnd
              ? new Date(entitlement.currentPeriodEnd).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })
              : "—"}
            description={entitlement.currentPeriodEnd ? "구독 만료일" : "구독 없음"}
          />
          <KPICard
            icon={<CheckCircle2 className="h-5 w-5 text-amber-500" />}
            title={creditBalance != null ? `${creditBalance.toLocaleString()} P` : "— P"}
            description="크레딧 잔액"
            highlighted
          />
          <KPICard
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
            title={planName}
            description="현재 플랜"
          />
        </div>

        {/* 이번 주 액션 */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">이번 주 액션</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <ActionCard
              icon={<Sparkles className="h-5 w-5" />}
              title="이번달 아이템 생성하기"
              href="/kr/workspace/marketing"
              disabled={!canManage}
            />
            <ActionCard
              icon={<Mail className="h-5 w-5" />}
              title="내 글 톤 설정하기"
              href="/kr/workspace/marketing#settings"
              disabled={!canManage}
            />
            <ActionCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="랜딩페이지 만들기"
              href="/kr/workspace/landing"
              disabled={!canManage}
            />
          </div>
        </div>

        {/* 이번 달 홍보 콘텐츠 */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">이번 달 홍보 콘텐츠</h2>
            <Link
              href="/kr/workspace/inbox"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              전체 보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {contentItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                아직 생성된 콘텐츠가 없습니다.
              </p>
              <Link
                href="/kr/workspace/marketing/auto-posting"
                className="mt-3 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                콘텐츠 생성하기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {contentItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <p className="mb-3 text-sm font-medium text-foreground line-clamp-2">
                    {item.topic}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(item.blog_content ?? "", `blog-${item.id}`)}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedId === `blog-${item.id}` ? "복사됨!" : "블로그 복사"}
                    </button>
                    <button
                      onClick={() => handleCopy(item.sns_content ?? "", `sns-${item.id}`)}
                      className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copiedId === `sns-${item.id}` ? "복사됨!" : "SNS 복사"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 운영정보 요약 */}
        <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          플랜 {planName}
          {creditBalance != null && ` · 크레딧 ${creditBalance.toLocaleString()}P`}
          {isCompanyWorkspace && " · 팀 워크스페이스"}
        </div>
      </div>
      </div>
    </>
  );
}

// KPI Card Component
function KPICard({
  icon,
  title,
  description,
  highlighted = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlighted
          ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        {icon}
      </div>
      <div className="text-lg font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

// Action Card Component
function ActionCard({
  icon,
  title,
  href,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  disabled?: boolean;
}) {
  const content = (
    <div
      className={`relative flex h-32 flex-col items-center justify-center rounded-xl border p-6 text-center transition ${
        disabled
          ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
          : "border-border bg-card hover:border-primary hover:shadow-md"
      }`}
    >
      {disabled && (
        <span className="absolute right-2 top-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          관리자만 가능
        </span>
      )}
      <div className="mb-2">{icon}</div>
      <div className="text-sm font-medium text-foreground">{title}</div>
    </div>
  );

  return disabled ? content : <Link href={href}>{content}</Link>;
}


export default function WorkspaceDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <WorkspaceDashboardContent />
    </Suspense>
  );
}

