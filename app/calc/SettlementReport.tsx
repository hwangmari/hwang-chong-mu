"use client";

import styled from "styled-components";
import { Expense } from "@/types";

interface SettlementReportProps {
  members: string[];
  expenses: Expense[];
  perPersonShare: number;
  totalAmount: number;
  settlements: { from: string; to: string; amount: number }[];
}

export default function SettlementReport({
  members,
  expenses,
  perPersonShare,
  totalAmount,
}: SettlementReportProps) {
  return (
    <StTotalCard>
      {/* 1. 상단 요약 영역 (기존 SettlementSummary 역할) */}
      <StSummarySection>
        <div className="row">
          <span className="label">총 지출 금액</span>
          <span className="value">{totalAmount.toLocaleString()}원</span>
        </div>
        <div className="divider" />
        <div className="row highlight">
          <span className="label">1인당 부담금</span>
          <span className="value">
            {Math.round(perPersonShare).toLocaleString()}원
          </span>
        </div>
      </StSummarySection>

      {/* 2. 상세 내역 아코디언 영역 */}
      <StDetailsSection>
        <details>
          <summary>
            <span>📊 멤버별 상세 계산 방식</span>
            <span className="arrow">▼</span>
          </summary>
          <div className="accordion-content">
            {members.map((member) => {
              const paidAmount = expenses
                .filter((e) => e.payer === member && e.type === "COMMON")
                .reduce((acc, cur) => acc + cur.amount, 0);
              const diff = paidAmount - perPersonShare;

              return (
                <StMemberRow key={member}>
                  <div className="member-main">
                    <span className="name">{member}</span>
                    <span className={`diff ${diff >= 0 ? "plus" : "minus"}`}>
                      {diff >= 0
                        ? `+${diff.toLocaleString()}`
                        : diff.toLocaleString()}
                      원
                    </span>
                  </div>
                  <div className="member-sub">
                    {paidAmount.toLocaleString()}원(지출) -{" "}
                    {perPersonShare.toLocaleString()}원(몫)
                  </div>
                </StMemberRow>
              );
            })}
          </div>
        </details>
      </StDetailsSection>
    </StTotalCard>
  );
}

// ✨ 스타일 정의
const StTotalCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const StSummarySection = styled.div`
  padding: 1.5rem;
  background-color: white;

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    .label {
      font-size: 0.9rem;
      color: ${({ theme }) => theme.colors.gray500};
      font-weight: 500;
    }
    .value {
      font-size: 1.2rem;
      font-weight: 700;
    }

    &.highlight {
      margin-top: 0.5rem;
      .label {
        color: ${({ theme }) => theme.colors.gray800};
        font-weight: 700;
      }
      .value {
        font-size: 1.5rem;
        color: ${({ theme }) => theme.semantic.primary || "#3b82f6"};
        font-weight: 800;
      }
    }
  }

  .divider {
    height: 1px;
    background-color: ${({ theme }) => theme.colors.gray100};
    margin: 0.5rem 0;
  }
`;

const StDetailsSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray100};

  details {
    summary {
      padding: 1rem 1.5rem;
      list-style: none;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray600};
      background-color: ${({ theme }) => theme.colors.gray50};

      &::-webkit-details-marker {
        display: none;
      }
      .arrow {
        transition: transform 0.2s;
      }
    }

    &[open] summary .arrow {
      transform: rotate(180deg);
    }
  }

  .accordion-content {
    padding: 1rem 1.5rem;
    background-color: white;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
`;

const StMemberRow = styled.div`
  .member-main {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    margin-bottom: 0.2rem;

    .diff.plus {
      color: #3b82f6;
    }
    .diff.minus {
      color: #ef4444;
    }
  }
  .member-sub {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray400};
  }
`;
