import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { key } = await req.json().catch(() => ({ key: "" }));
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey || key !== adminKey) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("airoute_admin", key, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // 7 days expiry
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}






