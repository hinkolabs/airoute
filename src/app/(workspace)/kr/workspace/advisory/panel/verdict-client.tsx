"use client";

import { useState } from "react";
import { Gavel, AlertCircle, Lock } from "lucide-react";

type VerdictClientProps = {
  workspaceId: string;
};

type VerdictResult = {
  question: string;
  verdict: string;
  reasoning?: string;
};

export default function VerdictClient({ workspaceId }: VerdictClientProps) {
  const [question, setQuestion] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VerdictResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = async () => {
    try {
      const res = await fetch(`/api/credits/balance?workspace_id=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  const handleGetVerdict = async () => {
    if (!question.trim()) {
      setError("질문을 입력해주세요.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Placeholder: AI panel verdict (free, no credit charge)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setResult({
        question: question.trim(),
        verdict: "찬성 (60%) vs 반대 (40%)",
      });
    } catch (err: any) {
      setError(err.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetDetailedReasoning = async () => {
    if (!result) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Consume 20 credits for detailed reasoning
      const consumeRes = await fetch("/api/credits/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          feature_key: "verdict_detail",
          amount: 20,
          description: "AI 판정단 상세 논거",
        }),
      });

      if (!consumeRes.ok) {
        const data = await consumeRes.json();
        if (consumeRes.status === 402) {
          setError(`크레딧이 부족합니다. (현재: ${data.balance}P, 필요: ${data.required}P)`);
          return;
        }
        throw new Error(data.error || "크레딧 차감 실패");
      }

      const consumeData = await consumeRes.json();
      setBalance(consumeData.new_balance);

      // Placeholder: Detailed AI reasoning
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setResult({
        ...result,
        reasoning:
          "찬성 측 논거:\n- AI 판정단의 다양한 관점에서 본 긍정적 의견\n- 실제 논거는 준비 중입니다.\n\n반대 측 논거:\n- 잠재적 위험과 부정적 측면\n- 실제 논거는 준비 중입니다.",
      });
    } catch (err: any) {
      setError(err.message || "처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI 판정단</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            다양한 AI가 질문에 대해 판정합니다. (결과 무료, 상세 논거 20P)
          </p>
        </div>
        {balance !== null && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">현재 크레딧</p>
            <p className="text-xl font-bold">{balance.toLocaleString()}P</p>
          </div>
        )}
      </div>

      {!balance && (
        <button
          onClick={fetchBalance}
          className="text-sm text-primary hover:underline"
        >
          크레딧 잔액 확인
        </button>
      )}

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            판정 받을 질문
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="예: '우리 회사는 AI 챗봇을 도입해야 할까요?'"
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
            disabled={isProcessing}
          />
        </div>

        <button
          onClick={handleGetVerdict}
          disabled={!question.trim() || isProcessing}
          className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing && !result ? "판정 중..." : "판정 받기 (무료)"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">오류</p>
            <p className="text-sm text-destructive/90 mt-1">{error}</p>
            {error.includes("크레딧이 부족") && (
              <a
                href="/kr/workspace/billing"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                크레딧 충전하기 →
              </a>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-primary bg-primary/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gavel className="h-5 w-5 text-primary" />
              <p className="font-medium text-primary">판정 결과</p>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              질문: {result.question}
            </p>
            <p className="text-lg font-bold">{result.verdict}</p>
          </div>

          {result.reasoning ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium mb-2">상세 논거</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {result.reasoning}
              </p>
            </div>
          ) : (
            <button
              onClick={handleGetDetailedReasoning}
              disabled={isProcessing}
              className="w-full rounded-lg border-2 border-primary bg-background px-4 py-3 font-medium text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "생성 중..." : "상세 논거 보기 (20P)"}
            </button>
          )}
        </div>
      )}

      <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
        <p className="font-medium">안내</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>기본 판정 결과는 무료로 제공됩니다.</li>
          <li>상세한 논거를 보려면 20 크레딧이 차감됩니다.</li>
          <li>현재 실제 AI 판정은 준비 중이며, 크레딧 차감만 테스트됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
