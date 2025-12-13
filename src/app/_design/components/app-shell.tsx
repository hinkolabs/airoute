"use client";

import { ThemeProvider, useTheme } from "@/app/_design/providers/theme-provider";
import Header from "@/components/layout/header";
import { MobileBottomNav } from "./page";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * AppShell 내부 컨텐츠 - useTheme 사용을 위해 분리
 */
function AppShellContent({ children }: AppShellProps) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-colors duration-200",
        theme === "day"
          ? "bg-[#F5F5F7] text-slate-900"
          : "bg-[#000814] text-slate-50"
      )}
    >
      {/* Global Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

/**
 * AppShell - 전체 앱의 레이아웃을 담당하는 클라이언트 컴포넌트.
 * ThemeProvider를 포함하여 Header, Main, MobileBottomNav를 감싸고,
 * 어디서든 useTheme()를 사용할 수 있도록 보장합니다.
 */
export default function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider>
      <AppShellContent>{children}</AppShellContent>
    </ThemeProvider>
  );
}

