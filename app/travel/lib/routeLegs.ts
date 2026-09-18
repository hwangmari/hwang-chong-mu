// 장소와 장소 사이의 이동 시간을 구하는 쪽 일. 화면(RoutePanel)은 여기 있는 것만 부른다.
//
// 규칙 세 가지.
// 1) 좌표가 없는 장소는 길찾기를 물어볼 수 없으므로 그 앞뒤 구간은 아예 빼고 만든다.
// 2) "자동"은 두 곳이 가까우면 걸어가고(1.2km 이하), 멀면 대중교통으로 본다.
//    대중교통 길이 없다고 나오면 한 번 더 묻는다 — 2.5km 안쪽이면 도보, 더 멀면 차량.
//    강을 건너는 구간(상하이 황푸강)은 걸어서 못 가니 거리와 상관없이 차량.
//    (중국은 구글에 대중교통이 아예 없어 1.4km 산책길도 차량으로 잡히던 문제 — 2026-09-17)
// 3) 길찾기 대행 창구(/api/travel/route-legs)는 한 번에 15구간까지라 넘치면 나눠 보낸다. (2026-09-16)
import type { TransitLeg, TransitMode, TravelDay, TravelPlace } from "../types";
import { routePlaces } from "./plan";

/** 길찾기 대행 창구가 한 번에 받아 주는 구간 수 (app/api/travel/route-legs/route.ts 의 MAX_LEGS 와 같다) */
const MAX_PER_CALL = 15;

/** 이 거리까지는 "걸어가는 게 낫다"고 본다. */
const WALK_LIMIT_M = 1200;

/** 대중교통 길이 없을 때, 이 거리까지는 차 대신 걸어가는 것으로 다시 묻는다 (걸어서 30분 남짓) */
const WALK_FALLBACK_M = 2500;

/** 좌표가 강의 어느 쪽인지 알려 주는 함수. 강 정보가 없는 도시면 넘기지 않는다. */
export type SideOf = (point: Coord) => string;

/** 화면에서 고르는 이동 수단. AUTO 는 구간마다 알아서 고른다는 뜻. */
export type RouteMode = "AUTO" | TransitMode;

export type Coord = { lat: number; lng: number };

/** 길찾기 한 구간. fromId 는 "이 장소 다음 구간"이라는 표시라 결과를 되붙일 때 쓴다. */
export type LegRequest = {
  fromId: string;
  o: Coord;
  d: Coord;
  mode: TransitMode;
  /** "자동"으로 고른 구간인지. 이때만 대중교통 실패를 차량으로 다시 물어본다. */
  auto?: boolean;
};

/** 두 좌표 사이의 직선 거리(m). 지구를 공으로 보고 재는 흔한 방법. */
export function haversineMeters(a: Coord, b: Coord): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 대중교통 길이 없을 때 대신 물어볼 수단. 강을 건너면 차량, 걸을 만하면 도보, 아니면 차량. */
export function fallbackMode(o: Coord, d: Coord, sideOf?: SideOf): TransitMode {
  if (sideOf && sideOf(o) !== sideOf(d)) return "DRIVE";
  return haversineMeters(o, d) <= WALK_FALLBACK_M ? "WALK" : "DRIVE";
}

/** "자동"일 때 이 구간을 어떻게 갈지 고른다. 강을 건너면 대중교통, 가까우면 도보, 아니면 대중교통. */
export function pickAutoMode(o: Coord, d: Coord, sideOf?: SideOf): TransitMode {
  if (sideOf && sideOf(o) !== sideOf(d)) return "TRANSIT";
  return haversineMeters(o, d) <= WALK_LIMIT_M ? "WALK" : "TRANSIT";
}

function coordOf(place: TravelPlace): Coord | null {
  if (typeof place.lat !== "number" || typeof place.lng !== "number") return null;
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return null;
  return { lat: place.lat, lng: place.lng };
}

/**
 * 동선 순서대로 이어지는 구간 목록을 만든다.
 * 앞이든 뒤든 좌표가 없는 짝은 물어볼 수 없으므로 건너뛴다.
 */
export function buildLegRequests(
  places: TravelPlace[],
  mode: RouteMode,
  sideOf?: SideOf,
): LegRequest[] {
  const requests: LegRequest[] = [];
  for (let i = 0; i < places.length - 1; i += 1) {
    const o = coordOf(places[i]);
    const d = coordOf(places[i + 1]);
    if (!o || !d) continue;
    requests.push(
      mode === "AUTO"
        ? { fromId: places[i].id, o, d, mode: pickAutoMode(o, d, sideOf), auto: true }
        : { fromId: places[i].id, o, d, mode },
    );
  }
  return requests;
}

type LegResult = TransitLeg | { error: "NO_ROUTE" };

/**
 * 길찾기 대행 창구에 물어본다.
 * 돌려주는 값은 "장소 id → 이동 한 구간(못 구했으면 null)". null 도 그대로 저장해서
 * 예전에 구해 둔 값이 남아 사람을 헷갈리게 하지 않도록 한다.
 *
 * 실패는 세 가지로만 던진다: NO_KEY(열쇠 없음) / RATE(너무 잦음) / FAIL(그 밖에).
 */
export async function fetchRouteLegs(
  requests: LegRequest[],
  region?: string,
  sideOf?: SideOf,
): Promise<Record<string, TransitLeg | null>> {
  const found: Record<string, TransitLeg | null> = {};
  if (requests.length === 0) return found;

  const first = await postLegs(requests, region);

  // 자동으로 고른 대중교통 구간이 "길 없음"이면 딱 한 번 더 물어본다 — 강을 건너면 차량, 2.5km 안쪽은 도보, 그 밖은 차량
  const retry: LegRequest[] = [];
  requests.forEach((request, index) => {
    const leg = first[index];
    found[request.fromId] = leg;
    if (!leg && request.auto && request.mode === "TRANSIT") {
      retry.push({ ...request, mode: fallbackMode(request.o, request.d, sideOf) });
    }
  });

  if (retry.length > 0) {
    const second = await postLegs(retry, region);
    retry.forEach((request, index) => {
      const leg = second[index];
      if (leg) found[request.fromId] = leg;
    });
  }

  return found;
}

/** 보낸 순서 그대로 결과를 돌려준다(못 구한 칸은 null). 15구간이 넘으면 나눠 보낸다. */
async function postLegs(
  requests: LegRequest[],
  region?: string,
): Promise<(TransitLeg | null)[]> {
  const legs: (TransitLeg | null)[] = [];

  for (let i = 0; i < requests.length; i += MAX_PER_CALL) {
    const chunk = requests.slice(i, i + MAX_PER_CALL);
    const res = await fetch("/api/travel/route-legs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legs: chunk.map(({ o, d, mode }) => ({ o, d, mode })),
        ...(region ? { region } : {}),
      }),
    }).catch(() => null);

    if (!res) throw new Error("FAIL");
    if (!res.ok) throw await readError(res);

    const data = (await res.json().catch(() => null)) as { legs?: LegResult[] } | null;
    const got = Array.isArray(data?.legs) ? data.legs : [];
    chunk.forEach((_, index) => {
      const leg = got[index];
      legs.push(leg && !("error" in leg) ? leg : null);
    });
  }

  return legs;
}

async function readError(res: Response): Promise<Error> {
  if (res.status === 429) return new Error("RATE");
  if (res.status === 500) {
    const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
    const message = typeof body?.error === "string" ? body.error : "";
    if (message.includes("열쇠")) return new Error("NO_KEY");
  }
  return new Error("FAIL");
}

/**
 * 그 날 동선을 도는 데 걸리는 시간(분)을 모두 더한다. 동선에서 뺀 숙소는 세지 않는다.
 * 마지막 정거장에는 "다음 구간"이 없으므로 맨 뒤 한 칸은 빼고 더한다 —
 * 숙소가 동선에 있으면 맨 뒤가 숙소(복귀 지점)이고, 예전 저장본에 숙소의 transitToNext 가 남아 있어도 이렇게 자동으로 무시된다.
 */
export function dayTransitTotal(day: TravelDay): number {
  return routePlaces(day)
    .slice(0, -1)
    .reduce((sum, place) => sum + (place.transitToNext?.minutes ?? 0), 0);
}

/** 95 → "1시간 35분", 46 → "46분" */
export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0분";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

/** 900 → "0.9km", 8000 → "8km" */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return "";
  const km = (meters / 1000).toFixed(1);
  return `${km.endsWith(".0") ? km.slice(0, -2) : km}km`;
}
