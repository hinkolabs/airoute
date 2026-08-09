"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "새 소싱", href: "/kr/workspace/admin/shopping-shorts" },
  { label: "소싱함", href: "/kr/workspace/admin/shopping-shorts/favorites" },
  { label: "검색 기록", href: "/kr/workspace/admin/shopping-shorts/history" },
];

export default function ShortsSourcingNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active =
          tab.href === "/kr/workspace/admin/shopping-shorts"
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
