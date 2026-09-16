// 여행 플랜: 구글 장소 검색(자동완성·상세) 프록시.
// 서버 열쇠(GOOGLE_MAPS_SERVER_KEY)는 이 파일 밖으로 나가지 않는다. 브라우저는 이 주소만 부른다.
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { PlaceCategory } from "@/app/travel/types";

const NO_KEY = { error: "구글 지도 열쇠가 아직 설정되지 않았어요." };
const UPSTREAM_FAIL = { error: "장소 검색에 실패했어요. 잠시 후 다시 해 주세요." };
const TOO_MANY = { error: "검색이 너무 잦아요. 잠시 후 다시 해 주세요." };
const BAD_BODY = { error: "요청 내용을 확인해 주세요." };

const TIMEOUT_MS = 8000;
const MAX_SUGGESTIONS = 6;
const MAX_INPUT = 80;
const MIN_INPUT = 2;
const MAX_TOKEN = 64;
const BIAS_RADIUS_M = 50000;

// 구글이 돌려주는 type 값 → 우리 화면의 분류. 위에서부터 먼저 걸리는 것을 쓴다.
const CATEGORY_BY_TYPE: Record<string, PlaceCategory> = {
  airport: "airport",
  lodging: "stay",
  hotel: "stay",
  guest_house: "stay",
  hostel: "stay",
  resort_hotel: "stay",
  restaurant: "food",
  meal_takeaway: "food",
  food: "food",
  bar: "food",
  cafe: "cafe",
  coffee_shop: "cafe",
  bakery: "cafe",
  dessert_shop: "cafe",
  tea_house: "cafe",
  tourist_attraction: "sight",
  museum: "sight",
  art_gallery: "sight",
  park: "sight",
  zoo: "sight",
  aquarium: "sight",
  amusement_park: "sight",
  historical_landmark: "sight",
  place_of_worship: "sight",
  temple: "sight",
  shrine: "sight",
  landmark: "sight",
  shopping_mall: "outdoor",
  store: "outdoor",
  department_store: "outdoor",
  market: "outdoor",
  clothing_store: "outdoor",
  convenience_store: "outdoor",
  supermarket: "outdoor",
};

function toCategory(primaryType?: string, types?: string[]): PlaceCategory {
  const candidates = [primaryType, ...(types ?? [])].filter(
    (t): t is string => typeof t === "string" && t.length > 0,
  );
  for (const t of candidates) {
    const hit = CATEGORY_BY_TYPE[t];
    if (hit) return hit;
    // japanese_restaurant, ramen_restaurant 처럼 나라·메뉴별로 갈리는 값은 전부 식당으로 본다.
    if (t.endsWith("_restaurant")) return "food";
  }
  return "etc";
}

type Point = { lat: number; lng: number };

// 나라 코드: 없거나 ""면 "나라를 좁히지 않음", 두 글자 대문자만 허용. 그 외는 null(=잘못된 값).
function readRegion(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return null;
  return /^[A-Z]{2}$/.test(value) ? value : null;
}

// 검색 중심 좌표: 없으면 undefined, 모양이 이상하면 null.
function readBias(value: unknown): Point | null | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const lat = Number(v.lat);
  const lng = Number(v.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      placeId?: string;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }[];
};

type DetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
};

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(BAD_BODY, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  if (b.kind === "autocomplete") return autocomplete(req, b);
  if (b.kind === "details") return details(req, b);
  return NextResponse.json(BAD_BODY, { status: 400 });
}

async function autocomplete(req: Request, b: Record<string, unknown>) {
  const input = typeof b.input === "string" ? b.input.trim() : "";
  if (input.length < MIN_INPUT || input.length > MAX_INPUT) {
    return bad(`검색어는 ${MIN_INPUT}자 이상 ${MAX_INPUT}자 이하로 입력해 주세요.`);
  }

  const sessionToken = typeof b.sessionToken === "string" ? b.sessionToken : "";
  if (!sessionToken || sessionToken.length > MAX_TOKEN) {
    return bad("검색 세션 값이 올바르지 않아요.");
  }

  const region = readRegion(b.region);
  if (region === null) return bad("나라 코드가 올바르지 않아요.");

  const bias = readBias(b.bias);
  if (bias === null) return bad("검색 기준 위치가 올바르지 않아요.");

  if (!checkRateLimit(`travel-places:${getClientIp(req)}`, 40, 60_000)) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }

  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return NextResponse.json(NO_KEY, { status: 500 });

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
      },
      body: JSON.stringify({
        input,
        languageCode: "ko",
        ...(region ? { regionCode: region, includedRegionCodes: [region] } : {}),
        sessionToken,
        ...(bias
          ? {
              locationBias: {
                circle: {
                  center: { latitude: bias.lat, longitude: bias.lng },
                  radius: BIAS_RADIUS_M,
                },
              },
            }
          : {}),
      }),
    });

    if (!res.ok) {
      // 구글이 준 본문은 열쇠 정보가 섞일 수 있어 그대로 흘려보내지 않는다.
      console.error("[travel places]", res.status);
      return NextResponse.json(UPSTREAM_FAIL, { status: 502 });
    }

    const data = (await res.json()) as AutocompleteResponse;
    const items = (data.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p && typeof p.placeId === "string")
      .slice(0, MAX_SUGGESTIONS)
      .map((p) => ({
        placeId: p.placeId as string,
        mainText: p.structuredFormat?.mainText?.text ?? "",
        secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
      }));

    return NextResponse.json({ items });
  } catch (e) {
    console.error("[travel places]", e instanceof Error ? e.name : "unknown");
    return NextResponse.json(UPSTREAM_FAIL, { status: 502 });
  }
}

async function details(req: Request, b: Record<string, unknown>) {
  const placeId = typeof b.placeId === "string" ? b.placeId.trim() : "";
  if (!placeId || placeId.length > 256) return bad("장소 값이 올바르지 않아요.");

  const sessionToken = typeof b.sessionToken === "string" ? b.sessionToken : "";
  if (sessionToken.length > MAX_TOKEN) return bad("검색 세션 값이 올바르지 않아요.");

  if (!checkRateLimit(`travel-details:${getClientIp(req)}`, 15, 60_000)) {
    return NextResponse.json(TOO_MANY, { status: 429 });
  }

  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return NextResponse.json(NO_KEY, { status: 500 });

  const url =
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ko` +
    (sessionToken ? `&sessionToken=${encodeURIComponent(sessionToken)}` : "");

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,location,googleMapsUri,primaryType,types",
      },
    });

    if (!res.ok) {
      console.error("[travel places]", res.status);
      return NextResponse.json(UPSTREAM_FAIL, { status: 502 });
    }

    const data = (await res.json()) as DetailsResponse;
    return NextResponse.json({
      placeId: data.id ?? placeId,
      name: data.displayName?.text ?? "",
      address: data.formattedAddress ?? "",
      lat: data.location?.latitude ?? null,
      lng: data.location?.longitude ?? null,
      url: data.googleMapsUri ?? "",
      category: toCategory(data.primaryType, data.types),
    });
  } catch (e) {
    console.error("[travel places]", e instanceof Error ? e.name : "unknown");
    return NextResponse.json(UPSTREAM_FAIL, { status: 502 });
  }
}
