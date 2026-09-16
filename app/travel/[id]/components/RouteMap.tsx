"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled, { useTheme } from "styled-components";
import {
  loadGoogleMaps,
  type GmapsListener,
  type GmapsMap,
  type GmapsMarker,
  type GmapsAdvancedMarker,
  type GmapsPolyline,
  type GoogleMapsApi,
} from "../../lib/googleMapsLoader";
import { CATEGORY_LABEL, type TransitMode, type TransitLeg, type TravelPlace } from "../../types";
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
// (2026-09-16)

type RouteMapProps = {
  places: TravelPlace[];
  focusedId: string | null;
  onFocus: (id: string | null) => void;
  legs?: TransitLeg[];
  /** 나라 코드(JP 등). 지도 글자·검색 기준을 그 나라에 맞춘다. page.tsx 가 plan.region 을 넘겨 주면 된다. */
  region?: string;
};

/** 지도에 찍을 한 점. 좌표가 있는 장소만 여기에 들어온다. */
type Pin = { id: string; name: string; lat: number; lng: number; isStay: boolean; label: string };

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

function isReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function RouteMap({ places, focusedId, onFocus, legs, region }: RouteMapProps) {
  const theme = useTheme();
  const [api, setApi] = useState<GoogleMapsApi | null>(null);
  const [loading, setLoading] = useState(true);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GmapsMap | null>(null);
  const pinsRef = useRef(new Map<string, PinHandle>());
  const linesRef = useRef<GmapsPolyline[]>([]);
  const boundsKeyRef = useRef("");
  const onFocusRef = useRef(onFocus);
  // 핀을 누를 때 쓸 최신 손잡이. 핀을 다시 만들지 않으려고 따로 담아 둔다.
  useEffect(() => {
    onFocusRef.current = onFocus;
  }, [onFocus]);

  // 이동선 색: 걷기 초록 / 대중교통 파랑 / 차 주황.
  const strokeColor = useMemo<Record<TransitMode, string>>(
    () => ({
      WALK: theme.colors.green500,
      TRANSIT: theme.semantic.primary,
      DRIVE: theme.colors.orange500,
    }),
    [theme],
  );

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
      out.push({ id: place.id, name: place.name, lat, lng, isStay, label: isStay ? "🏨" : String(counter) });
    }
    return out;
  }, [places]);

  const missingCount = places.length - pins.length;
  const boundsKey = useMemo(() => pins.map((pin) => pin.id).join("|"), [pins]);

  /** 길찾기 결과가 있으면 그 선을 그대로 그린다. 하나도 없으면 아래에서 직선 하나만 긋는다. */
  const strokes = useMemo(() => {
    const out: { polyline: string; mode: TransitMode }[] = [];
    if (!legs) return out;
    for (let i = 0; i < places.length - 1; i += 1) {
      const leg = legs[i];
      if (leg?.polyline) out.push({ polyline: leg.polyline, mode: leg.mode });
    }
    return out;
  }, [legs, places]);

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
            before.listener.remove();
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
          `background:${pin.isStay ? theme.colors.amber500 : theme.semantic.primary}`,
          `color:${theme.colors.white}`,
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
          label: { text: pin.label, color: "#fff", fontWeight: "800" },
        });
        const listener = marker.addListener("click", () => onFocusRef.current(pin.id));
        handles.set(pin.id, { legacy: marker, lat: pin.lat, lng: pin.lng, label: pin.label, listener });
      }
    }

    for (const [id, handle] of handles) {
      if (alive.has(id)) continue;
      handle.listener.remove();
      handle.legacy?.setMap(null);
      if (handle.advanced) handle.advanced.map = null;
      handles.delete(id);
    }
  }, [api, pins, theme]);

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
            strokeColor: strokeColor[stroke.mode],
            strokeWeight: 4,
            strokeOpacity: 0.9,
          }),
        );
      }
      return;
    }

    if (pins.length < 2) return;
    linesRef.current.push(
      new api.maps.Polyline({
        map,
        path: pins.map((pin) => ({ lat: pin.lat, lng: pin.lng })),
        geodesic: true,
        strokeColor: theme.semantic.primary,
        strokeWeight: 3,
        strokeOpacity: 0.85,
      }),
    );
  }, [api, pins, strokes, strokeColor, theme]);

  // ── 장소 목록이 바뀌면 전부 보이게 맞춘다 (같은 목록이면 화면을 건드리지 않는다)
  useEffect(() => {
    const map = mapRef.current;
    if (!api || !map || boundsKeyRef.current === boundsKey) return;
    boundsKeyRef.current = boundsKey;
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
      return;
    }
    const bounds = new api.maps.LatLngBounds();
    for (const pin of pins) bounds.extend({ lat: pin.lat, lng: pin.lng });
    map.fitBounds(bounds, 40);
  }, [api, boundsKey, pins]);

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
    const lines = linesRef.current;
    return () => {
      for (const handle of handles.values()) {
        handle.listener.remove();
        handle.legacy?.setMap(null);
        if (handle.advanced) handle.advanced.map = null;
      }
      handles.clear();
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
        <span>— 이동선</span>
        {hasModeLegend && <span>🚶 도보 🚆 대중교통 🚗 차량</span>}
      </StMapLegend>
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
