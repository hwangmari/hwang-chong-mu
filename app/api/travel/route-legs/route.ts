// 여행 플랜: 장소와 장소 사이 이동 시간(길찾기) 프록시.
// 한 번에 여러 구간을 물어보고, 한 구간이 실패해도 나머지는 그대로 돌려준다.
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { TransitLeg, TransitMode } from "@/app/travel/types";

const NO_KEY = { error: "구글 지도 열쇠가 아직 설정되지 않았어요." };
const TOO_MANY = { error: "검색이 너무 잦아요. 잠시 후 다시 해 주세요." };
// 한 사람이 아니라 창구 전체가 몰릴 때 (리뷰 반영 2026-09-16)
const TOO_BUSY = { error: "지금은 조회가 몰려 있어요. 잠시 후 다시 해 주세요." };
const BAD_BODY = { error: "요청 내용을 확인해 주세요." };

const TIMEOUT_MS = 8000;
const MAX_LEGS = 15;
const MODES: TransitMode[] = ["WALK", "TRANSIT", "DRIVE"];

const FIELD_MASK = [
  "routes.duration",
  "routes.distanceMeters",
  "routes.polyline.encodedPolyline",
  "routes.legs.steps.transitDetails.transitLine.nameShort",
  "routes.legs.steps.transitDetails.transitLine.name",
  "routes.legs.steps.transitDetails.transitLine.vehicle.type",
].join(",");

// 대중교통 수단별 그림글자. 모르는 값은 버스로 본다.
const VEHICLE_EMOJI: Record<string, string> = {
  BUS: "🚌",
  SUBWAY: "🚆",
  METRO_RAIL: "🚆",
  RAIL: "🚆",
  HEAVY_RAIL: "🚆",
  COMMUTER_TRAIN: "🚆",
  TRAM: "🚋",
  FERRY: "⛴️",
};

type Point = { lat: number; lng: number };
type LegInput = { o: Point; d: Point; mode: TransitMode };
type LegResult = TransitLeg | { error: "NO_ROUTE" };

type RoutesResponse = {
  routes?: {
    duration?: string;
    distanceMeters?: number;
    polyline?: { encodedPolyline?: string };
    legs?: {
      steps?: {
        transitDetails?: {
          transitLine?: {
            nameShort?: string;
            name?: string;
            vehicle?: { type?: string };
          };
        };
      }[];
    }[];
  }[];
};

function readPoint(value: unknown): Point | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const lat = Number(v.lat);
  const lng = Number(v.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

// "1234s" → 1234 (초). 모양이 다르면 null.
function readSeconds(duration: unknown): number | null {
  if (typeof duration !== "string") return null;
  const n = Number(duration.replace(/s$/, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// 대중교통 노선 이름들을 겹치지 않게 모아 "🚆 야마노테선 · 🚌 도영버스" 모양으로 만든다.
function buildSummary(route: NonNullable<RoutesResponse["routes"]>[number]): string | undefined {
  const names: string[] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      const line = step.transitDetails?.transitLine;
      if (!line) continue;
      const name = line.nameShort ?? line.name;
      if (!name) continue;
      const emoji = VEHICLE_EMOJI[line.vehicle?.type ?? ""] ?? "🚌";
      const label = `${emoji} ${name}`;
      if (!names.includes(label)) names.push(label);
    }
  }
  return names.length ? names.join(" · ") : undefined;
}

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(BAD_BODY, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const rawLegs = b.legs;
  if (!Array.isArray(rawLegs) || rawLegs.length < 1 || rawLegs.length > MAX_LEGS) {
    return NextResponse.json(
      { error: `이동 구간은 1개 이상 ${MAX_LEGS}개 이하로 보내 주세요.` },
      { status: 400 },
    );
  }

  const legs: LegInput[] = [];
  for (const raw of rawLegs) {
    if (!raw || typeof raw !== "object") {
      return NextResponse.json(BAD_BODY, { status: 400 });
    }
    const r = raw as Record<string, unknown>;
    const o = readPoint(r.o);
    const d = readPoint(r.d);
    const mode = r.mode;
    if (!o || !d) {
      return NextResponse.json({ error: "장소 좌표가 올바르지 않아요." }, { status: 400 });
    }
    if (typeof mode !== "string" || !MODES.includes(mode as TransitMode)) {
      return NextResponse.json({ error: "이동 수단이 올바르지 않아요." }, { status: 400 });
    }
    legs.push({ o, d, mode: mode as TransitMode });
  }

  const region =
    b.region === undefined || b.region === null || b.region === ""
      ? ""
      : typeof b.region === "string" && /^[A-Z]{2}$/.test(b.region)
        ? b.region
        : null;
  if (region === null) {
    return NextResponse.json({ error: "나라 코드가 올바르지 않아요." }, { status: 400 });
  }

  if (!checkRateLimit(`travel-routes:${getClientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }
  // 사람별 제한은 주소를 바꿔 가며 피할 수 있다. 구글 요금이 한 번에 새어 나가지 않게 창구 전체 상한도 둔다. (리뷰 반영 2026-09-16)
  if (!checkRateLimit("travel-routes:global", 60, 60_000)) {
    return NextResponse.json(TOO_BUSY, { status: 429 });
  }

  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return NextResponse.json(NO_KEY, { status: 500 });

  // 실패한 구간이 여러 개여도 기록은 한 번만 남긴다(로그가 넘치지 않게).
  let logged = false;
  const logOnce = (detail: string | number) => {
    if (logged) return;
    logged = true;
    console.error("[travel route-legs]", detail);
  };

  const results = await Promise.all(legs.map((leg) => fetchLeg(leg, key, region, logOnce)));

  return NextResponse.json({ legs: results });
}

async function fetchLeg(
  leg: LegInput,
  key: string,
  region: string,
  logOnce: (detail: string | number) => void,
): Promise<LegResult> {
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: leg.o.lat, longitude: leg.o.lng } } },
        destination: { location: { latLng: { latitude: leg.d.lat, longitude: leg.d.lng } } },
        travelMode: leg.mode,
        languageCode: "ko",
        ...(region ? { regionCode: region } : {}),
        ...(leg.mode === "TRANSIT"
          ? { transitPreferences: { routingPreference: "FEWER_TRANSFERS" } }
          : {}),
        ...(leg.mode === "DRIVE" ? { routingPreference: "TRAFFIC_UNAWARE" } : {}),
      }),
    });

    if (!res.ok) {
      logOnce(res.status);
      return { error: "NO_ROUTE" };
    }

    const data = (await res.json()) as RoutesResponse;
    const route = data.routes?.[0];
    const seconds = readSeconds(route?.duration);
    if (!route || seconds === null) return { error: "NO_ROUTE" };

    const meters = Number(route.distanceMeters);
    const polyline = route.polyline?.encodedPolyline;
    const summary = leg.mode === "TRANSIT" ? buildSummary(route) : undefined;

    return {
      mode: leg.mode,
      minutes: Math.max(1, Math.round(seconds / 60)),
      meters: Number.isFinite(meters) ? meters : 0,
      ...(summary ? { summary } : {}),
      ...(polyline ? { polyline } : {}),
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    logOnce(e instanceof Error ? e.name : "unknown");
    return { error: "NO_ROUTE" };
  }
}
