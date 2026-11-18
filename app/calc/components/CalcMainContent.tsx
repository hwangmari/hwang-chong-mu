"use client";
import styled from "styled-components";
import { Expense, ExpenseType } from "@/types";

import MemberManager from "./MemberManager";
import ExpenseInput from "./ExpenseInput";
import ExpenseList from "./ExpenseList";
import SettlementReport from "./SettlementReport";
import SettlementList from "./SettlementList";
import ShareButton from "./ui/ShareButton";

interface CalcMainContentProps {
  members: string[];
  expenses: Expense[];
  settlementResult: {
    totalCommonSpend: number;
    perPersonShare: number;
    settlements: { from: string; to: string; amount: number }[];
    remainder: number;
    remainderReceiver: string | null;
  };

  onAddMember: (name: string) => void;
  onDeleteMember: (name: string) => void;
  onAddExpense: (
    payer: string,
    desc: string,
    amount: number,
    type: ExpenseType,
  ) => void;
  onDeleteExpense: (id: number) => void;
  onUpdateExpense: (id: number, amount: number) => void;
  onToggleExpenseType: (id: number) => void;
}

export default function CalcMainContent({
  members,
  expenses,
  settlementResult,
  onAddMember,
  onDeleteMember,
  onAddExpense,
  onDeleteExpense,
  onUpdateExpense,
  onToggleExpenseType,
}: CalcMainContentProps) {
  const {
    totalCommonSpend,
    perPersonShare,
    settlements,
    remainder,
    remainderReceiver,
  } = settlementResult;

  // 넓은 창(900px 이상): 위는 좌우 두 열(왼쪽 = 멤버·입력, 오른쪽 = 정산 결과),
  // 아래는 지출 목록 한 열 전체 폭. 폰은 멤버 → 입력 → 정산 → 목록 한 열.
  return (
    <StCalcGrid>
      <StCalcStack $area="main">
        <MemberManager
          members={members}
          onAddMember={onAddMember}
          onDeleteMember={onDeleteMember}
        />
        <ExpenseInput members={members} onAddExpense={onAddExpense} />
      </StCalcStack>

      <StCalcStack $area="side">
        <SettlementReport
          members={members}
          expenses={expenses}
          perPersonShare={perPersonShare}
          totalAmount={totalCommonSpend}
          settlements={settlements}
          remainder={remainder}
          remainderReceiver={remainderReceiver}
          fill
        />
        <SettlementList settlements={settlements} />
        <ShareButton
          totalAmount={totalCommonSpend}
          perPersonShare={perPersonShare}
          membersCount={members.length}
          settlements={settlements}
          remainder={remainder}
          remainderReceiver={remainderReceiver}
        />
      </StCalcStack>

      <StCalcStack $area="list">
        <ExpenseList
          expenses={expenses}
          onDelete={onDeleteExpense}
          onUpdate={onUpdateExpense}
          onToggleType={onToggleExpenseType}
        />
      </StCalcStack>
    </StCalcGrid>
  );
}

/* 카드 사이 간격은 여기 gap 하나로만 정한다(카드마다 제각각이던 바깥 여백은 0으로).
   사이트 공용 desktop(1024px) 기준이면 주인 창(약 945px)에서 한 열이 돼서 900px부터 나눈다. */
const CARD_GAP = "1.25rem";

const StCalcGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${CARD_GAP};

  @media (min-width: 900px) {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    grid-template-areas:
      "main side"
      "list list";
    gap: ${CARD_GAP};
    /* 위 두 열은 같은 줄이라 아래 끝을 맞춘다(오른쪽 정산 카드가 남는 높이를 채움) */
    align-items: stretch;
  }
`;

const StCalcStack = styled.div<{ $area: "main" | "side" | "list" }>`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${CARD_GAP};

  & > * {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  @media (min-width: 900px) {
    grid-area: ${({ $area }) => $area};
  }
`;
