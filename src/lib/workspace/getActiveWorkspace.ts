import { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export type WorkspaceType = "personal" | "company";
export type WorkspaceRole = "owner" | "admin" | "member";

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
}

export interface WorkspaceMembership {
  workspace_id: string;
  role: WorkspaceRole;
  display_name?: string | null;
}

export interface ActiveWorkspace {
  workspace: Workspace;
  role: WorkspaceRole;
  workspaceType: WorkspaceType;
  membership: WorkspaceMembership;
}

type CodedError = Error & { code?: string };

type GetActiveWorkspaceOptions = {
  force?: boolean; // bypass cache when true
};

type Cached = {
  userId: string;
  value: ActiveWorkspace;
  at: number;
};

let __activeWorkspaceCache: Cached | null = null;
const CACHE_TTL_MS = 30_000; // keep short; dashboard can still refresh data independently

const BOOTSTRAP_FLAG_PREFIX = "airoute_ws_bootstrapped_";

function getBootstrapFlag(userId: string) {
  return `${BOOTSTRAP_FLAG_PREFIX}${userId}`;
}

function hasBootstrapFlag(userId: string) {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return sessionStorage.getItem(getBootstrapFlag(userId)) === "1";
  } catch {
    return false;
  }
}

function setBootstrapFlag(userId: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(getBootstrapFlag(userId), "1");
  } catch {
    // best effort
  }
}

function clearBootstrapFlag(userId: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(getBootstrapFlag(userId));
  } catch {
    // best effort
  }
}

export async function ensurePersonalWorkspace(user: User): Promise<void> {
  if (!user?.id || typeof window === "undefined") return;
  if (hasBootstrapFlag(user.id)) {
    return;
  }

  const supabase = getBrowserSupabaseClient();

  try {
    const { data: existingMember, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (existingMember) {
      setBootstrapFlag(user.id);
      return;
    }

    const now = new Date().toISOString();
    const cryptoSource =
      typeof globalThis !== "undefined"
        ? (globalThis as typeof globalThis & {
            crypto?: { randomUUID?: () => string };
          }).crypto
        : undefined;
    const workspaceId =
      cryptoSource && typeof cryptoSource.randomUUID === "function"
        ? cryptoSource.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

    const { error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        id: workspaceId,
        type: "personal",
        name: "Personal Workspace",
        created_at: now,
      });

    if (workspaceError) {
      throw workspaceError;
    }

    const rawDisplayName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email ??
      "User";
    const displayName =
      (typeof rawDisplayName === "string" ? rawDisplayName : String(rawDisplayName))
        .trim() || "User";

    const { error: memberInsertError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: "owner",
        display_name: displayName,
        created_at: now,
      });

    if (memberInsertError) {
      throw memberInsertError;
    }

    setBootstrapFlag(user.id);
  } catch (error) {
    clearBootstrapFlag(user.id);
    throw error;
  }
}

export async function getActiveWorkspace(
  user: User | null | undefined,
  options: GetActiveWorkspaceOptions = {}
): Promise<ActiveWorkspace | null> {
  // Hard guard: do not attempt any workspace bootstrap without a resolved authed user.
  // This prevents RLS 403 (auth.uid() is NULL) when the page runs before auth settles.
  if (!user?.id) {
    const noAuthError = new Error(
      "[Workspace] No authenticated user yet. Skip workspace bootstrap."
    ) as CodedError;
    noAuthError.code = "NO_AUTH_USER";
    throw noAuthError;
  }

  const force = !!options.force;
  const userIdForCache = user.id;

  if (!force && userIdForCache && __activeWorkspaceCache?.userId === userIdForCache) {
    const age = Date.now() - __activeWorkspaceCache.at;
    if (age < CACHE_TTL_MS) {
      return __activeWorkspaceCache.value;
    }
  }

  // IMPORTANT: Use the exact same browser Supabase client instance as AuthProvider if available.
  // Otherwise, we may lose the session token and hit RLS (403) as anon.
  const supabase =
    (typeof window !== "undefined" && (window as any).__supabase)
      ? (window as any).__supabase
      : getBrowserSupabaseClient();

  // Ensure session is actually present in this client before doing any writes.
  // If session is missing, auth.uid() will be NULL and RLS will reject inserts.
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw sessionErr;
  if (!sessionData?.session?.access_token) {
    const noSessionError = new Error(
      "[Workspace] No session access_token yet. Skip workspace bootstrap."
    ) as CodedError;
    noSessionError.code = "NO_SESSION";
    throw noSessionError;
  }

  // Debug (keep): confirm this client carries the token before any insert.
  // This helps diagnose "multiple Supabase clients" issues.
  try {
    console.log("[Workspace] session check:", {
      hasToken: !!sessionData.session?.access_token,
      sessionUserId: sessionData.session?.user?.id,
      inputUserId: user.id,
    });
  } catch {}

  const userId = user.id;
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, display_name")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (!membership?.workspace_id) {
    return null;
  }

  const { data: workspaceRow, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, type, created_at")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  if (workspaceError) {
    throw workspaceError;
  }

  if (!workspaceRow?.id) {
    return null;
  }

  const workspaceType = (workspaceRow.type as WorkspaceType) ?? "personal";
  const role = (membership.role as WorkspaceRole) ?? "member";

  const activeWorkspace: ActiveWorkspace = {
    workspace: {
      id: workspaceRow.id,
      name: workspaceRow.name,
      type: workspaceType,
    },
    role,
    workspaceType,
    membership: {
      workspace_id: membership.workspace_id,
      role,
      display_name: membership.display_name ?? null,
    },
  };

  __activeWorkspaceCache = {
    userId: user.id,
    value: activeWorkspace,
    at: Date.now(),
  };

  return activeWorkspace;
}

export function clearActiveWorkspaceCache() {
  __activeWorkspaceCache = null;
}
