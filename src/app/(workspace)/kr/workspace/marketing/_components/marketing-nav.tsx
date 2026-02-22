"use client";

import Link from "next/link";

interface MarketingNavProps {
  active: "automation" | "instant" | "history" | "settings";
}

export function MarketingNav({ active }: MarketingNavProps) {
  const navItems = [
    {
      id: "automation" as const,
      label: "자동화 마케팅",
      href: "/kr/workspace/marketing",
      disabled: false,
    },
    {
      id: "instant" as const,
      label: "즉시 발송(토큰)",
      href: "/kr/workspace/marketing/instant",
      disabled: true,
      badge: "준비중",
    },
    {
      id: "history" as const,
      label: "발송 히스토리",
      href: "/kr/workspace/marketing/history",
      disabled: true,
      badge: "준비중",
    },
    {
      id: "settings" as const,
      label: "설정",
      href: "/kr/workspace/marketing/settings",
      disabled: true,
      badge: "준비중",
    },
  ];

  return (
    <>
      {/* Desktop Left Navigation */}
      <nav className="hidden lg:flex lg:w-[220px] lg:flex-col lg:border-r lg:border-border lg:bg-card/30 lg:p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = active === item.id;
            const baseClasses = "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition";
            
            if (item.disabled) {
              return (
                <div
                  key={item.id}
                  className={`${baseClasses} cursor-not-allowed text-muted-foreground/50`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${baseClasses} ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Horizontal Navigation */}
      <nav className="lg:hidden border-b border-border bg-card/30">
        <div className="flex overflow-x-auto px-4 py-2">
          <div className="flex gap-2">
            {navItems.map((item) => {
              const isActive = active === item.id;
              const baseClasses = "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition";
              
              if (item.disabled) {
                return (
                  <div
                    key={item.id}
                    className={`${baseClasses} cursor-not-allowed text-muted-foreground/50`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`${baseClasses} ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
