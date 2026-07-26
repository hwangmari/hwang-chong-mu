// POST /api/auth/signup  { nickname, password } → 계정 생성 + 세션 쿠키 발급
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
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!nickname || !password) {
      return NextResponse.json(
        { error: "닉네임과 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }
    if (email && !email.includes("@")) {
      return NextResponse.json(
        { error: "이메일 형식을 확인해 주세요." },
        { status: 400 },
      );
    }

    if (!checkRateLimit(`auth-signup:${getClientIp(req)}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "시도 횟수가 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }

    const { data, error } = await supabase.rpc("hwang_signup", {
      p_nickname: nickname,
      p_password: password,
      p_email: email || null,
    });

    if (error) {
      // DB에서 raise한 코드별 사용자 메시지 (내부 상세는 서버 로그만)
      const code = error.message || "";
      if (code.includes("NICKNAME_TAKEN")) {
        return NextResponse.json(
          { error: "이미 사용 중인 닉네임입니다." },
          { status: 409 },
        );
      }
      if (code.includes("INVALID_NICKNAME")) {
        return NextResponse.json(
          { error: "닉네임은 2~20자로 입력해 주세요." },
          { status: 400 },
        );
      }
      if (code.includes("INVALID_PASSWORD")) {
        return NextResponse.json(
          { error: "비밀번호는 4자 이상으로 입력해 주세요." },
          { status: 400 },
        );
      }
      console.error("[auth/signup]", error);
      return NextResponse.json(
        { error: "회원가입에 실패했습니다." },
        { status: 500 },
      );
    }

    const user = data as { id: string; nickname: string } | null;
    if (!user?.id) {
      return NextResponse.json(
        { error: "회원가입에 실패했습니다." },
        { status: 500 },
      );
    }

    const res = NextResponse.json({ user });
    res.cookies.set(buildAppSessionCookie(signAppSession(user.id)));
    return res;
  } catch (err) {
    console.error("[auth/signup]", err);
    return NextResponse.json(
      { error: "회원가입에 실패했습니다." },
      { status: 500 },
    );
  }
}
