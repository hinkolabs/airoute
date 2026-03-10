"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RouteI18n = {
  locale: string;
  title: string | null;
  description: string | null;
};

type AdminRoute = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  featured: boolean;
  tags: string[] | null;
  guide_bullets: string[] | null;
  manual_order: number | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  routes_i18n?: RouteI18n[];
};

type CreateFormData = {
  title: string;
  slug: string;
  description: string;
  icon: string;
};

export default function AdminRoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<AdminRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");

  // Quick create
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>({
    title: "",
    slug: "",
    description: "",
    icon: "",
  });

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  async function fetchRoutes() {
    try {
      const res = await fetch("/api/admin/routes/list-all");
      const json = await res.json();
      if (json.ok) setRoutes(json.routes || []);
    } catch (e) {
      console.error("Failed to fetch routes:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (creating) return;
    if (!createForm.title.trim()) {
      alert("루트 제목을 입력해주세요.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/routes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title.trim(),
          slug: createForm.slug.trim() || undefined,
          description: createForm.description.trim() || null,
          icon: createForm.icon.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "생성 실패");
      // Navigate to edit page
      router.push(`/admin/routes/${json.route.id}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "생성 실패");
      setCreating(false);
    }
  }

  async function handleDelete(routeId: string, routeTitle: string) {
    if (
      !confirm(
        `"${routeTitle}" 루트를 삭제하시겠습니까?\n관련 route_tools, i18n 데이터도 함께 삭제됩니다.`
      )
    )
      return;

    setDeletingId(routeId);
    try {
      const res = await fetch(`/api/admin/routes/${routeId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || json.error || "삭제 실패");
      fetchRoutes();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      !searchQuery.trim() ||
      route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (route.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || route.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link
          href="/admin"
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          ← 관리자 대시보드로 돌아가기
        </Link>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">루트 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              루트 등록, 수정, 삭제를 관리합니다. 항목을 클릭하면 상세 편집 페이지로 이동합니다.
            </p>
          </div>
          <Link
            href="/admin/routes/translate"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            번역 관리 →
          </Link>
        </div>

        {/* ── Route List ── */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">
              등록된 루트 ({routes.length}개)
            </h2>
            <div className="flex items-center gap-3">
              <KrTranslationSummary routes={routes} />
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm"
              >
                {showCreate ? "취소" : "+ 새 루트 추가"}
              </button>
            </div>
          </div>

          {/* Quick Create Form */}
          {showCreate && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                새 루트 빠른 생성
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  placeholder="제목 *"
                  className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  value={createForm.slug}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, slug: e.target.value })
                  }
                  placeholder="Slug (비우면 자동 생성)"
                  className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <input
                  type="text"
                  value={createForm.icon}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, icon: e.target.value })
                  }
                  placeholder="아이콘 이모지"
                  className="px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="간단한 설명"
                  className="md:col-span-3 px-3 py-2 text-sm border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium text-sm"
              >
                {creating ? "생성 중..." : "생성 후 편집 페이지로 이동"}
              </button>
            </div>
          )}

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, slug, 설명으로 검색..."
              className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "active" | "inactive"
                )
              }
              className="px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">전체 상태</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            {filteredRoutes.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">
                {searchQuery || statusFilter !== "all"
                  ? "검색 결과가 없습니다."
                  : "등록된 루트가 없습니다."}
              </p>
            ) : (
              filteredRoutes.map((route) => {
                const krI18n = route.routes_i18n?.find(
                  (r) => r.locale === "kr"
                );
                const hasKr = !!krI18n?.title;
                return (
                  <div
                    key={route.id}
                    className="flex items-start justify-between gap-4 p-4 border border-border rounded-lg hover:bg-accent group"
                  >
                    <Link
                      href={`/admin/routes/${route.id}`}
                      className="flex-1 min-w-0 block"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {route.icon && (
                          <span className="text-lg">{route.icon}</span>
                        )}
                        <h3 className="font-medium text-card-foreground group-hover:text-primary transition">
                          {route.title}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            route.status === "active"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {route.status}
                        </span>
                        {route.featured && (
                          <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-600">
                            Featured
                          </span>
                        )}
                        {hasKr ? (
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-600">
                            KR
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-500">
                            미번역
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {route.slug}
                        {route.manual_order != null &&
                          ` · 순서: ${route.manual_order}`}
                      </p>
                      {route.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {route.description}
                        </p>
                      )}
                      {krI18n?.title && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5 line-clamp-1">
                          KR: {krI18n.title}
                        </p>
                      )}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">
                        {new Date(route.created_at).toLocaleDateString("ko-KR")}
                      </span>
                      <Link
                        href={`/admin/routes/${route.id}`}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-background text-foreground hover:bg-muted transition"
                      >
                        수정
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(route.id, route.title);
                        }}
                        disabled={deletingId === route.id}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 bg-red-500/5 text-red-600 hover:bg-red-500/10 transition disabled:opacity-50"
                      >
                        {deletingId === route.id ? "삭제중..." : "삭제"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KrTranslationSummary({ routes }: { routes: AdminRoute[] }) {
  const done = routes.filter((r) =>
    r.routes_i18n?.some((i) => i.locale === "kr" && i.title)
  ).length;
  const none = routes.length - done;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-green-600">KR 번역 {done}</span>
      <span className="text-red-500">미번역 {none}</span>
    </div>
  );
}
