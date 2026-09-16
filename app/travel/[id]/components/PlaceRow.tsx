"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CATEGORY_LABEL, type TravelPlace } from "../../types";
import {
  StCategoryChip,
  StDetailLink,
  StDragHandle,
  StGhostBtn,
  StIconBtn,
  StMemoArea,
  StMemoInput,
  StMemoText,
  StNameBox,
  StNumBadge,
  StPlaceAddr,
  StPlaceName,
  StReorderBtn,
  StRow,
  StRowActions,
} from "../page.styles";

// 장소 한 줄. 번호·분류 칸 폭이 고정이라 이름이 길든 짧든 모든 줄의 이름이 같은 자리에서 시작한다.
// 끌어 옮기기(⠿)는 마우스용이고, 휴대폰에서는 ▲▼ 버튼만 보인다. (2026-09-16)

type PlaceRowProps = {
  place: TravelPlace;
  /** 화면에 보이는 번호 (숙소를 뺀 1부터) */
  number: number;
  /** day.places 안에서의 실제 자리 — 순서 바꾸기는 이 값으로 한다 */
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  dragging: boolean;
  over: boolean;
  focused: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (placeId: string) => void;
  onMemo: (placeId: string, memo: string) => void;
  onFocus: (id: string | null) => void;
  onDirty: (value: boolean) => void;
  onDragStart: (event: DragEvent, index: number) => void;
  onDragOverRow: (event: DragEvent, index: number) => void;
  onDropRow: (event: DragEvent, index: number) => void;
  onDragEnd: () => void;
};

/** 상세정보 링크. 구글 장소를 붙이기 전에는 구글 지도 검색 주소로 대신 연다. */
function detailUrl(place: TravelPlace): string {
  if (place.url) return place.url;
  const query = `${place.name} ${place.address ?? ""}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function PlaceRow({
  place,
  number,
  index,
  canMoveUp,
  canMoveDown,
  dragging,
  over,
  focused,
  onMove,
  onRemove,
  onMemo,
  onFocus,
  onDirty,
  onDragStart,
  onDragOverRow,
  onDropRow,
  onDragEnd,
}: PlaceRowProps) {
  const [editingMemo, setEditingMemo] = useState(false);
  const [draft, setDraft] = useState(place.memo ?? "");
  const memoRef = useRef<HTMLTextAreaElement | null>(null);

  // 글이 길어지면 칸이 따라 늘어나게 (스크롤 대신)
  useEffect(() => {
    const node = memoRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [draft, editingMemo]);

  const startMemo = () => {
    setDraft(place.memo ?? "");
    setEditingMemo(true);
    onDirty(true);
  };

  const finishMemo = () => {
    setEditingMemo(false);
    onDirty(false);
    onMemo(place.id, draft);
  };

  return (
    <StRow
      $dragging={dragging}
      $over={over}
      draggable
      onDragStart={(event) => onDragStart(event, index)}
      onDragOver={(event) => onDragOverRow(event, index)}
      onDrop={(event) => onDropRow(event, index)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => onFocus(place.id)}
      onMouseLeave={() => onFocus(null)}
      data-place-id={place.id}
      data-focused={focused ? "true" : undefined}
    >
      <StNumBadge data-testid="place-number">{number}</StNumBadge>
      <StCategoryChip>{CATEGORY_LABEL[place.category]}</StCategoryChip>

      <StNameBox>
        <StPlaceName>{place.name}</StPlaceName>
        {place.address && <StPlaceAddr>{place.address}</StPlaceAddr>}
      </StNameBox>

      <StRowActions>
        <StDetailLink href={detailUrl(place)} target="_blank" rel="noopener noreferrer">
          상세정보
        </StDetailLink>
        <StDragHandle aria-hidden="true">⠿</StDragHandle>
        <StReorderBtn
          type="button"
          aria-label={`${place.name} 한 칸 위로`}
          disabled={!canMoveUp}
          onClick={() => onMove(index, index - 1)}
        >
          ▲
        </StReorderBtn>
        <StReorderBtn
          type="button"
          aria-label={`${place.name} 한 칸 아래로`}
          disabled={!canMoveDown}
          onClick={() => onMove(index, index + 1)}
        >
          ▼
        </StReorderBtn>
        <StIconBtn
          type="button"
          aria-label={`${place.name} 지우기`}
          onClick={() => onRemove(place.id)}
        >
          🗑
        </StIconBtn>
      </StRowActions>

      <StMemoArea>
        {editingMemo ? (
          <StMemoInput
            ref={memoRef}
            value={draft}
            autoFocus
            placeholder="여기서 뭘 할지 적어 두세요"
            aria-label={`${place.name} 메모`}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={finishMemo}
          />
        ) : place.memo ? (
          <>
            <StMemoText>{place.memo}</StMemoText>
            <StGhostBtn type="button" onClick={startMemo}>
              편집
            </StGhostBtn>
          </>
        ) : (
          <StGhostBtn type="button" onClick={startMemo}>
            메모 추가
          </StGhostBtn>
        )}
      </StMemoArea>
    </StRow>
  );
}
