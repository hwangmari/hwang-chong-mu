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
    type: ExpenseType
  ) => void;
}

export default function ExpenseInput({ members, onAddExpense }: Props) {
  const [payer, setPayer] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<ExpenseType>("COMMON");

  // 멤버가 변경되면 payer 유효성 체크 및 자동 선택
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
    <StSection>
      <StSectionTitle>📝 지출 내역 입력</StSectionTitle>
      <StInputGrid>
        <StPayerSelection>
          <div className="label">결제한 사람</div>
          <StPayerList>
            {members.length > 0 ? (
              members.map((m) => (
                <StPayerChip
                  key={m}
                  $active={payer === m}
                  onClick={() => setPayer(m)}
                >
                  {m}
                </StPayerChip>
              ))
            ) : (
              <span className="no-member">멤버를 먼저 추가해주세요</span>
            )}
          </StPayerList>
        </StPayerSelection>

        <StInput
          placeholder="사용 내역 (예: 흑돼지 삼겹살)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <StInput
          type="number"
          placeholder="금액 (원)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <StToggleGroup>
          <StRadioLabel $active={type === "COMMON"}>
            <input
              type="radio"
              checked={type === "COMMON"}
              onChange={() => setType("COMMON")}
            />
            공동 경비 (N빵)
          </StRadioLabel>
          <StRadioLabel $active={type === "PERSONAL"}>
            <input
              type="radio"
              checked={type === "PERSONAL"}
              onChange={() => setType("PERSONAL")}
            />
            개인 지출
          </StRadioLabel>
        </StToggleGroup>
        <StAddButton onClick={handleSubmit}>등록하기</StAddButton>
      </StInputGrid>
    </StSection>
  );
}

// 스타일 컴포넌트 (StSection, StSectionTitle 등은 중복되므로 별도 파일로 분리하거나 각각 선언 필요)
// 편의상 여기에 필요한 스타일만 포함합니다. (실제로는 common UI 폴더에 StSection 등을 두는게 좋습니다)
const StSection = styled.section`
  background: ${({ theme }) => theme.colors.white};
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
`;
const StSectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  margin-bottom: 1.25rem;
`;
const StInputGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const StPayerSelection = styled.div`
  .label {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray500};
    margin-bottom: 0.5rem;
  }
  .no-member {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray400};
  }
`;
const StPayerList = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;
const StPayerChip = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.95rem;
  font-weight: ${({ $active }) => ($active ? "700" : "500")};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.semantic.primary : theme.semantic.border};
  background-color: ${({ theme, $active }) =>
    $active ? theme.semantic.primaryLight : theme.colors.white};
  color: ${({ theme, $active }) =>
    $active ? theme.semantic.primary : theme.colors.gray600};
  transition: all 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;
const StInput = styled.input`
  padding: 0.875rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  outline: none;
  font-size: 0.95rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  &:focus {
    border-color: ${({ theme }) => theme.semantic.primary};
    background-color: ${({ theme }) => theme.colors.white};
  }
`;
const StToggleGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem 0;
`;
const StRadioLabel = styled.label<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: ${({ theme, $active }) =>
    $active ? theme.semantic.primary : theme.colors.gray500};
  font-weight: ${({ $active }) => ($active ? "700" : "500")};
  input {
    accent-color: ${({ theme }) => theme.semantic.primary};
  }
`;
const StAddButton = styled.button`
  background-color: ${({ theme }) => theme.semantic.primary};
  color: white;
  padding: 1rem;
  margin-top: 0.5rem;
  font-size: 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  width: 100%;
  &:hover {
    background-color: ${({ theme }) => theme.colors.blue700};
  }
`;
