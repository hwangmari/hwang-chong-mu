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
  monthSettlementTotal: number;
  monthAssetTotal: number;
  boardSummaryCards: Array<{
    id: string;
    label: string;
    amount: number;
    count: number;
    description: string;
  }>;
  formatAmount: (value: number) => string;
  selectedLedgerCardId?: string | null;
  onSelectLedgerCard?: (cardId: string) => void;
  selectedCalendarCardId?: string | null;
  onSelectCalendarCard?: (cardId: string) => void;
  hiddenCalendarAmountCardIds?: string[];
  onToggleCalendarAmountCard?: (cardId: string) => void;
};

export default function TopSummaryControls({
  viewMode,
  monthTotals,
  monthPaymentTotals,
  cashBalance,
  monthSettlementTotal,
  monthAssetTotal,
  boardSummaryCards,
  formatAmount,
  selectedLedgerCardId = null,
  onSelectLedgerCard,
  selectedCalendarCardId = null,
  onSelectCalendarCard,
  hiddenCalendarAmountCardIds = [],
  onToggleCalendarAmountCard,
}: Props) {
  const isCalendarDetailCard = (cardId: string) =>
    cardId === "income" || cardId === "asset";
  const canHideCalendarAmount = (cardId: string) =>
    cardId === "income" || cardId === "cash_balance" || cardId === "asset";

  const calendarCards = [
    {
      id: "income",
      label: "수입",
      value: formatAmount(monthTotals.income),
      detailLines: [],
      tone: "income" as const,
      hiddenValue: "금액 숨김",
    },
    {
      id: "expense",
      label: "지출",
      value: formatAmount(monthTotals.expense),
      detailLines: [
        `현금 ${formatAmount(monthPaymentTotals.cash)}`,
        `카드 ${formatAmount(monthPaymentTotals.card)}`,
        `체크카드 ${formatAmount(monthPaymentTotals.check_card)}`,
      ],
      tone: "expense" as const,
      hiddenValue: "금액 숨김",
    },
    {
      id: "cash_balance",
      label: "현금 잔액",
      value: formatAmount(cashBalance),
      detailLines: [
        `현금 지출 ${formatAmount(monthPaymentTotals.cash)}`,
        `카드정산 ${formatAmount(monthSettlementTotal)}`,
      ],
      tone: "income" as const,
      hiddenValue: "금액 숨김",
    },
    {
      id: "asset",
      label: "자산",
      value: formatAmount(monthAssetTotal),
      detailLines: ["저축 카테고리 합계"],
      tone: "asset" as const,
      hiddenValue: "금액 숨김",
    },
  ];

  if (viewMode === "ledger") {
    return (
      <StTopControls>
        <StLedgerGrid>
          {boardSummaryCards.map((card) => (
            <StLedgerCard
              key={card.id}
              type="button"
              $active={selectedLedgerCardId === card.id}
              onClick={() => onSelectLedgerCard?.(card.id)}
            >
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
        {calendarCards.map((card) => {
          const isHidden =
            canHideCalendarAmount(card.id) &&
            hiddenCalendarAmountCardIds.includes(card.id);
          const renderedDetailLines =
            isHidden && card.detailLines.length > 0
              ? card.detailLines.map(() => "금액 숨김")
              : card.detailLines;

          return (
            <StCalendarSummaryCard
              key={card.id}
              $active={
                isCalendarDetailCard(card.id) && selectedCalendarCardId === card.id
              }
              $clickable={isCalendarDetailCard(card.id)}
              role={isCalendarDetailCard(card.id) ? "button" : undefined}
              tabIndex={isCalendarDetailCard(card.id) ? 0 : undefined}
              onClick={
                isCalendarDetailCard(card.id)
                  ? () => onSelectCalendarCard?.(card.id)
                  : undefined
              }
              onKeyDown={
                isCalendarDetailCard(card.id)
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectCalendarCard?.(card.id);
                      }
                    }
                  : undefined
              }
            >
              <StCalendarSummaryTop>
                <StCalendarSummaryLabel>{card.label}</StCalendarSummaryLabel>
                {canHideCalendarAmount(card.id) ? (
                  <StCalendarSummaryToggle
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleCalendarAmountCard?.(card.id);
                    }}
                  >
                    {isHidden ? "보기" : "숨기기"}
                  </StCalendarSummaryToggle>
                ) : null}
              </StCalendarSummaryTop>
              <StCalendarSummaryValue $tone={card.tone} $hidden={isHidden}>
                {isHidden ? card.hiddenValue : card.value}
              </StCalendarSummaryValue>
              <StCalendarSummaryDetail>
                {renderedDetailLines.map((line, index) => (
                  <span key={`${card.id}-${index}`}>{line}</span>
                ))}
              </StCalendarSummaryDetail>
            </StCalendarSummaryCard>
          );
        })}
      </StCalendarSummaryLine>
    </StTopControls>
  );
}

const StTopControls = styled.div`
  margin-bottom: 0.65rem;
`;

const StLedgerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 0.65rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }
`;

const StLedgerCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  min-height: 8.3rem;
  width: 100%;
  border-radius: 22px;
  border: 1px solid ${({ $active }) => ($active ? "#9bb7ff" : "#d9e3f0")};
  background: ${({ $active }) =>
    $active
      ? "linear-gradient(180deg, #f2f6ff 0%, #eef4ff 100%)"
      : "linear-gradient(180deg, #fcfdff 0%, #f7faff 100%)"};
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(102, 120, 160, 0.05);
  padding: 0;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;

  &:hover {
    border-color: #b7caef;
    box-shadow: 0 10px 22px rgba(102, 120, 160, 0.1);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(79, 124, 255, 0.14),
      0 10px 22px rgba(102, 120, 160, 0.1);
  }

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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem;
    margin-bottom: 0.65rem;
  }
`;
const StCalendarSummaryCard = styled.article<{
  $active: boolean;
  $clickable: boolean;
}>`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  min-height: 9.6rem;
  border-radius: 22px;
  background: linear-gradient(180deg, #fcfdff 0%, #f8fbff 100%);
  border: 1px solid ${({ $active }) => ($active ? "#9db8ee" : "#dbe4f1")};
  box-shadow: ${({ $active }) =>
    $active
      ? "0 10px 24px rgba(95, 115, 217, 0.12)"
      : "0 8px 20px rgba(102, 120, 160, 0.05)"};
  padding: 1.12rem 1.18rem;
  text-align: left;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    ${({ $clickable }) =>
      $clickable
        ? `
      border-color: #bfd0ef;
      box-shadow: 0 12px 24px rgba(102, 120, 160, 0.1);
      transform: translateY(-1px);
    `
        : ""}
  }

  @media (max-width: 720px) {
    min-height: auto;
    border-radius: 18px;
    padding: 0.8rem 0.88rem;
    box-shadow: none;
  }
`;
const StCalendarSummaryTop = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.45rem;
`;
const StCalendarSummaryLabel = styled.p`
  font-size: 0.88rem;
  color: #707988;
  font-weight: 800;
  margin-bottom: 0.45rem;

  @media (max-width: 720px) {
    font-size: 0.8rem;
    margin-bottom: 0.32rem;
  }
`;
const StCalendarSummaryToggle = styled.button`
  border: 1px solid #d7e2ef;
  background: #f8fbff;
  color: #62748d;
  border-radius: 999px;
  padding: 0.22rem 0.54rem;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.2;
`;
const StCalendarSummaryValue = styled.p<{
  $tone: "income" | "expense" | "asset";
  $hidden?: boolean;
}>`
  font-size: 1.36rem;
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: ${({ $tone, $hidden }) => {
    if ($hidden) return "#8b95a6";
    if ($tone === "income") return "#4f7cff";
    if ($tone === "asset") return "#3f8f8a";
    return "#6b63e8";
  }};

  @media (max-width: 720px) {
    font-size: 1.02rem;
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
