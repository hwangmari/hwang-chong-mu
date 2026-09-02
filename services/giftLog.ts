// 경조사비 장부 클라이언트 서비스 레이어.
// 모든 접근은 /api/gift-log 서버 라우트를 경유한다(세션 쿠키로 사용자 확정).
// 컴포넌트는 supabase를 직접 부르지 않는다.
import type { GiftEntry, GiftEntryInput } from "@/app/gift-log/types";

type EntriesResponse = { entries: GiftEntry[] };

// 표시 순서: 날짜는 최근이 위, 같은 날 안에서는 "먼저 담은 사람이 위"(종이 장부에 적은 순서).
// 서버(gift_log_list)는 같은 날을 최근 등록순으로 주므로 여기서 한 번 뒤집어 맞춘다.
function sortLedger(entries: GiftEntry[]): GiftEntry[] {
  return [...entries].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || a.createdAt.localeCompare(b.createdAt),
  );
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.error ?? "요청이 실패했습니다.");
  }
  return payload as T;
}

// 내 기록 전체 (서버가 날짜 내림차순으로 준다)
export async function fetchGiftEntries(): Promise<GiftEntry[]> {
  const data = await api<EntriesResponse>("/api/gift-log");
  return sortLedger(data.entries ?? []);
}

// 저장(새 기록/수정) → 갱신된 전체 목록
export async function saveGiftEntry(input: GiftEntryInput): Promise<GiftEntry[]> {
  const data = await api<EntriesResponse>("/api/gift-log", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return sortLedger(data.entries ?? []);
}

// "냈음" 표시 토글(여러 건) → 갱신된 전체 목록
export async function setGiftReturned(
  ids: string[],
  returned: boolean,
): Promise<GiftEntry[]> {
  const data = await api<EntriesResponse>("/api/gift-log", {
    method: "PATCH",
    body: JSON.stringify({ ids, returned }),
  });
  return sortLedger(data.entries ?? []);
}

// 삭제 → 갱신된 전체 목록
export async function deleteGiftEntry(id: string): Promise<GiftEntry[]> {
  const data = await api<EntriesResponse>(
    `/api/gift-log?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  return sortLedger(data.entries ?? []);
}
