"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PptGeneratorClientProps {
  workspaceId: string;
}

export default function PptGeneratorClient({ workspaceId }: PptGeneratorClientProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const PPT_COST = 100;

  // Load balance on mount
  const fetchBalance = async () => {
    setLoadingBalance(true);
    setError(null);
    try {
      const res = await fetch(`/api/credits/balance?workspace_id=${workspaceId}`);
      if (!res.ok) {
        throw new Error("잔액 조회 실패");
      }
      const data = await res.json();
      setBalance(data.balance);
    } catch (err: any) {
      setError(err.message || "잔액 조회 중 오류가 발생했습니다.");
    } finally {
      setLoadingBalance(false);
    }
  };

  // Auto-fetch balance on mount
  useEffect(() => {
    fetchBalance();
  }, []);

  // Generate PPT
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // 1. Consume credits first
      const consumeRes = await fetch("/api/credits/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          feature_key: "ppt_generate",
          amount: PPT_COST,
          description: "PPT 생성",
        }),
      });

      if (!consumeRes.ok) {
        const errorData = await consumeRes.json();
        
        // Insufficient credits
        if (errorData.code === "INSUFFICIENT_CREDITS") {
          setError(
            `크레딧이 부족합니다. (필요: ${PPT_COST}P, 보유: ${errorData.balance}P)`
          );
          setBalance(errorData.balance);
          setIsGenerating(false);
          return;
        }

        throw new Error(errorData.error || "크레딧 차감 실패");
      }

      const consumeData = await consumeRes.json();
      setBalance(consumeData.new_balance);

      // 2. TODO: Actual PPT generation logic here
      // For now, just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("PPT 생성이 완료되었습니다! (데모)");
      
      // Refresh balance
      await fetchBalance();
    } catch (err: any) {
      setError(err.message || "PPT 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGoToBilling = () => {
    const currentPath = encodeURIComponent("/kr/workspace/productivity/ppt");
    router.push(`/kr/workspace/billing?next=${currentPath}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">PPT 생성</h1>
        <p className="mt-2 text-sm text-slate-600">
          AI가 기획한 PPT를 자동으로 만들어줍니다.
        </p>

        {/* Balance Section */}
        <div className="mt-6 rounded-md bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">크레딧 잔액</p>
              {balance !== null ? (
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {balance.toLocaleString()}P
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">조회하려면 버튼을 클릭하세요</p>
              )}
            </div>
            <button
              onClick={fetchBalance}
              disabled={loadingBalance}
              className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
            >
              {loadingBalance ? "조회 중..." : "잔액 조회"}
            </button>
          </div>
        </div>

        {/* Cost Info */}
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            💡 PPT 생성 1회당 <strong>{PPT_COST}P</strong>가 차감됩니다.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
            {error.includes("크레딧이 부족합니다") && (
              <button
                onClick={handleGoToBilling}
                className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-700"
              >
                크레딧 충전하러 가기 →
              </button>
            )}
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? "생성 중..." : "PPT 생성하기"}
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <a
            href="/kr/workspace"
            className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
          >
            ← 워크스페이스로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
