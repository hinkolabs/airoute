"use client";

import { useState } from "react";

/**
 * Routes Migration UI
 * Admin tool for migrating routes to DB
 * 
 * Access: http://localhost:3000/admin/routes-migrate
 */

type ActionResult = {
  status: string;
  message?: string;
  data?: any;
  error?: string;
};

export default function RoutesMigratePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, ActionResult>>({});

  const executeAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/routes/migrate?action=${action}`);
      const data = await res.json();
      
      setResults((prev) => ({
        ...prev,
        [action]: {
          status: res.ok ? "success" : "error",
          data: data,
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [action]: {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Link */}
        <a
          href="/admin"
          className="mb-4 inline-block text-sm text-primary hover:underline"
        >
          ← 관리자 대시보드로 돌아가기
        </a>
        
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          루트 마이그레이션 도구
        </h1>
        <p className="mb-8 text-muted-foreground">
          src/lib/routes.ts의 루트 데이터를 Supabase DB로 마이그레이션합니다
        </p>

        {/* Action Buttons */}
        <div className="mb-8 space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">작업 목록</h2>

          <div className="space-y-3">
            {/* Step 1: Check */}
            <button
              onClick={() => executeAction("check")}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">1. DB 상태 확인</div>
                  <div className="text-xs text-muted-foreground">
                    routes 테이블 존재 여부 및 tools.id 타입 확인
                  </div>
                </div>
                <span className="text-primary">→</span>
              </div>
            </button>

            {/* Step 2: Create */}
            <button
              onClick={() => executeAction("create")}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">2. 테이블 생성 SQL 생성</div>
                  <div className="text-xs text-muted-foreground">
                    routes 및 route_tools 테이블 생성 SQL 확인
                  </div>
                </div>
                <span className="text-primary">→</span>
              </div>
            </button>

            {/* Step 3: Seed */}
            <button
              onClick={() => executeAction("seed")}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">3. 데이터 삽입</div>
                  <div className="text-xs text-muted-foreground">
                    src/lib/routes.ts에서 10개 루트 및 단계 삽입
                  </div>
                </div>
                <span className="text-primary">→</span>
              </div>
            </button>
          </div>

          {loading && (
            <div className="mt-4 rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">
              처리 중...
            </div>
          )}
        </div>

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">실행 결과</h2>

            {Object.entries(results).map(([action, result]) => (
              <div
                key={action}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground capitalize">
                    {action}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      result.status === "success"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {result.status === "success" ? "성공" : "실패"}
                  </span>
                </div>

                <pre className="mt-3 overflow-x-auto rounded-lg bg-background p-4 text-xs text-foreground">
                  {JSON.stringify(result.data || result.error, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            사용 방법
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-semibold text-foreground">1. 확인:</span>{" "}
              현재 DB 상태 확인
            </li>
            <li>
              <span className="font-semibold text-foreground">2. 생성:</span>{" "}
              SQL 복사 후 Supabase SQL 에디터에서 실행
            </li>
            <li>
              <span className="font-semibold text-foreground">3. 삽입:</span>{" "}
              src/lib/routes.ts의 루트 데이터 삽입
            </li>
          </ol>

          <div className="mt-4 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-500">
            ⚠️ 2단계는 Supabase 대시보드에서 수동으로 SQL을 실행해야 합니다
          </div>
        </div>
      </div>
    </div>
  );
}









