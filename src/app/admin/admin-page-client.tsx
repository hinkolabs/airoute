"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  MapIcon,
  Languages,
  BookText,
  Wrench,
  ChevronRight,
  FlaskConical,
  Plus,
  ExternalLink,
  Database,
  Bug,
  Globe,
  RefreshCw,
  Sparkles,
  Shield,
  Loader2,
} from "lucide-react";

type Tab = "dashboard" | "routes" | "tools" | "guides" | "tests";

const tabs: { id: Tab; label: string; icon: typeof MapIcon }[] = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "routes", label: "루트", icon: MapIcon },
  { id: "tools", label: "툴", icon: Wrench },
  { id: "guides", label: "가이드", icon: BookText },
  { id: "tests", label: "테스트", icon: FlaskConical },
];

export default function AdminPageClient() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                관리자 대시보드
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                AIROUTE 콘텐츠 관리 시스템
              </p>
            </div>
            <Link
              href="/kr/workspace"
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Workspace로 이동
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "dashboard" && <DashboardTab onNavigate={setActiveTab} />}
        {activeTab === "routes" && <RoutesTab />}
        {activeTab === "tools" && <ToolsTab />}
        {activeTab === "guides" && <GuidesTab />}
        {activeTab === "tests" && <TestsTab />}
      </main>
    </div>
  );
}

/* ─── Dashboard Tab ─── */

type Summary = {
  routes: { total: number; kr: number };
  tools: { total: number; krDone: number; krNone: number };
  guides: { total: number; published: number; draft: number; review: number; en: number; kr: number };
};

function DashboardTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard-summary");
      const json = await res.json();
      if (json.ok) setData(json);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <p className="text-sm text-muted-foreground py-12 text-center">로딩 중...</p>;
  }

  if (!data) {
    return <p className="text-sm text-destructive py-12 text-center">데이터 로드 실패</p>;
  }

  const { routes, tools, guides } = data;
  const routesKrPct = routes.total ? Math.round((routes.kr / routes.total) * 100) : 0;
  const toolsKrPct = tools.total ? Math.round((tools.krDone / tools.total) * 100) : 0;
  const guidesKrPct = guides.en ? Math.round((guides.kr / guides.en) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <TabHeader title="현황 대시보드" description="루트, 툴, 가이드 콘텐츠 현황 한눈에 보기" />
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          새로고침
        </button>
      </div>

      {/* Demo Mode Toggle */}
      <DemoModeToggle />

      {/* Homepage Theme Selector */}
      <HomepageThemeSelector />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <OverviewCard
          title="루트"
          icon={<MapIcon className="h-5 w-5" />}
          accent="blue"
          onClick={() => onNavigate("routes")}
          stats={[
            { label: "전체", value: routes.total },
            { label: "KR 번역", value: routes.kr, color: "green" },
            { label: "미번역", value: routes.total - routes.kr, color: routes.total - routes.kr > 0 ? "red" : undefined },
          ]}
          progress={routesKrPct}
        />
        <OverviewCard
          title="툴"
          icon={<Wrench className="h-5 w-5" />}
          accent="orange"
          onClick={() => onNavigate("tools")}
          stats={[
            { label: "전체", value: tools.total },
            { label: "KR 번역", value: tools.krDone, color: "green" },
            { label: "미번역", value: tools.krNone, color: tools.krNone > 0 ? "red" : undefined },
          ]}
          progress={toolsKrPct}
        />
        <OverviewCard
          title="가이드"
          icon={<BookText className="h-5 w-5" />}
          accent="purple"
          onClick={() => onNavigate("guides")}
          stats={[
            { label: "전체", value: guides.total },
            { label: "EN", value: guides.en },
            { label: "KR", value: guides.kr, color: "green" },
          ]}
          progress={guidesKrPct}
          progressLabel="EN→KR 번역"
          sub={`발행 ${guides.published} · 검토 ${guides.review} · 초안 ${guides.draft}`}
        />
      </div>

      {/* AI Creator Banner */}
      <Link
        href="/admin/ai-creator"
        className="group flex items-center gap-4 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 p-5 transition hover:border-violet-500/50 hover:shadow-md"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground group-hover:text-violet-600">
            AI 콘텐츠 크리에이터
          </h3>
          <p className="text-sm text-muted-foreground">
            프롬프트 하나로 루트 + 가이드 + 툴을 AI가 분석해서 통합 생성
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:text-violet-600" />
      </Link>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">빠른 작업</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickLink href="/admin/ai-creator" label="AI 통합 생성" desc="루트+가이드+툴 한번에" />
          <QuickLink href="/admin/tools" label="툴 관리" desc="등록/수정/삭제/번역" />
          <QuickLink href="/admin/routes" label="루트 관리" desc="등록/수정/삭제" />
          <QuickLink href="/admin/guides" label="가이드 관리" desc="생성/수정/삭제" />
        </div>
      </div>
    </div>
  );
}

function OverviewCard({
  title, icon, accent, stats, progress, progressLabel, sub, onClick,
}: {
  title: string;
  icon: React.ReactNode;
  accent: AccentColor;
  stats: { label: string; value: number; color?: string }[];
  progress: number;
  progressLabel?: string;
  sub?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-5 text-left transition hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={accentText[accent]}>{icon}</div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="mb-3">
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-foreground">{progress}%</span>
          <span className="text-xs text-muted-foreground mb-1">{progressLabel ?? "KR 번역"}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progress === 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-orange-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {stats.map((s, i) => (
          <span key={i} className={s.color === "green" ? "text-green-600" : s.color === "red" ? "text-red-500" : s.color === "yellow" ? "text-yellow-600" : "text-muted-foreground"}>
            {s.label} <strong>{s.value}</strong>
          </span>
        ))}
      </div>
      {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
    </button>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-border bg-card p-3 transition hover:border-primary/40 hover:bg-muted"
    >
      <p className="text-sm font-medium text-foreground group-hover:text-primary">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </Link>
  );
}

/* ─── Shared Components ─── */

type LinkItem = {
  label: string;
  href: string;
  description: string;
  external?: boolean;
};

type AccentColor = "blue" | "green" | "purple" | "orange";

const accentBg: Record<AccentColor, string> = {
  blue: "bg-blue-500/10",
  green: "bg-green-500/10",
  purple: "bg-purple-500/10",
  orange: "bg-orange-500/10",
};

const accentText: Record<AccentColor, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  purple: "text-purple-600 dark:text-purple-400",
  orange: "text-orange-600 dark:text-orange-400",
};

function SectionCard({
  icon,
  title,
  description,
  links,
  accent = "blue",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  links: LinkItem[];
  accent?: AccentColor;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={`px-6 py-4 ${accentBg[accent]}`}>
        <div className="flex items-center gap-3">
          <div className={accentText[accent]}>{icon}</div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {links.map((link, i) =>
          link.external ? (
            <a
              key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-lg border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-muted"
            >
              <div>
                <h4 className="font-medium text-foreground text-sm">
                  {link.label}
                </h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {link.description}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </a>
          ) : (
            <Link
              key={i}
              href={link.href}
              className="group flex items-center justify-between rounded-lg border border-border bg-background p-4 transition hover:border-primary/50 hover:bg-muted"
            >
              <div>
                <h4 className="font-medium text-foreground text-sm">
                  {link.label}
                </h4>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {link.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

function TabHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

/* ─── Tab Contents ─── */

function RoutesTab() {
  return (
    <div className="space-y-6">
      <TabHeader
        title="루트 관리"
        description="루트 등록, 수정, 삭제 및 번역"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard
          icon={<Plus className="h-5 w-5" />}
          title="생성 / 관리"
          description="루트 CRUD 및 마이그레이션"
          accent="blue"
          links={[
            {
              label: "루트 관리 (CRUD)",
              href: "/admin/routes",
              description: "루트 등록, 수정, 삭제 및 목록 관리",
            },
            {
              label: "루트 마이그레이션 (레거시)",
              href: "/admin/routes-migrate",
              description: "하드코딩된 루트 데이터를 DB로 마이그레이션",
            },
          ]}
        />
        <SectionCard
          icon={<Languages className="h-5 w-5" />}
          title="번역"
          description="OpenAI로 루트 자동 번역"
          accent="green"
          links={[
            {
              label: "루트 자동 번역",
              href: "/admin/routes/translate",
              description: "영문 루트를 한글로 번역 (OpenAI gpt-4o-mini)",
            },
          ]}
        />
      </div>
    </div>
  );
}

function ToolsTab() {
  return (
    <div className="space-y-6">
      <TabHeader
        title="툴 관리"
        description="AI 툴 등록, 정보 관리 및 번역"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard
          icon={<Plus className="h-5 w-5" />}
          title="생성 / 등록"
          description="신규 AI 툴 등록 및 관리"
          accent="orange"
          links={[
            {
              label: "툴 등록 & 관리",
              href: "/admin/tools",
              description: "신규 AI 툴을 등록하고 기존 툴 정보 관리",
            },
          ]}
        />
        <SectionCard
          icon={<Languages className="h-5 w-5" />}
          title="번역"
          description="OpenAI로 툴 자동 번역"
          accent="green"
          links={[
            {
              label: "툴 자동 번역",
              href: "/admin/tools",
              description: "영문 툴 정보를 한글로 번역 (OpenAI)",
            },
          ]}
        />
      </div>
    </div>
  );
}

function GuidesTab() {
  return (
    <div className="space-y-6">
      <TabHeader
        title="가이드 관리"
        description="AI 가이드 콘텐츠 생성, 관리 및 번역"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard
          icon={<Plus className="h-5 w-5" />}
          title="생성 / 관리"
          description="AI 가이드 콘텐츠 생성 및 상태 관리"
          accent="purple"
          links={[
            {
              label: "가이드 생성 & 관리",
              href: "/admin/guides",
              description: "OpenAI로 가이드 자동 생성 및 상태(draft/review/approved) 관리",
            },
          ]}
        />
        <SectionCard
          icon={<Languages className="h-5 w-5" />}
          title="번역"
          description="영문 가이드를 한글로 번역"
          accent="green"
          links={[
            {
              label: "가이드 자동 번역",
              href: "/admin/guides/translate",
              description: "영문 가이드를 한글로 자동 번역 (OpenAI)",
            },
          ]}
        />
      </div>
    </div>
  );
}

function TestsTab() {
  return (
    <div className="space-y-6">
      <TabHeader
        title="테스트 도구"
        description="개발 및 QA를 위한 테스트 페이지 모음"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <SectionCard
          icon={<Database className="h-5 w-5" />}
          title="Routes & DB"
          description="루트 데이터 및 DB 검증"
          accent="blue"
          links={[
            {
              label: "루트 마이그레이션",
              href: "/admin/routes-migrate",
              description: "루트 데이터 DB 마이그레이션 & 검증",
            },
            {
              label: "Routes 검증 API",
              href: "/api/routes/verify",
              description: "routes/route_tools 테이블 상태 확인",
              external: true,
            },
            {
              label: "Tools 테이블 확인",
              href: "/api/routes/check-tools-table",
              description: "tools 테이블 총 개수 및 샘플 조회",
              external: true,
            },
            {
              label: "Route Steps 검증",
              href: "/api/routes/check-steps",
              description: "routes ↔ route_tools 관계 확인",
              external: true,
            },
            {
              label: "누락 Tools 확인",
              href: "/api/routes/check-missing-tools",
              description: "필수 tool slugs 존재 여부 확인",
              external: true,
            },
          ]}
        />

        <SectionCard
          icon={<Globe className="h-5 w-5" />}
          title="API & Entitlement"
          description="Workspace API 및 권한 테스트"
          accent="purple"
          links={[
            {
              label: "Entitlement API 테스트",
              href: "/test-entitlement.html",
              description: "Workspace entitlement API 응답 확인",
              external: true,
            },
            {
              label: "Entitlement Lock 테스트",
              href: "/test-entitlement-lock.html",
              description: "is_paid_for_lock 로직 검증",
              external: true,
            },
            {
              label: "DEMO_MODE 확인",
              href: "/api/debug/demo",
              description: "런타임 환경 변수 및 DEMO_MODE 상태",
              external: true,
            },
          ]}
        />

        <SectionCard
          icon={<Bug className="h-5 w-5" />}
          title="Debug"
          description="디버그 엔드포인트 및 유틸리티"
          accent="orange"
          links={[
            {
              label: "Favorites 데이터 확인",
              href: "/api/debug/favorites",
              description: "guest_id 기반 favorites 데이터 조회",
              external: true,
            },
            {
              label: "Favorites 동기화",
              href: "/api/debug/sync-favorites",
              description: "DB favorites → localStorage 동기화",
              external: true,
            },
            {
              label: "Fix & Reseed",
              href: "/api/routes/fix-and-reseed",
              description: "누락된 tools 추가 및 route_tools 재시드",
              external: true,
            },
          ]}
        />
      </div>

      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-5">
        <h3 className="font-semibold text-foreground mb-2">사용 주의사항</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• 테스트 페이지는 로그인 상태에서만 작동합니다</li>
          <li>
            • 외부 링크(API, HTML)는 새 탭에서 열립니다
          </li>
          <li>
            • Debug API는 쿼리 파라미터가 필요할 수 있습니다 (예:{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              ?guest_id=xxx
            </code>
            )
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ─── Homepage Theme Selector ─── */

const THEME_OPTIONS = [
  { value: "default", label: "기본 (Default)", desc: "현재 운영 중인 기본 디자인" },
  { value: "v2", label: "V2 (Full)", desc: "그라데이션 Hero, Stats, CTA 배너 — 모던 디자인" },
  { value: "v2-simple", label: "V2 심플", desc: "미니멀 텍스트 중심, 단색 CTA — 초심플" },
] as const;

function HomepageThemeSelector() {
  const [theme, setTheme] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/homepage-theme");
      const json = await res.json();
      if (json.ok) {
        setTheme(json.theme);
        setUpdatedAt(json.updated_at);
      } else {
        setError(json.error || "API 응답 오류");
      }
    } catch {
      setError("네트워크 오류");
    }
    setLoaded(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const apply = async (next: string) => {
    if (saving || next === theme) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/homepage-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      });
      const json = await res.json();
      if (json.ok) {
        setTheme(json.theme);
        setUpdatedAt(new Date().toISOString());
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (!loaded) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">홈페이지 테마 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error || theme === null) {
    return (
      <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-5 w-5 text-orange-500" />
            <div>
              <h3 className="font-semibold text-foreground">홈페이지 테마: 기본값 사용 중</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {error ?? "설정을 불러올 수 없습니다"} — <code className="text-xs bg-muted px-1 py-0.5 rounded">app_settings</code> 테이블에 homepage_theme 행이 필요합니다
              </p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            재시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">홈페이지 테마</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              글로벌(EN) + 한글(KR) 메인 페이지 디자인을 즉시 전환합니다
              {updatedAt && (
                <span className="ml-2 text-muted-foreground/60">
                  (마지막 변경: {new Date(updatedAt).toLocaleString("ko-KR")})
                </span>
              )}
            </p>
          </div>
        </div>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {THEME_OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => apply(opt.value)}
              disabled={saving}
              className={`rounded-lg border p-4 text-left transition disabled:opacity-50 ${
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                  {opt.label}
                </span>
                {active && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    적용 중
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
        <span>미리보기:</span>
        <a href="/v2" target="_blank" rel="noopener" className="text-primary hover:underline">EN v2</a>
        <a href="/v2/simple" target="_blank" rel="noopener" className="text-primary hover:underline">EN v2-심플</a>
        <a href="/kr/v2" target="_blank" rel="noopener" className="text-primary hover:underline">KR v2</a>
        <a href="/kr/v2/simple" target="_blank" rel="noopener" className="text-primary hover:underline">KR v2-심플</a>
      </div>
    </div>
  );
}

/* ─── Demo Mode Toggle ─── */

function DemoModeToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDone, setLoadingDone] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/demo-mode");
      const json = await res.json();
      if (json.ok) {
        setEnabled(json.demo_mode);
        setUpdatedAt(json.updated_at);
      } else {
        setError(json.error || "API 응답 오류");
      }
    } catch (e) {
      setError("네트워크 오류");
    }
    setLoadingDone(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async () => {
    if (enabled === null || toggling) return;
    const next = !enabled;

    const confirmed = window.confirm(
      next
        ? "데모 모드를 켜면 워크스페이스/인증/결제 기능이 비활성화됩니다. 계속하시겠습니까?"
        : "데모 모드를 끄면 워크스페이스/인증/결제 기능이 활성화됩니다. 계속하시겠습니까?",
    );
    if (!confirmed) return;

    setToggling(true);
    try {
      const res = await fetch("/api/admin/settings/demo-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const json = await res.json();
      if (json.ok) {
        setEnabled(json.demo_mode);
        setUpdatedAt(new Date().toISOString());
      }
    } catch { /* ignore */ }
    setToggling(false);
  };

  if (!loadingDone) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">데모 모드 상태 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error || enabled === null) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-foreground">데모 모드: 연결 실패</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {error ?? "알 수 없는 오류"} — Supabase에 <code className="text-xs bg-muted px-1 py-0.5 rounded">app_settings</code> 테이블이 있는지 확인하세요
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            재시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-5 transition ${enabled ? "border-yellow-500/40 bg-yellow-500/5" : "border-green-500/40 bg-green-500/5"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className={`h-5 w-5 ${enabled ? "text-yellow-600" : "text-green-600"}`} />
          <div>
            <h3 className="font-semibold text-foreground">
              데모 모드: {enabled ? "ON" : "OFF"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabled
                ? "워크스페이스 · 인증 · 결제 기능이 비활성화 상태입니다"
                : "모든 기능이 활성화 상태입니다"}
              {updatedAt && (
                <span className="ml-2 text-muted-foreground/60">
                  (마지막 변경: {new Date(updatedAt).toLocaleString("ko-KR")})
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={toggling}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
            enabled
              ? "bg-green-600 hover:bg-green-700"
              : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          {toggling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {enabled ? "데모 모드 끄기" : "데모 모드 켜기"}
        </button>
      </div>
    </div>
  );
}
