/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ExpenseType } from "@/types";

interface Props {
  members: string[];
  onAddExpense: (
    payer: string,
    desc: string,
    amount: number,
    type: ExpenseType,
  ) => void;
}

export default function ExpenseInput({ members, onAddExpense }: Props) {
  const [payer, setPayer] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<ExpenseType>("COMMON");

  useEffect(() => {
    if (members.length > 0 && (!payer || !members.includes(payer))) {
      setPayer(members[0]);
    }
  }, [members, payer]);

  const handleSubmit = () => {
    if (!payer) return alert("결제한 사람을 선택해주세요.");
    if (!desc || !amount) return alert("내용과 금액을 입력해주세요.");
    onAddExpense(payer, desc, parseInt(amount, 10), type);
    setDesc("");
    setAmount("");
  };

  return (
    <StInputWrapper>
      <StSectionTitle>📝 지출 내역 입력</StSectionTitle>

      {/* 1. 결제자 선택 칩 */}
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

      {/* ✨ 2. 선택된 이름 강조 가이드 */}
      <StSelectedGuide>
        {payer ? (
          <p>
            <span>{payer}</span>님이 결제한 내역을 입력하고 있어요
          </p>
        ) : (
          <p>누가 결제했나요?</p>
        )}
      </StSelectedGuide>

      {/* 3. 입력 필드 그룹 */}
      <StInputRow>
        <StInput
          placeholder="사용 내역"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <StInput
          type="number"
          className="amount-input"
          placeholder="금액"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
            N빵
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
        <StMiniAddButton onClick={handleSubmit}>등록</StMiniAddButton>
      </StBottomRow>
    </StInputWrapper>
  );
}

// 스타일 가이드 추가
const StInputWrapper = styled.div`
  margin-bottom: 0.75rem;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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

const StSectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
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
    background-color: white;
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

const StMiniAddButton = styled.button`
  background-color: ${({ theme }) => theme.semantic.primary};
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.6rem;
  font-weight: 700;
  font-size: 0.9rem;
`;
