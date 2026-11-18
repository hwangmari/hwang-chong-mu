"use client";
import { Button } from "@hwangchongmu/ui";
import React, { useState, useEffect, useMemo } from "react";
import styled, { useTheme } from "styled-components";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import { Expense, ExpenseType } from "@/types";
import { useModal } from "@/components/common/ModalProvider";
import { onlyDigits } from "@/utils/number";
import { isoToDateKey, splitDate, toDateKey, withDate } from "./expenseDate";

interface Props {
  members: string[];
  /** 이 방에 이미 들어간 내역 — 날짜 칩(이미 쓴 날짜들)을 만드는 데만 쓴다 */
  expenses: Expense[];
  onAddExpense: (
    payer: string,
    desc: string,
    amount: number,
    type: ExpenseType,
  ) => void;
}

export default function ExpenseInput({
  members,
  expenses,
  onAddExpense,
}: Props) {
  const theme = useTheme();
  const { openAlert } = useModal();
  const [payer, setPayer] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<ExpenseType>("COMMON");
  // 날짜 키("11/14"). 빈 값 = 날짜 없음. 등록 후에도 유지해 같은 날 내역을 연달아 넣기 쉽게
  const today = toDateKey(new Date());
  const [dateKey, setDateKey] = useState(today);

  // 날짜 칩: 이 방에서 이미 쓴 날짜들 + 오늘 + 지금 고른 날짜, 날짜 순
  const dateChips = useMemo(() => {
    const orders = new Map<string, number>();
    for (const key of [
      ...expenses.map((e) => splitDate(e.description).key),
      today,
      dateKey,
    ]) {
      if (!key || orders.has(key)) continue;
      orders.set(key, splitDate(`${key} x`).order);
    }
    return [...orders.entries()].sort((a, b) => a[1] - b[1]).map(([k]) => k);
  }, [expenses, today, dateKey]);

  useEffect(() => {
    if (members.length > 0 && (!payer || !members.includes(payer))) {
      setPayer(members[0]);
    }
  }, [members, payer]);

  const handleSubmit = async () => {
    if (!payer) {
      await openAlert("결제한 사람을 선택해주세요.");
      return;
    }
    if (!desc || !amount) {
      await openAlert("내용과 금액을 입력해주세요.");
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      await openAlert("금액은 0보다 큰 숫자여야 합니다.");
      return;
    }
    if (!Number.isInteger(parsedAmount)) {
      await openAlert("금액은 정수로 입력해주세요.");
      return;
    }
    onAddExpense(payer, withDate(dateKey, desc.trim()), parsedAmount, type);
    setDesc("");
    setAmount("");
  };

  return (
    <StInputWrapper>
      <Card
        padding="1.25rem"
        radius="1rem"
        shadow="0 2px 4px rgba(0, 0, 0, 0.02)"
        borderColor={theme.semantic.border}
      >
        <StSectionTitle>
          <SectionTitle>📝 지출 내역 입력</SectionTitle>
        </StSectionTitle>

        <StPayerScroll>
          {members.map((m) => (
            <StPayerChip
              key={m}
              $active={payer === m}
              onClick={() => setPayer(m)}
            >
              {m}
            </StPayerChip>
          ))}
        </StPayerScroll>

        <StSelectedGuide>
          {payer ? (
            <p>
              <span>{payer}</span>님이 결제한 내역을 입력하고 있어요
            </p>
          ) : (
            <p>누가 결제했나요?</p>
          )}
        </StSelectedGuide>

        <StDateRow role="group" aria-label="사용한 날짜">
          <StFieldLabel>날짜</StFieldLabel>
          <StDateChips>
            <StPayerChip
              type="button"
              $active={dateKey === ""}
              onClick={() => setDateKey("")}
            >
              날짜 없음
            </StPayerChip>
            {dateChips.map((key) => (
              <StPayerChip
                key={key}
                type="button"
                $active={dateKey === key}
                onClick={() => setDateKey(key)}
              >
                {key}
                {key === today ? " 오늘" : ""}
              </StPayerChip>
            ))}
            <StDatePicker
              type="date"
              aria-label="다른 날짜 고르기"
              title="다른 날짜 고르기"
              onChange={(e) => {
                const key = isoToDateKey(e.target.value);
                if (key) setDateKey(key);
              }}
            />
          </StDateChips>
        </StDateRow>

        <StInputRow>
          <StInput
            placeholder="사용 내역"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <StInput
            type="text"
            inputMode="numeric"
            className="amount-input"
            placeholder="금액"
            value={amount}
            onChange={(e) => setAmount(onlyDigits(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </StInputRow>

        <StBottomRow>
          <StToggleGroup>
            <StRadioLabel $active={type === "COMMON"}>
              <input
                type="radio"
                checked={type === "COMMON"}
                onChange={() => setType("COMMON")}
              />
              공통(같이 나눔)
            </StRadioLabel>
            <StRadioLabel $active={type === "PERSONAL"}>
              <input
                type="radio"
                checked={type === "PERSONAL"}
                onChange={() => setType("PERSONAL")}
              />
              개인
            </StRadioLabel>
          </StToggleGroup>
          <Button
            color="primary"
            variant="fill"
            size="small"
            onClick={handleSubmit}
          >
            등록
          </Button>
        </StBottomRow>
      </Card>
    </StInputWrapper>
  );
}

const StInputWrapper = styled.div`
  margin-bottom: 0.75rem;
`;

const StSelectedGuide = styled.div`
  margin-bottom: 0.75rem;
  padding-left: 0.2rem;
  p {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.gray500};
  }
  span {
    color: ${({ theme }) => theme.semantic.primary};
    font-weight: 700;
    margin-right: 0.2rem;
  }
`;

const StSectionTitle = styled.div`
  margin-bottom: 1.25rem;
`;

const StPayerScroll = styled.div`
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.75rem;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const StPayerChip = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 0.4rem 0.8rem;
  border-radius: 0.6rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.semantic.primary : theme.semantic.border};
  background-color: ${({ theme, $active }) =>
    $active ? theme.semantic.primaryLight : theme.colors.white};
  color: ${({ theme, $active }) =>
    $active ? theme.semantic.primary : theme.colors.gray600};
`;

const StDateRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

/* 날짜 칩은 옆으로 밀지 않고 다음 줄로 — 달력 칸까지 늘 보이게 */
const StDateChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding-bottom: 0.75rem;
`;

const StFieldLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  padding-left: 0.2rem;
`;

/* 칩 옆 작은 달력 칸 — 칩과 같은 높이·테두리 */
const StDatePicker = styled.input`
  flex-shrink: 0;
  width: 2.6rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.6rem;
  background-color: ${({ theme }) => theme.colors.white};
  color: transparent;
  font-size: 0.875rem;
  cursor: pointer;

  &::-webkit-datetime-edit {
    display: none;
  }
  &::-webkit-calendar-picker-indicator {
    margin: 0;
    cursor: pointer;
  }
  &:focus {
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

const StInputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  .amount-input {
    width: 40%;
  }
`;

const StInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.6rem;
  font-size: 0.9rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  &:focus {
    background-color: ${({ theme }) => theme.colors.white};
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

const StBottomRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StToggleGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const StRadioLabel = styled.label<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  cursor: pointer;
  color: ${({ theme, $active }) =>
    $active ? theme.semantic.primary : theme.colors.gray500};
  font-weight: 600;
  input {
    accent-color: ${({ theme }) => theme.semantic.primary};
  }
`;
