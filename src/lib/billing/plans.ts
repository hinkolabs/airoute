// AIROUTE Personal Billing Plans - Single Source of Truth
// Policy: 2 months free for yearly => yearly_total = monthly * 10

export type BillingCycle = 'monthly' | 'yearly';
export type PersonalPlanId = 'starter' | 'pro';

export interface PersonalPlan {
  id: PersonalPlanId;
  name_kr: string;
  badge_kr?: string;
  tokens_monthly: number;
  features_kr: string[];
  price_monthly_usd: number;
  // Fixed KRW prices for KR market
  price_monthly_krw: number;
  price_yearly_krw: number;
}

export const PERSONAL_PLANS: readonly PersonalPlan[] = [
  {
    id: 'starter',
    name_kr: '스타터',
    tokens_monthly: 1000,
    features_kr: [
      '월 1,000 토큰',
      '자동화 템플릿 3개',
      '개인 워크스페이스 1개',
      '기본 이메일 지원',
    ],
    price_monthly_usd: 2.9,
    price_monthly_krw: 49000,
    price_yearly_krw: 490000,
  },
  {
    id: 'pro',
    name_kr: '프로',
    badge_kr: '추천',
    tokens_monthly: 10000,
    features_kr: [
      '월 10,000 토큰',
      '자동화 템플릿 무제한',
      '개인 워크스페이스 무제한',
      '우선 이메일 지원',
    ],
    price_monthly_usd: 7.9,
    price_monthly_krw: 99000,
    price_yearly_krw: 990000,
  },
] as const;

/**
 * Yearly total = monthly * 10 (2 months free)
 */
export function getYearlyTotalUsd(monthlyPrice: number): number {
  return monthlyPrice * 10;
}

/**
 * Discount percent = (1 - yearlyTotal / (monthly * 12)) * 100
 * => (1 - 10/12) * 100 = 16.666...
 */
export function getDiscountPercent(monthlyPrice: number): number {
  const yearlyTotal = getYearlyTotalUsd(monthlyPrice);
  return (1 - yearlyTotal / (monthlyPrice * 12)) * 100;
}

/**
 * Format USD: $2.9, $29 (trim trailing .0)
 */
export function formatUsd(amount: number): string {
  const rounded = Math.round(amount * 10) / 10;
  const str = rounded.toString();
  return '$' + (str.endsWith('.0') ? str.slice(0, -2) : str);
}

/**
 * Format USD with 2 decimals: $2.42 (for monthly equivalent)
 */
export function formatUsd2(amount: number): string {
  return '$' + amount.toFixed(2);
}

/**
 * Billing summary text for KR
 */
export function getBillingSummaryKr(
  plan: PersonalPlan,
  cycle: BillingCycle
): string {
  if (cycle === 'monthly') {
    return '월간 결제';
  }
  const yearlyTotal = getYearlyTotalUsd(plan.price_monthly_usd);
  return `연간 결제 ${formatUsd(yearlyTotal)}/년 (2개월 무료)`;
}
