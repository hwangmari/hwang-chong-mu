"use client";
import React from "react";
import { ExpenseType } from "@/types";

// Components
import MemberManager from "./MemberManager";
import ExpenseInput from "./ExpenseInput";
import ExpenseList from "./ExpenseList";
import SettlementReport from "./SettlementReport";

// Types
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
  settlementResult: any; // 타입 정의가 복잡하면 일단 any 또는 hooks의 리턴 타입 활용

  // Handlers
  onAddMember: (name: string) => void;
  onDeleteMember: (name: string) => void;
  onAddExpense: (
    payer: string,
    desc: string,
    amount: number,
    type: ExpenseType
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
        result={settlementResult}
        hasData={expenses.length > 0 || members.length > 0}
      />
    </>
  );
}
