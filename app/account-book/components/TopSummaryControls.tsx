"use client";

import styled from "styled-components";
import { EntryType } from "../types";
type PaymentTotals = {
  cash: number;
  card: number;
  check_card: number;
};

type Props = {
  monthTotals: { income: number; expense: number };
  monthPaymentTotals: { income: PaymentTotals; expense: PaymentTotals };
  cashBalance: number;
  assetTotal: number;
  memberExpenseTotals: Array<[string, number]>;
  onOpenIncomeYearly: () => void;
  onOpenExpenseYearly: () => void;
  onOpenAssetYearly: () => void;
  formatAmount: (value: number) => string;
};

export default function TopSummaryControls({
  monthTotals,
  monthPaymentTotals,
  cashBalance,
  assetTotal,
  memberExpenseTotals,
  onOpenIncomeYearly,
  onOpenExpenseYearly,
  onOpenAssetYearly,
  formatAmount,
}: Props) {
  return (
    <StTopControls>
      <StSummaryLine>
        <StSummaryButton type="button" onClick={onOpenIncomeYearly}>
          <StSummaryLabel>수입</StSummaryLabel>
          <StSummaryValue $kind="income">
            {formatAmount(monthTotals.income)}
          </StSummaryValue>
        </StSummaryButton>

        <StSummaryButton type="button" onClick={onOpenExpenseYearly}>
          <StSummaryLabel>지출</StSummaryLabel>
          <StSummaryValue $kind="expense">
            {formatAmount(monthTotals.expense)}
          </StSummaryValue>
          <StSummaryDetail>
            <span>현금 {formatAmount(monthPaymentTotals.expense.cash)}</span>
            <span>카드 {formatAmount(monthPaymentTotals.expense.card)}</span>
            <span>
              체크카드 {formatAmount(monthPaymentTotals.expense.check_card)}
            </span>
          </StSummaryDetail>
        </StSummaryButton>

        <StSummaryBox>
          <StSummaryLabel>현금 잔액</StSummaryLabel>
          <StSummaryValue $kind={cashBalance >= 0 ? "income" : "expense"}>
            {formatAmount(cashBalance)}
          </StSummaryValue>
        </StSummaryBox>

        <StSummaryButton type="button" onClick={onOpenAssetYearly}>
          <StSummaryLabel>자산</StSummaryLabel>
          <StSummaryValue $kind="income">{formatAmount(assetTotal)}</StSummaryValue>
          <StSummaryDetail>
            <span>저축 카테고리 합계</span>
          </StSummaryDetail>
        </StSummaryButton>
      </StSummaryLine>

      {memberExpenseTotals.length > 0 && (
        <StMemberSummary>
          {memberExpenseTotals.map(([name, amount]) => (
            <span key={name}>
              {name} {formatAmount(amount)}
            </span>
          ))}
        </StMemberSummary>
      )}
    </StTopControls>
  );
}

const StTopControls = styled.div`
  margin-bottom: 0.8rem;
`;
const StSummaryLine = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;
const StSummaryBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  border-radius: 12px;
  background: #f9fbff;
  border: 1px solid #e5eaf1;
  padding: 0.7rem;
`;
const StSummaryButton = styled.button`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  border-radius: 12px;
  background: #f9fbff;
  border: 1px solid #e5eaf1;
  padding: 0.7rem;
  text-align: left;
  cursor: pointer;
  &:hover {
    background: #f2f7fd;
  }
`;
const StSummaryLabel = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;
const StSummaryValue = styled.p<{ $kind: EntryType }>`
  font-size: 1.2rem;
  font-weight: 800;
  color: ${({ $kind }) => ($kind === "income" ? "#26a269" : "#da4f7f")};
`;
const StSummaryDetail = styled.div`
  display: grid;
  gap: 0.15rem;
  margin-top: 0.35rem;
  span {
    font-size: 0.74rem;
    color: #7b8596;
    line-height: 1.2;
  }
`;

const StMemberSummary = styled.div`
  margin-top: 0.6rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;

  span {
    font-size: 0.74rem;
    font-weight: 700;
    color: #4f6178;
    background: #edf3f9;
    border: 1px solid #d7e3ef;
    border-radius: 999px;
    padding: 0.2rem 0.5rem;
  }
`;
