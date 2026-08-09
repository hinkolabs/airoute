"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Sparkles, Loader2, Search, X, Plus, Check, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, SectionCard, InfoBanner } from "./_components/ui";
import ShortsSourcingNav from "./_components/shorts-nav";
import { SHORTS_SEARCH_LIMITS, ProductMatch } from "@/lib/shorts-sourcing/types";

interface ProductAnalysis {
  product_name_ko: string;
  category_ko: string | null;
  brand: string | null;
  model_name: string | null;
  attributes: string[];
  chinese_product_name: string;
  chinese_keywords: string[];
  chinese_hashtags: string[];
  confidence: number;
}

interface KeywordRow {
  id: string;
  keyword: string;
  is_ai_generated: boolean;
  is_selected: boolean;
}

interface MatchRow extends ProductMatch {
  id: string;
}

function formatPrice(match: MatchRow): string | null {
  if (match.price_min === null) return null;
  const currency = match.currency ?? "CNY";
  if (match.price_max !== null && match.price_max !== match.price_min) {
    return `${match.price_min}~${match.price_max} ${currency}`;
  }
  return `${match.price_min} ${currency}`;
}

function formatSold(count: number | null): string | null {
  if (count === null || count === undefined) return null;
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만개 판매`;
  return `${count}개 판매`;
}

type PlatformFilter = "all" | "douyin" | "xiaohongshu";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

function VersionBadge() {
  return (
    <span
      title={`빌드 버전 ${APP_VERSION} — 이 값이 최신 커밋 해시와 다르면 아직 배포가 반영되지 않은 것입니다.`}
      className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
    >
      v{APP_VERSION}
    </span>
  );
}

export default function ShoppingShortsClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [keywords, setKeywords] = useState<KeywordRow[]>([]);
  const [newKeyword, setNewKeyword] = useState("");

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [selectingMatchId, setSelectingMatchId] = useState<string | null>(null);

  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [resultsPerKeyword, setResultsPerKeyword] = useState<number>(SHORTS_SEARCH_LIMITS.defaultResultsPerKeyword);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  function handleFileSelected(file: File | null) {
    if (!file) return;
    setSelectedFile(file);
    setAnalyzeError(null);
    setAnalysis(null);
    setKeywords([]);
    setSessionId(null);
    setMatches([]);
    setMatchError(null);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFileSelected(file);
  }

  async function handleAnalyze() {
    if (!selectedFile) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/shorts-sourcing/analyze-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "상품 분석에 실패했습니다. 이미지를 다시 선택하거나 잠시 후 다시 시도해 주세요.");
      }

      setSessionId(data.session_id);
      setAnalysis(data.analysis);
      setKeywords(data.keywords ?? []);
    } catch (err: any) {
      setAnalyzeError(err.message || "상품 분석에 실패했습니다.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleMatchProduct() {
    if (!sessionId) return;
    setMatching(true);
    setMatchError(null);

    try {
      const res = await fetch("/api/shorts-sourcing/match-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "1688 제품 매칭에 실패했습니다.");
      }
      setMatches(data.matches ?? []);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : "1688 제품 매칭에 실패했습니다.");
    } finally {
      setMatching(false);
    }
  }

  async function selectMatch(matchId: string) {
    setSelectingMatchId(matchId);
    setMatches((prev) => prev.map((m) => ({ ...m, is_selected: m.id === matchId })));

    try {
      const res = await fetch(`/api/shorts-sourcing/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_selected: true }),
      });
      const data = await res.json();
      if (res.ok && data.keywords) {
        setKeywords(data.keywords);
      }
    } catch {
      // best-effort — keyword refresh failing just means the admin edits keywords manually below
    } finally {
      setSelectingMatchId(null);
    }
  }

  async function toggleKeyword(keywordId: string, isSelected: boolean) {
    if (!sessionId) return;
    setKeywords((prev) => prev.map((k) => (k.id === keywordId ? { ...k, is_selected: isSelected } : k)));
    await fetch(`/api/shorts-sourcing/sessions/${sessionId}/keywords/${keywordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_selected: isSelected }),
    }).catch(() => {});
  }

  async function removeKeyword(keywordId: string) {
    if (!sessionId) return;
    setKeywords((prev) => prev.filter((k) => k.id !== keywordId));
    await fetch(`/api/shorts-sourcing/sessions/${sessionId}/keywords/${keywordId}`, { method: "DELETE" }).catch(() => {});
  }

  async function addKeyword() {
    const keyword = newKeyword.trim();
    if (!keyword || !sessionId) return;
    if (keywords.length >= SHORTS_SEARCH_LIMITS.maxKeywordsPerSession) return;

    const res = await fetch(`/api/shorts-sourcing/sessions/${sessionId}/keywords`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword }),
    });
    const data = await res.json();
    if (res.ok && data.keyword) {
      setKeywords((prev) => [...prev, data.keyword]);
      setNewKeyword("");
    }
  }

  async function handleSearch() {
    if (!sessionId) return;
    const selectedKeywordIds = keywords.filter((k) => k.is_selected).map((k) => k.id);
    if (selectedKeywordIds.length === 0) {
      setSearchError("검색어를 최소 1개 이상 선택해주세요.");
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const res = await fetch("/api/shorts-sourcing/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          keyword_ids: selectedKeywordIds,
          platform,
          limit_per_keyword: resultsPerKeyword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "영상 검색을 시작하지 못했습니다.");
      }
      router.push(`/admin/shopping-shorts/session/${sessionId}`);
    } catch (err: any) {
      setSearchError(err.message || "영상 검색을 시작하지 못했습니다.");
    } finally {
      setSearching(false);
    }
  }

  const platformCount = platform === "all" ? 2 : 1;
  const estimatedJobs = keywords.filter((k) => k.is_selected).length * platformCount;

  return (
    <PageContainer>
      <PageHeader
        title={
          <>
            숏츠 영상 소싱 <VersionBadge />
          </>
        }
        subtitle="상품 스크린샷을 넣으면 더우인/샤오홍슈에서 유사 영상 후보를 찾아드립니다."
      />
      <ShortsSourcingNav />

      <SectionCard title="1. 상품 이미지" subtitle="쿠팡 등에서 캡처한 상품 스크린샷을 올려주세요 (JPG/PNG/WEBP, 최대 10MB)">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center hover:border-primary/40 hover:bg-muted/50 transition-colors"
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="상품 미리보기" className="max-h-64 rounded-lg object-contain" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">클릭하거나 이미지를 드래그해서 올려주세요</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
          />
        </div>

        {analyzeError && (
          <InfoBanner variant="error" className="mt-3">{analyzeError}</InfoBanner>
        )}

        <div className="mt-4">
          <Button onClick={handleAnalyze} disabled={!selectedFile || analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 분석 중...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> 상품 분석
              </>
            )}
          </Button>
        </div>
      </SectionCard>

      {analysis && (
        <SectionCard
          title="2. 1688에서 정확한 제품 찾기"
          subtitle="쿠팡 상품과 정확히 같은 제품을 1688에서 사진으로 찾습니다. 목록에서 맞는 것을 직접 선택해주세요."
        >
          {matches.length === 0 && (
            <Button onClick={handleMatchProduct} disabled={matching} variant="outline">
              {matching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 1688 검색 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> 1688에서 이 제품 찾기
                </>
              )}
            </Button>
          )}

          {matchError && (
            <InfoBanner variant="error" className="mt-3">{matchError}</InfoBanner>
          )}

          {matches.length > 0 && (
            <>
              <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => selectMatch(m.id)}
                    disabled={selectingMatchId !== null}
                    className={`overflow-hidden rounded-xl border text-left transition-colors ${
                      m.is_selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="relative aspect-square w-full bg-muted">
                      {m.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.image_url}
                          alt={m.title}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                      {m.image_rank !== null && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          매칭 {m.image_rank}위
                        </span>
                      )}
                      {m.is_selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {selectingMatchId === m.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5 p-2">
                      <p className="line-clamp-2 text-xs font-medium leading-snug">{m.title}</p>
                      <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                        {formatPrice(m) && <span>{formatPrice(m)}</span>}
                        {formatSold(m.sold_count) && <span>· {formatSold(m.sold_count)}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Button onClick={handleMatchProduct} disabled={matching} variant="ghost" size="sm" className="mt-3">
                {matching ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Search className="mr-1.5 h-3.5 w-3.5" />}
                다시 검색
              </Button>
            </>
          )}
        </SectionCard>
      )}

      {analysis && (
        <SectionCard title="3. 분석 결과 · 검색어 편집" subtitle="중국어를 몰라도 그대로 검색을 진행할 수 있습니다. 1688 제품을 선택하면 검색어가 자동으로 갱신됩니다.">
          <dl className="grid grid-cols-[80px_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">상품명</dt>
            <dd className="font-medium">{analysis.product_name_ko}</dd>
            <dt className="text-muted-foreground">카테고리</dt>
            <dd>{analysis.category_ko ?? "-"}</dd>
            <dt className="text-muted-foreground">중국어명</dt>
            <dd>{analysis.chinese_product_name}</dd>
            <dt className="text-muted-foreground">특징</dt>
            <dd>{analysis.attributes.length > 0 ? analysis.attributes.join(" · ") : "-"}</dd>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {keywords.map((k) => (
              <button
                key={k.id}
                onClick={() => toggleKeyword(k.id, !k.is_selected)}
                className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  k.is_selected
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {k.keyword}
                <X
                  className="h-3 w-3 opacity-0 group-hover:opacity-60"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeKeyword(k.id);
                  }}
                />
              </button>
            ))}
          </div>

          {keywords.length < SHORTS_SEARCH_LIMITS.maxKeywordsPerSession && (
            <div className="mt-3 flex gap-2">
              <input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                placeholder="검색어 직접 추가"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              />
              <Button variant="outline" size="sm" onClick={addKeyword}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </SectionCard>
      )}

      {analysis && (
        <SectionCard title="4. 플랫폼 선택 · 검색 실행">
          <div className="flex gap-2">
            {([
              { key: "all", label: "전체" },
              { key: "douyin", label: "더우인" },
              { key: "xiaohongshu", label: "샤오홍슈" },
            ] as { key: PlatformFilter; label: string }[]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPlatform(opt.key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  platform === opt.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <label className="text-muted-foreground">검색어당 결과 수</label>
            <input
              type="number"
              min={5}
              max={SHORTS_SEARCH_LIMITS.maxResultsPerKeyword}
              value={resultsPerKeyword}
              onChange={(e) => setResultsPerKeyword(Number(e.target.value))}
              className="w-20 rounded-lg border border-border bg-background px-2 py-1"
            />
          </div>

          <InfoBanner variant="info" className="mt-4">
            이번 검색: 검색어 {keywords.filter((k) => k.is_selected).length}개 × 플랫폼 {platformCount}개 · 예상 검색 작업 최대 {estimatedJobs}회
            (동일 검색어는 캐시가 있으면 API를 다시 호출하지 않습니다)
          </InfoBanner>

          {searchError && <InfoBanner variant="error" className="mt-3">{searchError}</InfoBanner>}

          <div className="mt-4">
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 검색 시작 중...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> 영상 찾기
                </>
              )}
            </Button>
          </div>
        </SectionCard>
      )}
    </PageContainer>
  );
}
