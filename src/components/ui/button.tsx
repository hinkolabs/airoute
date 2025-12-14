'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700',
  secondary:
    'bg-slate-700 text-slate-100 hover:bg-slate-600 active:bg-slate-500',
  ghost:
    'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

/**
 * Button - Reusable button component with variants and sizes.
 * Uses rounded-full style with emerald-500 as primary color.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium rounded-full',
    'transition-colors duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
    'disabled:opacity-50 disabled:cursor-not-allowed',
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






