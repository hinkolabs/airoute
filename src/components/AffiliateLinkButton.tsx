'use client';

import { ReactNode, MouseEvent, AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type Placement = 'tool_card' | 'tool_detail' | 'route_step' | 'route_detail' | 'best3' | 'trending' | 'guide_cta' | 'guide' | 'guide_cta_bottom';

interface AffiliateLinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
  href: string;
  partnerName?: string;
  placement: Placement;
  toolSlug?: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
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
 * AffiliateLinkButton - Unified outbound link tracking component
 * 
 * Tracks all external affiliate/official links via GA4 without blocking navigation.
 * Renders as an <a> tag with button styling.
 */
export default function AffiliateLinkButton({
  href,
  partnerName,
  placement,
  toolSlug,
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: AffiliateLinkButtonProps) {
  
  // Extract partner name from domain if not provided
  const getPartnerName = (): string => {
    if (partnerName) return partnerName;
    
    try {
      const url = new URL(href);
      const hostname = url.hostname.replace('www.', '');
      return hostname.split('.')[0] || hostname;
    } catch {
      return 'unknown';
    }
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    
    const partner = getPartnerName();
    
    // Localhost-only debug log and assertion
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('[AffiliateLinkButton CLICK]', {
        href,
        partnerName: partner,
        placement,
        toolSlug: toolSlug || 'none',
      });
    }
    
    // Fire GA4 event
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'affiliate_click', {
          partner_name: partner,
          link_url: href,
          placement,
          tool_slug: toolSlug || 'none',
          event_category: 'engagement',
          event_label: `${placement}_${partner}`,
        });
        console.log('📊 GA4 Affiliate Click:', {
          partner_name: partner,
          link_url: href,
          placement,
          tool_slug: toolSlug || 'none',
        });
      } catch (error) {
        console.error('GA4 tracking error:', error);
      }
    } else {
      // Development/local environment - log to console
      console.log('📊 GA4 Affiliate Click:', {
        partner_name: partner,
        link_url: href,
        placement,
        tool_slug: toolSlug || 'none',
      });
    }

    // Do NOT preventDefault - let navigation proceed naturally
  };

  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium rounded-full',
    'transition-colors duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className={baseStyles}
      data-affiliate="1"
      {...props}
    >
      {children}
    </a>
  );
}


