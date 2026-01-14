"use client";

import { useEffect, useState, use } from "react";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import { StContainer } from "@/components/styled/layout.styled";
import DietMainContent from "../DietMainContent";

export default function DietRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [goal, setGoal] = useState<any>(null);

  useEffect(() => {
    const fetchGoal = async () => {
      const { data } = await supabase
        .from("diet_goals")
        .select("*")
        .eq("id", id)
        .single();
      if (data) setGoal(data);
    };
    fetchGoal();
  }, [id]);

  if (!goal) return <div className="p-10 text-center">로딩 중... 🥗</div>;

  return (
    <StContainer>
      <Header>
        <Title>🥗 {goal.title}</Title>
        {goal.target_weight && (
          <SubTitle>목표: {goal.target_weight}kg</SubTitle>
        )}
      </Header>

      {/* 메인 로직 컴포넌트 분리 */}
      <DietMainContent goalId={Number(id)} />
    </StContainer>
  );
}

const Header = styled.div`
  text-align: center;
  margin: 1rem 0 2rem;
`;
const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 800;
  color: #1f2937;
`;
const SubTitle = styled.p`
  color: #6b7280;
  margin-top: 0.5rem;
  font-weight: 600;
`;
