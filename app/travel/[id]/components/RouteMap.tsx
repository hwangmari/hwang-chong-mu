"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styled from "styled-components";
import {
  loadGoogleMaps,
  type GmapsListener,
  type GmapsMap,
  type GmapsMarker,
  type GmapsAdvancedMarker,
  type GmapsPolyline,
  type GoogleMapsApi,
} from "../../lib/googleMapsLoader";
import type { NearbySpot } from "../../lib/guides";
import { haversineMeters } from "../../lib/routeLegs";
import { CATEGORY_ICON, CATEGORY_LABEL, type TransitMode, type TransitLeg, type TravelPlace } from "../../types";
import {
  StCardTitle,
  StHint,
  StLegendDot,
  StMapBody,
  StMapCard,
  StMapItem,
  StMapItemText,
  StMapLegend,
  StNumBadge,
} from "../page.styles";

// 오른쪽 "오늘의 동선" 카드.
// 구글 열쇠가 있으면 진짜 지도를, 없으면 도는 순서만 적은 요약 카드를 보여준다(열쇠 없는 상태도 정상 화면이다).
// places 는 도는 순서 그대로 온다 — 1 → 2 → … → n → 🏨(숙소 복귀). 마지막 "숙소로" 구간만 점선이다.
// (2026-09-16)

type RouteMapProps = {
  places: TravelPlace[];
  focusedId: string | null;
  onFocus: (id: string | null) => void;
  /** 장소 순서 그대로. 아직 못 구한 칸은 비어 있다(순서가 어긋나면 안 되므로 빈칸을 빼지 않는다). */
  legs?: (TransitLeg | undefined)[];
  /** 나라 코드(JP 등). 지도 글자·검색 기준을 그 나라에 맞춘다. page.tsx 가 plan.region 을 넘겨 주면 된다. */
  region?: string;
  /** 클릭으로 고른 장소 — 있으면 그곳으로 확대(SELECT_ZOOM)하고, 풀리면 전체 보기로 돌아간다 (2026-09-17) */
  selectedId?: string | null;
  /** 고른 장소 주변의 추천 장소 — 연한 작은 핀으로 찍는다 */
  nearby?: NearbySpot[];
  /** 주변 핀에 손을 올리거나(id) 떼면(null) 알려 준다 — 아래 주변 칸의 줄과 같이 밝아지게 */
  onNearbyHover?: (id: string | null) => void;
  /** 주변 칸에서 가리키는 장소 id — 그 핀만 진하게 */
  nearbyActiveId?: string | null;
  /** 지도 아래에 붙는 칸(주변 추천). 카드 안에 넣어 테두리가 두 겹 되지 않게 한다 */
  children?: ReactNode;
};

/** 지도에 찍을 한 점. 좌표가 있는 장소만 여기에 들어온다. */
type Pin = { id: string; name: string; lat: number; lng: number; isStay: boolean; isAirport: boolean; label: string };

/** 주변 추천 핀 하나. 고른 장소가 바뀌면 통째로 지우고 다시 찍는다 — 손을 올릴 때는 테두리 색만 바꾼다. */
type NearbyHandle = {
  legacy?: GmapsMarker;
  advanced?: GmapsAdvancedMarker;
  /** 테두리 색을 바꾼다(가리키는 핀만 진하게) */
  setRing: (ring: string) => void;
  /** 붙여 둔 손잡이·핀을 모두 뗀다 */
  dispose: () => void;
};

/** 이미 그려 둔 핀 하나. 같은 장소는 다시 만들지 않고 이 기록을 고쳐 쓴다. */
type PinHandle = {
  legacy?: GmapsMarker;
  advanced?: GmapsAdvancedMarker;
  content?: HTMLDivElement;
  lat: number;
  lng: number;
  label: string;
  listener: GmapsListener;
};

const SEOUL = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 12;
/** 장소 하나를 클릭해 확대할 때의 배율 — 1.5km 반경이 한 화면에 들어오는 정도 */
const SELECT_ZOOM = 15;

// 구글 지도에 넘기는 색은 구글이 직접 읽는다. 우리 색표(theme)는 oklch() 라서 구글이 못 읽고
// 선·핀이 검게 나오므로, 지도로 넘어가는 색만 16진수로 적어 둔다. 화면(styled-components) 쪽은 그대로 theme 을 쓴다. (리뷰 반영 2026-09-16)
/** 이동선 색: 걷기 초록 / 대중교통 파랑 / 차 주황 */
const STROKE_COLOR: Record<TransitMode, string> = {
  WALK: "#22c55e",
  TRANSIT: "#2563eb",
  DRIVE: "#f97316",
};
/** 길찾기 결과가 없을 때 긋는 직선 */
const LINE_FALLBACK = "#2563eb";

// 마지막 "숙소로 돌아가는" 구간은 점선으로 긋는다 — 다른 구간과 성격이 달라서.
// 구글 지도에는 점선 옵션이 따로 없어서, 선 자체는 투명하게(strokeOpacity: 0) 두고
// 짧은 세로 막대(M 0,-1 0,1)를 12px 간격으로 반복해 찍는 공식 문서의 방법을 쓴다.
const DASH_OPTIONS = {
  strokeOpacity: 0,
  icons: [
    { icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "12px" },
  ],
};
const PIN_FILL = "#2563eb";
const PIN_STAY_FILL = "#f59e0b";
const PIN_TEXT = "#ffffff";
/** 주변 추천 핀 — 흰 바탕에 파란 테두리(번호 핀과 한눈에 구분되게) */
const NEARBY_FILL = "#ffffff";
const NEARBY_RING = "#93c5fd";
const NEARBY_RING_ACTIVE = "#2563eb";
const NEARBY_TEXT = "#1f2937";
/** 옛 지도 핀(Marker)용 동그라미 모양 — 기본 빨간 핀 대신 쓴다. 반지름 10px 원 */
const NEARBY_SYMBOL_PATH = "M -10,0 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0";

/** 공항이 시내에서 이만큼 넘게 떨어져 있으면 화면 맞춤에서 뺀다 */
const FAR_AIRPORT_M = 15000;

/**
 * 화면을 맞출 때 쓸 핀. 도착·출발 날에는 50km 밖 공항 때문에 지도가 도시 전체로 줄어들어
 * 시내 동선이 한 점에 뭉친다 — 나머지 핀의 가운데에서 15km 넘게 떨어진 공항만 뺀다(핀·선은 그대로 그린다). (2026-09-17)
 */
function framePins(pins: Pin[]): Pin[] {
  const city = pins.filter((pin) => !pin.isAirport);
  if (city.length === 0 || city.length === pins.length) return pins;
  const center = {
    lat: city.reduce((sum, pin) => sum + pin.lat, 0) / city.length,
    lng: city.reduce((sum, pin) => sum + pin.lng, 0) / city.length,
  };
  const kept = pins.filter((pin) => !pin.isAirport || haversineMeters(center, pin) <= FAR_AIRPORT_M);
  return kept;
}

/** 옛 지도 핀(Marker)에 주는 동그라미 아이콘. 테두리 색만 바꿔 다시 넘긴다 */
function nearbyIcon(ring: string) {
  return {
    path: NEARBY_SYMBOL_PATH,
    fillColor: NEARBY_FILL,
    fillOpacity: 1,
    strokeColor: ring,
    strokeWeight: 2,
    scale: 1,
    // path 의 (0,0)이 원 중심이라 좌표 위에 딱 앉는다. 글자(이모지)도 중심에 온다
    labelOrigin: { x: 0, y: 0 },
  };
}

function isReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function RouteMap({
  places,
  focusedId,
  onFocus,
  legs,
  region,
  selectedId = null,
  nearby,
  onNearbyHover,
  nearbyActiveId = null,
  children,
}: RouteMapProps) {
  const [api, setApi] = useState<GoogleMapsApi | null>(null);
  const [loading, setLoading] = useState(true);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GmapsMap | null>(null);
  const pinsRef = useRef(new Map<string, PinHandle>());
  const linesRef = useRef<GmapsPolyline[]>([]);
  // 주변 추천 핀은 번호 핀과 따로 관리한다(고를 때마다 통째로 갈리는 값이라 고쳐 쓰지 않고 지우고 다시 찍는다)
  const nearbyRef = useRef(new Map<string, NearbyHandle>());
  const boundsKeyRef = useRef("");
  const onFocusRef = useRef(onFocus);
  const onNearbyHoverRef = useRef(onNearbyHover);
  // 핀을 누를 때 쓸 최신 손잡이. 핀을 다시 만들지 않으려고 따로 담아 둔다.
  useEffect(() => {
    onFocusRef.current = onFocus;
    onNearbyHoverRef.current = onNearbyHover;
  }, [onFocus, onNearbyHover]);

  /** 좌표가 있는 장소만, 왼쪽 목록과 같은 번호를 달아서 (숙소는 번호 대신 🏨) */
  const pins = useMemo<Pin[]>(() => {
    let counter = 0;
    const out: Pin[] = [];
    for (const place of places) {
      const isStay = place.isStay === true;
      if (!isStay) counter += 1;
      const { lat, lng } = place;
      if (typeof lat !== "number" || typeof lng !== "number") continue;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      out.push({
        id: place.id,
        name: place.name,
        lat,
        lng,
        isStay,
        isAirport: place.category === "airport",
        label: isStay ? "🏨" : String(counter),
      });
    }
    return out;
  }, [places]);

  const missingCount = places.length - pins.length;
  const boundsKey = useMemo(() => pins.map((pin) => pin.id).join("|"), [pins]);

  /** 동선의 끝이 숙소인지(= 마지막 구간이 "숙소 복귀"라 점선으로 긋는다) */
  const endsAtStay = places.length > 1 && places[places.length - 1]?.isStay === true;

  /** 길찾기 결과가 있으면 그 선을 그대로 그린다. 하나도 없으면 아래에서 직선 하나만 긋는다. */
  const strokes = useMemo(() => {
    const out: { polyline: string; mode: TransitMode; dashed: boolean }[] = [];
    if (!legs) return out;
    const lastIndex = places.length - 2;
    for (let i = 0; i < places.length - 1; i += 1) {
      const leg = legs[i];
      if (leg?.polyline) {
        out.push({ polyline: leg.polyline, mode: leg.mode, dashed: endsAtStay && i === lastIndex });
      }
    }
    return out;
  }, [endsAtStay, legs, places]);

  // page.tsx 는 순서를 맞추려고 아직 못 구한 칸을 빈칸으로 남겨 보내므로, 진짜 값이 하나라도 있을 때만 보여 준다
  const hasModeLegend = (legs ?? []).some((leg) => Boolean(leg));

  // ── 구글 지도 불러오기 (열쇠가 없으면 null 이 와서 요약 카드로 남는다)
  useEffect(() => {
    let alive = true;
    void loadGoogleMaps(region).then((result) => {
      if (!alive) return;
      setApi(result);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [region]);

  // ── 지도는 딱 한 번만 만든다 (다시 그릴 때마다 새로 만들면 화면이 튄다)
  useEffect(() => {
    if (!api || mapRef.current || !boxRef.current) return;
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
    const first = pins[0];
    mapRef.current = new api.maps.Map(boxRef.current, {
      center: first ? { lat: first.lat, lng: first.lng } : SEOUL,
      zoom: DEFAULT_ZOOM,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      ...(mapId ? { mapId } : {}),
    });
  }, [api, pins]);

  // ── 핀: 사라진 곳만 지우고, 남은 곳은 자리·번호만 고쳐 쓴다
  useEffect(() => {
    const map = mapRef.current;
    if (!api || !map) return;
    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
    const AdvancedMarker = api.maps.marker?.AdvancedMarkerElement;
    const useAdvanced = Boolean(AdvancedMarker && mapId);
    const handles = pinsRef.current;
    const alive = new Set<string>();

    for (const pin of pins) {
      alive.add(pin.id);
      const before = handles.get(pin.id);

      if (before) {
        if (before.lat !== pin.lat || before.lng !== pin.lng) {
          if (before.legacy) before.legacy.setPosition({ lat: pin.lat, lng: pin.lng });
          if (before.advanced) before.advanced.position = { lat: pin.lat, lng: pin.lng };
          before.lat = pin.lat;
          before.lng = pin.lng;
        }
        if (before.label !== pin.label) {
          if (before.content) {
            // 새 지도 핀은 글자만 바꾸면 된다
            before.content.textContent = pin.label;
            before.label = pin.label;
          } else {
            // 옛 지도 핀은 번호를 바꿀 방법이 없어 그 핀만 새로 만든다
            before.listener?.remove();
            before.legacy?.setMap(null);
            handles.delete(pin.id);
          }
        }
        if (handles.has(pin.id)) continue;
      }

      if (useAdvanced && AdvancedMarker) {
        const content = document.createElement("div");
        content.textContent = pin.label;
        const size = pin.isStay ? "28px" : "26px";
        content.style.cssText = [
          `width:${size}`,
          `height:${size}`,
          "display:flex",
          "align-items:center",
          "justify-content:center",
          "border-radius:50%",
          `background:${pin.isStay ? PIN_STAY_FILL : PIN_FILL}`,
          `color:${PIN_TEXT}`,
          "font-size:0.78rem",
          "font-weight:800",
          "line-height:1",
          "box-shadow:0 1px 4px rgba(0,0,0,0.25)",
        ].join(";");
        const marker = new AdvancedMarker({
          map,
          position: { lat: pin.lat, lng: pin.lng },
          content,
          title: pin.name,
          zIndex: pin.isStay ? 2 : 1,
        });
        const listener = marker.addListener("click", () => onFocusRef.current(pin.id));
        handles.set(pin.id, { advanced: marker, content, lat: pin.lat, lng: pin.lng, label: pin.label, listener });
      } else {
        const marker = new api.maps.Marker({
          map,
          position: { lat: pin.lat, lng: pin.lng },
          title: pin.name,
          zIndex: pin.isStay ? 2 : 1,
          label: { text: pin.label, color: PIN_TEXT, fontWeight: "800" },
        });
        const listener = marker.addListener("click", () => onFocusRef.current(pin.id));
        handles.set(pin.id, { legacy: marker, lat: pin.lat, lng: pin.lng, label: pin.label, listener });
      }
    }

    for (const [id, handle] of handles) {
      if (alive.has(id)) continue;
      // 지도가 오류 상태(열쇠 거부 등)면 addListener 가 빈 값을 줄 때가 있다 — 그때 화면 전체가 죽지 않게 (2026-09-17)
      handle.listener?.remove();
      handle.legacy?.setMap(null);
      if (handle.advanced) handle.advanced.map = null;
      handles.delete(id);
    }
  }, [api, pins]);

  // ── 이동선: 장소나 길찾기 결과가 바뀌면 지우고 다시 긋는다
  useEffect(() => {
    const map = mapRef.current;
    if (!api || !map) return;
    for (const line of linesRef.current) line.setMap(null);
    // 배열 자체는 그대로 두고 비운다 — 화면을 떠날 때 정리하는 쪽이 같은 배열을 보고 있어야 해서
    linesRef.current.length = 0;

    if (strokes.length > 0) {
      for (const stroke of strokes) {
        const path = api.maps.geometry.encoding.decodePath(stroke.polyline);
        if (path.length < 2) continue;
        linesRef.current.push(
          new api.maps.Polyline({
            map,
            path,
            strokeColor: STROKE_COLOR[stroke.mode],
            strokeWeight: 4,
            ...(stroke.dashed ? DASH_OPTIONS : { strokeOpacity: 0.9 }),
          }),
        );
      }
      return;
    }

    if (pins.length < 2) return;
    const path = pins.map((pin) => ({ lat: pin.lat, lng: pin.lng }));
    // 마지막 핀이 숙소면 "돌아가는" 구간만 떼어 점선으로 긋는다
    const backToStay = endsAtStay && pins[pins.length - 1].isStay;
    const solid = backToStay ? path.slice(0, -1) : path;
    if (solid.length >= 2) {
      linesRef.current.push(
        new api.maps.Polyline({
          map,
          path: solid,
          geodesic: true,
          strokeColor: LINE_FALLBACK,
          strokeWeight: 3,
          strokeOpacity: 0.85,
        }),
      );
    }
    if (backToStay) {
      linesRef.current.push(
        new api.maps.Polyline({
          map,
          path: path.slice(-2),
          geodesic: true,
          strokeColor: LINE_FALLBACK,
          strokeWeight: 3,
          ...DASH_OPTIONS,
        }),
      );
    }
  }, [api, endsAtStay, pins, strokes]);

  // ── 장소 목록이 바뀌면 전부 보이게 맞춘다 (같은 목록이면 화면을 건드리지 않는다)
  // 고른 장소가 풀릴 때(selectedId → null)도 전체 보기로 돌아온다 — 그때는 목록이 같아도 다시 맞춘다 (2026-09-17)
  useEffect(() => {
    const map = mapRef.current;
    if (!api || !map) return;
    const key = `${boundsKey}#${selectedId ?? ""}`;
    if (boundsKeyRef.current === key) return;
    boundsKeyRef.current = key;
    // 고른 장소가 있으면 확대 효과(아래)가 화면을 맡는다
    if (selectedId) return;
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
      return;
    }
    const framed = framePins(pins);
    // 공항을 빼고 한 곳만 남으면 fitBounds 가 한계까지 확대해 버린다 — 그때는 동네가 보이는 배율로
    if (framed.length === 1) {
      map.setCenter({ lat: framed[0].lat, lng: framed[0].lng });
      map.setZoom(SELECT_ZOOM);
      return;
    }
    const bounds = new api.maps.LatLngBounds();
    for (const pin of framed) bounds.extend({ lat: pin.lat, lng: pin.lng });
    map.fitBounds(bounds, 40);
  }, [api, boundsKey, pins, selectedId]);

  // ── 지금 배율을 상자에 적어 둔다(화면 점검용). 사람 눈엔 안 보인다
  useEffect(() => {
    const map = mapRef.current;
    const box = boxRef.current;
    if (!api || !map || !box) return;
    const write = () => box.setAttribute("data-zoom", String(map.getZoom() ?? ""));
    write();
    const listener = map.addListener("zoom_changed", write);
    return () => listener.remove();
  }, [api]);

  // ── 클릭으로 고른 장소가 있으면 그곳으로 확대한다 (주변 1.5km 가 한 화면에)
  // 같은 장소·같은 좌표면 다시 하지 않는다 — 20초 폴링마다 목록이 새로 와도 사람이 옮겨 둔 지도를 되돌리지 않게 (리뷰 반영 2026-09-17)
  const selectedPin = selectedId ? pins.find((pin) => pin.id === selectedId) : undefined;
  const selectedKey = selectedPin ? `${selectedPin.id}@${selectedPin.lat},${selectedPin.lng}` : "";
  useEffect(() => {
    const map = mapRef.current;
    if (!api || !map || !selectedKey) return;
    const [, coords] = selectedKey.split("@");
    const [lat, lng] = coords.split(",").map(Number);
    const to = { lat, lng };
    map.setZoom(SELECT_ZOOM);
    if (isReducedMotion()) map.setCenter(to);
    else map.panTo(to);
  }, [api, selectedKey]);

  // ── 주변 추천 핀: 고른 장소·목록이 바뀔 때만 지우고 다시 찍는다 (손을 올릴 때는 아래 효과가 색만 바꾼다)
  useEffect(() => {
    const map = mapRef.current;
    if (!api || !map) return;
    const handles = nearbyRef.current;
    for (const handle of handles.values()) handle.dispose();
    handles.clear();
    if (!selectedId || !nearby || nearby.length === 0) return;

    const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
    const AdvancedMarker = api.maps.marker?.AdvancedMarkerElement;
    const useAdvanced = Boolean(AdvancedMarker && mapId);

    for (const spot of nearby) {
      const ring = NEARBY_RING;
      const hover = () => onNearbyHoverRef.current?.(spot.id);
      const leave = () => onNearbyHoverRef.current?.(null);
      if (useAdvanced && AdvancedMarker) {
        const content = document.createElement("div");
        content.textContent = CATEGORY_ICON[spot.category];
        content.style.cssText = [
          "width:22px",
          "height:22px",
          "display:flex",
          "align-items:center",
          "justify-content:center",
          "border-radius:50%",
          `background:${NEARBY_FILL}`,
          `border:2px solid ${ring}`,
          "font-size:0.7rem",
          "line-height:1",
          "box-shadow:0 1px 3px rgba(0,0,0,0.2)",
          "cursor:pointer",
        ].join(";");
        content.addEventListener("mouseenter", hover);
        content.addEventListener("mouseleave", leave);
        const marker = new AdvancedMarker({
          map,
          position: { lat: spot.lat, lng: spot.lng },
          content,
          title: spot.name,
          zIndex: 0,
        });
        const listener = marker.addListener("click", hover);
        handles.set(spot.id, {
          advanced: marker,
          setRing: (color) => {
            content.style.borderColor = color;
          },
          dispose: () => {
            listener.remove();
            content.removeEventListener("mouseenter", hover);
            content.removeEventListener("mouseleave", leave);
            marker.map = null;
          },
        });
      } else {
        const marker = new api.maps.Marker({
          map,
          position: { lat: spot.lat, lng: spot.lng },
          title: spot.name,
          zIndex: 0,
          icon: nearbyIcon(ring),
          label: { text: CATEGORY_ICON[spot.category], color: NEARBY_TEXT, fontSize: "11px" },
        });
        // 옛 핀은 mouseover/mouseout 이름을 쓴다. 손잡이 여러 개라 한꺼번에 떼는 함수로 정리한다
        marker.addListener("click", hover);
        marker.addListener("mouseover", hover);
        marker.addListener("mouseout", leave);
        handles.set(spot.id, {
          legacy: marker,
          setRing: (color) => marker.setIcon(nearbyIcon(color)),
          dispose: () => {
            api.maps.event.clearInstanceListeners(marker);
            marker.setMap(null);
          },
        });
      }
    }
  }, [api, selectedId, nearby]);

  // ── 가리키는 주변 핀만 진한 테두리 — 핀을 다시 만들지 않고 색만 바꾼다
  useEffect(() => {
    for (const [id, handle] of nearbyRef.current) {
      handle.setRing(id === nearbyActiveId ? NEARBY_RING_ACTIVE : NEARBY_RING);
    }
  }, [nearbyActiveId, nearby]);

  // ── 왼쪽 목록에 손을 올리면 그 핀으로 살짝 옮긴다 (확대 배율은 그대로)
  useEffect(() => {
    const map = mapRef.current;
    if (!api || !map || !focusedId) return;
    const target = pins.find((pin) => pin.id === focusedId);
    if (!target) return;
    const to = { lat: target.lat, lng: target.lng };
    if (isReducedMotion()) map.setCenter(to);
    else map.panTo(to);
  }, [api, focusedId, pins]);

  // ── 화면을 떠날 때 붙여 둔 것들을 정리한다
  useEffect(() => {
    const handles = pinsRef.current;
    const nearbyHandles = nearbyRef.current;
    const lines = linesRef.current;
    return () => {
      for (const handle of handles.values()) {
        handle.listener?.remove();
        handle.legacy?.setMap(null);
        if (handle.advanced) handle.advanced.map = null;
      }
      handles.clear();
      for (const handle of nearbyHandles.values()) handle.dispose();
      nearbyHandles.clear();
      for (const line of lines) line.setMap(null);
      lines.length = 0;
    };
  }, []);

  const mapReady = !loading && api !== null;

  return (
    <StMapCard>
      <StCardTitle>🗺️ 오늘의 동선</StCardTitle>

      {mapReady ? (
        <>
          <StMapBox ref={boxRef} role="region" aria-label="오늘 도는 곳 지도" />
          {missingCount > 0 && (
            <StHint>좌표 없는 장소 {missingCount}곳은 지도에 안 찍혀요 — 검색해서 넣으면 찍혀요</StHint>
          )}
        </>
      ) : (
        <>
          {places.length === 0 ? (
            <StHint>장소를 넣으면 도는 순서가 여기에 쌓여요.</StHint>
          ) : (
            <StMapBody>
              {/* 번호는 숙소를 빼고 센다 — 왼쪽 목록의 번호와 같은 숫자가 되도록 */}
              {places.map((place, index) => (
                <StMapItem
                  key={place.id}
                  $focused={focusedId === place.id}
                  onMouseEnter={() => onFocus(place.id)}
                  onMouseLeave={() => onFocus(null)}
                  onClick={() => onFocus(place.id)}
                >
                  <StNumBadge>
                    {place.isStay
                      ? "🏨"
                      : index + 1 - places.slice(0, index + 1).filter((p) => p.isStay).length}
                  </StNumBadge>
                  <StMapItemText>
                    {place.name} · {CATEGORY_LABEL[place.category]}
                  </StMapItemText>
                </StMapItem>
              ))}
            </StMapBody>
          )}

          {loading ? (
            <StMapLoading aria-live="polite">지도 불러오는 중…</StMapLoading>
          ) : (
            <StHint>지도는 구글 열쇠를 넣으면 여기에 그려져요.</StHint>
          )}
        </>
      )}

      <StMapLegend>
        <StLegendDot $tone="stay">숙소</StLegendDot>
        <StLegendDot $tone="place">장소</StLegendDot>
        {selectedId && nearby && nearby.length > 0 && <span>○ 주변 추천</span>}
        <span>— 이동선</span>
        {endsAtStay && <span>┈ 숙소 복귀</span>}
        {hasModeLegend && <span>🚶 도보 🚆 대중교통 🚗 차량</span>}
      </StMapLegend>

      {children}
    </StMapCard>
  );
}

/* 지도가 들어가는 칸. 카드가 이미 테두리를 갖고 있어 여기에는 테두리를 두지 않는다. */
const StMapBox = styled.div`
  width: 100%;
  min-height: 480px;
  height: 60vh;
  max-height: 640px;
  border-radius: 0.9rem;
  overflow: hidden;
  background: ${({ theme }) => theme.semantic.bg};

  @media ${({ theme }) => theme.media.mobile} {
    min-height: 0;
    height: 360px;
    max-height: none;
  }
`;

/* 불러오는 동안 빈 칸 대신 자리를 잡아 두는 줄 (움직임 없이 조용하게) */
const StMapLoading = styled.p`
  display: flex;
  align-items: center;
  height: 2.5rem;
  padding: 0 0.75rem;
  border-radius: 0.625rem;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.86rem;
  font-weight: 700;
`;
