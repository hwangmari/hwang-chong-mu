// POST /api/auth/reset/request  { nickname, email } → 재설정 링크 메일 발송
// 보안: 계정 존재 여부를 노출하지 않기 위해 매치 여부·에러와 무관하게 항상 200 {ok:true}를 반환한다.
// (rate-limit 초과 시에만 429). 토큰 평문은 메일 링크로만 전달하고 DB에는 sha256 해시만 저장한다.
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  if (!checkRateLimit(`auth-reset-req:${getClientIp(req)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "시도 횟수가 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const nickname =
      typeof body?.nickname === "string" ? body.nickname.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!nickname || !email) {
      return NextResponse.json(
        { error: "닉네임과 이메일을 입력해 주세요." },
        { status: 400 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 3600_000).toISOString();

    const { data } = await supabase.rpc("hwang_request_reset", {
      p_nickname: nickname,
      p_email: email,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt,
    });

    if (data === true) {
      const origin = new URL(req.url).origin;
      const resetUrl = `${origin}/reset?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl).catch((e) =>
        console.error("[reset/request] email", e),
      );
    }
  } catch (err) {
    // 존재 노출 방지: 내부 오류도 사용자에게는 성공과 동일하게 응답한다.
    console.error("[reset/request]", err);
  }

  return NextResponse.json({ ok: true });
}
