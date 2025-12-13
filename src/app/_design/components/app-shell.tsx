"use client";

import Header from "@/components/layout/header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * AppShell - 전체 앱의 레이아웃 (다크 테마 전용)
 */
export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      {/* Global Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

