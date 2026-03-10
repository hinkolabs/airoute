export type BillingCycle = 'monthly' | 'yearly' | string;
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'incomplete'
  | 'canceled'
  | 'past_due'
  | 'unpaid'
  | string;

export interface WorkspaceSubscriptionLite {
  plan_key: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  seat_count: number;
  current_period_end?: string | null;
  updated_at?: string | null;
}

// Re-export for convenience
export type WorkspaceSubscription = WorkspaceSubscriptionLite;
export type Entitlement = ReturnType<typeof getEntitlements>;

export function getEntitlements(params: {
  workspaceType?: string | null;
  subscription?: WorkspaceSubscriptionLite | null;
  workspaceRole?: 'owner' | 'admin' | 'member' | 'system_admin' | null;
}) {
  const status = params.subscription?.status ?? null;
  const currentPeriodEnd = params.subscription?.current_period_end ?? null;

  // cancelled 상태여도 current_period_end가 미래면 접근 허용 (해지 예약 중)
  const isCancelledWithAccess =
    status === 'cancelled' &&
    currentPeriodEnd != null &&
    new Date(currentPeriodEnd) > new Date();

  const isActive = status === 'active' || status === 'trialing' || isCancelledWithAccess;
  const planKey = params.subscription?.plan_key ?? null;
  const billingCycle = params.subscription?.billing_cycle ?? null;
  const seatCount = params.subscription?.seat_count ?? 0;
  const workspaceType = params.workspaceType ?? 'personal';
  const workspaceRole = params.workspaceRole ?? 'member';

  // Determine if user can create additional workspaces
  // Starter plan (no subscription or inactive): limited to 1 personal workspace
  const isStarterPlan = !isActive || !planKey;
  const canCreateWorkspace = !isStarterPlan; // Pro+ can create unlimited workspaces

  // Capabilities
  const isPaidBySubscription = isActive;
  const canManageBilling = 
    workspaceRole === 'owner' || 
    workspaceRole === 'admin' || 
    workspaceRole === 'system_admin';
  const isPaidForLock = workspaceType === 'company' ? true : isPaidBySubscription;

  return {
    isActive,
    planKey,
    billingCycle,
    seatCount,
    currentPeriodEnd,
    // Access to workspace is auth-gated (not pay-gated). Paid features are gated.
    canUseWorkspace: true,
    canUsePaidFeatures: isActive,
    canUseWorkspaceFeatures: isActive,
    canCreateWorkspace,
    workspace: {
      type: workspaceType as 'personal' | 'company',
    },
    capabilities: {
      is_paid_by_subscription: isPaidBySubscription,
      can_manage_billing: canManageBilling,
      is_paid_for_lock: isPaidForLock,
    },
  };
}
