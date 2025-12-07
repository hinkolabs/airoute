"use client";

import { cn } from "@/lib/utils";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-sm",
  secondary:
    "bg-slate-800 text-slate-100 hover:bg-slate-700 shadow-sm",
  outline:
    "border border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-emerald-300 bg-transparent",
  ghost:
    "text-slate-300 hover:text-emerald-400 bg-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = cn(
    "inline-flex items-center justify-center rounded-2xl font-medium",
    "transition-all duration-150",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseStyles}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={baseStyles} {...props}>
      {children}
    </button>
  );
}
