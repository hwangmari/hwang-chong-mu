// "냈음" 표시가 붙은 받은 기록과 짝지어지는 "냈어요" 기록을 찾는 순수 함수.
//
// 저장 구조는 그대로 두고(받은 기록의 returned 플래그 하나) 답례 금액은
// 평범한 "냈어요" 기록으로 따로 남긴다. 그래서 화면에서 둘을 이어 붙일
// 규칙이 필요하다 — 그 규칙이 여기 한 곳에만 있다.
//
// 짝의 조건: 같은 사람 + 같은 경조사 종류 + 받은 날 이후(같은 날 포함)에 낸 기록.
// 여러 건이면 가장 빠른 것(먼저 낸 것)을 답례로 본다.
import type { GiftEntry } from "./types";

// 답례로 낸 돈 — 화면에서 폼이 모아 올려 보내는 값
export type ReturnPayment = { date: string; amount: number };

export function findReturnEntry(
  entries: GiftEntry[],
  received: GiftEntry,
): GiftEntry | null {
  if (received.direction !== "received") return null;
  const name = received.personName.trim();

  let best: GiftEntry | null = null;
  for (const entry of entries) {
    if (entry.direction !== "given") continue;
    if (entry.eventType !== received.eventType) continue;
    if (entry.personName.trim() !== name) continue;
    if (entry.date < received.date) continue;
    if (
      best === null ||
      entry.date < best.date ||
      (entry.date === best.date && entry.createdAt < best.createdAt)
    ) {
      best = entry;
    }
  }
  return best;
}

// 답례로 새로 만드는 "냈어요" 기록의 메모. 나중에 목록에서 봐도 무엇인지 알 수 있게.
export function returnMemo(receivedDate: string): string {
  return `답례 (받은 날 ${receivedDate})`;
}
