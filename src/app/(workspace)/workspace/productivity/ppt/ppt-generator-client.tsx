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
        throw new Error("Failed to fetch balance");
      }
      const data = await res.json();
      setBalance(data.balance);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching balance.");
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
          description: "PPT Generation",
        }),
      });

      if (!consumeRes.ok) {
        const errorData = await consumeRes.json();
        
        // Insufficient credits
        if (errorData.code === "INSUFFICIENT_CREDITS") {
          setError(
            `Insufficient credits. (Required: ${PPT_COST}P, Available: ${errorData.balance}P)`
          );
          setBalance(errorData.balance);
          setIsGenerating(false);
          return;
        }

        throw new Error(errorData.error || "Failed to consume credits");
      }

      const consumeData = await consumeRes.json();
      setBalance(consumeData.new_balance);

      // 2. TODO: Actual PPT generation logic here
      // For now, just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert("PPT generation completed! (Demo)");
      
      // Refresh balance
      await fetchBalance();
    } catch (err: any) {
      setError(err.message || "An error occurred during PPT generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGoToBilling = () => {
    const currentPath = encodeURIComponent("/workspace/productivity/ppt");
    router.push(`/workspace/billing?next=${currentPath}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">PPT Generator</h1>
        <p className="mt-2 text-sm text-slate-600">
          AI creates presentations automatically for you.
        </p>

        {/* Balance Section */}
        <div className="mt-6 rounded-md bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Credit Balance</p>
              {balance !== null ? (
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {balance.toLocaleString()}P
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Click button to check balance</p>
              )}
            </div>
            <button
              onClick={fetchBalance}
              disabled={loadingBalance}
              className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
            >
              {loadingBalance ? "Checking..." : "Check Balance"}
            </button>
          </div>
        </div>

        {/* Cost Info */}
        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            💡 Each PPT generation costs <strong>{PPT_COST}P</strong>.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
            {error.includes("Insufficient credits") && (
              <button
                onClick={handleGoToBilling}
                className="mt-2 text-sm font-medium text-red-600 underline hover:text-red-700"
              >
                Top up credits →
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
            {isGenerating ? "Generating..." : "Generate PPT"}
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <a
            href="/workspace"
            className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
          >
            ← Back to Workspace
          </a>
        </div>
      </div>
    </div>
  );
}
