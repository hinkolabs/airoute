"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/app/_providers/auth-provider";
import { useSearchParams } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { ActiveWorkspace, Workspace, WorkspaceRole } from "@/lib/workspace/getActiveWorkspace";
import * as entitlements from "@/lib/billing/entitlements";
import type { WorkspaceSubscription, Entitlement } from "@/lib/billing/entitlements";

// Re-export types for convenience
export type { WorkspaceSubscription, Entitlement } from "@/lib/billing/entitlements";

const __DEV__ = process.env.NODE_ENV !== "production";
const ACTIVE_WORKSPACE_KEY = "airoute_active_ws_id";

type EntitlementsArgs = {
  workspaceType: "personal" | "company";
  subscription: WorkspaceSubscription | null;
  workspaceRole?: 'owner' | 'admin' | 'member' | 'system_admin' | null;
};

function computeEntitlement(args: EntitlementsArgs): Entitlement {
  const fn =
    (entitlements as any).getEntitlements ??
    (entitlements as any).getEntitlement; // fallback if someone exported singular by mistake
  if (typeof fn !== "function") {
    if (__DEV__) {
      console.error("[WorkspaceProvider] entitlements export missing. Available exports:", Object.keys(entitlements as any));
    }
    return {} as Entitlement;
  }
  return fn(args) as Entitlement;
}

interface WorkspaceContextType {
  activeWorkspace: ActiveWorkspace | null;
  workspaces: Workspace[];
  membersCount: number;
  subscription: WorkspaceSubscription | null;
  entitlement: Entitlement;
  loading: boolean;
  error: string | null;
  refreshWorkspace: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [subscription, setSubscription] = useState<WorkspaceSubscription | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement>(
    computeEntitlement({ workspaceType: "personal", subscription: null, workspaceRole: null })
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = async () => {
    if (!user?.id) {
      setActiveWorkspace(null);
      setWorkspaces([]);
      setMembersCount(0);
      setSubscription(null);
      setEntitlement(computeEntitlement({ workspaceType: "personal", subscription: null, workspaceRole: null }));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = getBrowserSupabaseClient();

      // Check if a specific workspace is requested via query param
      const requestedWorkspaceId = searchParams?.get("ws");

      // Get all workspaces user is a member of
      const { data: memberships, error: membershipError } = await supabase
        .from("workspace_members")
        .select("workspace_id, role, display_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (membershipError) {
        throw membershipError;
      }

      if (!memberships || memberships.length === 0) {
        // No workspace found - this shouldn't happen if ensurePersonalWorkspace is called
        setActiveWorkspace(null);
        setWorkspaces([]);
        setMembersCount(0);
        setSubscription(null);
        setEntitlement(computeEntitlement({ workspaceType: "personal", subscription: null, workspaceRole: null }));
        setLoading(false);
        return;
      }

      // Get workspace details
      const workspaceIds = memberships.map((m: any) => m.workspace_id);
      const { data: workspaceRows, error: workspaceError } = await supabase
        .from("workspaces")
        .select("id, name, type, created_at")
        .in("id", workspaceIds);

      if (workspaceError) {
        throw workspaceError;
      }

      // Map workspaces
      const workspaceList: Workspace[] = (workspaceRows || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        type: (row.type as "personal" | "company") ?? "personal",
      }));

      setWorkspaces(workspaceList);

      // Determine active workspace with strict priority
      let targetMembership = null;
      let selectionReason = "";
      
      // Priority (a): requested workspace via ?ws= query param
      if (requestedWorkspaceId) {
        const found = memberships.find((m: any) => m.workspace_id === requestedWorkspaceId);
        if (found) {
          targetMembership = found;
          selectionReason = "ws-param";
        }
      }
      
      // Priority (b): saved workspace from localStorage
      if (!targetMembership) {
        try {
          const savedWorkspaceId = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
          if (savedWorkspaceId) {
            const found = memberships.find((m: any) => m.workspace_id === savedWorkspaceId);
            if (found) {
              targetMembership = found;
              selectionReason = "saved";
            }
          }
        } catch (e) {
          // localStorage might be unavailable
        }
      }
      
      // Priority (c): single personal workspace as fallback
      if (!targetMembership) {
        const personalWorkspaces = memberships.filter((m: any) => {
          const ws = workspaceList.find((w: any) => w.id === m.workspace_id);
          return ws && ws.type === "personal";
        });
        if (personalWorkspaces.length === 1) {
          targetMembership = personalWorkspaces[0];
          selectionReason = "personal-fallback";
        }
      }
      
      // Priority (d): first membership as last resort
      if (!targetMembership) {
        targetMembership = memberships[0];
        selectionReason = "first-fallback";
      }

      const targetWorkspace = workspaceList.find(
        (w) => w.id === targetMembership.workspace_id
      );

      if (!targetWorkspace) {
        throw new Error("워크스페이스를 찾을 수 없습니다");
      }
      
      // Persist to localStorage ONLY if not a default fallback
      if (selectionReason === "ws-param" || selectionReason === "saved") {
        try {
          localStorage.setItem(ACTIVE_WORKSPACE_KEY, targetWorkspace.id);
        } catch (e) {
          // localStorage might be unavailable
        }
      }
      
      if (__DEV__) {
        console.log("[WorkspaceProvider] Workspace selection:", {
          requestedWorkspaceId,
          savedWorkspaceId: (() => {
            try {
              return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
            } catch {
              return null;
            }
          })(),
          chosen: targetWorkspace.id,
          reason: selectionReason,
        });
      }

      // Count members in active workspace
      const { count: memberCount, error: countError } = await supabase
        .from("workspace_members")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", targetWorkspace.id);

      if (countError) {
        console.warn("[WorkspaceProvider] Failed to count members:", countError);
        setMembersCount(1); // fallback
      } else {
        setMembersCount(memberCount || 1);
      }

      const active: ActiveWorkspace = {
        workspace: targetWorkspace,
        role: (targetMembership.role as WorkspaceRole) ?? "member",
        workspaceType: targetWorkspace.type,
        membership: {
          workspace_id: targetMembership.workspace_id,
          role: (targetMembership.role as WorkspaceRole) ?? "member",
          display_name: targetMembership.display_name ?? null,
        },
      };

      setActiveWorkspace(active);
      if (__DEV__) {
        console.log("[WorkspaceProvider] Active workspace loaded:", active);
      }

      // Fetch subscription for active workspace
      let fetchedSubscription: WorkspaceSubscription | null = null;
      try {
        const subRes = await fetch(`/api/workspace/subscription?workspace_id=${targetWorkspace.id}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          fetchedSubscription = subData.subscription || null;
          setSubscription(fetchedSubscription);
          if (__DEV__) {
            console.log("[WorkspaceProvider] Subscription loaded:", fetchedSubscription);
          }
        } else {
          console.warn("[WorkspaceProvider] Failed to fetch subscription");
          setSubscription(null);
        }
      } catch (subError) {
        console.warn("[WorkspaceProvider] Error fetching subscription:", subError);
        setSubscription(null);
      }

      // Calculate entitlement
      const calculatedEntitlement = computeEntitlement({
        workspaceType: targetWorkspace.type,
        subscription: fetchedSubscription,
        workspaceRole: active.role,
      });
      setEntitlement(calculatedEntitlement);
      if (__DEV__) {
        console.log("[WorkspaceProvider] Entitlement calculated:", calculatedEntitlement);
      }
    } catch (err) {
      console.error("[WorkspaceProvider] Error loading workspace:", err);
      setError(err instanceof Error ? err.message : "워크스페이스 로드 중 오류가 발생했습니다");
      setActiveWorkspace(null);
      setWorkspaces([]);
      setMembersCount(0);
      setSubscription(null);
      setEntitlement(computeEntitlement({ workspaceType: "personal", subscription: null, workspaceRole: null }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      // Wait for auth to settle
      return;
    }

    loadWorkspace();
  }, [user?.id, authLoading, searchParams?.get("ws")]);

  const refreshWorkspace = async () => {
    await loadWorkspace();
  };

  const switchWorkspace = async (workspaceId: string) => {
    // Persist user-selected workspace immediately
    try {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId);
    } catch (e) {
      // localStorage might be unavailable
    }
    // Reload workspace with the new selection
    await loadWorkspace();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        workspaces,
        membersCount,
        subscription,
        entitlement,
        loading,
        error,
        refreshWorkspace,
        switchWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
