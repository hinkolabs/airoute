"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Guide {
  id: string;
  slug: string;
  title: string;
  lang: string;
  status: string;
  hasKrTranslation?: boolean;
}

export default function AdminGuidesTranslatePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [guideId, setGuideId] = useState("");
  const [forceRetranslate, setForceRetranslate] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const [translateModel, setTranslateModel] = useState("gpt-4o-mini");
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [loadGuidesError, setLoadGuidesError] = useState<string | null>(null);

  // Load EN guides on mount
  useEffect(() => {
    async function loadGuides() {
      try {
        const res = await fetch("/api/admin/guides/list");
        if (!res.ok) {
          throw new Error(`Failed to fetch guides: ${res.status}`);
        }
        const data = await res.json();
        console.log("Loaded guides data:", data);
        
        // Filter: same condition as /guides page (status='published' AND lang='en')
        const enGuides = data.items?.filter(
            (g: any) => g.lang === "en" && g.status === "published"
          ) || [];
        
        // Check which guides have KR translations
        const guidesWithTranslationStatus = enGuides.map((guide: any) => {
          const hasKrTranslation = data.items?.some(
            (kr: any) => kr.lang === "kr" && kr.taxonomy === guide.slug
          ) || false;
          return {
            ...guide,
            hasKrTranslation,
          };
        });
        
        console.log("Filtered EN guides (published):", enGuides.length);
        setGuides(guidesWithTranslationStatus);
        
        if (enGuides.length === 0) {
          setLoadGuidesError("발행된 영문 가이드가 없습니다.");
        }
      } catch (err) {
        console.error("Failed to load guides:", err);
        setLoadGuidesError(err instanceof Error ? err.message : "가이드 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoadingGuides(false);
      }
    }
    loadGuides();
  }, []);

  const handleTranslate = async (mode: "all" | "single") => {
    if (mode === "single" && !guideId.trim()) {
      setError("가이드를 선택해주세요");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = mode === "single" 
        ? { guideId: guideId.trim(), forceRetranslate, model: translateModel } 
        : { forceRetranslate, batchSize, model: translateModel };
      
      const res = await fetch("/api/admin/guides/translate-to-kr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        const errorMsg = data.error || "번역 실패";
        const errorDetails = data.details ? `\n\n상세: ${JSON.stringify(data.details, null, 2)}` : "";
        const errorCode = data.code ? `\n오류 코드: ${data.code}` : "";
        throw new Error(`${errorMsg}${errorCode}${errorDetails}`);
      }

      setResult(data);
      
      // 성공 후 가이드 목록 새로고침
      window.location.reload();
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
            가이드 자동 번역 (영문 → 한글)
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            OpenAI를 사용하여 영문 가이드를 한글로 자동 번역합니다
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            번역 설정
          </h2>

          {/* Debug Info */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-4 rounded-md bg-muted/50 p-3 text-xs">
              <p className="font-mono text-muted-foreground">
                Debug: {loadingGuides ? "Loading..." : `${guides.length} guides loaded`}
              </p>
              {loadGuidesError && (
                <p className="font-mono text-red-500">Error: {loadGuidesError}</p>
              )}
            </div>
          )}

          {/* Single Guide Mode */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">
              특정 가이드 선택 (선택사항)
            </label>
            
            {/* Translation Status Summary */}
            {!loadingGuides && guides.length > 0 && (
              <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
                <span>
                  전체: <strong>{guides.length}</strong>개
                </span>
                <span className="text-green-600 dark:text-green-400">
                  ✅ 번역됨: <strong>{guides.filter(g => g.hasKrTranslation).length}</strong>개
                </span>
                <span className="text-orange-600 dark:text-orange-400">
                  ❌ 미번역: <strong>{guides.filter(g => !g.hasKrTranslation).length}</strong>개
                </span>
              </div>
            )}
            
            {loadingGuides ? (
              <div className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
                가이드 목록을 불러오는 중...
              </div>
            ) : loadGuidesError ? (
              <div className="w-full rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
                {loadGuidesError}
              </div>
            ) : guides.length === 0 ? (
              <div className="w-full rounded-lg border border-yellow-500/50 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
                번역 가능한 영문 가이드가 없습니다. (/guides 페이지에 보이는 EN 가이드만 표시됩니다)
              </div>
            ) : (
              <select
                value={guideId}
                onChange={(e) => setGuideId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              >
                <option value="">전체 가이드 번역 (비워두기)</option>
                {guides.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.hasKrTranslation ? "✅ " : "❌ "}
                    {guide.title}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              특정 가이드만 번역하려면 선택하세요. 비워두면 /guides 페이지에 보이는 모든 가이드를 번역합니다.
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
              이미 번역된 가이드도 다시 번역합니다 (기존 한글 가이드 업데이트)
            </p>
          </div>

          {/* Batch Size Option */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-foreground">
              배치 처리 개수 (전체 번역 시)
            </label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={3}>3개씩 (안전, 약 1분)</option>
              <option value={5}>5개씩 (권장, 약 2분)</option>
              <option value={10}>10개씩 (빠름, 약 4분)</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              한 번에 처리할 가이드 개수를 선택하세요. 많을수록 빠르지만 타임아웃 위험이 있습니다.
              <br />
              미번역 가이드가 많으면 여러 번 실행하세요. (가이드당 약 20~30초 소요)
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
              disabled={loading || !guideId.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "번역 중..." : "선택한 가이드 번역하기"}
            </button>
            <button
              onClick={() => handleTranslate("all")}
              disabled={loading}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "번역 중..." : "전체 가이드 번역하기"}
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
            <div className="mb-4 space-y-2 text-sm text-muted-foreground">
              <div>처리된 가이드: <strong className="text-foreground">{result.processed}개</strong></div>
              {result.total && (
                <>
                  <div>전체 가이드: <strong className="text-foreground">{result.total}개</strong></div>
                  {result.hasMore && (
                    <div className="rounded-md bg-yellow-500/10 p-2 text-yellow-600 dark:text-yellow-400">
                      ⚠️ 남은 가이드: <strong>{result.remaining}개</strong>
                      <br />
                      <span className="text-xs">
                        "전체 가이드 번역하기"를 다시 클릭하면 나머지를 계속 처리합니다.
                      </span>
                    </div>
                  )}
                </>
              )}
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
                        번역:{" "}
                        {item.translated ? (
                          <span className="text-primary">✓ 번역 완료</span>
                        ) : (
                          <span className="text-muted-foreground">
                            이미 존재함
                          </span>
                        )}
                      </div>
                      {item.krSlug && (
                        <div>
                          한글 슬러그:{" "}
                          <Link 
                            href={`/admin/guides/${item.id}`}
                            className="text-primary hover:underline"
                          >
                            {item.krSlug}
                          </Link>
                        </div>
                      )}
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
              • /guides 페이지에 조회되는 영문 가이드를 가져옵니다 (status='published', lang='en')
            </li>
            <li>
              • OpenAI를 사용하여 제목, 요약, 본문을 번역합니다
            </li>
            <li>
              • 새 한글 가이드를 생성하거나 기존 한글 가이드를 업데이트합니다
            </li>
            <li>
              • 한글 가이드 슬러그는 "{`영문슬러그-kr`}" 형식으로 생성됩니다
            </li>
            <li>
              • taxonomy 필드를 통해 영문 원본 가이드와 연결됩니다
            </li>
            <li>
              • 이미 한글 가이드가 있으면 건너뜁니다 (Force Re-translate 체크 시 제외)
            </li>
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
