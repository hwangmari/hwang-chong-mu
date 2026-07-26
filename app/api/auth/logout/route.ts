// POST /api/auth/logout → 세션 쿠키 제거
import { NextResponse } from "next/server";
import { buildAppSessionClearCookie } from "@/lib/auth/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(buildAppSessionClearCookie());
  return res;
}
