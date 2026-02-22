"use client";

import { Lock, Rocket } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/app/_providers/workspace-provider";

interface PlaceholderClientProps {
  title: string;
  description: string;
  featureKey: string;
}

export default function PlaceholderClient({
  title,
  description,
  featureKey,
}: PlaceholderClientProps) {
  const { entitlement, activeWorkspace } = useWorkspace();
  const isPaidForLock = entitlement?.capabilities?.is_paid_for_lock === true;
  const isCompany = activeWorkspace?.workspace.type === "company";

  // Company workspace는 항상 unlock
  const isLocked = !isCompany && !isPaidForLock;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8 text-center shadow-lg">
        {isLocked ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <Lock className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h1 className="mb-3 text-2xl font-bold text-foreground">{title}</h1>
            <p className="mb-6 text-sm text-muted-foreground">{description}</p>
            <div className="mb-6 rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-foreground">
                이 기능은 유료 플랜에서 사용 가능합니다.
              </p>
            </div>
            <Link
              href="/kr/workspace/billing"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Rocket className="h-4 w-4" />
              플랜 업그레이드
            </Link>
          </>
        ) : (
          <>
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Rocket className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="mb-3 text-2xl font-bold text-foreground">{title}</h1>
            <p className="mb-6 text-sm text-muted-foreground">{description}</p>
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                이 기능은 준비 중입니다. 곧 만나보실 수 있습니다!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
