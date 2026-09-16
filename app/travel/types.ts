// 여행 플랜(travel)의 자료 모양. 저장 공간(travel_plans)과 화면이 같이 쓴다.

/** 장소의 종류. 지도 핀 색과 목록 아이콘이 이 값으로 갈린다. */
export type PlaceCategory = "airport" | "stay" | "outdoor" | "food" | "cafe" | "sight" | "etc";

export const CATEGORY_LABEL: Record<PlaceCategory, string> = { airport: "공항", stay: "숙소", outdoor: "아웃도어·쇼핑", food: "식당", cafe: "카페", sight: "관광", etc: "기타" };

export const CATEGORY_ICON: Record<PlaceCategory, string> = { airport: "✈️", stay: "🏨", outdoor: "🛍️", food: "🍽️", cafe: "☕", sight: "📷", etc: "📍" };

/** 이동 수단. 구글 길찾기에 그대로 넘기는 값이라 대문자를 지킨다. */
export type TransitMode = "WALK" | "TRANSIT" | "DRIVE";

/** 한 장소에서 다음 장소까지의 이동 한 구간. 길찾기 결과를 그대로 담아 둔다(매번 다시 묻지 않으려고). */
export type TransitLeg = { mode: TransitMode; minutes: number; meters: number; summary?: string; polyline?: string; fetchedAt: string };

/** 여행지 한 곳. isStay(숙소)는 하루에 하나뿐이고 places[0] 자리에 둔다. */
export type TravelPlace = { id: string; name: string; category: PlaceCategory; address?: string; lat?: number; lng?: number; placeId?: string; url?: string; memo?: string; isStay?: boolean; transitToNext?: TransitLeg | null };

/** 하루치 일정. stayInRoute 를 끄면 숙소는 목록에 남되 동선(이동 시간 계산)에서는 빠진다. */
export type TravelDay = { date: string; stayInRoute: boolean; places: TravelPlace[] };

/** 여행 하나. days 는 시작일~종료일 하루당 한 칸, pool 은 아직 날짜를 못 정한 후보 장소. */
export type TravelPlan = { id: string; slug: string; shortCode: string; title: string; startDate: string; endDate: string; region: string; days: TravelDay[]; pool: TravelPlace[]; createdAt: string; updatedAt: string };

/** 구글 장소 검색에 넘기는 나라 코드. 빈 값은 "나라를 좁히지 않음". */
export const REGIONS: { code: string; label: string }[] = [ { code: "KR", label: "한국" }, { code: "JP", label: "일본" }, { code: "CN", label: "중국" }, { code: "TW", label: "대만" }, { code: "TH", label: "태국" }, { code: "VN", label: "베트남" }, { code: "SG", label: "싱가포르" }, { code: "US", label: "미국" }, { code: "", label: "유럽·기타" } ];

/** 한 여행의 최대 일수 (days 칸이 끝없이 늘어나지 않게) */
export const MAX_TRIP_DAYS = 30;
