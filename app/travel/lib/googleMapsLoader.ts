// 구글 지도 스크립트를 브라우저에 딱 한 번만 넣는 도우미.
// 열쇠가 없거나 막혀 있으면 null 을 돌려주고, 화면은 지도 대신 요약 카드를 보여준다(설계상 정상 동작).
// @types/google.maps 를 쓰지 않으므로(패키지 추가 금지) 필요한 만큼만 아래에 직접 적어 둔다.

export type GmapsPoint = { lat: number; lng: number };

export interface GmapsLatLng {
  lat(): number;
  lng(): number;
}

export type GmapsLatLngInput = GmapsPoint | GmapsLatLng;

export interface GmapsListener {
  remove(): void;
}

export interface GmapsBounds {
  extend(point: GmapsLatLngInput): GmapsBounds;
  isEmpty(): boolean;
  getCenter(): GmapsLatLng;
}

export type GmapsPadding = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

// 지도·마커·선에 넘기는 설정값은 종류가 너무 많아 열쇠/값 쌍으로만 받는다.
export type GmapsOptions = Record<string, unknown>;

export interface GmapsMap {
  setCenter(position: GmapsLatLngInput): void;
  setZoom(zoom: number): void;
  getZoom(): number | undefined;
  panTo(position: GmapsLatLngInput): void;
  fitBounds(bounds: GmapsBounds, padding?: number | GmapsPadding): void;
  setOptions(options: GmapsOptions): void;
  addListener(eventName: string, handler: () => void): GmapsListener;
}

export interface GmapsMarker {
  setMap(map: GmapsMap | null): void;
  setPosition(position: GmapsLatLngInput): void;
  addListener(eventName: string, handler: () => void): GmapsListener;
}

export interface GmapsAdvancedMarker {
  map: GmapsMap | null;
  position: GmapsLatLngInput | null;
  addListener(eventName: string, handler: () => void): GmapsListener;
}

export interface GmapsPolyline {
  setMap(map: GmapsMap | null): void;
  setPath(path: GmapsLatLngInput[]): void;
  setOptions(options: GmapsOptions): void;
}

export interface GoogleMapsApi {
  maps: {
    Map: new (container: HTMLElement, options?: GmapsOptions) => GmapsMap;
    Marker: new (options?: GmapsOptions) => GmapsMarker;
    Polyline: new (options?: GmapsOptions) => GmapsPolyline;
    LatLngBounds: new (sw?: GmapsLatLngInput, ne?: GmapsLatLngInput) => GmapsBounds;
    geometry: { encoding: { decodePath(encoded: string): GmapsLatLng[] } };
    event: {
      addListener(instance: object, eventName: string, handler: () => void): GmapsListener;
      addListenerOnce(instance: object, eventName: string, handler: () => void): GmapsListener;
      removeListener(listener: GmapsListener): void;
      clearInstanceListeners(instance: object): void;
    };
    // marker 라이브러리는 최신 지도에서만 있다. 없으면 Marker 로 대체한다.
    marker?: {
      AdvancedMarkerElement: new (options?: GmapsOptions) => GmapsAdvancedMarker;
      PinElement?: new (options?: GmapsOptions) => { element: HTMLElement };
    };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsApi;
    __hwangGmapsReady?: () => void;
    gm_authFailure?: () => void;
  }
}

const SCRIPT_FLAG = "data-hwang-gmaps";

let loading: Promise<GoogleMapsApi | null> | null = null;
// 한 번 막히면(열쇠가 잘못됐거나 차단) 이 창에서는 다시 묻지 않는다 — 다시 시도하면 기다리기만 하다 멈춘다.
// 새로고침하면 처음부터 다시 시도한다. (리뷰 반영 2026-09-16)
let failed = false;

export function loadGoogleMaps(region?: string): Promise<GoogleMapsApi | null> {
  if (failed) return Promise.resolve(null);
  if (loading) return loading;
  if (typeof window === "undefined") return Promise.resolve(null);

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  // 열쇠가 없으면 지도를 포기하고 요약 카드로 보여준다(에러 아님).
  if (!key) return Promise.resolve(null);

  if (window.google?.maps) {
    loading = Promise.resolve(window.google);
    return loading;
  }

  loading = new Promise<GoogleMapsApi | null>((resolve) => {
    let settled = false;
    const finish = (api: GoogleMapsApi | null) => {
      if (settled) return;
      settled = true;
      if (!api) {
        // 실패한 흔적을 남겨 두면(스크립트 태그·콜백) 다음 호출이 "이미 넣었다"고 보고 오지 않을 콜백을 영영 기다린다.
        // 넣어 둔 것을 치우고, 이 창에서는 더 묻지 않는 표시를 남긴다. (리뷰 반영 2026-09-16)
        failed = true;
        loading = null;
        document.querySelector(`script[${SCRIPT_FLAG}]`)?.remove();
        delete window.__hwangGmapsReady;
      }
      resolve(api);
    };

    window.__hwangGmapsReady = () => finish(window.google ?? null);
    // 열쇠가 잘못됐거나 막혀 있으면 구글이 이 함수를 부른다. 없으면 지도가 회색 판으로 남는다.
    window.gm_authFailure = () => finish(null);

    const existing = document.querySelector(`script[${SCRIPT_FLAG}]`);
    if (existing) {
      // 이미 누가 넣어 둔 스크립트가 있으면 새로 넣지 않고 콜백만 기다린다.
      existing.addEventListener("error", () => finish(null));
      return;
    }

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&v=weekly&language=ko` +
      (region ? `&region=${encodeURIComponent(region)}` : "") +
      `&libraries=marker,geometry&loading=async&callback=__hwangGmapsReady`;
    script.async = true;
    script.defer = true;
    script.setAttribute(SCRIPT_FLAG, "1");
    script.onerror = () => {
      script.remove();
      finish(null);
    };
    document.head.appendChild(script);
  });

  return loading;
}
