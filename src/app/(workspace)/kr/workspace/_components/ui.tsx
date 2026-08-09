/**
 * Workspace Design Primitives — Toss-style clean/minimal
 * Used by all KR workspace pages for visual consistency.
 * Globals CSS / tailwind.config are NOT modified.
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// PageContainer — standard max-width, padding, vertical spacing
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// PageHeader — title + subtitle + optional right action slot
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Card — base white card
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// SectionCard — card with a label header row
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// EmptyState — centered icon + message + optional action
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// StatPill — compact colored pill for summary stats
// ─────────────────────────────────────────────────────────────
export function StatPill({
  icon,
  label,
  count,
  color = "default",
}: {
  icon?: ReactNode;
  label: string;
  count?: number;
  color?: "default" | "emerald" | "blue" | "violet" | "amber";
}) {
  const colorMap = {
    default: "bg-muted border-border text-foreground",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    violet: "bg-violet-50 border-violet-200 text-violet-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
        colorMap[color]
      )}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SkeletonRow — loading placeholder bars
// ─────────────────────────────────────────────────────────────
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      <div className="h-4 w-3/4 rounded-lg bg-muted" />
      <div className="h-4 w-1/2 rounded-lg bg-muted" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("animate-pulse space-y-3", className)}>
      <div className="h-4 w-2/3 rounded-lg bg-muted" />
      <div className="h-3 w-full rounded-lg bg-muted" />
      <div className="h-3 w-5/6 rounded-lg bg-muted" />
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Divider — thin horizontal rule with spacing
// ─────────────────────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}

// ─────────────────────────────────────────────────────────────
// InfoBanner — contextual info/warning banner
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// RequiredBadge / OptionalBadge
// ─────────────────────────────────────────────────────────────
export function RequiredBadge() {
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
      필수
    </span>
  );
}

export function OptionalBadge() {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      선택
    </span>
  );
}
