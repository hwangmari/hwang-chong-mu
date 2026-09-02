// 가계부 → 경조사비 장부 가져오기.
// 가계부에는 "상대방 이름·관계"가 없어서 완전 자동은 불가능하고,
// 후보(날짜·금액·방향·종류 추측)를 만들어 사람이 이름을 채워 담는 반자동 방식이다.
// 가계부 데이터는 읽기만 한다 — 가계부 쪽 파일은 수정하지 않는다.
import { fetchAccountBookStore } from "@/app/account-book/repository";
import { isCardSettlementEntry } from "@/app/account-book/components/WorkspaceLedgerView/utils";
import type { AccountEntry } from "@/app/account-book/types";
import type { GiftDirection, GiftEntry, GiftEventType } from "./types";

// 가계부 page.tsx가 마지막으로 연 워크스페이스를 저장하는 키 (읽기 전용으로 재사용)
const LAST_WORKSPACE_KEY = "hwang-account-book-last-workspace";

// 가계부 소분류 "경조사" 또는 항목/메모/가맹점에 이 단어가 있으면 후보
const GIFT_KEYWORDS =
  /경조사|축의|조의|부의|부조|결혼|웨딩|청첩|장례|조문|돌잔치|첫돌|생신/i;

export type ImportCandidate = {
  sourceId: string; // 가계부 entry.id
  date: string;
  amount: number;
  direction: GiftDirection;
  guessedEventType: GiftEventType;
  guessedName: string; // 항목 이름에서 추출 시도. 못 찾으면 ""
  hint: string; // 가계부에 적힌 원문 (항목 · 가맹점 · 메모)
  alreadyImported: boolean; // 같은 날짜·금액·방향 기록이 장부에 이미 있으면 true
};

export type ImportSource =
  | { kind: "linked"; workspaceId: string } // /account 에서 계정에 연결한 가계부
  | { kind: "recent"; workspaceId: string } // 이 브라우저에서 마지막으로 연 가계부
  | { kind: "none" };

// 어느 가계부(워크스페이스)에서 가져올지 결정. 계정 연결 > 최근 연 것 > 없음
export async function resolveAccountBookSource(): Promise<ImportSource> {
  try {
    const res = await fetch("/api/auth/links", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as {
        links?: { service: string; resourceRef?: Record<string, unknown> }[];
      };
      const link = (data.links ?? []).find((l) => l.service === "account-book");
      const workspaceId = String(link?.resourceRef?.workspaceId ?? "");
      if (workspaceId) return { kind: "linked", workspaceId };
    }
  } catch {
    // 연결 조회 실패는 무시하고 다음 후보로
  }

  if (typeof window !== "undefined") {
    const recent = window.localStorage.getItem(LAST_WORKSPACE_KEY) ?? "";
    if (recent) return { kind: "recent", workspaceId: recent };
  }
  return { kind: "none" };
}

export function guessEventType(text: string): GiftEventType {
  if (/축의|결혼|웨딩|청첩/i.test(text)) return "wedding";
  if (/조의|부의|장례|조문|상가/i.test(text)) return "funeral";
  if (/돌잔치|첫돌/i.test(text)) return "firstBirthday";
  if (/생일|생신/i.test(text)) return "birthday";
  return "etc";
}

// "김철수 축의금" → "김철수". 경조사 단어와 기호를 지운 뒤 한글 2~4자만 남으면 이름으로 본다.
export function guessPersonName(item: string): string {
  const stripped = item
    .replace(
      /축의금|조의금|부의금|부조금|경조사비|경조사|축의|조의|부의|부조|결혼식|결혼|장례식|장례|돌잔치|첫돌|생일|생신|선물|화환|님|씨/g,
      " ",
    )
    .replace(/[^가-힣\s]/g, " ")
    .trim();
  // 첫 번째 한글 2~4자 토큰을 이름으로 본다. 예) "조재영(제로)축의금" → "조재영"
  const tokens = stripped.split(/\s+/).filter(Boolean);
  return tokens.find((t) => /^[가-힣]{2,4}$/.test(t)) ?? "";
}

// 항목·가맹점·메모에 같은 내용이 들어가 있으면 한 번만 보여준다.
// 경조사 단어("축의금", "결혼" 등)와 공백을 뺀 알맹이가 같거나 포함되면 같은 내용으로 보고 긴 쪽만 남긴다.
// 예) "양정원님축의금" + "양정원님 결혼 축의금" → "양정원님 결혼 축의금"
const HINT_NOISE =
  /축의금|조의금|부의금|부조금|경조사비|경조사|축의|조의|부의|부조|결혼식|결혼|장례식|장례|돌잔치|첫돌|생일|생신|화환|\s/g;

function hintCore(text: string): string {
  return text.replace(HINT_NOISE, "");
}

export function buildHint(parts: (string | undefined)[]): string {
  const texts = parts.map((raw) => (raw ?? "").trim()).filter(Boolean);
  // "축의금"처럼 경조사 단어만 있는 조각은 다른 조각이 있으면 정보가 없으니 버린다
  const withCore = texts.filter((t) => hintCore(t));
  const pool = withCore.length > 0 ? withCore : texts.slice(0, 1);

  const kept: string[] = [];
  for (const text of pool) {
    const core = hintCore(text);
    const idx = kept.findIndex((k) => {
      const kc = hintCore(k);
      return kc === core || kc.includes(core) || core.includes(kc);
    });
    if (idx === -1) kept.push(text);
    else if (text.length > kept[idx].length) kept[idx] = text;
  }
  return kept.join(" · ");
}

function isGiftLike(entry: AccountEntry): boolean {
  if (entry.subCategory === "경조사") return true;
  const text = `${entry.item} ${entry.merchant ?? ""} ${entry.memo}`;
  return GIFT_KEYWORDS.test(text);
}

// 가계부에서 경조사 후보를 뽑아 최신순으로 반환
export async function fetchImportCandidates(
  workspaceId: string,
  existing: GiftEntry[],
): Promise<ImportCandidate[]> {
  const store = await fetchAccountBookStore();

  const existingKeys = new Set(
    existing.map((e) => `${e.date}|${e.amount}|${e.direction}`),
  );

  return store.entries
    .filter(
      (entry) =>
        entry.workspaceId === workspaceId &&
        entry.amount > 0 &&
        !isCardSettlementEntry(entry) &&
        isGiftLike(entry),
    )
    .map((entry): ImportCandidate => {
      const direction: GiftDirection =
        entry.type === "income" ? "received" : "given";
      const text = `${entry.item} ${entry.merchant ?? ""} ${entry.memo}`;
      return {
        sourceId: entry.id,
        date: entry.date,
        amount: entry.amount,
        direction,
        guessedEventType: guessEventType(text),
        guessedName: guessPersonName(entry.item),
        hint: buildHint([entry.item, entry.merchant, entry.memo]),
        alreadyImported: existingKeys.has(
          `${entry.date}|${entry.amount}|${direction}`,
        ),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
