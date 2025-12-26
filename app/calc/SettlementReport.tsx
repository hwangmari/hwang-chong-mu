"use client";
import React from "react";
import styled from "styled-components";
import SettlementSummary from "./SettlementSummary";
import SettlementList from "./SettlementList";

interface Props {
  result: {
    totalCommonSpend: number;
    perPersonShare: number;
    settlements: { from: string; to: string; amount: number }[];
  };
  hasData: boolean;
}

export default function SettlementReport({ result, hasData }: Props) {
  if (!hasData) return null;

  return (
    <StResultContainer>
      <StSectionTitle>📊 정산 리포트</StSectionTitle>

      <SettlementSummary
        totalAmount={result.totalCommonSpend}
        perPersonAmount={result.perPersonShare}
      />

      <SettlementList settlements={result.settlements} />
    </StResultContainer>
  );
}

const StSectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  margin-bottom: 1.25rem;
`;
const StResultContainer = styled.section`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px dashed ${({ theme }) => theme.colors.gray200};
`;
