"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, Coins, User, LogOut, Settings, Plus, Building2, Check } from "lucide-react";
import { useAuth } from "@/app/_providers/auth-provider";
import { useWorkspace } from "@/app/_providers/workspace-provider";
import CreateWorkspaceModal from "./create-workspace-modal";
import CreditTopupModal from "./credit-topup-modal";

export default function WorkspaceHeader() {
  const { user, signOut } = useAuth();
  const { activeWorkspace, workspaces, loading: workspaceLoading } = useWorkspace();
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  // Fetch balance from API
  const fetchBalance = async () => {
    if (!activeWorkspace?.workspace.id) return;
    
    setLoadingBalance(true);
    try {
      const res = await fetch(`/api/credits/balance?workspace_id=${activeWorkspace.workspace.id}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (err) {
      console.error("[WorkspaceHeader] Failed to fetch balance:", err);
    } finally {
      setLoadingBalance(false);
    }
  };

  // Load balance when active workspace changes
  useEffect(() => {
    if (activeWorkspace?.workspace.id) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [activeWorkspace?.workspace.id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateSuccess = async (workspaceId: string) => {
    setIsCreateModalOpen(false);
    // Note: For team workspaces, payment redirect handles the flow
    // This callback is not used anymore but kept for compatibility
  };

  const handleWorkspaceSwitch = (workspaceId: string) => {
    setIsWorkspaceMenuOpen(false);
    router.push(`/workspace?ws=${workspaceId}`);
  };

  const handleToppedUp = (newBalance: number) => {
    setBalance(newBalance);
    setIsTopupModalOpen(false);
  };

  const currentWorkspaceName = activeWorkspace?.workspace.name || "Personal Workspace";
  const isLoading = workspaceLoading;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      {/* Left: Logo + Workspace Selector */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/logo/airoute-symbol.png"
              alt="Airoute Symbol"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
          <span className="hidden text-base font-semibold tracking-tight sm:inline-block">
            <span className="text-foreground">AI</span>
            <span className="text-primary">ROUTE</span>
          </span>
        </Link>

        {/* Workspace Selector Dropdown */}
        {user && (
          <div className="relative" ref={workspaceMenuRef}>
            <button
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
              disabled={isLoading}
            >
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{currentWorkspaceName}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Workspace Dropdown Menu */}
            {isWorkspaceMenuOpen && (
              <div className="absolute left-0 top-full mt-2 min-w-[240px] rounded-lg border border-border bg-card shadow-lg z-50">
                <div className="p-2">
                  {/* Workspaces List */}
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Workspaces
                  </div>
                  {workspaces.length > 0 ? (
                    workspaces.map((workspace) => {
                      const isActive = activeWorkspace?.workspace.id === workspace.id;
                      return (
                        <button
                          key={workspace.id}
                          onClick={() => handleWorkspaceSwitch(workspace.id)}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <Building2 className="h-4 w-4" />
                          <span className="flex-1 text-left">{workspace.name}</span>
                          {isActive && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No workspaces
                    </div>
                  )}
                  <div className="my-2 h-px bg-border" />

                  {/* Add Workspace Button */}
                  <button
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      setIsCreateModalOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Token Badge + Profile Menu */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Token Balance - Clickable */}
            <button
              onClick={() => setIsTopupModalOpen(true)}
              disabled={loadingBalance || !activeWorkspace}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 transition hover:bg-muted hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Coins className="h-4 w-4 text-primary" />
              {loadingBalance ? (
                <span className="text-sm font-medium text-muted-foreground">...</span>
              ) : (
                <span className="text-sm font-medium text-foreground">
                  {balance !== null ? balance.toLocaleString() : "0"}
                </span>
              )}
            </button>

            {/* Profile Menu with Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline-block">
                  {user.email?.split("@")[0]}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 min-w-[200px] rounded-lg border border-border bg-card shadow-lg z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {user.email}
                    </div>
                    <div className="my-1 h-px bg-border" />
                    
                    {/* Settings Option (future) */}
                    <button
                      disabled
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition cursor-not-allowed opacity-50"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>

                    {/* Logout Button */}
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Not logged in: Show login + signup buttons */}
            <Link
              href="/auth/login?next=/workspace"
              className="rounded-lg border border-border bg-transparent px-4 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Sign up
            </Link>
          </>
        )}
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Credit Topup Modal */}
      {activeWorkspace && (
        <CreditTopupModal
          isOpen={isTopupModalOpen}
          onClose={() => setIsTopupModalOpen(false)}
          workspaceId={activeWorkspace.workspace.id}
          onToppedUp={handleToppedUp}
        />
      )}
    </header>
  );
}
