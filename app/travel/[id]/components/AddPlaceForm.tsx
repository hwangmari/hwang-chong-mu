"use client";

import { useState } from "react";
import { CATEGORY_LABEL, type PlaceCategory } from "../../types";
import type { NewPlaceInput } from "../useTravelPlan";
import { StAddForm, StGhostBtn, StPrimaryBtn, StSelect, StTextInput } from "../page.styles";

// 1단계(구글 연결 전)에서는 장소를 손으로 적어 넣는다.
// 다음 단계에서 아래 "장소 이름" 칸만 구글 장소 자동완성으로 갈아 끼울 예정이라,
// 이름 칸을 따로 떼어 두고 그 결과(위도·경도·구글 장소 id)도 그대로 받을 수 있게 입력 모양을 맞춰 두었다. (2026-09-16)

type AddPlaceFormProps = {
  /** place = 그냥 들르는 곳, stay = 그 날 자는 곳(분류가 숙소로 고정된다) */
  mode: "place" | "stay";
  busy?: boolean;
  onAdd: (input: NewPlaceInput) => void | Promise<void>;
  /** 숙소 입력 칸처럼 잠깐 열었다 닫는 경우에만 준다 */
  onCancel?: () => void;
  autoFocus?: boolean;
};

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as PlaceCategory[]).filter(
  (category) => category !== "stay",
);

export default function AddPlaceForm({
  mode,
  busy = false,
  onAdd,
  onCancel,
  autoFocus = false,
}: AddPlaceFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("sight");
  const [address, setAddress] = useState("");

  const isStay = mode === "stay";
  const canAdd = name.trim().length > 0 && !busy;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canAdd) return;
    await onAdd({
      name: name.trim(),
      category: isStay ? "stay" : category,
      address: address.trim() || undefined,
      isStay,
    });
    setName("");
    setAddress("");
  };

  return (
    <StAddForm onSubmit={handleSubmit}>
      {/* 다음 단계에서 이 칸이 구글 장소 자동완성으로 바뀐다 */}
      <StTextInput
        value={name}
        autoFocus={autoFocus}
        onChange={(event) => setName(event.target.value)}
        placeholder={isStay ? "숙소 이름" : "장소 이름"}
        aria-label={isStay ? "숙소 이름" : "장소 이름"}
      />
      {!isStay && (
        <StSelect
          value={category}
          onChange={(event) => setCategory(event.target.value as PlaceCategory)}
          aria-label="장소 분류"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {CATEGORY_LABEL[option]}
            </option>
          ))}
        </StSelect>
      )}
      <StTextInput
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        placeholder="주소 (없어도 돼요)"
        aria-label="주소"
      />
      <StPrimaryBtn type="submit" disabled={!canAdd}>
        추가
      </StPrimaryBtn>
      {onCancel && (
        <StGhostBtn type="button" onClick={onCancel}>
          취소
        </StGhostBtn>
      )}
    </StAddForm>
  );
}
