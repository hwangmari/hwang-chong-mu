// POST /api/auth/reset/confirm  { token, password } → 토큰 검증 후 비밀번호 교체
// 토큰 평문은 URL로만 오가고, DB 조회는 sha256 해시로만 한다(1회용·1시간 만료).
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    if (!checkRateLimit(`auth-reset-confirm:${getClientIp(req)}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "시도 횟수가 많습니다. 잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!token || !password) {
      return NextResponse.json(
        { error: "토큰과 새 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }
    if (password.length < 4) {
      return NextResponse.json(
        { error: "비밀번호는 4자 이상으로 입력해 주세요." },
        { status: 400 },
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { data, error } = await supabase.rpc("hwang_reset_password", {
      p_token_hash: tokenHash,
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
      console.error("[auth/reset/confirm]", error);
      return NextResponse.json(
        { error: "비밀번호 재설정에 실패했습니다." },
        { status: 500 },
      );
    }

    if (data === true) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "링크가 만료되었거나 유효하지 않아요. 다시 요청해 주세요." },
      { status: 400 },
    );
  } catch (err) {
    console.error("[auth/reset/confirm]", err);
    return NextResponse.json(
      { error: "비밀번호 재설정에 실패했습니다." },
      { status: 500 },
    );
  }
}
