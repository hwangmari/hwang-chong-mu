"use client";

import { Fragment, useState, type DragEvent } from "react";
import type { TransitLeg, TravelDay } from "../../types";
import { StHint, StTransitLine } from "../page.styles";
import PlaceRow from "./PlaceRow";

// 하루치 장소 목록. 순서 바꾸기는 마우스로 끌기(HTML5 드래그)와 ▲▼ 버튼 두 가지로 할 수 있다.
// 숙소는 늘 맨 앞에 고정돼 있어 이 목록에서는 빼고, 자리 번호(index)만 한 칸씩 밀어 계산한다. (2026-09-16)

const TRANSIT_TEXT: Record<TransitLeg["mode"], string> = {
  WALK: "🚶 도보",
  TRANSIT: "🚆 대중교통",
  DRIVE: "🚗 차량",
};

type PlaceListProps = {
  day: TravelDay;
  focusedId: string | null;
  onMove: (from: number, to: number) => void;
  onRemove: (placeId: string) => void;
  onMemo: (placeId: string, memo: string) => void;
  onFocus: (id: string | null) => void;
  onDirty: (value: boolean) => void;
};

export default function PlaceList({
  day,
  focusedId,
  onMove,
  onRemove,
  onMemo,
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
      {/* 숙소를 동선에 넣은 날이면 숙소 → 첫 장소 이동 시간이 맨 위에 온다 */}
      {stay?.transitToNext && day.stayInRoute && (
        <StTransitLine>
          {TRANSIT_TEXT[stay.transitToNext.mode]} {stay.transitToNext.minutes}분
        </StTransitLine>
      )}

      {rows.map((place, i) => {
        const index = offset + i;
        const leg = place.transitToNext;
        return (
          <Fragment key={place.id}>
            <PlaceRow
              place={place}
              number={i + 1}
              index={index}
              canMoveUp={i > 0}
              canMoveDown={i < rows.length - 1}
              dragging={dragIndex === index}
              over={overIndex === index && dragIndex !== null && dragIndex !== index}
              focused={focusedId === place.id}
              onMove={onMove}
              onRemove={onRemove}
              onMemo={onMemo}
              onFocus={onFocus}
              onDirty={onDirty}
              onDragStart={handleDragStart}
              onDragOverRow={handleDragOver}
              onDropRow={handleDrop}
              onDragEnd={resetDrag}
            />
            {leg && i < rows.length - 1 && (
              <StTransitLine>
                {TRANSIT_TEXT[leg.mode]} {leg.minutes}분
              </StTransitLine>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
