// 경조사비 기록에서 화면에 필요한 집계를 만드는 순수 함수 모음.
// 기록이 많아야 수백 건이라 서버 왕복 없이 전량을 받아 여기서 계산한다.
// ("이 사람 얼마 해야 하지?"에 즉시 답하는 게 이 서비스의 핵심이라 지연이 없어야 한다)
import {
  DirectionTotal,
  EVENT_TYPE_KEYS,
  GiftEntry,
  GiftEventType,
  GiftRelation,
  PersonSummary,
  RELATION_KEYS,
  YearSummary,
} from "./types";

export function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

// 기록이 존재하는 연도 목록 (내림차순)
export function listYears(entries: GiftEntry[]): number[] {
  const years = new Set<number>();
  for (const entry of entries) years.add(yearOf(entry.date));
  return [...years].sort((a, b) => b - a);
}

function emptyTotal(): DirectionTotal {
  return { given: 0, received: 0, count: 0 };
}

function addTo(total: DirectionTotal, entry: GiftEntry) {
  if (entry.direction === "given") total.given += entry.amount;
  else total.received += entry.amount;
  total.count += 1;
}

// 사람별 집계. 이름이 같으면 한 사람으로 본다(동명이인은 메모로 구분).
// 반환은 마지막 기록이 최근인 순서.
export function buildPersonSummaries(entries: GiftEntry[]): PersonSummary[] {
  const byName = new Map<string, GiftEntry[]>();
  for (const entry of entries) {
    const key = entry.personName.trim();
    const list = byName.get(key) ?? [];
    list.push(entry);
    byName.set(key, list);
  }

  const summaries: PersonSummary[] = [];
  for (const [personName, list] of byName) {
    // entries는 이미 날짜 내림차순이지만, 호출부가 필터한 경우를 대비해 다시 정렬
    const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
    let givenTotal = 0;
    let receivedTotal = 0;
    for (const entry of sorted) {
      if (entry.direction === "given") givenTotal += entry.amount;
      else receivedTotal += entry.amount;
    }
    summaries.push({
      personName,
      relation: sorted[0].relation,
      relationDetail: sorted[0].relationDetail,
      givenTotal,
      receivedTotal,
      balance: receivedTotal - givenTotal,
      entries: sorted,
      returnedMarked: sorted.some((e) => e.direction === "received" && e.returned),
      receivedIds: sorted.filter((e) => e.direction === "received").map((e) => e.id),
      lastGiven: sorted.find((entry) => entry.direction === "given") ?? null,
      lastDate: sorted[0].date,
    });
  }

  return summaries.sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

// 이름 부분일치 검색 (공백 무시, 대소문자 무시)
export function searchPersons(
  summaries: PersonSummary[],
  keyword: string,
): PersonSummary[] {
  const needle = keyword.replace(/\s/g, "").toLowerCase();
  if (!needle) return summaries;
  return summaries.filter((summary) =>
    summary.personName.replace(/\s/g, "").toLowerCase().includes(needle),
  );
}

// 한 해의 나간/받은 총액과 종류별·관계별 집계
export function buildYearSummary(
  entries: GiftEntry[],
  year: number,
): YearSummary {
  const eventMap = new Map<GiftEventType, DirectionTotal>(
    EVENT_TYPE_KEYS.map((key) => [key, emptyTotal()]),
  );
  // 관계는 "관계|세부" 조합으로 나눈다 (세부가 비면 관계만)
  const relationMap = new Map<string, DirectionTotal>();

  let givenTotal = 0;
  let receivedTotal = 0;

  for (const entry of entries) {
    if (yearOf(entry.date) !== year) continue;
    if (entry.direction === "given") givenTotal += entry.amount;
    else receivedTotal += entry.amount;
    addTo(eventMap.get(entry.eventType) ?? emptyTotal(), entry);
    const relationKey = `${entry.relation}|${entry.relationDetail.trim()}`;
    const relationTotal = relationMap.get(relationKey) ?? emptyTotal();
    addTo(relationTotal, entry);
    relationMap.set(relationKey, relationTotal);
  }

  return {
    year,
    givenTotal,
    receivedTotal,
    // 기록이 하나도 없는 항목은 숨긴다
    byEventType: EVENT_TYPE_KEYS.map((key) => ({
      key,
      total: eventMap.get(key)!,
    })).filter((row) => row.total.count > 0),
    // 관계 순서(RELATION_KEYS) → 세부 없는 것 먼저 → 세부 이름순
    byRelation: [...relationMap.entries()]
      .map(([combined, total]) => {
        const [key, detail] = combined.split("|") as [GiftRelation, string];
        return { key, detail, total };
      })
      .sort(
        (a, b) =>
          RELATION_KEYS.indexOf(a.key) - RELATION_KEYS.indexOf(b.key) ||
          a.detail.localeCompare(b.detail, "ko"),
      ),
  };
}
