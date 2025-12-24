"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { ExpenseType } from "@/types";

// Components

// Hook
import { useCalculator } from "@/hooks/useCalculator";
import { useCalcPersistence } from "@/hooks/useCalcPersistence"; // ✅ 추가
import CalcHeader from "./CalcHeader";
import ExpenseInput from "./ExpenseInput";
import ExpenseList from "./ExpenseList";
import MemberManager from "./MemberManager";
import SettlementReport from "./SettlementReport";
import FooterGuide from "@/components/common/FooterGuide";
import CalcMainContent from "./CalcMainContent";

interface Expense {
  id: number;
  payer: string;
  description: string;
  amount: number;
  type: ExpenseType;
}

export default function CalcPage() {
  const [members, setMembers] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // ✅ 저장 로직 훅 사용
  const { saveRoomData, loading } = useCalcPersistence();

  // ... (기존 핸들러 로직들: handleAddMember 등 동일하게 유지) ...
  const handleAddMember = (name: string) => {
    /*...*/ setMembers([...members, name]);
  };
  const handleDeleteMember = (name: string) => {
    /*...*/ setMembers(members.filter((m) => m !== name));
  };
  const handleAddExpense = (
    payer: string,
    desc: string,
    amount: number,
    type: ExpenseType
  ) => {
    /*...*/ setExpenses([
      ...expenses,
      { id: Date.now(), payer, description: desc, amount, type },
    ]);
  };
  const handleDeleteExpense = (id: number) => {
    /*...*/ setExpenses(expenses.filter((e) => e.id !== id));
  };
  const handleUpdateExpense = (id: number, amount: number) => {
    /*...*/ setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, amount } : e))
    );
  };

  const settlementResult = useCalculator(members, expenses);

  return (
    <StContainer>
      {/* ✅ 저장 버튼 연결 */}
      <CalcHeader
        onSave={() => saveRoomData(members, expenses)}
        isLoading={loading}
      />
      {/* ✅ 중복 코드 제거 및 컴포넌트 교체 */}
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

      {/* ✅ 하단 가이드 추가 */}
      <FooterGuide
        title="💡 정산 꿀팁, 이렇게 써보세요!"
        tips={[
          {
            icon: <TipIcon>🧮</TipIcon>,
            title: "머리 아픈 계산은 맡기세요",
            description:
              "누가 누구에게 얼마를? 복잡한 꼬리 물기 식 송금은 이제 그만! 최소한의 이체 횟수로 끝내는 '최적의 경로'를 알려드려요.",
          },
          {
            icon: <TipIcon>🔗</TipIcon>,
            title: "링크 하나로 공유 끝",
            description:
              "앱 설치도, 로그인도 필요 없어요. 정산이 끝나면 링크만 복사해서 단톡방에 툭! 친구들도 바로 결과를 확인할 수 있어요.",
          },
          {
            icon: <TipIcon>💸</TipIcon>,
            title: "공금과 개인 돈 구분하기",
            description:
              "다 같이 먹은 식사는 '공동', 나 혼자 산 기념품은 '개인'. 지출 성격을 구분해두면 정산에서 자동으로 제외되어 편리해요.",
          },
          {
            icon: <TipIcon>🧐</TipIcon>,
            title: "투명한 영수증 관리",
            description:
              "'이거 무슨 돈이야?' 나중에 딴소리 없도록! 누가, 어디서, 무엇을 썼는지 기록하여 모두가 납득하는 깔끔한 정산을 만드세요.",
          },
        ]}
      />
    </StContainer>
  );
}

const StContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  background-color: ${({ theme }) => theme.semantic.bg};
  min-height: 100vh;
`;

// ✅ TipIcon 스타일 추가 (맨 아래에 붙여넣기)
const TipIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background-color: ${({ theme }) => theme.colors.blue50};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.25rem;
`;
