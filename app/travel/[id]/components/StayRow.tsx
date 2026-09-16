"use client";

import { useState } from "react";
import { useModal } from "@/components/common/ModalProvider";
import type { TravelDay } from "../../types";
import type { NewPlaceInput } from "../useTravelPlan";
import {
  StCategoryChip,
  StPlaceAddr,
  StPlaceName,
  StNameBox,
  StNameLine,
  StQuietTag,
  StStayActions,
  StStayBand,
  StStayForm,
  StStayIcon,
  StStayQuiet,
  StRowBtn,
  StSwitchLabel,
} from "../page.styles";
import AddPlaceForm from "./AddPlaceForm";

// 그 날 자는 곳. 하루의 기준점이라 목록 맨 위에 붙박이로 두고, 번호도 끌어 옮기기도 없다.
// "동선에 포함"을 끄면 목록에는 남되 이동 시간 계산에서만 빠진다.
// 볼 때(editing=false)는 바꾸기·빼기·체크박스 대신 "동선 포함 / 동선 제외" 꼬리표만 보여 준다. (2026-09-16)

type StayRowProps = {
  day: TravelDay;
  /** 하루 카드가 고치는 중인지 */
  editing: boolean;
  busy: boolean;
  onSetStay: (input: NewPlaceInput | null) => void;
  onToggleStayInRoute: () => void;
};

export default function StayRow({
  day,
  editing,
  busy,
  onSetStay,
  onToggleStayInRoute,
}: StayRowProps) {
  const { openConfirm } = useModal();
  // 숙소 이름을 적는 칸을 열어 두었는지 (하루 카드의 편집 모드와는 별개)
  const [formWanted, setFormWanted] = useState(false);
  // 고치는 중일 때만 그 칸이 실제로 열린다 — 편집을 끄면 저절로 닫힌다
  const formOpen = editing && formWanted;

  const stay = day.places.find((place) => place.isStay) ?? null;

  const handleAdd = async (input: NewPlaceInput) => {
    onSetStay(input);
    setFormWanted(false);
  };

  const handleRemove = async () => {
    const ok = await openConfirm("이 날 숙소를 뺄까요?");
    if (!ok) return;
    onSetStay(null);
  };

  return (
    <StStayBand>
      <StStayIcon aria-hidden="true">🏨</StStayIcon>

      {stay ? (
        <StNameBox>
          <StNameLine>
            <StCategoryChip data-testid="stay-chip">숙소</StCategoryChip>
            <StPlaceName>{stay.name}</StPlaceName>
          </StNameLine>
          {stay.address && <StPlaceAddr>{stay.address}</StPlaceAddr>}
        </StNameBox>
      ) : (
        <StNameLine>
          <StCategoryChip data-testid="stay-chip">숙소</StCategoryChip>
          <StStayQuiet>숙소를 정하면 여기 나와요</StStayQuiet>
        </StNameLine>
      )}

      <StStayActions>
        {!editing ? (
          stay && (
            <StQuietTag data-testid="stay-route-tag">
              {day.stayInRoute ? "동선 포함" : "동선 제외"}
            </StQuietTag>
          )
        ) : stay ? (
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
            <StRowBtn type="button" title="숙소 바꾸기" onClick={() => setFormWanted((prev) => !prev)}>
              바꾸기
            </StRowBtn>
            <StRowBtn type="button" $tone="danger" title="숙소 빼기" onClick={handleRemove}>
              빼기
            </StRowBtn>
          </>
        ) : (
          <StRowBtn type="button" onClick={() => setFormWanted(true)}>
            숙소 넣기
          </StRowBtn>
        )}
      </StStayActions>

      {formOpen && (
        <StStayForm>
          <AddPlaceForm
            mode="stay"
            busy={busy}
            autoFocus
            onAdd={handleAdd}
            onCancel={() => setFormWanted(false)}
          />
        </StStayForm>
      )}
    </StStayBand>
  );
}
