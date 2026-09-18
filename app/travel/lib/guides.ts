// 추천 장소 안내서 고르기·바꾸기. 화면(SpotPicker)은 여기 있는 것만 부른다.
//
// 어느 여행에 어느 도시 안내서를 보여 줄지는 세 가지로 정한다.
// 1) 나라(region)가 같아야 하고
// 2) 여행 이름에 도시 이름(keywords)이 들어 있거나
// 3) 좌표 있는 장소 하나라도 도시 중심(center) 반경(radiusKm) 안에 있으면 그 도시로 본다.
// 둘 다 아니면(예: "중국" 여행인데 제목이 "베이징"이고 장소도 아직 없음) 아무것도 보여 주지 않는다 — 엉뚱한 도시 목록이 뜨는 것보다 낫다.
// 반경은 그 도시(공항 포함)만 덮을 만큼만 잡는다 — 넓게 잡으면 옆 도시 여행에도 이 목록이 뜬다 (리뷰 반영 2026-09-17)
import { SHANGHAI_GUIDE } from "../data/shanghai";
import type { CityGuide, GuideArea, GuideSpot, TravelPlan } from "../types";
import { haversineMeters } from "./routeLegs";

/** 지금 있는 안내서 전부. 도시를 더하면 여기 한 줄만 붙이면 된다. */
export const CITY_GUIDES: CityGuide[] = [SHANGHAI_GUIDE];

/** 이 여행에 맞는 안내서. 없으면 null — 그때는 "추천 장소에서 고르기" 버튼 자체가 숨는다. */
export function findGuide(plan: Pick<TravelPlan, "region" | "title" | "days">): CityGuide | null {
  const title = plan.title.toLowerCase();
  const coords = plan.days.flatMap((day) =>
    day.places.flatMap((place) =>
      typeof place.lat === "number" && typeof place.lng === "number"
        ? [{ lat: place.lat, lng: place.lng }]
        : [],
    ),
  );

  for (const guide of CITY_GUIDES) {
    if (guide.region !== plan.region) continue;
    if (guide.keywords.some((keyword) => title.includes(keyword.toLowerCase()))) return guide;
    if (coords.some((coord) => haversineMeters(coord, guide.center) <= guide.radiusKm * 1000)) {
      return guide;
    }
  }
  return null;
}

/** 주변 추천 한 곳 — 안내서 장소에 "기준 장소에서 몇 m"를 붙인 것 */
export type NearbySpot = GuideSpot & { meters: number };

/** 주변 추천을 찾는 반경(걸어서 20분 안팎)과 최대 개수. 화면·계산이 같은 값을 쓰도록 여기 한 번만 적는다 */
export const NEARBY_RADIUS_M = 1500;
export const NEARBY_LIMIT = 8;
/** 이보다 가까우면 "그 장소 자신"으로 본다(손으로 적어 이름이 안 맞아도 같은 자리를 또 담지 않게) */
const SELF_M = 50;

/**
 * 기준 좌표 반경(radiusM) 안의 안내서 장소를 가까운 순으로 돌려준다.
 * 이미 그 여행에 있는 곳(placed 로 알아본 것)은 뺀다 — 주변 칸은 "새로 담을 곳"만 보여 주는 자리라서. (2026-09-17)
 */
export function nearbySpots(
  guide: CityGuide,
  center: { lat: number; lng: number },
  placed: Map<string, number>,
  { radiusM = NEARBY_RADIUS_M, limit = NEARBY_LIMIT }: { radiusM?: number; limit?: number } = {},
): NearbySpot[] {
  // 강이 도시를 가르면(상하이 황푸강) 기준 장소와 같은 쪽만 — 직선 1km 여도 강 건너는 걸어서 못 간다 (주인 요청 2026-09-17)
  const side = guide.river ? sideAt(guide, center) : null;
  const out: NearbySpot[] = [];
  for (const area of guide.areas) {
    for (const spot of area.spots) {
      const meters = haversineMeters(center, spot);
      if (meters > radiusM || meters < SELF_M) continue;
      if (side && spotSide(area, spot) !== side) continue;
      if (findPlacedDay(placed, spotNameKey(spot.name)) !== undefined) continue;
      out.push({ ...spot, meters });
    }
  }
  return out.sort((a, b) => a.meters - b.meters).slice(0, limit);
}

/** 안내서 장소가 강의 어느 쪽인지 — 따로 안 적었으면 서쪽(상하이 기준 시내 쪽). */
function spotSide(area: GuideArea, spot: GuideSpot): "east" | "west" {
  return spot.side ?? area.side ?? "west";
}

/**
 * 어떤 좌표가 강의 어느 쪽인지 — 안내서에서 가장 가까운 장소의 쪽을 따른다.
 * 안내서 장소는 강가 양쪽에 촘촘히 있어서, 강 한가운데가 아니면 가장 가까운 곳이 같은 쪽이다.
 */
export function sideAt(guide: CityGuide, point: { lat: number; lng: number }): "east" | "west" {
  let best: { meters: number; side: "east" | "west" } | null = null;
  for (const area of guide.areas) {
    for (const spot of area.spots) {
      const meters = haversineMeters(point, spot);
      if (!best || meters < best.meters) best = { meters, side: spotSide(area, spot) };
    }
  }
  return best?.side ?? "west";
}

/**
 * 담기 전에 구글 지도에서 먼저 볼 수 있는 검색 주소.
 * 한국어 이름은 구글이 못 찾는 경우가 많아, 괄호 속 한자(沈大成)가 있으면 그걸로 찾고 도시 이름을 붙인다. (주인 요청 2026-09-17)
 */
export function spotSearchUrl(spot: Pick<GuideSpot, "name">, city: string): string {
  const han = spot.name.match(/[（(]([^)）]*[\u4e00-\u9fff][^)）]*)[)）]/)?.[1]?.trim();
  const base = han ?? spot.name;
  // 이름에 이미 도시 이름이 들어 있으면("스타벅스 리저브 로스터리 상하이") 두 번 붙이지 않는다
  const query = (base.includes(city) ? base : `${base} ${city}`).trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * 이름을 비교용으로 다듬는다 — 사람이 적은 이름과 안내서 이름이 조금 달라도 같은 곳으로 보이게.
 * "점심 · 꾸이만롱(桂满陇) 신세계백화점점" → "꾸이만롱신세계백화점점" (끼니 머리말·괄호 속 한자·띄어쓰기 제거) (리뷰 반영 2026-09-17)
 */
export function spotNameKey(name: string): string {
  return name
    .replace(/[（(][^)）]*[)）]/g, "")
    .replace(/^(아침|점심|저녁|브런치|카페|간식)\s*[·:]\s*/, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** 이 정도는 되어야 "한쪽이 다른 쪽을 품는다"를 같은 곳으로 본다 — "예원"(2자)이 "예원상성"에 맞아 버리지 않게 */
const MIN_CONTAIN_LEN = 4;

/**
 * 꼭 같지 않아도 같은 곳으로 본다:
 * - "락번드·외백다리"처럼 가운뎃점으로 묶어 적은 이름은 조각 하나("락번드")가 꼭 같으면
 * - 한쪽 이름이 다른 쪽을 품고 있으면(둘 다 4자 이상 — "예원"이 "예원상성"에 맞아 버리지 않게)
 * 없으면 undefined.
 */
export function findPlacedDay(placed: Map<string, number>, key: string): number | undefined {
  const exact = placed.get(key);
  if (exact !== undefined) return exact;
  // "락번드·외백다리" ↔ "락번드" / "락번드·외백다리" ↔ "외백다리(外白渡桥)" — 양쪽 다 조각으로 나눠 본다
  const keyParts = key.split("·").filter((part) => part.length >= 2);
  for (const [other, day] of placed) {
    const otherParts = other.split("·").filter((part) => part.length >= 2);
    if (other.includes("·") && otherParts.some((part) => part === key)) return day;
    if (key.includes("·") && keyParts.some((part) => part === other)) return day;
  }
  if (key.length < MIN_CONTAIN_LEN) return undefined;
  for (const [other, day] of placed) {
    if (other.length < MIN_CONTAIN_LEN) continue;
    if (other.includes(key) || key.includes(other)) return day;
  }
  return undefined;
}

/**
 * 여행에 이미 들어 있는 장소 이름 → 그 날 번호(0부터). 같은 이름이 여러 날에 있으면 앞선 날.
 * 추천 창에서 "DAY 02에 있음"을 보여 주는 데 쓴다. 날짜 없는 후보(pool)는 세지 않는다 — 아직 일정은 아니라서.
 */
export function placedDayByName(plan: Pick<TravelPlan, "days">): Map<string, number> {
  const found = new Map<string, number>();
  plan.days.forEach((day, dayIndex) => {
    day.places.forEach((place) => {
      const key = spotNameKey(place.name);
      if (!found.has(key)) found.set(key, dayIndex);
    });
  });
  return found;
}
