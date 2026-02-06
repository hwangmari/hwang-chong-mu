"use client";

import { useEffect, useState, use } from "react";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import MonthlyTracker from "../MonthlyTracker";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";

export default function HabitRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [goal, setGoal] = useState<{
    title: string;
    emoji: string;
    color: string;
  } | null>(null);

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
    <StContainer>
      <StWrapper>
        <Header>
          <Title>
            {goal.emoji} {goal.title}
          </Title>
        </Header>
      </StWrapper>
      <MonthlyTracker
        goalId={Number(id)}
        themeColor={goal.color || "#22c55e"}
      />
    </StContainer>
  );
}

/** ... (나머지 스타일들) */
const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;
const Title = styled.h1`
  font-size: 2rem;
  font-weight: 900;
  color: #0f172a;
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
