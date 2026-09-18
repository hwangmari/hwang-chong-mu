// 여행 플랜의 순수 함수 모음 (화면·저장 어디서든 같은 결과가 나오게 여기 한 번만 적는다).
//
// 날짜는 처음부터 끝까지 "YYYY-MM-DD" 문자열로만 다룬다.
// new Date(...).toISOString()은 UTC로 옮겨져 한국에서 하루가 밀리므로 절대 쓰지 않고,
// 날짜 계산은 date-fns 로만 한다. (2026-09-16)
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import {
  CATEGORY_LABEL,
  MAX_PLACE_STEPS,
  MAX_TRIP_DAYS,
  type PlaceCategory,
  type PlaceStep,
  type TravelDay,
  type TravelPlace,
} from "../types";

/** 저장본에 들어 있어도 되는 장소 분류. 여기 없는 값은 "기타"로 본다. */
const CATEGORIES = new Set(Object.keys(CATEGORY_LABEL));

/** 장소 id. 저장 전에도 화면에서 구분해야 해서 브라우저에서 만든다. */
export function newPlaceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 장소 안의 세부 일정을 다듬는다. 저장본을 사람이 직접 고쳤거나 예전 모양이어도 화면이 멈추지 않게,
 * 모양이 아닌 항목은 버리고 내용이 빈 줄도 버린다. (2026-09-18)
 */
export function normalizeSteps(steps: unknown): PlaceStep[] {
  if (!Array.isArray(steps)) return [];
  const out: PlaceStep[] = [];
  for (const step of steps) {
    if (!step || typeof step !== "object") continue;
    const { id, text, time } = step as Partial<PlaceStep>;
    const body = typeof text === "string" ? text.trim() : "";
    if (!body) continue;
    const at = typeof time === "string" ? time.trim() : "";
    out.push({ id: typeof id === "string" && id ? id : newPlaceId(), text: body, ...(at ? { time: at } : {}) });
    if (out.length >= MAX_PLACE_STEPS) break;
  }
  return out;
}

/**
 * 하루치를 규칙에 맞게 다듬는다.
 * - 숙소(isStay)는 하루에 하나뿐이고 항상 맨 앞(places[0])에 둔다 — "이 날은 여기서 잔다"를 먼저 보여주려고.
 * - id가 빠진 장소에는 id를 채운다(예전 저장본 대비).
 * - 저장본이 깨져 있어도(빈 칸·모양이 다름) 화면 전체가 멈추지 않게 빈 하루로 바꿔 준다 (리뷰 반영 2026-09-16)
 */
export function normalizeDay(day: TravelDay | null | undefined): TravelDay {
  if (!day || typeof day !== "object" || !Array.isArray(day.places)) {
    return { date: typeof day?.date === "string" ? day.date : "", stayInRoute: true, places: [] };
  }

  const places: TravelPlace[] = day.places
    .filter((place): place is TravelPlace => Boolean(place) && typeof place === "object")
    .map((place) => {
      const steps = normalizeSteps(place.steps);
      const next: TravelPlace = {
        ...place,
        id: place.id || newPlaceId(),
        name: typeof place.name === "string" ? place.name : String(place.name ?? ""),
        category: (CATEGORIES.has(place.category) ? place.category : "etc") as PlaceCategory,
      };
      // 비어 있으면 steps 칸 자체를 두지 않는다 — 예전 저장본과 같은 모양을 지키려고
      if (steps.length > 0) next.steps = steps;
      else delete next.steps;
      return next;
    });
  const stayIndex = places.findIndex((place) => place.isStay);
  const ordered =
    stayIndex > 0 ? [places[stayIndex], ...places.filter((_, i) => i !== stayIndex)] : places;
  return {
    date: typeof day.date === "string" ? day.date : "",
    stayInRoute: day.stayInRoute !== false,
    places: ordered.map((place, index) => {
      if (stayIndex >= 0 && index === 0) return place.isStay ? place : { ...place, isStay: true };
      return place.isStay ? { ...place, isStay: false } : place;
    }),
  };
}

/**
 * 시작일~종료일 하루당 한 칸을 만든다.
 * 이미 적어 둔 날(prev)은 날짜가 같으면 그대로 옮겨 오므로 기간만 바꿔도 내용이 날아가지 않는다.
 */
export function buildDays(start: string, end: string, prev?: TravelDay[]): TravelDay[] {
  const from = parseISO(start);
  const total = differenceInCalendarDays(parseISO(end), from) + 1;
  if (!Number.isFinite(total) || total < 1) return [];
  const kept = new Map((prev ?? []).map((day) => [day.date, day]));
  const days: TravelDay[] = [];
  for (let i = 0; i < Math.min(total, MAX_TRIP_DAYS); i += 1) {
    const date = format(addDays(from, i), "yyyy-MM-dd");
    const before = kept.get(date);
    days.push(before ? normalizeDay({ ...before, date }) : { date, stayInRoute: true, places: [] });
  }
  return days;
}

/** 순서 바꾸기. 맨 앞에 고정된 숙소는 자리를 내주지도, 옮기지도 않는다. */
export function movePlace(day: TravelDay, from: number, to: number): TravelDay {
  const places = [...day.places];
  if (from === to) return day;
  if (from < 0 || from >= places.length) return day;
  if (to < 0 || to >= places.length) return day;
  const locked = places[0]?.isStay ? 1 : 0;
  if (from < locked || to < locked) return day;
  const [moved] = places.splice(from, 1);
  places.splice(to, 0, moved);
  return { ...day, places };
}

/**
 * 이동 시간을 이어 그릴 순서. 숙소는 "그 날 마지막에 돌아가는 곳"이라 맨 뒤에 붙인다.
 * → 1 → 2 → … → n → 🏨(복귀). 목록 맨 위에 붙박이로 있는 숙소에서 1번으로 가는 선은 긋지 않는다.
 * 숙소를 동선에서 뺀 날(stayInRoute=false)은 숙소를 아예 넣지 않는다. (2026-09-16 주인 요청: "6번은 다시 숙소로 간 거잖아")
 */
export function routePlaces(day: TravelDay): TravelPlace[] {
  const rest = day.places.filter((place) => !place.isStay);
  const stay = day.places.find((place) => place.isStay);
  return day.stayInRoute && stay ? [...rest, stay] : rest;
}

/**
 * 어떤 장소를 넣거나 빼면 그 앞뒤 구간의 이동 시간이 더 이상 맞지 않으므로 지운다.
 * day.places 는 [숙소, 1번, 2번 …] 순서이고 숙소의 transitToNext 는 이제 뜻이 없으므로(항상 null)
 * index-1 이 숙소로 잡혀도 아무 일도 일어나지 않는다.
 */
export function clearTransitAround(day: TravelDay, index: number): TravelDay {
  return {
    ...day,
    places: day.places.map((place, i) =>
      i === index - 1 || i === index ? { ...place, transitToNext: null } : place,
    ),
  };
}

/**
 * 동선 중간에 "숙소에 들르는" 정거장. 아침에 짐을 맡기거나, 마지막 날 놀다가 짐을 찾고 공항으로 갈 때 쓴다.
 * 맨 위 붙박이 숙소(isStay)와 달리 보통 장소처럼 번호가 붙고 순서도 옮길 수 있다 — 분류만 "숙소"라 🏨 로 보인다.
 * 마지막 날처럼 이 뒤에 공항이 오면 "마지막에 숙소로 복귀"는 꺼 두어야 공항 → 숙소 구간이 생기지 않는다. (주인 요청 2026-09-17)
 */
export function stayStopInput(stay: TravelPlace): Omit<TravelPlace, "id" | "isStay" | "transitToNext"> {
  return {
    name: "숙소 들르기 (짐 맡기기·찾기)",
    category: "stay",
    ...(stay.address ? { address: stay.address } : {}),
    ...(typeof stay.lat === "number" ? { lat: stay.lat } : {}),
    ...(typeof stay.lng === "number" ? { lng: stay.lng } : {}),
    ...(stay.placeId ? { placeId: stay.placeId } : {}),
    ...(stay.url ? { url: stay.url } : {}),
    memo: stay.name,
  };
}

/** "2박 3일" (하루짜리는 "당일") */
export function nightsLabel(start: string, end: string): string {
  const nights = differenceInCalendarDays(parseISO(end), parseISO(start));
  if (!Number.isFinite(nights) || nights <= 0) return "당일";
  return `${nights}박 ${nights + 1}일`;
}

/**
 * "2026-10-16" ~ "2026-10-18" → "2026.10.16–10.18" (같은 해라 뒤쪽 연도는 생략)
 * 해를 넘기면 뒤쪽 연도를 그대로 둔다 → "2026.12.30–2027.01.02" (리뷰 반영 2026-09-16)
 */
export function rangeLabel(start: string, end: string): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const tail = sameYear ? end.slice(5) : end;
  return `${start.replace(/-/g, ".")}–${tail.replace(/-/g, ".")}`;
}

/** "2026-10-16" → "10.16 (금)" */
export function dayLabel(date: string): string {
  const parsed = parseISO(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return format(parsed, "MM.dd (E)", { locale: ko });
}

/** 그 날 들르는 곳 개수 → "8곳" */
export function dayCountLabel(count: number): string {
  return `${count}곳`;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 여행 만들기/기간 고치기 입력 검사. 문제가 없으면 null, 있으면 사람이 읽을 안내 문구를 돌려준다. */
export function validateTripInput({
  title,
  startDate,
  endDate,
}: {
  title: string;
  startDate: string;
  endDate: string;
}): string | null {
  const name = title.trim();
  if (!name) return "여행 이름을 적어 주세요.";
  if (name.length > 40) return "여행 이름은 40자까지 적을 수 있어요.";
  if (!DATE_PATTERN.test(startDate)) return "출발 날짜를 골라 주세요.";
  if (!DATE_PATTERN.test(endDate)) return "돌아오는 날짜를 골라 주세요.";
  const days = differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1;
  if (!Number.isFinite(days)) return "날짜를 다시 골라 주세요.";
  if (days < 1) return "돌아오는 날짜가 출발 날짜보다 빨라요.";
  if (days > MAX_TRIP_DAYS) return `한 번에 담을 수 있는 기간은 ${MAX_TRIP_DAYS}일까지예요.`;
  return null;
}
