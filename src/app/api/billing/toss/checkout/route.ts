import { NextRequest, NextResponse } from "next/server";
import { getDemoMode } from "@/lib/flags";

/**
 * POST /api/billing/toss/checkout
 * 
 * Toss Payments checkout endpoint (placeholder)
 * Returns 501 Not Implemented until Toss integration is ready
 */
export async function POST(req: NextRequest) {
  if (await getDemoMode()) {
    return new NextResponse(null, { status: 404 });
  }
  
  try {
    const body = await req.json();
    const { workspace_id, plan_key, billing_cycle } = body;

    // Log the attempt for future implementation
    console.log('[Toss Checkout] Request received:', {
      workspace_id,
      plan_key,
      billing_cycle,
      timestamp: new Date().toISOString(),
    });

    // Return 501 Not Implemented
    return NextResponse.json(
      { 
        error: '토스 결제는 곧 지원 예정입니다. 잠시만 기다려 주세요.',
        code: 'TOSS_NOT_IMPLEMENTED'
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('[Toss Checkout] Error:', error);
    return NextResponse.json(
      { 
        error: '결제 요청 처리 중 오류가 발생했습니다.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
