"use client";

import styled from "styled-components";

interface SettlementSummaryProps {
  totalAmount: number; // 총 지출 금액
  perPersonAmount: number; // 1인당 부담금
}

export default function SettlementSummary({
  totalAmount,
  perPersonAmount,
}: SettlementSummaryProps) {
  return (
    <StSummaryCard>
      {/* 상단: 총 지출 */}
      <StRow>
        <span className="label">총 지출 금액</span>
        <span className="value">{totalAmount.toLocaleString()}원</span>
      </StRow>

      <StDivider />

      {/* 하단: 1인당 부담금 (강조) */}
      <StRow $isHighlight>
        <span className="label">1인당 부담금</span>
        <span className="value">
          {Math.round(perPersonAmount).toLocaleString()}원
        </span>
      </StRow>
    </StSummaryCard>
  );
}

// ✨ 스타일 정의
const StSummaryCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};

  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 1.25rem;

  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StRow = styled.div<{ $isHighlight?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .label {
    font-size: 0.95rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray500};
  }

  .value {
    font-size: ${({ $isHighlight }) => ($isHighlight ? "1.5rem" : "1.25rem")};
    font-weight: ${({ $isHighlight }) => ($isHighlight ? "800" : "700")};
    font-variant-numeric: tabular-nums;

    color: ${({ theme, $isHighlight }) =>
      $isHighlight ? theme.colors.gray900 : theme.colors.gray800};
  }
`;

const StDivider = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.gray100};
  margin: 0.2rem 0;
`;
