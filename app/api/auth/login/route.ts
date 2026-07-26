// POST /api/auth/login  { nickname, password } → 세션 쿠키 발급
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { signAppSession, buildAppSessionCookie } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const nickname =
      typeof body?.nickname === "string" ? body.nickname.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!nickname || !password) {
      return NextResponse.json(
        { error: "닉네임과 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    if (!checkRateLimit(`auth-login:${getClientIp(req)}:${nickname}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "시도 횟수가 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }

    const { data, error } = await supabase.rpc("hwang_login", {
      p_nickname: nickname,
      p_password: password,
    });
    if (error) {
      console.error("[auth/login]", error);
      return NextResponse.json(
        { error: "로그인에 실패했습니다." },
        { status: 500 },
      );
    }

    const user = data as { id: string; nickname: string } | null;
    if (!user?.id) {
      // 닉네임 존재 여부를 구분해 노출하지 않는다
      return NextResponse.json(
        { error: "닉네임 또는 비밀번호가 맞지 않아요." },
        { status: 401 },
      );
    }

    const res = NextResponse.json({ user });
    res.cookies.set(buildAppSessionCookie(signAppSession(user.id)));
    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: "로그인에 실패했습니다." },
      { status: 500 },
    );
  }
}
