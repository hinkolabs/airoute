import { cookies } from "next/headers";

/**
 * Admin 인증 체크 - 쿠키 기반
 * @throws Error if not authenticated
 */
export async function requireAdminOrThrow(): Promise<void> {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) {
    throw new Error("ADMIN_KEY is required");
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







