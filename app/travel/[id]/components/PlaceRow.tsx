"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CATEGORY_LABEL, type TravelPlace } from "../../types";
import {
  StCategoryChip,
  StDragHandle,
  StMemoArea,
  StMemoInput,
  StMemoText,
  StNameBox,
  StNumBadge,
  StPlaceAddr,
  StPlaceName,
  StRow,
  StRowActions,
  StRowBtn,
  StRowBtnLabel,
} from "../page.styles";

// 장소 한 줄. 번호·분류 칸 폭이 고정이라 이름이 길든 짧든 모든 줄의 이름이 같은 자리에서 시작한다.
// 줄 안의 조작은 모두 같은 버튼 한 식구(StRowBtn, 높이 32px)로 만들고, 조작 칸 폭도 고정해
// 줄마다 상세정보·▲·▼·삭제가 같은 x 에 선다. 메모를 손보는 버튼만 메모 줄 안으로 내려 두었다.
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

/* 아이콘은 글자 색을 그대로 따라가는 선 그림 — 기기마다 다르게 보이는 이모지를 쓰지 않는다 */

function IconOut() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3.5 8.5 8.5 3.5" />
      <path d="M4.5 3.5h4v4" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9.5 2.5 11.5 4.5 5 11 2.5 11.5 3 9z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.5 4.5h11" />
      <path d="M6.5 4.5V3h3v1.5" />
      <path d="M4.2 4.5 4.8 13h6.4l.6-8.5" />
      <path d="M6.6 7v3.5M9.4 7v3.5" />
    </svg>
  );
}

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
        <StRowBtn
          as="a"
          $tone="primary"
          href={detailUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
          title="상세정보 (새 창)"
          aria-label={`${place.name} 상세정보`}
          data-testid="detail-btn"
        >
          <StRowBtnLabel>상세정보</StRowBtnLabel>
          <IconOut />
        </StRowBtn>
        <StDragHandle aria-hidden="true">⠿</StDragHandle>
        <StRowBtn
          type="button"
          $icon
          title="한 칸 위로"
          aria-label={`${place.name} 한 칸 위로`}
          disabled={!canMoveUp}
          onClick={() => onMove(index, index - 1)}
          data-testid="up-btn"
        >
          ▲
        </StRowBtn>
        <StRowBtn
          type="button"
          $icon
          title="한 칸 아래로"
          aria-label={`${place.name} 한 칸 아래로`}
          disabled={!canMoveDown}
          onClick={() => onMove(index, index + 1)}
          data-testid="down-btn"
        >
          ▼
        </StRowBtn>
        <StRowBtn
          type="button"
          $icon
          $tone="dangerQuiet"
          title="삭제"
          aria-label={`${place.name} 삭제`}
          onClick={() => onRemove(place.id)}
          data-testid="del-btn"
        >
          <IconTrash />
        </StRowBtn>
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
            <StMemoText data-testid="memo-text">{place.memo}</StMemoText>
            <StRowBtn
              type="button"
              title="메모 편집"
              aria-label={`${place.name} 메모 편집`}
              onClick={startMemo}
            >
              <IconPencil />
              메모 편집
            </StRowBtn>
          </>
        ) : (
          <StRowBtn
            type="button"
            title="메모 추가"
            aria-label={`${place.name} 메모 추가`}
            onClick={startMemo}
          >
            <IconPencil />
            메모 추가
          </StRowBtn>
        )}
      </StMemoArea>
    </StRow>
  );
}
