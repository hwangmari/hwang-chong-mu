"use client";

import styled from "styled-components";

type Props = {
  viewMode: "ledger" | "calendar";
  monthTotals: {
    income: number;
    expense: number;
  };
  monthPaymentTotals: {
    cash: number;
    card: number;
    check_card: number;
  };
  cashBalance: number;
  monthAssetTotal: number;
  boardSummaryCards: Array<{
    id: string;
    label: string;
    amount: number;
    count: number;
    description: string;
  }>;
  formatAmount: (value: number) => string;
};

export default function TopSummaryControls({
  viewMode,
  monthTotals,
  monthPaymentTotals,
  cashBalance,
  monthAssetTotal,
  boardSummaryCards,
  formatAmount,
}: Props) {
  const calendarCards = [
    {
      label: "수입",
      value: formatAmount(monthTotals.income),
      detailLines: [],
      tone: "income" as const,
    },
    {
      label: "지출",
      value: formatAmount(monthTotals.expense),
      detailLines: [
        `현금 ${formatAmount(monthPaymentTotals.cash)}`,
        `카드 ${formatAmount(monthPaymentTotals.card)}`,
        `체크카드 ${formatAmount(monthPaymentTotals.check_card)}`,
      ],
      tone: "expense" as const,
    },
    {
      label: "현금 잔액",
      value: formatAmount(cashBalance),
      detailLines: [],
      tone: "income" as const,
    },
    {
      label: "자산",
      value: formatAmount(monthAssetTotal),
      detailLines: ["저축 카테고리 합계"],
      tone: "asset" as const,
    },
  ];

  if (viewMode === "ledger") {
    return (
      <StTopControls>
        <StLedgerGrid>
          {boardSummaryCards.map((card) => (
            <StLedgerCard key={card.id}>
              <StLedgerCardHead>
                <strong>{card.label}</strong>
                <em>{formatAmount(card.amount)}</em>
              </StLedgerCardHead>
              <StLedgerCardDescription>{card.description}</StLedgerCardDescription>
              <StLedgerCardFooter>
                {card.count > 0
                  ? `이번 달 ${card.count}건 기록`
                  : "이번 달 내역이 없습니다."}
              </StLedgerCardFooter>
            </StLedgerCard>
          ))}
        </StLedgerGrid>
      </StTopControls>
    );
  }

  return (
    <StTopControls>
      <StCalendarSummaryLine>
        {calendarCards.map((card) => (
          <StCalendarSummaryCard key={card.label}>
            <StCalendarSummaryLabel>{card.label}</StCalendarSummaryLabel>
            <StCalendarSummaryValue $tone={card.tone}>
              {card.value}
            </StCalendarSummaryValue>
            <StCalendarSummaryDetail>
              {card.detailLines.map((line) => (
                <span key={`${card.label}-${line}`}>{line}</span>
              ))}
            </StCalendarSummaryDetail>
          </StCalendarSummaryCard>
        ))}
      </StCalendarSummaryLine>
    </StTopControls>
  );
}

const StTopControls = styled.div`
  margin-bottom: 0.65rem;
`;

const StLedgerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.65rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }
`;

const StLedgerCard = styled.article`
  display: flex;
  flex-direction: column;
  min-height: 8.3rem;
  border-radius: 22px;
  border: 1px solid #d9e3f0;
  background: linear-gradient(180deg, #fcfdff 0%, #f7faff 100%);
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(102, 120, 160, 0.05);

  @media (max-width: 720px) {
    min-height: auto;
  }
`;

const StLedgerCardHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.95rem 1rem 0.18rem;

  strong {
    font-size: 0.88rem;
    font-weight: 900;
    color: #1f2937;
  }

  em {
    font-style: normal;
    font-size: 0.84rem;
    font-weight: 900;
    color: #5973c1;
    white-space: nowrap;
  }

  @media (max-width: 720px) {
    padding: 0.85rem 0.9rem 0.3rem;
  }
`;

const StLedgerCardDescription = styled.p`
  padding: 0 1rem 0.8rem;
  min-height: 2.5rem;
  font-size: 0.72rem;
  line-height: 1.35;
  font-weight: 700;
  color: #8a97aa;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StLedgerCardFooter = styled.div`
  margin-top: auto;
  border-top: 1px solid #e5edf7;
  background: rgba(243, 247, 253, 0.78);
  padding: 0.72rem 1rem 0.8rem;
  font-size: 0.76rem;
  font-weight: 800;
  color: #8d99ab;

  @media (max-width: 720px) {
    padding: 0.62rem 0.9rem 0.72rem;
  }
`;

const StCalendarSummaryLine = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
  margin-bottom: 0.75rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
`;
const StCalendarSummaryCard = styled.article`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 9.6rem;
  border-radius: 22px;
  background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%);
  border: 1px solid #dbe4f1;
  box-shadow: 0 8px 20px rgba(102, 120, 160, 0.05);
  padding: 1.12rem 1.18rem;

  @media (max-width: 720px) {
    min-height: auto;
    padding: 0.95rem 1rem;
  }
`;
const StCalendarSummaryLabel = styled.p`
  font-size: 0.88rem;
  color: #707988;
  font-weight: 800;
  margin-bottom: 0.45rem;
`;
const StCalendarSummaryValue = styled.p<{
  $tone: "income" | "expense" | "asset";
}>`
  font-size: 1.55rem;
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: ${({ $tone }) => {
    if ($tone === "income") return "#4f7cff";
    if ($tone === "asset") return "#3f8f8a";
    return "#6b63e8";
  }};

  @media (max-width: 720px) {
    font-size: 1.35rem;
  }
`;
const StCalendarSummaryDetail = styled.div`
  display: grid;
  gap: 0.16rem;
  margin-top: 0.68rem;

  span {
    font-size: 0.75rem;
    color: #8892a3;
    line-height: 1.35;
    font-weight: 700;
  }

  @media (max-width: 720px) {
    display: none;
  }
`;
