'use client';

import { ReactNode, MouseEvent, AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { logEventToDB } from '@/lib/event-logger';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type Placement = 'tool_card' | 'tool_detail' | 'route_detail' | 'route_best_tools' | 'best3' | 'trending' | 'guide_cta' | 'guide' | 'guide_cta_bottom' | 'category_best3' | string;

interface AffiliateLinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
  href: string | null | undefined;
  partnerName?: string;
  placement: Placement;
  toolSlug?: string;
  routeSlug?: string | null;
  guideSlug?: string | null;
  stepIndex?: number | null;
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
  routeSlug,
  guideSlug,
  stepIndex,
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: AffiliateLinkButtonProps) {
  
  // If href is null/undefined, render as disabled button
  if (!href) {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-full',
      'transition-colors duration-200',
      'opacity-50 cursor-not-allowed',
      variantStyles[variant],
      sizeStyles[size],
      className
    );
    
    return (
      <button
        type="button"
        disabled
        className={baseStyles}
      >
        {children}
      </button>
    );
  }

  // Determine if this is internal/test traffic
  const isInternalTraffic = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const hostname = window.location.hostname;
    
    // Development environments
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    
    // Vercel preview deployments
    if (hostname.includes('vercel.app')) return true;
    
    // Any other preview/staging domains (add as needed)
    if (hostname.includes('preview') || hostname.includes('staging')) return true;
    
    return false;
  };

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    
    // Use tool_slug as partner_name for consistency (stable identifier, no casing issues)
    const partnerNameForTracking = toolSlug || 'unknown';
    const isInternal = isInternalTraffic();
    
    // Localhost-only debug log
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('[AffiliateLinkButton CLICK]', {
        href,
        partnerName: partnerNameForTracking,
        placement,
        toolSlug: toolSlug || 'none',
        routeSlug: routeSlug || 'none',
        guideSlug: guideSlug || 'none',
        stepIndex: stepIndex || 'none',
        isInternalTraffic: isInternal,
      });
    }
    
    // Fire GA4 event with tool_slug as partner_name
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'affiliate_click', {
          partner_name: partnerNameForTracking,
          tool_slug: toolSlug || 'none',
          link_url: href,
          placement,
          route_slug: routeSlug ?? null,
          guide_slug: guideSlug ?? null,
          is_internal_traffic: isInternal,
        });
        console.log('📊 GA4 Affiliate Click:', {
          partner_name: partnerNameForTracking,
          tool_slug: toolSlug || 'none',
          link_url: href,
          placement,
          route_slug: routeSlug ?? null,
          guide_slug: guideSlug ?? null,
          is_internal_traffic: isInternal,
        });
      } catch (error) {
        console.error('GA4 tracking error:', error);
      }
    } else {
      // Development/local environment - log to console
      console.log('📊 GA4 Affiliate Click:', {
        partner_name: partnerNameForTracking,
        tool_slug: toolSlug || 'none',
        link_url: href,
        placement,
        route_slug: routeSlug ?? null,
        guide_slug: guideSlug ?? null,
        is_internal_traffic: isInternal,
      });
    }

    // Log to DB (non-blocking)
    // Determine event_type and target_type based on context
    // Route step clicks (with stepIndex) => route_outbound_click
    // Other clicks with routeSlug (non-step) => tool_click with ref_route_slug
    // Everything else => tool_click
    const isRouteStep = !!(routeSlug && stepIndex);
    const isRouteContext = !!(routeSlug && !stepIndex);
    
    const eventType = isRouteStep ? 'route_outbound_click' : 'tool_click';
    const targetType = isRouteStep ? 'route' : 'tool';
    const targetSlug = isRouteStep ? routeSlug : (toolSlug || 'unknown');
    const source = placement || 'other';

    logEventToDB({
      event_type: eventType,
      target_type: targetType,
      target_slug: targetSlug,
      source,
      metadata: {
        partner_name: partnerNameForTracking,
        tool_slug: toolSlug || null,
        link_url: href,
        placement,
        route_slug: isRouteStep ? routeSlug : null,
        ref_route_slug: isRouteContext ? routeSlug : null,
        guide_slug: guideSlug || null,
        step_index: stepIndex ?? null,
        is_internal_traffic: isInternal,
      },
    });

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


