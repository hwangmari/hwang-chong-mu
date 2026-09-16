"use client";

import { useState } from "react";
import { useModal } from "@/components/common/ModalProvider";
import type { TravelDay } from "../../types";
import type { NewPlaceInput } from "../useTravelPlan";
import {
  StCategoryChip,
  StGhostBtn,
  StPlaceAddr,
  StPlaceName,
  StNameBox,
  StStayActions,
  StStayBand,
  StStayForm,
  StStayIcon,
  StStayQuiet,
  StSwitchLabel,
} from "../page.styles";
import AddPlaceForm from "./AddPlaceForm";

// 그 날 자는 곳. 하루의 기준점이라 목록 맨 위에 붙박이로 두고, 번호도 끌어 옮기기도 없다.
// "동선에 포함"을 끄면 목록에는 남되 이동 시간 계산에서만 빠진다. (2026-09-16)

type StayRowProps = {
  day: TravelDay;
  busy: boolean;
  onSetStay: (input: NewPlaceInput | null) => void;
  onToggleStayInRoute: () => void;
};

export default function StayRow({ day, busy, onSetStay, onToggleStayInRoute }: StayRowProps) {
  const { openConfirm } = useModal();
  const [editing, setEditing] = useState(false);

  const stay = day.places.find((place) => place.isStay) ?? null;

  const handleAdd = async (input: NewPlaceInput) => {
    onSetStay(input);
    setEditing(false);
  };

  const handleRemove = async () => {
    const ok = await openConfirm("이 날 숙소를 뺄까요?");
    if (!ok) return;
    onSetStay(null);
  };

  return (
    <StStayBand>
      <StStayIcon aria-hidden="true">🏨</StStayIcon>
      <StCategoryChip>숙소</StCategoryChip>

      {stay ? (
        <StNameBox>
          <StPlaceName>{stay.name}</StPlaceName>
          {stay.address && <StPlaceAddr>{stay.address}</StPlaceAddr>}
        </StNameBox>
      ) : (
        <StStayQuiet>숙소를 정하면 여기 나와요</StStayQuiet>
      )}

      <StStayActions>
        {stay ? (
          <>
            <StSwitchLabel>
              <input
                type="checkbox"
                checked={day.stayInRoute}
                disabled={busy}
                onChange={onToggleStayInRoute}
              />
              동선에 포함
            </StSwitchLabel>
            <StGhostBtn type="button" onClick={() => setEditing((prev) => !prev)}>
              바꾸기
            </StGhostBtn>
            <StGhostBtn type="button" $tone="danger" onClick={handleRemove}>
              빼기
            </StGhostBtn>
          </>
        ) : (
          <StGhostBtn type="button" onClick={() => setEditing(true)}>
            숙소 넣기
          </StGhostBtn>
        )}
      </StStayActions>

      {editing && (
        <StStayForm>
          <AddPlaceForm
            mode="stay"
            busy={busy}
            autoFocus
            onAdd={handleAdd}
            onCancel={() => setEditing(false)}
          />
        </StStayForm>
      )}
    </StStayBand>
  );
}
