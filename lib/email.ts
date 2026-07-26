// 서버 전용 이메일 발송 헬퍼. Resend REST API를 fetch로 직접 호출한다(SDK 의존성 없음).
// RESEND_API_KEY가 없으면 실제 발송 대신 콘솔에 링크를 출력한다(로컬 테스트용 폴백).

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // 로컬/미설정 환경: 실제 메일 대신 콘솔에 링크를 남겨 테스트할 수 있게 한다.
    console.warn("[email] RESEND_API_KEY 없음 — 재설정 링크:", resetUrl);
    return;
  }

  const from = process.env.RESET_EMAIL_FROM || "황총무 <onboarding@resend.dev>";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #2b2d31;">
      <h1 style="font-size: 20px; font-weight: 800;">🐾 황총무 비밀번호 재설정</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #5a5f68;">
        아래 버튼을 눌러 새 비밀번호를 설정해 주세요.
      </p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #3182f6; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 20px; border-radius: 10px;">
          비밀번호 재설정하기
        </a>
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #8a8e95;">
        버튼이 눌리지 않으면 아래 링크를 복사해 주소창에 붙여넣어 주세요.<br />
        <a href="${resetUrl}" style="color: #3182f6; word-break: break-all;">${resetUrl}</a>
      </p>
      <p style="font-size: 12px; line-height: 1.6; color: #a0a4ab; margin-top: 24px;">
        이 링크는 1시간 동안만 유효해요. 재설정을 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "황총무 비밀번호 재설정",
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[email] Resend 발송 실패", res.status, detail);
    throw new Error("EMAIL_SEND_FAILED");
  }
}
