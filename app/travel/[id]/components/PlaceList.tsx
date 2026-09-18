"use client";

import { Fragment, useState, type DragEvent } from "react";
import type { PlaceStep, TransitLeg, TravelDay } from "../../types";
import { StHint, StTransitLine } from "../page.styles";
import PlaceRow from "./PlaceRow";

// 하루치 장소 목록. 순서 바꾸기는 마우스로 끌기(HTML5 드래그)와 ▲▼ 버튼 두 가지로 할 수 있다.
// 숙소는 늘 맨 앞에 고정돼 있어 이 목록에서는 빼고, 자리 번호(index)만 한 칸씩 밀어 계산한다.
// 실제로 도는 순서는 1 → 2 → … → n → 숙소(복귀)라, 이동 줄은 장소 줄 "아래"에 붙고
// 마지막 장소 밑의 줄에만 "· 숙소로"를 덧붙인다. 맨 위 숙소 줄에는 이동 줄이 붙지 않는다.
// 순서를 바꾸는 길은 "편집" 을 켠 동안에만 열린다(editing). (2026-09-16)

const TRANSIT_TEXT: Record<TransitLeg["mode"], string> = {
  WALK: "🚶 도보",
  TRANSIT: "🚆 대중교통",
  DRIVE: "🚗 차량",
};

type PlaceListProps = {
  day: TravelDay;
  /** 고치는 중인지 — 꺼져 있으면 순서 바꾸기·삭제·메모 버튼이 모두 숨는다 */
  editing: boolean;
  focusedId: string | null;
  /** 클릭으로 고른 장소(지도 확대·주변 추천). 없으면 null */
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (placeId: string) => void;
  onMemo: (placeId: string, memo: string) => void;
  onSteps: (placeId: string, steps: PlaceStep[]) => void;
  /** 구글 지도 검색에 붙일 도시 이름 */
  city: string;
  /** 지도에 자리를 아는 세부 일정 id 들 */
  pinnedStepIds?: Set<string>;
  onShowStep?: (placeId: string, stepId: string) => void;
  onFocus: (id: string | null) => void;
  onDirty: (value: boolean) => void;
};

export default function PlaceList({
  day,
  editing,
  focusedId,
  selectedId,
  onSelect,
  onMove,
  onRemove,
  onMemo,
  onSteps,
  city,
  pinnedStepIds,
  onShowStep,
  onFocus,
  onDirty,
}: PlaceListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // 숙소가 있으면 places[0] 은 숙소라 목록은 1번 자리부터
  const offset = day.places[0]?.isStay ? 1 : 0;
  const stay = offset === 1 ? day.places[0] : null;
  const rows = day.places.slice(offset);

  const resetDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
    onDirty(false);
  };

  const handleDragStart = (event: DragEvent, index: number) => {
    setDragIndex(index);
    onDirty(true);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (event: DragEvent, index: number) => {
    event.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (dragIndex !== null && dragIndex !== index) onMove(dragIndex, index);
    resetDrag();
  };

  if (rows.length === 0) {
    return <StHint>아직 넣은 장소가 없어요. 아래에서 가고 싶은 곳을 적어 보세요.</StHint>;
  }

  return (
    <div>
      {rows.map((place, i) => {
        const index = offset + i;
        const leg = place.transitToNext;
        // 마지막 장소 밑의 이동 줄은 "숙소로 돌아가는 구간"이다. 숙소가 없거나 동선에서 뺀 날에는 줄 자체를 만들지 않는다.
        const backToStay = i === rows.length - 1;
        const showLeg = Boolean(leg) && (!backToStay || Boolean(stay && day.stayInRoute));
        return (
          <Fragment key={place.id}>
            <PlaceRow
              place={place}
              number={i + 1}
              index={index}
              canMoveUp={i > 0}
              canMoveDown={i < rows.length - 1}
              editing={editing}
              dragging={dragIndex === index}
              over={overIndex === index && dragIndex !== null && dragIndex !== index}
              focused={focusedId === place.id}
              selected={selectedId === place.id}
              onSelect={onSelect}
              onMove={onMove}
              onRemove={onRemove}
              onMemo={onMemo}
              onSteps={onSteps}
              city={city}
              pinnedStepIds={pinnedStepIds}
              onShowStep={onShowStep}
              onFocus={onFocus}
              onDirty={onDirty}
              onDragStart={handleDragStart}
              onDragOverRow={handleDragOver}
              onDropRow={handleDrop}
              onDragEnd={resetDrag}
            />
            {showLeg && leg && (
              <StTransitLine data-testid="transit-line">
                {TRANSIT_TEXT[leg.mode]} {leg.minutes}분{backToStay ? " · 숙소로" : ""}
              </StTransitLine>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
