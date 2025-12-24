"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useParams } from "next/navigation";
import { ExpenseType } from "@/types";

// Components
import FooterGuide from "@/components/common/FooterGuide"; // 하단 팁 추가

// Hooks
import { useCalculator } from "@/hooks/useCalculator";
import { useCalcPersistence } from "@/hooks/useCalcPersistence";
import CalcHeader from "../CalcHeader";
import ExpenseInput from "../ExpenseInput";
import ExpenseList from "../ExpenseList";
import MemberManager from "../MemberManager";
import SettlementReport from "../SettlementReport";
import CalcMainContent from "../CalcMainContent";

// Types (필요시 types/index.ts로 이동)
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

  // 상태 관리
  const [members, setMembers] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // DB 훅
  const { fetchRoomData, saveRoomData, loading } = useCalcPersistence();

  // ✅ 1. 데이터 불러오기
  useEffect(() => {
    if (roomId) {
      fetchRoomData(roomId).then((data) => {
        if (data) {
          setMembers(data.members);
          setExpenses(data.expenses);
        }
      });
    }
  }, [roomId]); // fetchRoomData는 dependency 제외

  // ✅ 2. 공유하기 핸들러 (URL 복사)
  const handleShare = async () => {
    try {
      const url = window.location.href; // 현재 페이지 주소
      await navigator.clipboard.writeText(url);
      alert("링크가 복사되었습니다! 친구들에게 공유하세요. 🔗");
    } catch (err) {
      console.error(err);
      alert("링크 복사에 실패했습니다. URL을 직접 복사해주세요.");
    }
  };

  // 핸들러들 (수정/업데이트용 - 필요시 update 로직으로 교체 가능)
  const handleAddMember = (name: string) => {
    setMembers([...members, name]);
  };
  const handleDeleteMember = (name: string) => {
    setMembers(members.filter((m) => m !== name));
  };
  const handleAddExpense = (
    payer: string,
    desc: string,
    amount: number,
    type: ExpenseType
  ) => {
    setExpenses([
      ...expenses,
      { id: Date.now(), payer, description: desc, amount, type },
    ]);
  };
  const handleDeleteExpense = (id: number) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };
  const handleUpdateExpense = (id: number, amount: number) => {
    setExpenses(expenses.map((e) => (e.id === id ? { ...e, amount } : e)));
  };

  // 정산 계산
  const settlementResult = useCalculator(members, expenses);

  return (
    <StContainer>
      <CalcHeader onShare={handleShare} />

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
      {/* 하단 팁 가이드 */}
      <FooterGuide
        title="💡 정산 꿀팁"
        tips={[
          {
            icon: <div>🔗</div>,
            title: "링크 공유",
            description:
              "위의 공유 버튼을 눌러 링크를 복사해 단톡방에 올리세요.",
          },
          {
            icon: <div>💾</div>,
            title: "자동 저장",
            description:
              "이 페이지는 고유한 주소를 가지고 있어 언제든 다시 들어올 수 있어요.",
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
