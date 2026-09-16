"use client";

import { CATEGORY_LABEL, type TransitLeg, type TravelPlace } from "../../types";
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

// 1단계에서는 지도를 그리지 않고 "오늘 도는 순서"만 보여 준다.
// 다음 단계에서 이 카드의 본문만 진짜 지도로 바뀌므로, 받는 값(props)은 그때 쓸 모양 그대로 미리 정해 두었다. (2026-09-16)

type RouteMapProps = {
  places: TravelPlace[];
  focusedId: string | null;
  onFocus: (id: string | null) => void;
  legs?: TransitLeg[];
};

export default function RouteMap({ places, focusedId, onFocus }: RouteMapProps) {
  return (
    <StMapCard>
      <StCardTitle>🗺️ 오늘의 동선</StCardTitle>

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

      <StHint>지도는 구글 열쇠를 넣으면 여기에 그려져요.</StHint>

      <StMapLegend>
        <StLegendDot $tone="stay">숙소</StLegendDot>
        <StLegendDot $tone="place">장소</StLegendDot>
        <span>— 이동선</span>
      </StMapLegend>
    </StMapCard>
  );
}
