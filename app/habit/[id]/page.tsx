"use client";

import { useEffect, useState, use } from "react";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import InstallGuide from "@/components/common/InstallGuide";
import MonthlyTracker from "../MonthlyTracker";

export default function HabitRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // ✅ color 타입 추가
  const [goal, setGoal] = useState<{
    title: string;
    emoji: string;
    color: string;
  } | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const fetchGoal = async () => {
      // ✅ color 컬럼도 같이 가져오기
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("id", id)
        .single();
      if (data) setGoal(data);
    };
    fetchGoal();
  }, [id]);

  if (!goal) return <Loading>방 찾는 중... 🥕</Loading>;

  return (
    <MainContainer>
      <Header>
        <Emoji>{goal.emoji}</Emoji>
        <Title>{goal.title}</Title>
        <SubTitle>꾸준함이 재능을 이긴다!</SubTitle>
      </Header>

      {/* ✅ goal.color를 themeColor prop으로 전달 (없으면 기본 초록색) */}
      <MonthlyTracker
        goalId={Number(id)}
        themeColor={goal.color || "#22c55e"}
      />

      <InstallGuide
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />
    </MainContainer>
  );
}

// ... (스타일은 기존 유지) ...
const MainContainer = styled.main`
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
`;
// ... (나머지 스타일들)
const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;
const Emoji = styled.div`
  font-size: 3rem;
  margin-bottom: 0.5rem;
`;
const Title = styled.h1`
  font-size: 2rem;
  font-weight: 900;
  color: #0f172a;
`;
const SubTitle = styled.p`
  color: #64748b;
  margin-top: 0.5rem;
`;
const Loading = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
`;
