"use client";

import { useState } from "react";
import {
  StChip,
  StChipRow,
  StErrorText,
  StFieldName,
  StGhostBtn,
  StPrimarySmallBtn,
  StReturnActions,
  StReturnBand,
  StReturnField,
  StReturnRow,
  StReturnTitle,
  StSmallInput,
} from "../page.styles";
import { AMOUNT_PRESETS, DIRECTION_TONE } from "../types";
import { formatAmount, formatDateKo } from "./giftFormat";
import { formatDateKey } from "@/utils/date";
import { onlyDigits } from "@/utils/number";

// 답례 금액은 자주 쓰는 세 개만 칩으로. 더 큰 금액은 숫자로 적으면 된다.
const QUICK_AMOUNTS = AMOUNT_PRESETS.slice(0, 3);

type Props = {
  personName: string;
  // 답례의 대상이 되는 받은 기록의 날짜. 이보다 빠른 날짜는 고를 수 없다.
  receivedDate: string;
  // mark: 아직 "냈음" 표시 전 (금액 없이 표시만 할 수도 있다)
  // fill: 이미 "냈음"인데 금액만 뒤늦게 적는 중
  mode: "mark" | "fill";
  busy: boolean;
  onSave: (date: string, amount: number) => void;
  onSkipAmount: () => void;
  onClose: () => void;
};

// 받은 기록 바로 아래에서 열리는 작은 폼. "얼마 냈는지"만 물어본다.
export default function ReturnAmountForm({
  personName,
  receivedDate,
  mode,
  busy,
  onSave,
  onSkipAmount,
  onClose,
}: Props) {
  const [date, setDate] = useState(() => {
    const today = formatDateKey(new Date());
    // 아직 오지 않은 행사에 미리 표시하는 경우엔 받은 날을 기본으로
    return today < receivedDate ? receivedDate : today;
  });
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  function save() {
    const value = Number(amount);
    if (!date) {
      setError("낸 날짜를 골라 주세요.");
      return;
    }
    if (date < receivedDate) {
      setError(
        `받은 날(${formatDateKo(receivedDate)})보다 빠른 날짜는 고를 수 없어요.`,
      );
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("금액을 0보다 크게 적어 주세요.");
      return;
    }
    setError("");
    onSave(date, Math.round(value));
  }

  return (
    <StReturnBand role="group" aria-label={`${personName}에게 낸 금액 적기`}>
      <StReturnTitle>
        {personName}님에게 얼마 냈어요?
        <span>{formatDateKo(receivedDate)}에 받은 것에 대한 답례예요.</span>
      </StReturnTitle>

      <StReturnRow>
        <StReturnField>
          <StFieldName as="span">낸 날짜</StFieldName>
          <StSmallInput
            type="date"
            value={date}
            min={receivedDate}
            onChange={(e) => setDate(e.target.value)}
          />
        </StReturnField>
        <StReturnField>
          <StFieldName as="span">낸 금액 (원)</StFieldName>
          <StSmallInput
            type="text"
            inputMode="numeric"
            placeholder="예) 50000"
            value={amount}
            autoFocus
            onChange={(e) => setAmount(onlyDigits(e.target.value))}
          />
        </StReturnField>
      </StReturnRow>

      <StChipRow>
        {QUICK_AMOUNTS.map((preset) => (
          <StChip
            key={preset}
            type="button"
            $active={Number(amount) === preset}
            $tone={DIRECTION_TONE.given}
            onClick={() => setAmount(String(preset))}
          >
            {formatAmount(preset)}
          </StChip>
        ))}
      </StChipRow>

      {error ? <StErrorText>{error}</StErrorText> : null}

      <StReturnActions>
        {mode === "mark" ? (
          <StGhostBtn type="button" disabled={busy} onClick={onSkipAmount}>
            금액은 나중에
          </StGhostBtn>
        ) : (
          <StGhostBtn type="button" disabled={busy} onClick={onClose}>
            취소
          </StGhostBtn>
        )}
        <StPrimarySmallBtn type="button" disabled={busy} onClick={save}>
          {busy ? "저장 중..." : "저장"}
        </StPrimarySmallBtn>
      </StReturnActions>
    </StReturnBand>
  );
}
