// 여행 준비(extras) 칸의 순수 계산들 — 저장 공간도 화면도 같은 규칙을 쓰도록 한곳에 모았다.
// 이 파일은 바깥(저장 공간·리액트)을 부르지 않는다. 그래서 그대로 따로 돌려 보며 확인할 수 있다. (2026-09-16)
import { EMPTY_EXTRAS } from "../types";
import type { ChecklistItem, FlightInfo, TravelExtras } from "../types";

/** 목록 두 가지(준비물 / 살 거)를 가리키는 이름. */
export type ChecklistKey = "packing" | "shopping";

/** extras 에서 바꿀 수 있는 열쇠. SQL(travel_plans_set_extra)의 허용 목록과 항상 같아야 한다. */
export type ExtraKey = ChecklistKey | "flights" | "calcRoomId";

/** 줄마다 붙는 id. 같은 순간에 두 줄을 더해도 겹치지 않을 정도면 충분하다. */
export function newExtraId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `x${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/** 빈 글자는 아예 담지 않는다 — 저장본에 ""가 쌓이면 화면에서 "안 적었어요"를 못 가린다. */
function toOptional(value: unknown): string | undefined {
  const text = toText(value).trim();
  return text ? text : undefined;
}

function normalizeChecklist(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      id: toText(item.id) || newExtraId(),
      text: toText(item.text),
      done: item.done === true,
    }))
    .filter((item) => item.text.trim() !== "");
}

function normalizeFlights(raw: unknown): FlightInfo[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      id: toText(item.id) || newExtraId(),
      kind: item.kind === "in" ? ("in" as const) : ("out" as const),
      airline: toOptional(item.airline),
      flightNo: toOptional(item.flightNo),
      from: toOptional(item.from),
      to: toOptional(item.to),
      depart: toOptional(item.depart),
      arrive: toOptional(item.arrive),
      memo: toOptional(item.memo),
    }));
}

/** 저장본이 어떤 모양이든(없거나, 배열이 아니거나, 예전 값이거나) 화면이 쓰는 모양으로 맞춰 준다. */
export function normalizeExtras(raw: unknown): TravelExtras {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...EMPTY_EXTRAS };
  const row = raw as Record<string, unknown>;
  const calc = row.calcRoomId;
  return {
    packing: normalizeChecklist(row.packing),
    shopping: normalizeChecklist(row.shopping),
    flights: normalizeFlights(row.flights),
    calcRoomId: typeof calc === "string" && calc.trim() ? calc.trim() : null,
  };
}

/** "3/8 완료"를 만들 숫자. */
export function checklistCount(items: ChecklistItem[]): { done: number; total: number } {
  return { done: items.filter((item) => item.done).length, total: items.length };
}

/** 비행 한 줄을 사람이 읽는 문장으로. 안 적은 칸은 조용히 빠진다.
 *  예) "OZ361 · 인천 T2 09:05 → 푸동 10:05" */
export function flightLine(flight: FlightInfo | null | undefined): string {
  if (!flight) return "";
  const head = [flight.airline, flight.flightNo].map((v) => (v ?? "").trim()).filter(Boolean).join(" ");
  const from = [flight.from, flight.depart].map((v) => (v ?? "").trim()).filter(Boolean).join(" ");
  const to = [flight.to, flight.arrive].map((v) => (v ?? "").trim()).filter(Boolean).join(" ");
  const route = [from, to].filter(Boolean).join(" → ");
  return [head, route].filter(Boolean).join(" · ");
}

/** 출국/귀국 두 줄을 늘 같은 순서로 꺼낸다. 저장본에 없으면 빈 줄을 만들어 준다. */
export function flightOf(flights: FlightInfo[], kind: "out" | "in"): FlightInfo {
  const found = flights.find((flight) => flight.kind === kind);
  return found ?? { id: kind, kind };
}

/** 주소창에서 복사해 온 글("https://…/calc/seoul-ABC234", "/calc/seoul-ABC234")에서 방 이름만 집어낸다. */
export function extractCalcRoomId(raw: string): string {
  const text = (raw ?? "").trim();
  if (!text) return "";
  const match = text.match(/\/calc\/([^/?#\s]+)/);
  const picked = match ? match[1] : text;
  try {
    return decodeURIComponent(picked).trim();
  } catch {
    return picked.trim();
  }
}

/** 1234000 → "1,234,000" (원 단위는 쓰는 쪽에서 붙인다) */
export function wonText(value: number): string {
  return Math.round(value || 0).toLocaleString("ko-KR");
}
