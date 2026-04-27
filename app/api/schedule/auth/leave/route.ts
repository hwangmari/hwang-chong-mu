// POST /api/schedule/auth/leave
// 세션 쿠키를 즉시 만료시킨다. 로그아웃·방 나가기 공용.

import { NextResponse } from "next/server";
import { SCHEDULE_SESSION_COOKIE } from "@/lib/schedule-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SCHEDULE_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
