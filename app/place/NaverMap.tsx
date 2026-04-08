"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { NaverLocalItem } from "@/types/dinner";

interface NaverMapProps {
  items: NaverLocalItem[];
  focusedIndex: number | null;
  stripHtml: (str: string) => string;
}

// 네이버 지역검색 좌표 → WGS84 변환
const toLatLng = (mapx: string, mapy: string) => ({
  lat: Number(mapy) / 1e7,
  lng: Number(mapx) / 1e7,
});

declare global {
  interface Window {
    naver: any;
  }
}

export default function NaverMap({
  items,
  focusedIndex,
  stripHtml,
}: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(false);

  // SDK 스크립트 로드
  useEffect(() => {
    const ncpClientId = process.env.NEXT_PUBLIC_NCP_CLIENT_ID;
    if (!ncpClientId) {
      setSdkError(true);
      return;
    }

    if (window.naver?.maps) {
      setSdkLoaded(true);
      return;
    }

    // 이미 로딩 중인 스크립트가 있는지 확인
    const existing = document.querySelector(
      'script[src*="oapi.map.naver.com"]',
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.naver?.maps) setSdkLoaded(true);
        else setSdkError(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${ncpClientId}`;
    script.async = true;
    script.onload = () => {
      // SDK가 로드되었지만 인증 실패 시 naver.maps가 없을 수 있음
      setTimeout(() => {
        if (window.naver?.maps) {
          setSdkLoaded(true);
        } else {
          setSdkError(true);
        }
      }, 500);
    };
    script.onerror = () => setSdkError(true);
    document.head.appendChild(script);
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!sdkLoaded || !mapRef.current || !window.naver?.maps) return;

    try {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(37.5665, 126.978),
          zoom: 14,
          zoomControl: true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT,
          },
        });
      }
    } catch {
      setSdkError(true);
    }
  }, [sdkLoaded]);

  // 마커 업데이트
  useEffect(() => {
    if (!sdkLoaded || !mapInstanceRef.current || !window.naver?.maps) return;

    try {
      const map = mapInstanceRef.current;
      const { naver } = window;

      // 기존 마커 제거
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      if (items.length === 0) return;

      const bounds = new naver.maps.LatLngBounds();

      items.forEach((item, i) => {
        const { lat, lng } = toLatLng(item.mapx, item.mapy);
        if (!lat || !lng) return;

        const position = new naver.maps.LatLng(lat, lng);
        bounds.extend(position);

        const isFocused = focusedIndex === i;

        const marker = new naver.maps.Marker({
          position,
          map,
          icon: {
            content: `<div style="
              background: ${isFocused ? "#3b82f6" : "#fff"};
              color: ${isFocused ? "#fff" : "#1a1a1a"};
              border: 2px solid ${isFocused ? "#2563eb" : "#d1d5db"};
              border-radius: 20px;
              padding: 4px 10px;
              font-size: 13px;
              font-weight: 700;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(0,0,0,0.15);
              transform: ${isFocused ? "scale(1.15)" : "scale(1)"};
              transition: all 0.2s;
            ">${i + 1}. ${stripHtml(item.title)}</div>`,
            anchor: new naver.maps.Point(15, 15),
          },
          zIndex: isFocused ? 100 : 1,
        });

        markersRef.current.push(marker);
      });

      // 포커스된 마커로 이동
      if (focusedIndex !== null && items[focusedIndex]) {
        const { lat, lng } = toLatLng(
          items[focusedIndex].mapx,
          items[focusedIndex].mapy,
        );
        if (lat && lng) {
          map.panTo(new naver.maps.LatLng(lat, lng));
          map.setZoom(16);
        }
      } else if (markersRef.current.length > 0) {
        map.fitBounds(bounds, { top: 30, right: 30, bottom: 30, left: 30 });
      }
    } catch {
      // 마커 업데이트 실패 시 무시
    }
  }, [sdkLoaded, items, focusedIndex, stripHtml]);

  if (sdkError) {
    return (
      <StMapFallback>
        지도를 불러올 수 없습니다. NCP 콘솔에서 서비스 URL에
        <br />
        <b>http://localhost:3000</b> 이 등록되어 있는지 확인해주세요.
      </StMapFallback>
    );
  }

  return (
    <StMapContainer>
      <StMapWrapper ref={mapRef} />
      {!sdkLoaded && <StMapLoading>지도 로딩중...</StMapLoading>}
    </StMapContainer>
  );
}

const StMapContainer = styled.div`
  position: relative;
  width: 100%;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const StMapWrapper = styled.div`
  width: 100%;
  height: 350px;

  @media (min-width: 768px) {
    height: 450px;
  }
`;

const StMapLoading = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
`;

const StMapFallback = styled.div`
  padding: 1.5rem;
  text-align: center;
  border-radius: 1rem;
  border: 1px dashed ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.9rem;
  line-height: 1.6;

  b {
    color: ${({ theme }) => theme.colors.gray700};
  }
`;
