"use client";
import styled from "styled-components";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ExpenseType } from "@/types";

// Components
import FooterGuide from "@/components/common/FooterGuide";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";

// Hooks
import { useCalculator } from "@/hooks/useCalculator";
import { useCalcPersistence } from "@/hooks/useCalcPersistence";
import CalcMainContent from "../CalcMainContent";

// Types
interface Expense {
  id: number;
  payer: string;
  description: string;
  amount: number;
  type: ExpenseType;
}

export default function CalcDetailParamsPage() {
  const params = useParams();
  const roomId = params.id as string;
  const { fetchRoomData, updateRoomData } = useCalcPersistence();

  const [members, setMembers] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (roomId) {
      fetchRoomData(roomId).then((data) => {
        if (data) {
          setMembers(data.members || []);
          setExpenses(data.expenses || []);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const updateAndSave = (newMembers: string[], newExpenses: Expense[]) => {
    // 화면(State) 업데이트
    setMembers(newMembers);
    setExpenses(newExpenses);

    // ★ 중요: 기존 saveRoomData 대신 updateRoomData 사용
    // DB 업데이트 (자동 저장)
    if (roomId) {
      updateRoomData(roomId, newMembers, newExpenses);
    }
  };
  const handleAddMember = (name: string) => {
    const newMembers = [...members, name];
    updateAndSave(newMembers, expenses);
  };

  const handleDeleteMember = (name: string) => {
    const newMembers = members.filter((m) => m !== name);
    // 멤버 삭제 시 해당 멤버의 지출 내역 처리도 필요할 수 있음 (일단은 유지)
    updateAndSave(newMembers, expenses);
  };

  const handleAddExpense = (
    payer: string,
    desc: string,
    amount: number,
    type: ExpenseType
  ) => {
    const newExpenses = [
      ...expenses,
      { id: Date.now(), payer, description: desc, amount, type },
    ];
    updateAndSave(members, newExpenses);
  };

  const handleDeleteExpense = (id: number) => {
    const newExpenses = expenses.filter((e) => e.id !== id);
    updateAndSave(members, newExpenses);
  };

  const handleUpdateExpense = (id: number, amount: number) => {
    const newExpenses = expenses.map((e) =>
      e.id === id ? { ...e, amount } : e
    );
    updateAndSave(members, newExpenses);
  };

  // 정산 계산
  const settlementResult = useCalculator(members, expenses);

  return (
    <StContainer>
      <StWrapper>
        <CalcMainContent
          members={members}
          expenses={expenses}
          settlementResult={settlementResult}
          onAddMember={handleAddMember}
          onDeleteMember={handleDeleteMember}
          onAddExpense={handleAddExpense}
          onDeleteExpense={handleDeleteExpense}
          onUpdateExpense={handleUpdateExpense}
        />

        <FooterGuide
          title="💡 정산 꿀팁"
          tips={[
            {
              icon: "🔗",
              title: "링크 공유하기",
              description: "상단의 공유 버튼을 눌러 친구들을 초대하세요.",
            },
            {
              icon: "💾",
              title: "자동 저장됨",
              description: "입력하는 내용은 실시간으로 자동 저장됩니다.",
            },
          ]}
        />
      </StWrapper>
    </StContainer>
  );
}
