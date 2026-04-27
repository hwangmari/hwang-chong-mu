// 업무 캘린더 비밀번호 해시: Node scrypt 기반. 별도 패키지 없이 안전한 해시 저장.
// 포맷: `scrypt$<N>$<r>$<p>$<saltHex>$<hashHex>`

import crypto from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(crypto.scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: crypto.ScryptOptions,
) => Promise<Buffer>;

const KEYLEN = 32;
const SALT_LEN = 16;
// scrypt 파라미터: cost=2^14(=16384), blockSize=8, parallel=1. 일반 서버 기준 권장치.
const PARAMS = { N: 1 << 14, r: 8, p: 1 } as const;

export async function hashSchedulePassword(password: string): Promise<string> {
  if (!password) throw new Error("비밀번호는 비어있을 수 없습니다.");
  const salt = crypto.randomBytes(SALT_LEN);
  const hash = await scryptAsync(password, salt, KEYLEN, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
  });
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("hex"),
    hash.toString("hex"),
  ].join("$");
}

export async function verifySchedulePassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], "hex");
  const expected = Buffer.from(parts[5], "hex");
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }
  const actual = await scryptAsync(password, salt, expected.length, {
    N,
    r,
    p,
  });
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}
