"use client";

import { useState } from "react";
import { formatDistance } from "../../lib/routeLegs";
import { spotSearchUrl, type NearbySpot } from "../../lib/guides";
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  MEAL_CATEGORIES,
  type PlaceCategory,
  type TravelPlace,
} from "../../types";
import {
  StCardTitle,
  StHint,
  StNearbyActions,
  StNearbyAnchor,
  StNearbyFilters,
  StNearbyChip,
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
  /** 밥 자리(식당·카페)를 고른 상태인지 — 그때 식당·카페를 담으면 새 줄이 아니라 그 자리의 세부 일정으로 들어간다 */
  addsAsStep?: boolean;
  /** 반경 안의 분류별 개수 — 있는 분류만 단추로 보여 준다 */
  counts: Map<PlaceCategory, number>;
  /** 지금 추리고 있는 분류. null 이면 전체 */
  filter: PlaceCategory | null;
  onFilter: (category: PlaceCategory | null) => void;
  /** 지도 핀 쪽에서 가리키는 장소 id */
  activeId: string | null;
  onHover: (id: string | null) => void;
  busy?: boolean;
  /** 담기. 성공하면 null, 실패하면 안내 문구 */
  /** 담기. where="route" 는 동선에 새 줄로, where="step" 은 고른 장소 아래(세부 일정)로 */
  onAdd: (spot: NearbySpot, where: "route" | "step") => Promise<string | null>;
  onClose: () => void;
};

export default function NearbyPanel({
  anchor,
  nearby,
  hasGuide,
  city,
  hasCoords,
  radiusM,
  addsAsStep = false,
  counts,
  filter,
  onFilter,
  activeId,
  onHover,
  busy = false,
  onAdd,
  onClose,
}: NearbyPanelProps) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [failText, setFailText] = useState("");

  /** 밥 자리에서 밥 자리를 담을 때는 "아래"를 먼저 권한다(점심 후보 모으기) */
  const prefersStep = (spot: NearbySpot) => addsAsStep && MEAL_CATEGORIES.has(spot.category);

  const handleAdd = async (spot: NearbySpot, where: "route" | "step") => {
    if (busy || addingId) return;
    setAddingId(spot.id);
    setFailText("");
    try {
      const failure = await onAdd(spot, where);
      if (failure) setFailText(failure);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <StNearbyBlock data-testid="nearby-panel">
      <StNearbyHead>
        <StCardTitle>📍 주변 추천</StCardTitle>
        <StRowBtn type="button" onClick={onClose} data-testid="nearby-close">
          닫기
        </StRowBtn>
      </StNearbyHead>
      {/* 기준이 되는 장소는 제목 아래 한 줄로 — 좁은 칸에서 제목이 세 줄로 접히지 않게 (2026-09-18) */}
      <StNearbyAnchor title={anchor.name}>
        {anchor.name} · {formatDistance(radiusM)} 안
      </StNearbyAnchor>

      {/* 분류 추리기 — 있는 분류만. 점심 자리를 고르면 식당이 처음부터 눌려 있다 (주인 요청 2026-09-18) */}
      {hasGuide && hasCoords && counts.size > 1 && (
        <StNearbyFilters role="group" aria-label="분류로 추리기">
          <StNearbyChip
            type="button"
            $on={filter === null}
            aria-pressed={filter === null}
            data-testid="nearby-filter-all"
            onClick={() => onFilter(null)}
          >
            전체
          </StNearbyChip>
          {[...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([category, count]) => (
              <StNearbyChip
                key={category}
                type="button"
                $on={filter === category}
                aria-pressed={filter === category}
                data-testid={`nearby-filter-${category}`}
                onClick={() => onFilter(filter === category ? null : category)}
              >
                {CATEGORY_ICON[category]} {CATEGORY_LABEL[category]} {count}
              </StNearbyChip>
            ))}
        </StNearbyFilters>
      )}

      {!hasGuide ? (
        <StHint>이 도시는 아직 추천 목록이 없어요. 위 검색 칸으로 직접 넣어 주세요.</StHint>
      ) : !hasCoords ? (
        <StHint>이 장소는 좌표가 없어 주변을 찾을 수 없어요. 검색으로 다시 넣으면 좌표가 붙어요.</StHint>
      ) : nearby.length === 0 ? (
        <StHint>
          {filter
            ? `${formatDistance(radiusM)} 안에 아직 안 담은 ${CATEGORY_LABEL[filter]}이 없어요. "전체"를 눌러 보세요.`
            : `${formatDistance(radiusM)} 안에 아직 안 담은 추천 장소가 없어요.`}
        </StHint>
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
              <StNearbyActions>
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
                {/* 두 가지 담기: 동선에 새 줄로 넣거나, 고른 장소 아래(세부 일정)에 넣거나 (주인 요청 2026-09-18) */}
                <StRowBtn
                  type="button"
                  $tone={prefersStep(spot) ? undefined : "primary"}
                  disabled={busy || addingId !== null}
                  title="동선에 새 줄로 담아요 (번호가 하나 늘어요)"
                  aria-label={`${spot.name} 동선에 담기`}
                  data-testid="nearby-add"
                  onClick={() => void handleAdd(spot, "route")}
                >
                  {addingId === spot.id ? "담는 중…" : "동선"}
                </StRowBtn>
                <StRowBtn
                  type="button"
                  $tone={prefersStep(spot) ? "primary" : undefined}
                  disabled={busy || addingId !== null}
                  title={`${anchor.name} 아래(세부 일정)에 담아요 — 동선 번호는 그대로예요`}
                  aria-label={`${spot.name} ${anchor.name} 아래에 담기`}
                  data-testid="nearby-add-step"
                  onClick={() => void handleAdd(spot, "step")}
                >
                  아래
                </StRowBtn>
              </StNearbyActions>
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
