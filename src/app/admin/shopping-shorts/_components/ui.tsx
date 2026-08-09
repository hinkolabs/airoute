/**
 * Minimal design primitives for the /admin/shopping-shorts pages.
 * Self-contained copy (no dependency on the KR workspace UI kit) since this
 * feature is intentionally decoupled from /kr/workspace — see /admin/login.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-[960px] px-5 py-8 space-y-6 md:px-6", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-base text-muted-foreground leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  highlight,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-card px-5 py-5 shadow-sm",
        highlight ? "border-primary/40" : "border-border",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
  className,
  highlight,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={className} highlight={highlight}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {icon && (
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-base font-bold text-foreground leading-snug">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      <div className="h-4 w-3/4 rounded-lg bg-muted" />
      <div className="h-4 w-1/2 rounded-lg bg-muted" />
    </div>
  );
}

export function InfoBanner({
  children,
  variant = "info",
  className,
}: {
  children: ReactNode;
  variant?: "info" | "warning" | "success" | "error";
  className?: string;
}) {
  const variantMap = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
  };
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        variantMap[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
