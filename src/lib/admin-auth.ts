import { cookies } from "next/headers";

/**
 * Admin 인증 체크 - 쿠키 기반
 * @throws Error if not authenticated
 */
export async function requireAdminOrThrow(): Promise<void> {
  const adminKey = process.env.ADMIN_KEY;
  
  // Dev 환경에서 ADMIN_KEY 미설정 시 통과 (선택적)
  if (!adminKey) {
    console.warn("[Admin Auth] ADMIN_KEY not set, allowing access in dev mode");
    return;
  }
  
  const cookieStore = await cookies();
  const cookieKey = cookieStore.get("airoute_admin")?.value;
  
  if (cookieKey !== adminKey) {
    throw new Error("Unauthorized: Admin authentication required");
  }
}

/**
 * Admin 인증 상태 확인 (throw 없이)
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    await requireAdminOrThrow();
    return true;
  } catch {
    return false;
  }
}



