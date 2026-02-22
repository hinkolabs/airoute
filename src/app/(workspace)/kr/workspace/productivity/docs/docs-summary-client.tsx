"use client";

import { useState } from "react";
import { FileText, Link as LinkIcon, AlertCircle } from "lucide-react";

type DocsSummaryClientProps = {
  workspaceId: string;
};

export default function DocsSummaryClient({ workspaceId }: DocsSummaryClientProps) {
  const [inputType, setInputType] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
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

  const handleSummarize = async () => {
    const input = inputType === "url" ? url.trim() : text.trim();
    if (!input) {
      setError(`${inputType === "url" ? "URL" : "텍스트"}를 입력해주세요.`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // 1. Consume 50 credits
      const consumeRes = await fetch("/api/credits/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          feature_key: "docs_summary",
          amount: 50,
          description: "문서 요약",
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

      // 2. Placeholder: AI summary (not implemented yet)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setResult(
        "문서가 요약되었습니다!\n\n주요 내용:\n- 핵심 포인트 1 (준비중)\n- 핵심 포인트 2 (준비중)\n- 핵심 포인트 3 (준비중)\n\n실제 AI 요약은 준비 중입니다."
      );
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
          <h1 className="text-2xl font-bold">문서 요약</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            URL 또는 텍스트를 입력하여 빠르게 요약합니다. (50P)
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
        <div className="flex gap-2">
          <button
            onClick={() => setInputType("url")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              inputType === "url"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <LinkIcon className="inline h-4 w-4 mr-2" />
            URL
          </button>
          <button
            onClick={() => setInputType("text")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              inputType === "text"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            텍스트
          </button>
        </div>

        {inputType === "url" ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              문서 URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/document"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isProcessing}
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">
              문서 내용
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="요약할 텍스트를 입력하세요..."
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              rows={8}
              disabled={isProcessing}
            />
          </div>
        )}

        <button
          onClick={handleSummarize}
          disabled={
            isProcessing ||
            (inputType === "url" ? !url.trim() : !text.trim())
          }
          className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "요약 중..." : "요약하기 (50P)"}
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
        <div className="rounded-lg border border-primary bg-primary/10 p-4">
          <p className="font-medium text-primary mb-2">요약 결과</p>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {result}
          </p>
        </div>
      )}

      <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
        <p className="font-medium">안내</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>문서 요약은 50 크레딧이 차감됩니다.</li>
          <li>현재 실제 AI 요약은 준비 중이며, 크레딧 차감만 테스트됩니다.</li>
          <li>URL 입력 시 웹 페이지를 자동으로 가져와 요약합니다.</li>
        </ul>
      </div>
    </div>
  );
}
