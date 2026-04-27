// 업무 캘린더 세션 토큰: HS256 JWT를 Node crypto만으로 직접 구현.
// 외부 패키지 없이 워크스페이스 단위의 서명 쿠키를 발급/검증한다.

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const SCHEDULE_SESSION_COOKIE = "hws-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h
const ALG = "HS256";

export type ScheduleRole = "owner" | "member";

export interface ScheduleSessionPayload {
  workspaceId: string;
  userId: string;
  role: ScheduleRole;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SCHEDULE_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SCHEDULE_SESSION_SECRET 환경변수가 설정되지 않았거나 32자 미만입니다.",
    );
  }
  return secret;
}

function base64urlEncode(buf: Buffer | string): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4);
  const padded = input + (pad < 4 ? "=".repeat(pad) : "");
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function hmac(data: string): string {
  return base64urlEncode(
    crypto.createHmac("sha256", getSecret()).update(data).digest(),
  );
}

export function signScheduleSession(
  claims: Pick<ScheduleSessionPayload, "workspaceId" | "userId" | "role">,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: ScheduleSessionPayload = {
    ...claims,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const header = base64urlEncode(JSON.stringify({ alg: ALG, typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(payload));
  const signature = hmac(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

export function verifyScheduleSession(
  token: string | undefined | null,
): ScheduleSessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

  const expectedSig = hmac(`${header}.${body}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const headerObj = JSON.parse(base64urlDecode(header).toString("utf8"));
    if (headerObj.alg !== ALG) return null;
    const payload = JSON.parse(
      base64urlDecode(body).toString("utf8"),
    ) as ScheduleSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

// Next.js 서버 컴포넌트/라우트 핸들러에서 쿠키로부터 세션 읽기
export async function readScheduleSession(): Promise<ScheduleSessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SCHEDULE_SESSION_COOKIE)?.value ?? null;
  return verifyScheduleSession(token);
}

export function buildScheduleSessionCookieValue(token: string): {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    name: SCHEDULE_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
