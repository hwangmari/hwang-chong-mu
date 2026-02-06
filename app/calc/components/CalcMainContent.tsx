/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ExpenseType } from "@/types";

// Components
import MemberManager from "./MemberManager";
import ExpenseInput from "./ExpenseInput";
import ExpenseList from "./ExpenseList";
import SettlementReport from "./SettlementReport";
import SettlementList from "./SettlementList";
import ShareButton from "./ui/ShareButton";

interface Expense {
  id: number;
  payer: string;
  description: string;
  amount: number;
  type: ExpenseType;
}

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

  // Handlers
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
}: CalcMainContentProps) {
  // settlementResult에서 필요한 값들을 미리 뽑아둡니다.
  const {
    totalCommonSpend,
    perPersonShare,
    settlements,
    remainder,
    remainderReceiver,
  } = settlementResult;

  return (
    <>
      <MemberManager
        members={members}
        onAddMember={onAddMember}
        onDeleteMember={onDeleteMember}
      />

      <ExpenseInput members={members} onAddExpense={onAddExpense} />

      <ExpenseList
        expenses={expenses}
        onDelete={onDeleteExpense}
        onUpdate={onUpdateExpense}
      />

      {/* 전체 요약 + 상세 리포트 (합쳐진 버전) */}
      <SettlementReport
        members={members}
        expenses={expenses}
        perPersonShare={perPersonShare}
        totalAmount={totalCommonSpend}
        settlements={settlements}
        remainder={remainder}
        remainderReceiver={remainderReceiver}
      />

      {/* 송금 목록 (직관적으로 누가 누구에게 줄지 먼저 보여줌) */}
      <SettlementList settlements={settlements} />

      {/* 분리된 카톡 공유 버튼 */}
      <ShareButton
        totalAmount={totalCommonSpend}
        perPersonShare={perPersonShare}
        membersCount={members.length}
        settlements={settlements}
        remainder={remainder}
        remainderReceiver={remainderReceiver}
      />
    </>
  );
}
