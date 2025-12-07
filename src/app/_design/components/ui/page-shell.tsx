import { cn } from "@/lib/utils";
import React from "react";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * PageShell - 페이지 컨텐츠 래퍼.
 * 배경/텍스트 색상은 AppShell에서 처리하므로 여기서는 레이아웃만 담당.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "py-6 sm:py-8 md:py-10",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col">
        {children}
      </div>
    </div>
  );
}
