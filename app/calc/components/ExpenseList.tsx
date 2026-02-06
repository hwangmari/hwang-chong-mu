"use client";
import { StSection } from "@/components/styled/layout.styled";
import { Expense } from "@/types";
import React, { useState, useMemo } from "react";
import styled from "styled-components";
import SectionTitle from "./ui/SectionTitle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface Props {
  expenses: Expense[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, amount: number) => void;
}

export default function ExpenseList({ expenses, onDelete, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  const groupedExpenses = useMemo(() => {
    const groups: { [key: string]: Expense[] } = {};
    expenses.forEach((e) => {
      if (!groups[e.payer]) groups[e.payer] = [];
      groups[e.payer].push(e);
    });
    return groups;
  }, [expenses]);

  const currentTotal = useMemo(() => {
    return expenses.reduce((acc, cur) => acc + cur.amount, 0);
  }, [expenses]);

  const startEditing = (id: number, currentAmount: number) => {
    setEditingId(id);
    setEditAmount(currentAmount.toString());
  };

  const saveEditing = (id: number) => {
    const parsedAmount = Number(editAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return alert("금액은 0보다 큰 숫자여야 합니다.");
    }
    if (!Number.isInteger(parsedAmount)) {
      return alert("금액은 정수로 입력해주세요.");
    }
    onUpdate(id, parsedAmount);
    setEditingId(null);
  };

  if (expenses.length === 0) return null;

  return (
    <StSection>
      <StHeaderRow
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer" }}
      >
        <SectionTitle>
          <StTitleContent>
            🧾 지출 목록
            <StChevronIcon $expanded={isExpanded} />
          </StTitleContent>
        </SectionTitle>
        <StTotalText>
          Total <strong>{currentTotal.toLocaleString()}</strong>원
        </StTotalText>
      </StHeaderRow>

      {isExpanded && (
        <StGroupContainer>
          {Object.entries(groupedExpenses).map(([payer, items]) => (
            <div key={payer}>
              <StPayerHeader>
                <span className="name">{payer}</span>
                <span className="subtotal">
                  {items
                    .reduce((acc, cur) => acc + cur.amount, 0)
                    .toLocaleString()}
                  원
                </span>
              </StPayerHeader>

              <StList>
                {items.map((e) => (
                  <StListItem key={e.id} $isPersonal={e.type === "PERSONAL"}>
                    <div className="row-main">
                      <div className="content">
                        <span className="desc">{e.description}</span>
                        {e.type === "PERSONAL" && (
                          <StGrayBadge>개인</StGrayBadge>
                        )}
                      </div>

                      <StRightSection>
                        {editingId === e.id ? (
                          <>
                            <input
                              type="text"
                              value={editAmount}
                              autoFocus
                              onChange={(ev) => setEditAmount(ev.target.value)}
                              onKeyDown={(ev) => {
                                if (ev.key === "Enter") saveEditing(e.id);
                                if (ev.key === "Escape") setEditingId(null);
                              }}
                            />
                            <span className="unit">원</span>
                            <StFixedBtnGroup>
                              <button onClick={() => saveEditing(e.id)}>
                                완료
                              </button>
                              <span className="divider">|</span>
                              <button onClick={() => setEditingId(null)}>
                                취소
                              </button>
                            </StFixedBtnGroup>
                          </>
                        ) : (
                          <>
                            <span className="amount">
                              {e.amount.toLocaleString()}원
                            </span>
                            <StFixedBtnGroup>
                              <button
                                onClick={() => startEditing(e.id, e.amount)}
                              >
                                수정
                              </button>
                              <span className="divider">|</span>
                              <button onClick={() => onDelete(e.id)}>
                                삭제
                              </button>
                            </StFixedBtnGroup>
                          </>
                        )}
                      </StRightSection>
                    </div>
                  </StListItem>
                ))}
              </StList>
            </div>
          ))}
        </StGroupContainer>
      )}
    </StSection>
  );
}

const StHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};

  /* 호버 시 시각적 피드백 */
  &:hover h2 {
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const StTitleContent = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
`;

const StChevronIcon = styled(ExpandMoreIcon)<{ $expanded: boolean }>`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray400};
  transform: ${({ $expanded }) =>
    $expanded ? "rotate(0deg)" : "rotate(-90deg)"};
  transition: transform 0.2s;
`;

const StTotalText = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray500};
  strong {
    color: ${({ theme }) => theme.colors.gray900};
    font-weight: 700;
    font-size: 1.05rem;
    margin-left: 0.25rem;
  }
`;

const StGroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const StPayerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  .name {
    font-size: 1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray800};
    position: relative;
    padding-left: 0.75rem;
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 4px;
      background-color: ${({ theme }) => theme.colors.gray400};
      border-radius: 50%;
    }
  }
  .subtotal {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.gray500};
    font-weight: 500;
  }
`;

const StList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
`;

const StListItem = styled.li<{ $isPersonal: boolean }>`
  margin-left: 0.7rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
  background-color: transparent;
  color: ${({ theme, $isPersonal }) =>
    $isPersonal ? theme.colors.gray400 : theme.colors.gray800};

  &:last-child {
    border-bottom: none;
  }

  .row-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 1.5rem; /* 행 높이 고정 */
  }

  .content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    overflow: hidden;
    .desc {
      font-size: 0.95rem;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
  }
`;

const StRightSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 170px; /* 고정 너비로 덜컥거림 방지 */
  height: 1.5rem;

  /* 공통 텍스트 스타일 (금액, 단위) */
  .amount,
  .unit {
    font-weight: 600;
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
    line-height: 1.5rem;
  }

  .unit {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.gray600};
    margin-right: 0.8rem; /* 버튼과 간격 */
    margin-left: 0.1rem;
  }

  .amount {
    margin-right: 0.8rem; /* 버튼과 간격 */
  }

  /* 입력 폼 스타일 */
  input {
    width: 70px;
    height: 1.5rem;
    padding: 0;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray800};
    border-radius: 0;
    text-align: right;
    font-size: 0.95rem;
    font-weight: 600;
    background: transparent;
    outline: none;
    font-family: inherit;

    &:focus {
      border-bottom-color: ${({ theme }) => theme.semantic.primary};
    }
  }
`;

const StGrayBadge = styled.span`
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 500;
  flex-shrink: 0;
`;

/** 버튼 그룹 */
const StFixedBtnGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  width: 60px; /* 고정 너비 */

  .divider {
    color: ${({ theme }) => theme.colors.gray300};
    font-size: 0.7rem;
  }

  button {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.gray400};
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
    white-space: nowrap;

    &:hover {
      color: ${({ theme }) => theme.colors.gray800};
      text-decoration: underline;
    }
  }
`;
