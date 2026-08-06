"use client";

import { Button } from "@hwangchongmu/ui";
import {
  StActions,
  StCard,
  StCardHead,
  StCardTitle,
  StChip,
  StChipRow,
  StError,
  StFieldHead,
  StFieldName,
  StFieldUnit,
  StFormGrid,
  StInput,
  StLabel,
  StRow,
  StSelectorBox,
  StSelectorBtn,
  StSelectorHelp,
  StTextarea,
} from "../page.styles";
import {
  METRIC_COLOR,
  METRIC_KEYS,
  METRIC_LABEL,
  METRIC_STEP,
  METRIC_UNIT,
  type InBodyMetricKey,
  type VisibleMap,
} from "../types";

export type FormState = {
  id: string | null;
  date: string;
  weight: string;
  skeletalMuscle: string;
  bodyFatMass: string;
  bmr: string;
  bmi: string;
  bodyFatPct: string;
  abdominalFatRatio: string;
  visceralFatLevel: string;
  memo: string;
};

type MeasurementFormProps = {
  form: FormState;
  visible: VisibleMap;
  showSelector: boolean;
  error: string;
  busy: boolean;
  onToggleSelector: () => void;
  onToggleVisible: (key: InBodyMetricKey) => void;
  onDateChange: (value: string) => void;
  onFieldChange: (key: InBodyMetricKey, value: string) => void;
  onMemoChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export default function MeasurementForm({
  form,
  visible,
  showSelector,
  error,
  busy,
  onToggleSelector,
  onToggleVisible,
  onDateChange,
  onFieldChange,
  onMemoChange,
  onSubmit,
  onCancel,
}: MeasurementFormProps) {
  return (
    <StCard>
      <StCardHead>
        <StCardTitle>{form.id ? "기록 수정" : "새 측정 기록"}</StCardTitle>
        <StSelectorBtn type="button" onClick={onToggleSelector}>
          {showSelector ? "▾ 표시 지표 닫기" : "▸ 표시 지표 선택"}
        </StSelectorBtn>
      </StCardHead>

      {showSelector ? (
        <StSelectorBox>
          <StSelectorHelp>
            화면에 보고 싶은 지표만 켜두세요. 저장은 모든 지표가 됩니다.
          </StSelectorHelp>
          <StChipRow>
            {METRIC_KEYS.map((k) => {
              const on = visible[k];
              return (
                <StChip
                  key={k}
                  type="button"
                  $active={on}
                  $color={METRIC_COLOR[k]}
                  onClick={() => onToggleVisible(k)}
                >
                  {METRIC_LABEL[k]}
                </StChip>
              );
            })}
          </StChipRow>
        </StSelectorBox>
      ) : null}

      <StRow>
        <StLabel>
          측정 날짜
          <StInput
            type="date"
            value={form.date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </StLabel>
      </StRow>

      <StFormGrid>
        {METRIC_KEYS.map((k) => (
          <StLabel key={k}>
            <StFieldHead>
              <StFieldName>{METRIC_LABEL[k]}</StFieldName>
              <StFieldUnit>{METRIC_UNIT[k]}</StFieldUnit>
            </StFieldHead>
            <StInput
              type="number"
              inputMode="decimal"
              step={METRIC_STEP[k]}
              placeholder="예) 0"
              value={form[k]}
              onChange={(e) => onFieldChange(k, e.target.value)}
            />
          </StLabel>
        ))}
      </StFormGrid>

      <StLabel>
        메모
        <StTextarea
          rows={2}
          placeholder="측정 시간대, 식사 전후, 컨디션 등"
          value={form.memo}
          onChange={(e) => onMemoChange(e.target.value)}
        />
      </StLabel>

      {error ? <StError>{error}</StError> : null}

      <StActions>
        {form.id ? (
          <Button
            color="light"
            variant="fill"
            size="medium"
            onClick={onCancel}
          >
            취소
          </Button>
        ) : null}
        <Button
          color="primary"
          variant="fill"
          size="medium"
          onClick={onSubmit}
          disabled={busy}
        >
          {busy ? "저장 중..." : form.id ? "수정 저장" : "기록 저장"}
        </Button>
      </StActions>
    </StCard>
  );
}
