"use client";

import { useEffect, useMemo, useState } from "react";
import { dayLabel } from "../../lib/plan";
import { findPlacedDay, placedDayByName, spotNameKey, spotSearchUrl } from "../../lib/guides";
import { CATEGORY_ICON, type CityGuide, type GuideSpot, type TravelPlan } from "../../types";
import type { NewPlaceInput } from "../useTravelPlan";
import {
  StCopiedTag,
  StHint,
  StModal,
  StModalBtn,
  StModalTitle,
  StNotice,
  StOverlay,
  StQuietTag,
  StRowBtn,
  StSelect,
  StSpotBody,
  StSpotIcon,
  StSpotTip,
} from "../page.styles";
import {
  StAreaBlurb,
  StAreaChip,
  StAreaChips,
  StChipCount,
  StPickBtns,
  StPickFoot,
  StPickTag,
  StSpotList,
  StSpotName,
  StSpotRow,
  StSpotSide,
} from "./SpotPicker.styles";

// 추천 장소에서 골라 담는 창. 위에서 구역을 고르고, 가운데에서 장소를 체크하고, 아래에서 날짜를 골라 한 번에 담는다.
// 체크는 구역을 옮겨 다녀도 남는다 — "와이탄 2곳 + 예원 1곳"처럼 여러 구역을 섞어 하루를 짜라고 만든 창이라서.
// 담은 뒤에도 창은 닫지 않고 체크만 비운다(다음 날짜 것을 이어서 고르게). 이미 일정에 있는 곳은 "DAY 02" 꼬리표로 알려 준다. (2026-09-17)

type SpotPickerProps = {
  guide: CityGuide;
  plan: TravelPlan;
  /** 창을 열 때 보고 있던 날 — 담을 날짜의 처음 값 */
  defaultDayIndex: number;
  busy?: boolean;
  /** 담기. 저장까지 됐으면 null, 실패했으면 안내 문구 — 창이 화면을 덮고 있어 여기서 그대로 보여 준다 (리뷰 반영 2026-09-17) */
  onAdd: (dayIndex: number, inputs: NewPlaceInput[]) => Promise<string | null>;
  onClose: () => void;
};

/** 추천 장소 → 넣을 때 쓰는 모양. 팁은 메모로 들어간다.
    상세정보 링크는 일부러 안 넣는다 — 좌표는 대략값이라 좌표 링크를 주면 엉뚱한 핀이 열린다. 줄의 상세정보 버튼이 이름으로 검색해 준다. (리뷰 반영 2026-09-17) */
function toInput(spot: GuideSpot): NewPlaceInput {
  return {
    name: spot.name,
    category: spot.category,
    lat: spot.lat,
    lng: spot.lng,
    address: spot.address,
    memo: spot.tip,
  };
}

export default function SpotPicker({
  guide,
  plan,
  defaultDayIndex,
  busy = false,
  onAdd,
  onClose,
}: SpotPickerProps) {
  const [areaId, setAreaId] = useState(guide.areas[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [dayIndex, setDayIndex] = useState(defaultDayIndex);
  const [adding, setAdding] = useState(false);
  // 담은 뒤 안내. 같은 글자가 연달아 나와도 시계가 새로 가도록 횟수를 같이 든다 (리뷰 반영 2026-09-17)
  const [added, setAdded] = useState<{ text: string; seq: number }>({ text: "", seq: 0 });
  const [failText, setFailText] = useState("");

  const area = guide.areas.find((item) => item.id === areaId) ?? guide.areas[0];
  const placed = useMemo(() => placedDayByName(plan), [plan]);
  const allSpots = useMemo(() => guide.areas.flatMap((item) => item.spots), [guide]);

  // 구역 칩에 "이 구역에서 고른 개수"를 붙이려고 미리 센다
  const countByArea = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of guide.areas) {
      counts.set(item.id, item.spots.filter((spot) => selected.has(spot.id)).length);
    }
    return counts;
  }, [guide, selected]);

  // 기간을 줄여 고른 날이 사라지면 마지막 날로 당긴다
  const safeDayIndex = Math.min(dayIndex, Math.max(0, plan.days.length - 1));

  useEffect(() => {
    if (!added.text) return;
    const timer = window.setTimeout(() => setAdded({ text: "", seq: added.seq }), 2500);
    return () => window.clearTimeout(timer);
  }, [added]);

  // Esc 로 닫기 (내보내기 창과 달리 목록이 길어 마우스로 바깥을 찾기 번거롭다)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (spotId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(spotId)) next.delete(spotId);
      else next.add(spotId);
      return next;
    });
  };

  const canAdd = selected.size > 0 && !busy && !adding;

  const handleAdd = async () => {
    if (!canAdd) return;
    // 담는 순서는 "안내서에 적힌 순서"(구역 안 동선 순)로 — 체크한 순서는 사람이 기억하지 못한다
    const chosen = allSpots.filter((spot) => selected.has(spot.id));
    setAdding(true);
    setFailText("");
    try {
      const failure = await onAdd(safeDayIndex, chosen.map(toInput));
      if (failure) {
        setFailText(failure);
        return;
      }
      setSelected(new Set());
      setAdded((prev) => ({
        text: `DAY ${String(safeDayIndex + 1).padStart(2, "0")}에 ${chosen.length}곳 담았어요`,
        seq: prev.seq + 1,
      }));
    } finally {
      setAdding(false);
    }
  };

  return (
    <StOverlay onClick={onClose}>
      <StModal $wide onClick={(event) => event.stopPropagation()} data-testid="spot-picker">
        <StModalTitle>📌 {guide.city} 추천 장소</StModalTitle>
        <StHint>구역을 고르고 넣을 곳을 체크한 뒤, 아래에서 날짜를 골라 담아요. 팁은 메모로 함께 들어가요.</StHint>

        <StAreaChips role="tablist" aria-label="구역 고르기">
          {guide.areas.map((item) => {
            const active = item.id === area?.id;
            const count = countByArea.get(item.id) ?? 0;
            return (
              <StAreaChip
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                $active={active}
                onClick={() => setAreaId(item.id)}
              >
                {item.name}
                {count > 0 && <StChipCount $active={active}>{count}</StChipCount>}
              </StAreaChip>
            );
          })}
        </StAreaChips>

        {area && (
          <>
            <StAreaBlurb>{area.blurb}</StAreaBlurb>

            <StSpotList data-testid="spot-list">
              {area.spots.map((spot) => {
                const checked = selected.has(spot.id);
                const placedDay = findPlacedDay(placed, spotNameKey(spot.name));
                const dayTag = placedDay !== undefined ? `DAY ${String(placedDay + 1).padStart(2, "0")}` : "";
                return (
                  <StSpotRow key={spot.id} $checked={checked}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(spot.id)}
                      aria-label={dayTag ? `${spot.name} — 이미 ${dayTag}에 있어요` : spot.name}
                    />
                    <StSpotIcon aria-hidden>{CATEGORY_ICON[spot.category]}</StSpotIcon>
                    <StSpotBody>
                      <StSpotName>
                        {spot.name}
                        {spot.pick && <StPickTag>꼭</StPickTag>}
                      </StSpotName>
                      <StSpotTip>{spot.tip}</StSpotTip>
                    </StSpotBody>
                    <StSpotSide>
                      {dayTag && <StQuietTag title="이미 일정에 있어요">{dayTag}</StQuietTag>}
                      {/* 체크하기 전에 구글 지도에서 먼저 보기 — 링크라 눌러도 체크는 바뀌지 않는다 */}
                      <StRowBtn
                        as="a"
                        href={spotSearchUrl(spot, guide.city)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="구글 지도에서 보기 (새 창)"
                        aria-label={`${spot.name} 구글 지도에서 보기`}
                        data-testid="spot-map"
                        onClick={(event) => event.stopPropagation()}
                      >
                        지도 ↗
                      </StRowBtn>
                    </StSpotSide>
                  </StSpotRow>
                );
              })}
            </StSpotList>
          </>
        )}

        {/* 안내는 담기 줄 위에 — 담기 줄이 바닥에 붙어 있어 그 아래는 안 보일 수 있다 */}
        {added.text && <StCopiedTag data-testid="spot-added">{added.text}</StCopiedTag>}
        {failText && <StNotice $tone="error">{failText}</StNotice>}

        <StPickFoot>
          <StSelect
            value={safeDayIndex}
            onChange={(event) => setDayIndex(Number(event.target.value))}
            aria-label="담을 날짜"
          >
            {plan.days.map((day, index) => (
              <option key={day.date} value={index}>
                DAY {String(index + 1).padStart(2, "0")} · {dayLabel(day.date)}
              </option>
            ))}
          </StSelect>
          <StPickBtns>
            <StModalBtn
              type="button"
              $variant="primary"
              disabled={!canAdd}
              onClick={() => void handleAdd()}
              data-testid="spot-add"
            >
              {adding ? "담는 중…" : selected.size > 0 ? `${selected.size}곳 담기` : "담기"}
            </StModalBtn>
            <StModalBtn type="button" onClick={onClose}>
              닫기
            </StModalBtn>
          </StPickBtns>
        </StPickFoot>
      </StModal>
    </StOverlay>
  );
}
