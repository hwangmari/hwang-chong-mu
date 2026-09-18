// 여행 플랜(travel)의 자료 모양. 저장 공간(travel_plans)과 화면이 같이 쓴다.

/** 장소의 종류. 지도 핀 색과 목록 아이콘이 이 값으로 갈린다. */
export type PlaceCategory = "airport" | "stay" | "outdoor" | "food" | "cafe" | "sight" | "etc";

export const CATEGORY_LABEL: Record<PlaceCategory, string> = { airport: "공항", stay: "숙소", outdoor: "아웃도어·쇼핑", food: "식당", cafe: "카페", sight: "관광", etc: "기타" };

export const CATEGORY_ICON: Record<PlaceCategory, string> = { airport: "✈️", stay: "🏨", outdoor: "🛍️", food: "🍽️", cafe: "☕", sight: "📷", etc: "📍" };

/** 이동 수단. 구글 길찾기에 그대로 넘기는 값이라 대문자를 지킨다. */
export type TransitMode = "WALK" | "TRANSIT" | "DRIVE";

/** 한 장소에서 다음 장소까지의 이동 한 구간. 길찾기 결과를 그대로 담아 둔다(매번 다시 묻지 않으려고). */
export type TransitLeg = { mode: TransitMode; minutes: number; meters: number; summary?: string; polyline?: string; fetchedAt: string };

/** 장소 안의 세부 일정 한 줄. time 은 "10:30" 같은 자유 글자라 비워 둘 수 있다. (2026-09-18) */
export type PlaceStep = { id: string; text: string; time?: string };

/** 한 장소가 가질 수 있는 세부 일정 개수 — 목록이 끝없이 길어지지 않게 */
export const MAX_PLACE_STEPS = 20;

/** 여행지 한 곳. isStay(숙소)는 하루에 하나뿐이고 places[0] 자리에 둔다. steps 는 그 안에서 할 일(세부 일정). */
export type TravelPlace = { id: string; name: string; category: PlaceCategory; address?: string; lat?: number; lng?: number; placeId?: string; url?: string; memo?: string; isStay?: boolean; steps?: PlaceStep[]; transitToNext?: TransitLeg | null };

/** 하루치 일정. stayInRoute 를 끄면 숙소는 목록에 남되 동선(이동 시간 계산)에서는 빠진다. */
export type TravelDay = { date: string; stayInRoute: boolean; places: TravelPlace[] };

/** 여행 하나. days 는 시작일~종료일 하루당 한 칸, pool 은 아직 날짜를 못 정한 후보 장소. */
export type TravelPlan = { id: string; slug: string; shortCode: string; title: string; startDate: string; endDate: string; region: string; days: TravelDay[]; pool: TravelPlace[]; extras: TravelExtras; createdAt: string; updatedAt: string };

/** 구글 장소 검색에 넘기는 나라 코드. 빈 값은 "나라를 좁히지 않음". */
export const REGIONS: { code: string; label: string }[] = [ { code: "KR", label: "한국" }, { code: "JP", label: "일본" }, { code: "CN", label: "중국" }, { code: "TW", label: "대만" }, { code: "TH", label: "태국" }, { code: "VN", label: "베트남" }, { code: "SG", label: "싱가포르" }, { code: "US", label: "미국" }, { code: "", label: "유럽·기타" } ];

/** 한 여행의 최대 일수 (days 칸이 끝없이 늘어나지 않게) */
export const MAX_TRIP_DAYS = 30;

/* ===== 여행 준비(extras) =====
   날짜별 동선(days)과 달리 한 여행에 하나뿐인 값들. 저장 공간에서는 travel_plans.extras(jsonb) 한 칸에 모여 있다. */

/** 준비물·살 거 목록의 한 줄. done 은 체크 표시. */
export type ChecklistItem = { id: string; text: string; done: boolean };

/** 비행편 한 줄. kind 는 출국(out)/귀국(in) 두 가지뿐이고 시각은 "09:05" 같은 자유 글자다. */
export type FlightInfo = {
  id: string;
  kind: "out" | "in";
  airline?: string;
  flightNo?: string;
  from?: string;
  to?: string;
  depart?: string;
  arrive?: string;
  memo?: string;
};

/** 여행 준비 칸 전체. calcRoomId 는 연결한 여행 경비 계산기의 주소 값(/calc/<id>)이고 안 이으면 null. */
export type TravelExtras = {
  packing: ChecklistItem[];
  shopping: ChecklistItem[];
  flights: FlightInfo[];
  calcRoomId: string | null;
};

/** 아직 아무것도 안 적은 상태. 예전 저장본(extras 가 없던 때)도 이 모양으로 읽는다. */
export const EMPTY_EXTRAS: TravelExtras = {
  packing: [],
  shopping: [],
  flights: [],
  calcRoomId: null,
};

/* ===== 추천 장소 안내서(guide) =====
   도시별로 미리 추려 둔 관광지 목록. 저장 공간에는 들어가지 않고 코드(app/travel/data/*)에 그대로 있다.
   방 화면의 "추천 장소에서 고르기" 창이 이 모양을 읽어 구역별로 보여 주고, 고른 곳을 TravelPlace 로 바꿔 넣는다. (2026-09-17) */

/** 추천 장소 한 곳. tip 은 넣을 때 메모로 함께 들어간다. pick 은 "이 구역에서 꼭 가는 곳" 표시. */
export type GuideSpot = {
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  tip: string;
  address?: string;
  pick?: boolean;
  /** 강 건너편 구분(상하이는 황푸강 동쪽 "east" = 푸둥). 없으면 구역(area)의 값을 따른다 */
  side?: "east" | "west";
};

/** 구역 하나(와이탄·예원 …). blurb 는 구역을 고르면 맨 위에 한 줄로 보이는 설명.
    side 는 강을 기준으로 이 구역이 어느 쪽인지 — 주변 추천이 강 건너편을 "가까운 곳"으로 섞지 않게 (2026-09-17) */
export type GuideArea = { id: string; name: string; blurb: string; side?: "east" | "west"; spots: GuideSpot[] };

/** 도시 하나의 안내서. 어느 여행에 보여 줄지는 region + keywords(제목) 또는 center 반경 안의 장소 좌표로 정한다. */
export type CityGuide = {
  id: string;
  city: string;
  region: string;
  keywords: string[];
  center: { lat: number; lng: number };
  radiusKm: number;
  /** 도시를 가르는 강이 있으면 이름(예: "황푸강"). 있으면 주변 추천은 같은 쪽 장소만 보여 준다 */
  river?: string;
  areas: GuideArea[];
};
