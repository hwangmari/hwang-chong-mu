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
  StFieldName,
  StInput,
  StLabel,
  StRow,
  StSegmentBtn,
  StSegmentRow,
  StTextarea,
} from "../page.styles";
import {
  AMOUNT_PRESETS,
  DIRECTION_COLOR,
  DIRECTION_KEYS,
  DIRECTION_LABEL,
  EVENT_TYPE_COLOR,
  EVENT_TYPE_ICON,
  EVENT_TYPE_KEYS,
  EVENT_TYPE_LABEL,
  RELATION_COLOR,
  RELATION_DETAIL_PLACEHOLDER,
  RELATION_KEYS,
  RELATION_LABEL,
  type GiftDirection,
  type GiftEventType,
  type GiftRelation,
} from "../types";
import { formatAmount } from "./giftFormat";

export type FormState = {
  id: string | null;
  date: string;
  eventType: GiftEventType;
  direction: GiftDirection;
  personName: string;
  relation: GiftRelation;
  relationDetail: string;
  amount: string; // 입력 중엔 문자열로 들고 저장 때 숫자로 바꾼다
  memo: string;
};

type GiftEntryFormProps = {
  form: FormState;
  // 지금 고른 관계에서 전에 썼던 세부 항목들 (칩으로 추천)
  detailSuggestions: string[];
  error: string;
  busy: boolean;
  onChange: (patch: Partial<FormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export default function GiftEntryForm({
  form,
  detailSuggestions,
  error,
  busy,
  onChange,
  onSubmit,
  onCancel,
}: GiftEntryFormProps) {
  return (
    <StCard id="gift-log-form">
      <StCardHead>
        <StCardTitle>{form.id ? "✏️ 기록 수정" : "✏️ 새 기록"}</StCardTitle>
      </StCardHead>

      <StSegmentRow>
        {DIRECTION_KEYS.map((key) => (
          <StSegmentBtn
            key={key}
            type="button"
            $active={form.direction === key}
            $color={DIRECTION_COLOR[key]}
            onClick={() => onChange({ direction: key })}
          >
            {key === "given" ? "💸 " : "💰 "}
            {DIRECTION_LABEL[key]}
          </StSegmentBtn>
        ))}
      </StSegmentRow>

      <StRow>
        <StLabel>
          <StFieldName>날짜</StFieldName>
          <StInput
            type="date"
            value={form.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </StLabel>
        <StLabel>
          <StFieldName>상대방 이름</StFieldName>
          <StInput
            type="text"
            placeholder="예) 김철수"
            value={form.personName}
            autoComplete="off"
            onChange={(e) => onChange({ personName: e.target.value })}
          />
        </StLabel>
      </StRow>

      <StLabel as="div">
        <StFieldName>경조사 종류</StFieldName>
        <StChipRow>
          {EVENT_TYPE_KEYS.map((key) => (
            <StChip
              key={key}
              type="button"
              $active={form.eventType === key}
              $color={EVENT_TYPE_COLOR[key]}
              onClick={() => onChange({ eventType: key })}
            >
              {EVENT_TYPE_ICON[key]} {EVENT_TYPE_LABEL[key]}
            </StChip>
          ))}
        </StChipRow>
      </StLabel>

      <StLabel as="div">
        <StFieldName>관계</StFieldName>
        <StChipRow>
          {RELATION_KEYS.map((key) => (
            <StChip
              key={key}
              type="button"
              $active={form.relation === key}
              $color={RELATION_COLOR[key]}
              onClick={() => onChange({ relation: key, relationDetail: "" })}
            >
              {RELATION_LABEL[key]}
            </StChip>
          ))}
        </StChipRow>
        <StInput
          type="text"
          placeholder={`${RELATION_LABEL[form.relation]} 세부 — ${RELATION_DETAIL_PLACEHOLDER[form.relation]} (선택)`}
          value={form.relationDetail}
          maxLength={40}
          autoComplete="off"
          onChange={(e) => onChange({ relationDetail: e.target.value })}
        />
        {detailSuggestions.length > 0 ? (
          <StChipRow>
            {detailSuggestions.map((detail) => (
              <StChip
                key={detail}
                type="button"
                $active={form.relationDetail.trim() === detail}
                $color={RELATION_COLOR[form.relation]}
                onClick={() => onChange({ relationDetail: detail })}
              >
                {detail}
              </StChip>
            ))}
          </StChipRow>
        ) : null}
      </StLabel>

      <StLabel>
        <StFieldName>금액 (원)</StFieldName>
        <StInput
          type="number"
          inputMode="numeric"
          min={0}
          step={10000}
          placeholder="예) 50000"
          value={form.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
        />
        <StChipRow>
          {AMOUNT_PRESETS.map((preset) => (
            <StChip
              key={preset}
              type="button"
              $active={Number(form.amount) === preset}
              $color={DIRECTION_COLOR[form.direction]}
              onClick={() => onChange({ amount: String(preset) })}
            >
              {formatAmount(preset)}
            </StChip>
          ))}
        </StChipRow>
      </StLabel>

      <StLabel>
        <StFieldName>메모</StFieldName>
        <StTextarea
          rows={2}
          placeholder="예) 신부측, 화환 별도, 부부 동반 참석"
          value={form.memo}
          onChange={(e) => onChange({ memo: e.target.value })}
        />
      </StLabel>

      {error ? <StError>{error}</StError> : null}

      <StActions>
        {form.id ? (
          <Button color="light" variant="fill" size="medium" onClick={onCancel}>
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
