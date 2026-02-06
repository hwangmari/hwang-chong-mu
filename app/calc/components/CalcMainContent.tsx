"use client";
import { ExpenseType } from "@/types";

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

      <SettlementReport
        members={members}
        expenses={expenses}
        perPersonShare={perPersonShare}
        totalAmount={totalCommonSpend}
        settlements={settlements}
        remainder={remainder}
        remainderReceiver={remainderReceiver}
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
    </>
  );
}
