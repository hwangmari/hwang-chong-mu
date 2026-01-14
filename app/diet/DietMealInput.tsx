"use client";

import styled from "styled-components";
import Input from "@/components/common/Input";
import TagInput from "@/components/common/TagInput";

interface Props {
  weightLabel: string;
  weightValue: string;
  onWeightChange: (value: string) => void;
  weightPlaceholder?: string;

  dietLabel?: string;
  dietTags: string[];
  onDietChange: (tags: string[]) => void;
  dietPlaceholder?: string;
}

export default function DietMealInput({
  weightLabel,
  weightValue,
  onWeightChange,
  weightPlaceholder = "00.0",
  dietLabel = "식단",
  dietTags,
  onDietChange,
  dietPlaceholder,
}: Props) {
  return (
    <InputRow>
      <WeightArea>
        <Input
          label={weightLabel}
          placeholder={weightPlaceholder}
          value={weightValue}
          onChange={(e) => onWeightChange(e.target.value)}
        />
        <UnitText>kg</UnitText>
      </WeightArea>
      <DietArea>
        <TagInput
          label={dietLabel}
          placeholder={dietPlaceholder}
          tags={dietTags}
          onChange={onDietChange}
        />
      </DietArea>
    </InputRow>
  );
}

// ✨ 스타일 정의 (이동됨)
const InputRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-top: 1rem;
`;

const WeightArea = styled.div`
  flex: 3; /* 30% */
  position: relative;
`;

const DietArea = styled.div`
  flex: 7; /* 70% */
`;

const UnitText = styled.span`
  position: absolute;
  right: 12px;
  bottom: 12px;
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
  pointer-events: none;
`;
