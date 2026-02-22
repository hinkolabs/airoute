"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useWorkspace } from "@/app/_providers/workspace-provider";

const __DEV__ = process.env.NODE_ENV !== "production";

type Sub = {
  workspace_id: string;
  plan_key: string;
  billing_cycle: string;
  status: string;
  seat_count: number;
  current_period_end?: string | null;
  updated_at?: string | null;
} | null;

export default function BillingSuccessPage() {
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();

  const workspaceId = useMemo(() => {
    // Prefer: active workspace id (best)
    const id = activeWorkspace?.workspace?.id;
    if (id) return id;
    // Fallback: sessionStorage saved when starting checkout
    if (typeof window !== "undefined") {
      return window.sessionStorage.getItem("ar_last_workspace_id");
    }
    return null;
  }, [activeWorkspace?.workspace?.id]);

  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<Sub>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSub = async () => {
    if (!workspaceId) {
      setError("워크스페이스 정보를 찾지 못했습니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspace/subscription?workspace_id=${encodeURIComponent(workspaceId)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "구독 조회에 실패했습니다");
      setSub(data?.subscription ?? null);
      if (data?.subscription?.status === "active" || data?.subscription?.status === "trialing") {
        router.replace("/kr/workspace");
        return;
      }
      setLoading(false);
    } catch (err: any) {
      if (__DEV__) {
        console.error("[BillingSuccess] subscription fetch failed:", {
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
          code: err?.code,
          json: (() => { try { return JSON.stringify(err); } catch { return "[unstringifiable]"; } })(),
        });
      }
      setError(err?.message ?? "결제 확인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  useEffect(() => {
    // session_id exists but we don't need to call Stripe here; webhook already updated DB.
    // We only refetch DB subscription and redirect when active.
    fetchSub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-xl font-semibold">결제가 완료되었습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        결제 확정은 몇 초 정도 걸릴 수 있습니다. 자동으로 확인 후 워크스페이스로 이동합니다.
      </p>

      <div className="mt-6 rounded-lg border p-4">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <div className="text-sm">결제 상태 확인 중...</div>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="text-sm text-destructive">{error}</div>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              onClick={fetchSub}
            >
              다시 확인
            </button>
            <button
              type="button"
              className="ml-2 inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm"
              onClick={() => router.replace("/kr/workspace")}
            >
              워크스페이스로 이동
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm">
              현재 상태: <span className="font-medium">{sub?.status ?? "none"}</span>
            </div>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              onClick={() => router.replace("/kr/workspace")}
            >
              워크스페이스로 이동
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
