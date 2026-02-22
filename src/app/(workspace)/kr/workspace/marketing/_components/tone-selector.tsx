"use client";

import React, { useState } from "react";

// TODO: Replace with actual user plan check
const STUB_IS_PRO = false;

type ToneType = "friendly" | "professional" | "concise" | "mytone";

const TONE_PREVIEWS: Record<Exclude<ToneType, "mytone">, string> = {
  friendly: `안녕하세요! 이번 주 새로운 소식을 전해드려요.

저희 팀이 준비한 콘텐츠가 여러분의 일상에 작은 영감이 되었으면 좋겠어요. 블로그에는 실무에서 바로 써먹을 수 있는 팁을, SNS에는 가볍게 공유할 수 있는 인사이트를 담았답니다.

궁금한 점이 있으시면 언제든 편하게 연락 주세요. 함께 성장하는 파트너가 되고 싶어요!`,

  professional: `귀하의 비즈니스 성장을 위한 최신 인사이트를 공유드립니다.

본 주의 콘텐츠는 데이터 기반 전략과 실무 적용 사례를 중심으로 구성하였습니다. 블로그에서는 심층 분석 자료를, SNS 채널에서는 핵심 요약 정보를 확인하실 수 있습니다.

추가 문의 사항이 있으시면 하단 연락처로 연락 주시기 바랍니다.`,

  concise: `이번 주 업데이트입니다.

블로그: 실무 적용 가이드 3건
SNS: 핵심 인사이트 요약

자세한 내용은 첨부 링크를 확인하세요.`,
};

const ANALYZED_TONE_PREVIEW = `분석된 내 톤으로 작성된 샘플입니다.

입력하신 글의 문체와 어조를 바탕으로 자동 생성된 콘텐츠예요. 실제 발송 시 이 톤이 적용됩니다.

계속 사용하시려면 저장 버튼을 눌러주세요!`;

export function ToneSelector() {
  const [selectedTone, setSelectedTone] = useState<ToneType>("friendly");
  const [sampleText, setSampleText] = useState("");
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const charCount = sampleText.length;
  const maxChars = 500;
  const canAnalyze = charCount > 0 && charCount <= maxChars;

  const handleAnalyze = () => {
    // TODO: Call AI API to analyze tone
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzed(true);
      setSelectedTone("mytone");
      setIsAnalyzing(false);
    }, 1000);
  };

  const getPreviewText = () => {
    if (selectedTone === "mytone" && isAnalyzed) {
      return ANALYZED_TONE_PREVIEW;
    }
    if (selectedTone === "mytone") {
      return "내 톤이 분석되지 않았습니다.";
    }
    return TONE_PREVIEWS[selectedTone];
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-medium text-foreground">글쓰기 톤</div>
        <p className="mt-1 text-sm text-muted-foreground">
          기본 톤을 선택하거나, Pro에서는 샘플 글로 내 톤을 만들 수 있어요.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Column: Tone Selection & Input */}
        <div className="space-y-4">
          {/* Preset Tones */}
          <div className="rounded-lg border border-border bg-card p-4">
            <label className="mb-3 block text-sm font-medium text-foreground">
              기본 톤 선택
            </label>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-4 py-3 hover:bg-muted/50">
                <input
                  type="radio"
                  name="tone"
                  value="friendly"
                  checked={selectedTone === "friendly"}
                  onChange={() => setSelectedTone("friendly")}
                  className="h-4 w-4 text-primary"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">친근한 안내형</div>
                  <div className="text-xs text-muted-foreground">따뜻하고 편안한 느낌</div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-4 py-3 hover:bg-muted/50">
                <input
                  type="radio"
                  name="tone"
                  value="professional"
                  checked={selectedTone === "professional"}
                  onChange={() => setSelectedTone("professional")}
                  className="h-4 w-4 text-primary"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">전문적인 설득형</div>
                  <div className="text-xs text-muted-foreground">신뢰감 있고 격식 있는 느낌</div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background px-4 py-3 hover:bg-muted/50">
                <input
                  type="radio"
                  name="tone"
                  value="concise"
                  checked={selectedTone === "concise"}
                  onChange={() => setSelectedTone("concise")}
                  className="h-4 w-4 text-primary"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">간결한 실행형</div>
                  <div className="text-xs text-muted-foreground">핵심만 빠르게 전달</div>
                </div>
              </label>

              {/* My Tone Option (only if analyzed) */}
              {isAnalyzed && (
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-primary bg-primary/5 px-4 py-3 hover:bg-primary/10">
                  <input
                    type="radio"
                    name="tone"
                    value="mytone"
                    checked={selectedTone === "mytone"}
                    onChange={() => setSelectedTone("mytone")}
                    className="h-4 w-4 text-primary"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">내 톤</div>
                    <div className="text-xs text-muted-foreground">분석된 나만의 글쓰기 스타일</div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Pro Feature: Custom Tone Analysis */}
          {STUB_IS_PRO && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">
                  내 톤 분석하기
                </label>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Pro
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                내 글 500자 미만을 붙여넣으면, 동일한 말투로 작성해줘요.
              </p>
              
              <textarea
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value.slice(0, maxChars))}
                placeholder="평소 작성하시는 글을 붙여넣어 주세요. (이메일, 블로그 글 등)"
                className="mb-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                rows={6}
                maxLength={maxChars}
              />
              
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{charCount} / {maxChars}자</span>
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze || isAnalyzing}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? "분석 중..." : "내 톤 분석하기"}
              </button>

              {isAnalyzed && (
                <div className="mt-3 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
                  ✓ 내 톤 분석이 완료되었습니다. 우측에서 미리보기를 확인하세요.
                </div>
              )}
            </div>
          )}

          {/* Pro Feature Locked State */}
          {!STUB_IS_PRO && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">내 톤 분석하기</span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Pro
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pro 플랜에서는 내 글을 붙여넣어 나만의 톤을 분석하고 저장할 수 있어요.
              </p>
              <button
                type="button"
                disabled
                className="mt-3 inline-flex items-center justify-center rounded-md bg-muted px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed"
              >
                준비중
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="rounded-lg border border-border bg-card p-4">
          <label className="mb-3 block text-sm font-medium text-foreground">
            톤 미리보기
          </label>
          <div className="rounded-md bg-muted/50 p-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {getPreviewText()}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            실제 발송되는 콘텐츠는 이 톤을 기반으로 생성됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
