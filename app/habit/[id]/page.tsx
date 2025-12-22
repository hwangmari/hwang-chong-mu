"use client";

import { useEffect, useState, use } from "react"; // Next.js 15+ 에서는 params를 use()로 감쌈
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import InstallGuide from "@/components/common/InstallGuide";
import MonthlyTracker from "../MonthlyTracker";

// params 타입 정의
export default function HabitRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // params 언래핑 (Next.js 15 방식)
  const { id } = use(params);
  const [goal, setGoal] = useState<{ title: string; emoji: string } | null>(
    null
  );

  // ✅ 가이드 모달 상태
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // 방 정보 가져오기
  useEffect(() => {
    const fetchGoal = async () => {
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

      {/* goal_id를 넘겨서 이 방의 데이터만 다루도록 함 */}
      <MonthlyTracker goalId={Number(id)} />

      {/* ✅ 가이드 컴포넌트 연결 */}
      <InstallGuide
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />
    </MainContainer>
  );
}

// ✨ 스타일 추가
const TopBar = styled.div`
  width: 100%;
  max-width: 400px;
  display: flex;
  justify-content: flex-end; /* 오른쪽 정렬 */
  margin-bottom: 1rem;
`;

const MenuButton = styled.button`
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: white;
    color: #3b82f6;
    border-color: #3b82f6;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
`;

const MainContainer = styled.main`
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
`;

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
