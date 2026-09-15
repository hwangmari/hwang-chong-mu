// 여행 플랜의 순수 함수 모음 (화면·저장 어디서든 같은 결과가 나오게 여기 한 번만 적는다).
//
// 날짜는 처음부터 끝까지 "YYYY-MM-DD" 문자열로만 다룬다.
// new Date(...).toISOString()은 UTC로 옮겨져 한국에서 하루가 밀리므로 절대 쓰지 않고,
// 날짜 계산은 date-fns 로만 한다. (2026-09-16)
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { MAX_TRIP_DAYS, type TravelDay, type TravelPlace } from "../types";

/** 장소 id. 저장 전에도 화면에서 구분해야 해서 브라우저에서 만든다. */
export function newPlaceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 하루치를 규칙에 맞게 다듬는다.
 * - 숙소(isStay)는 하루에 하나뿐이고 항상 맨 앞(places[0])에 둔다 — "이 날은 여기서 잔다"를 먼저 보여주려고.
 * - id가 빠진 장소에는 id를 채운다(예전 저장본 대비).
 */
export function normalizeDay(day: TravelDay): TravelDay {
  const places = (day.places ?? []).map((place) => (place.id ? place : { ...place, id: newPlaceId() }));
  const stayIndex = places.findIndex((place) => place.isStay);
  const ordered =
    stayIndex > 0 ? [places[stayIndex], ...places.filter((_, i) => i !== stayIndex)] : places;
  return {
    date: day.date,
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

/** 이동 시간을 이어 그릴 장소들. 숙소를 동선에서 뺀 날(stayInRoute=false)은 숙소를 건너뛴다. */
export function routePlaces(day: TravelDay): TravelPlace[] {
  return day.places.filter((place) => !place.isStay || day.stayInRoute);
}

/** 어떤 장소를 넣거나 빼면 그 앞뒤 구간의 이동 시간이 더 이상 맞지 않으므로 지운다. */
export function clearTransitAround(day: TravelDay, index: number): TravelDay {
  return {
    ...day,
    places: day.places.map((place, i) =>
      i === index - 1 || i === index ? { ...place, transitToNext: null } : place,
    ),
  };
}

/** "2박 3일" (하루짜리는 "당일") */
export function nightsLabel(start: string, end: string): string {
  const nights = differenceInCalendarDays(parseISO(end), parseISO(start));
  if (!Number.isFinite(nights) || nights <= 0) return "당일";
  return `${nights}박 ${nights + 1}일`;
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
