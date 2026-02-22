import { CreditCard, Coins, Users } from "lucide-react";

interface StatusCardsProps {
  planKey: string | null;
  isActive: boolean;
  tokenBalance: number;
  memberCount: number;
  workspaceType: "personal" | "company";
}

export default function StatusCards({
  planKey,
  isActive,
  tokenBalance,
  memberCount,
  workspaceType,
}: StatusCardsProps) {
  const displayPlan = planKey === "starter" ? "Starter" : planKey === "pro" ? "Pro" : "Free";
  const displayStatus = isActive ? "활성" : "비활성";

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Subscription Status */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">구독 플랜</p>
            <p className="text-lg font-semibold text-foreground">
              {displayPlan}
            </p>
            <p className="text-xs text-muted-foreground">{displayStatus}</p>
          </div>
        </div>
      </div>

      {/* Token Balance */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">토큰 잔액</p>
            <p className="text-lg font-semibold text-foreground">
              {tokenBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Member Count - only show for company workspaces */}
      {workspaceType === "company" && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">멤버 수</p>
              <p className="text-lg font-semibold text-foreground">
                {memberCount}명
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
