import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

const VARIANT_STYLES = {
  primary: 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700',
  secondary: 'bg-zinc-700 text-white hover:bg-zinc-600 active:bg-zinc-500',
  outline: 'border border-zinc-600 text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700',
};

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900';
  const combinedStyles = `${baseStyles} ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={combinedStyles}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={combinedStyles} {...props}>
      {children}
    </button>
  );
}

