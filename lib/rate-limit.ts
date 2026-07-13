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
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
