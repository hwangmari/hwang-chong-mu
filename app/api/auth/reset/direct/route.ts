// POST /api/auth/reset/direct  { nickname, email, password }
// 메일 발송 없는 복구: 닉네임 + 가입 이메일이 맞으면 즉시 새 비밀번호로 교체한다.
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    if (!checkRateLimit(`auth-reset-direct:${getClientIp(req)}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "시도 횟수가 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const nickname =
      typeof body?.nickname === "string" ? body.nickname.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!nickname || !email || !password) {
      return NextResponse.json(
        { error: "닉네임·이메일·새 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }
    if (password.length < 4) {
      return NextResponse.json(
        { error: "비밀번호는 4자 이상으로 입력해 주세요." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("hwang_reset_by_email", {
      p_nickname: nickname,
      p_email: email,
      p_new_password: password,
    });

    if (error) {
      const code = error.message || "";
      if (code.includes("INVALID_PASSWORD")) {
        return NextResponse.json(
          { error: "비밀번호는 4자 이상으로 입력해 주세요." },
          { status: 400 },
        );
      }
      console.error("[auth/reset/direct]", error);
      return NextResponse.json(
        { error: "비밀번호 재설정에 실패했습니다." },
        { status: 500 },
      );
    }

    if (data === true) {
      return NextResponse.json({ ok: true });
    }

    // 닉네임+이메일이 맞지 않을 때는 사용자가 원인을 알 수 있게 안내(셀프 복구 UX)
    return NextResponse.json(
      { error: "닉네임 또는 이메일이 맞지 않아요." },
      { status: 400 },
    );
  } catch (err) {
    console.error("[auth/reset/direct]", err);
    return NextResponse.json(
      { error: "비밀번호 재설정에 실패했습니다." },
      { status: 500 },
    );
  }
}
