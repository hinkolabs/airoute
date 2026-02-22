"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Route {
  slug: string;
  title: string;
}

export default function AdminRoutesTranslatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [routeSlug, setRouteSlug] = useState("");
  const [forceRetranslate, setForceRetranslate] = useState(false);
  const [translateModel, setTranslateModel] = useState("gpt-4o-mini");
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Load routes on mount
  useEffect(() => {
    async function loadRoutes() {
      try {
        const res = await fetch("/api/routes/list?locale=en");
        if (res.ok) {
          const data = await res.json();
          setRoutes(data);
        }
      } catch (err) {
        console.error("Failed to load routes:", err);
      } finally {
        setLoadingRoutes(false);
      }
    }
    loadRoutes();
  }, []);

  const handleTranslate = async (mode: "all" | "single") => {
    if (mode === "single" && !routeSlug.trim()) {
      setError("루트를 선택해주세요");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = mode === "single" 
        ? { routeSlug: routeSlug.trim(), forceRetranslate, model: translateModel } 
        : { forceRetranslate, model: translateModel };
      
      const res = await fetch("/api/admin/routes/translate-to-kr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "번역 실패");
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-block text-sm text-primary hover:underline"
          >
            ← 관리자 대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            루트 자동 번역 (영문 → 한글)
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            OpenAI를 사용하여 영문 루트를 한글로 자동 번역합니다
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            번역 설정
          </h2>

          {/* Single Route Mode */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">
              특정 루트 선택 (선택사항)
            </label>
            {loadingRoutes ? (
              <div className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
                루트 목록을 불러오는 중...
              </div>
            ) : (
              <select
                value={routeSlug}
                onChange={(e) => setRouteSlug(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              >
                <option value="">전체 루트 번역 (비워두기)</option>
                {routes.map((route) => (
                  <option key={route.slug} value={route.slug}>
                    {route.title}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              특정 루트만 번역하려면 선택하세요. 비워두면 모든 루트를 번역합니다.
            </p>
          </div>

          {/* Force Retranslate Option */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={forceRetranslate}
                onChange={(e) => setForceRetranslate(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-sm font-medium text-foreground">
                Force Re-translate (기존 번역 덮어쓰기)
              </span>
            </label>
            <p className="ml-6 mt-1 text-xs text-muted-foreground">
              이미 번역된 루트도 다시 번역합니다 (기존 데이터 삭제 후 재생성)
            </p>
          </div>

          {/* Model Selection */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">
              번역 모델
            </label>
            <select
              value={translateModel}
              onChange={(e) => setTranslateModel(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="gpt-4o-mini">gpt-4o-mini (빠름, 저비용)</option>
              <option value="gpt-4o">gpt-4o (고품질, 자연스러운 한국어)</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleTranslate("single")}
              disabled={loading || !routeSlug.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "번역 중..." : "선택한 루트 번역하기"}
            </button>
            <button
              onClick={() => handleTranslate("all")}
              disabled={loading}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "번역 중..." : "전체 루트 번역하기"}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-950/20 p-4">
            <p className="text-sm font-medium text-red-400">오류</p>
            <p className="mt-1 text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              번역 결과
            </h2>
            <div className="mb-4 text-sm text-muted-foreground">
              처리된 루트: {result.processed}개
            </div>

            <div className="space-y-4">
              {result.results?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {item.slug}
                    </span>
                    {item.error && (
                      <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-400">
                        오류
                      </span>
                    )}
                  </div>
                  {item.error ? (
                    <p className="text-sm text-red-400">{item.error}</p>
                  ) : (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        루트:{" "}
                        {item.routeTranslated ? (
                          <span className="text-primary">✓ 번역 완료</span>
                        ) : (
                          <span className="text-muted-foreground">
                            이미 존재함
                          </span>
                        )}
                      </div>
                      <div>
                        워크플로우 단계:{" "}
                        <span className="text-primary">
                          {item.stepsTranslated}개 번역됨
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            작동 방식
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              • DB에서 아직 한글 번역이 없는 활성 루트를 가져옵니다
            </li>
            <li>
              • OpenAI를 사용하여 제목, 설명, 가이드 팁을 번역합니다
            </li>
            <li>
              • 각 루트의 모든 워크플로우 단계(route_tools)도 번역합니다
            </li>
            <li>
              • 번역된 내용을 routes_i18n과 route_tools_i18n 테이블에 저장합니다
            </li>
            <li>• 이미 한글 번역이 있는 루트는 건너뜁니다 (Force Re-translate 체크 시 제외)</li>
          </ul>
          <div className="mt-4 rounded-md bg-yellow-500/10 p-3">
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
              ⚠️ .env 파일에 OPENAI_ENABLED=true 및 OPENAI_API_KEY가 필요합니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
