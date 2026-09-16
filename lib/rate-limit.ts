// 외부 의존성 없는 인메모리 rate limit.
// 주의: 서버리스(다중 인스턴스) 환경에서는 인스턴스마다 카운터가 분리되어 완벽하지 않다. 남용 억제용 최소 방어선.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

// key 단위로 windowMs 동안 limit 회를 초과하면 false 반환.
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();

  // 맵이 과도하게 커지면 만료된 항목을 정리한다(메모리 누수 방지).
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

// 프록시 뒤의 클라이언트 IP 추출(없으면 "unknown").
// x-forwarded-for 의 맨 앞 칸은 부르는 쪽이 아무 값이나 적어 넣을 수 있어(횟수 제한을 매번 새 이름으로 피해 간다)
// 믿을 수 있는 x-real-ip 를 먼저 보고, 없으면 우리 쪽 프록시가 마지막에 붙인 맨 뒤 칸을 쓴다. (리뷰 반영 2026-09-16)
export function getClientIp(req: Request): string {
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return "unknown";
}
