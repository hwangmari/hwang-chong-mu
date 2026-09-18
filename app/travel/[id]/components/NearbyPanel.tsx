"use client";

import { useState } from "react";
import { formatDistance } from "../../lib/routeLegs";
import { spotSearchUrl, type NearbySpot } from "../../lib/guides";
import { CATEGORY_ICON, type TravelPlace } from "../../types";
import {
  StCardTitle,
  StHint,
  StNearbyBlock,
  StNearbyHead,
  StNearbyMeters,
  StNearbyName,
  StNearbyRow,
  StNearbyTip,
  StNotice,
  StRowBtn,
  StSpotBody,
  StSpotIcon,
} from "../page.styles";

// 장소 줄을 클릭하면 지도 아래에 열리는 "주변 추천" 칸. 안내서(app/travel/data) 장소 중 가까운 곳만 보여 주고,
// "담기"를 누르면 클릭한 장소 바로 뒤에 끼워 넣는다. 지도 핀에 손을 올리면 여기 줄도 같이 밝아진다(activeId). (2026-09-17)

type NearbyPanelProps = {
  /** 기준이 된 장소(왼쪽에서 클릭한 곳) */
  anchor: TravelPlace;
  nearby: NearbySpot[];
  /** 안내서가 없는 여행이면 false — 확대만 되고 목록은 안내 한 줄 */
  hasGuide: boolean;
  /** 구글 지도 검색에 붙일 도시 이름(안내서의 city) */
  city: string;
  /** 기준 장소에 좌표가 없으면 false — 주변을 잴 수 없다고 알려 준다 */
  hasCoords: boolean;
  radiusM: number;
  /** 지도 핀 쪽에서 가리키는 장소 id */
  activeId: string | null;
  onHover: (id: string | null) => void;
  busy?: boolean;
  /** 담기. 성공하면 null, 실패하면 안내 문구 */
  onAdd: (spot: NearbySpot) => Promise<string | null>;
  onClose: () => void;
};

export default function NearbyPanel({
  anchor,
  nearby,
  hasGuide,
  city,
  hasCoords,
  radiusM,
  activeId,
  onHover,
  busy = false,
  onAdd,
  onClose,
}: NearbyPanelProps) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [failText, setFailText] = useState("");

  const handleAdd = async (spot: NearbySpot) => {
    if (busy || addingId) return;
    setAddingId(spot.id);
    setFailText("");
    try {
      const failure = await onAdd(spot);
      if (failure) setFailText(failure);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <StNearbyBlock data-testid="nearby-panel">
      <StNearbyHead>
        <StCardTitle>
          📍 {anchor.name} 주변 추천 · {formatDistance(radiusM)}
        </StCardTitle>
        <StRowBtn type="button" onClick={onClose} data-testid="nearby-close">
          닫기
        </StRowBtn>
      </StNearbyHead>

      {!hasGuide ? (
        <StHint>이 도시는 아직 추천 목록이 없어요. 위 검색 칸으로 직접 넣어 주세요.</StHint>
      ) : !hasCoords ? (
        <StHint>이 장소는 좌표가 없어 주변을 찾을 수 없어요. 검색으로 다시 넣으면 좌표가 붙어요.</StHint>
      ) : nearby.length === 0 ? (
        <StHint>{formatDistance(radiusM)} 안에 아직 안 담은 추천 장소가 없어요.</StHint>
      ) : (
        <div role="list" aria-label="주변 추천 장소">
          {nearby.map((spot) => (
            // 자식 순서(아이콘·이름·거리·지도·담기)는 휴대폰 배치(page.styles.ts StNearbyRow 의 nth-child)와 맞물려 있다
            <StNearbyRow
              key={spot.id}
              role="listitem"
              $active={activeId === spot.id}
              data-testid="nearby-row"
              onMouseEnter={() => onHover(spot.id)}
              onMouseLeave={() => onHover(null)}
            >
              <StSpotIcon aria-hidden>{CATEGORY_ICON[spot.category]}</StSpotIcon>
              <StSpotBody>
                <StNearbyName title={spot.name}>{spot.name}</StNearbyName>
                <StNearbyTip title={spot.tip}>{spot.tip}</StNearbyTip>
              </StSpotBody>
              <StNearbyMeters data-testid="nearby-meters">{formatMeters(spot.meters)}</StNearbyMeters>
              {/* 담기 전에 구글 지도에서 사진·영업시간을 먼저 본다 */}
              <StRowBtn
                as="a"
                href={spotSearchUrl(spot, city)}
                target="_blank"
                rel="noopener noreferrer"
                title="구글 지도에서 보기 (새 창)"
                aria-label={`${spot.name} 구글 지도에서 보기`}
                data-testid="nearby-map"
              >
                지도 ↗
              </StRowBtn>
              <StRowBtn
                type="button"
                $tone="primary"
                disabled={busy || addingId !== null}
                aria-label={`${spot.name} 담기`}
                data-testid="nearby-add"
                onClick={() => void handleAdd(spot)}
              >
                {addingId === spot.id ? "담는 중…" : "담기"}
              </StRowBtn>
            </StNearbyRow>
          ))}
        </div>
      )}

      {failText && <StNotice $tone="error">{failText}</StNotice>}
      {hasGuide && nearby.length > 0 && (
        <StHint>담으면 {anchor.name} 바로 다음 순서로 들어가요. 순서는 ▲▼로 바꿀 수 있어요.</StHint>
      )}
    </StNearbyBlock>
  );
}

/** 1km 안쪽은 10m 단위로("120m"), 그 밖은 km 로("1.2km") — formatDistance 는 0.1km 아래를 ""로 만들어 버려서 */
function formatMeters(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return "";
  if (meters < 950) return `${Math.max(10, Math.round(meters / 10) * 10)}m`;
  return formatDistance(meters);
}
