"use client";
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
    updateAndSave(newMembers, expenses);
  };

  const handleAddExpense = (
    payer: string,
    desc: string,
    amount: number,
    type: ExpenseType,
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
      e.id === id ? { ...e, amount } : e,
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
              icon: "📋",
              title: "내역 복사하기",
              description:
                "복사 버튼을 누르면 카톡에 바로 붙여넣을 수 있는 텍스트가 복사돼요.",
            },
            {
              icon: "🔗",
              title: "카톡으로 초대하기",
              description:
                "상단 공유 버튼을 통해 친구들을 초대하면 실시간으로 정산 현황을 볼 수 있어요.",
            },
            {
              icon: "⚡",
              title: "실시간 자동 저장",
              description:
                "새로고침을 하거나 창을 닫아도 마지막으로 입력한 내역이 안전하게 보관되어 있어요.",
            },
            {
              icon: "✅",
              title: "정확한 N빵 계산",
              description:
                "개인 지출은 '개인'으로 설정해 보세요. 공통 비용만 똑똑하게 계산해 드릴게요.",
            },
          ]}
        />
      </StWrapper>
    </StContainer>
  );
}
