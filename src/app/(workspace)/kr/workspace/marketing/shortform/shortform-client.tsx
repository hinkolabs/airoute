"use client";

import { useState } from "react";
import { Upload, Video, AlertCircle } from "lucide-react";

type ShortformClientProps = {
  workspaceId: string;
};

export default function ShortformClient({ workspaceId }: ShortformClientProps) {
  const [file, setFile] = useState<File | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("영상 파일을 선택해주세요.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // 1. Consume 300 credits
      const consumeRes = await fetch("/api/credits/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          feature_key: "shortform",
          amount: 300,
          description: "숏폼 제작",
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

      // 2. Placeholder: AI/FFmpeg processing (not implemented yet)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setResult("숏폼 제작이 완료되었습니다! (실제 AI 처리는 준비 중입니다)");
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
          <h1 className="text-2xl font-bold">숏폼 제작</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            긴 영상을 숏폼으로 변환합니다. (300P)
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
          <label className="block text-sm font-medium mb-2">영상 파일 업로드</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="flex-1 text-sm file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!file || isProcessing}
          className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "처리 중..." : "숏폼 제작하기 (300P)"}
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
          <p className="font-medium text-primary">{result}</p>
          <p className="text-sm text-muted-foreground mt-2">
            생성된 숏폼은 준비 중입니다.
          </p>
        </div>
      )}

      <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
        <p className="font-medium">안내</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>숏폼 제작은 300 크레딧이 차감됩니다.</li>
          <li>현재 실제 AI 영상 처리는 준비 중이며, 크레딧 차감만 테스트됩니다.</li>
          <li>지원 형식: MP4, MOV, AVI 등</li>
        </ul>
      </div>
    </div>
  );
}
