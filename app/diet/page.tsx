"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  StContainer,
  StSection,
  StWrapper,
} from "@/components/styled/layout.styled";
import PageIntro from "@/components/common/PageIntro";
import CreateButton from "@/components/common/CreateButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Input from "@/components/common/Input";

export default function CreateDietPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    if (!title.trim()) return alert("목표를 입력해주세요!");
    setLoading(true);

    const { data, error } = await supabase
      .from("diet_goals")
      .insert({
        title,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("방 생성에 실패했습니다.");
    } else {
      router.push(`/diet/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <StContainer>
      <StWrapper>
        <PageIntro
          icon={<span>🥗</span>}
          title="건강한 다이어트"
          description={
            <>
              굶기만 하는 다이어트는 그만! 🙅‍♀️
              <br />
              매일의 <b>식단</b>과 <b>몸무게</b>를 기록하며
              <br />
              건강하게 목표를 달성해보세요.
            </>
          }
        />

        <StSection>
          <Input
            label="다이어트 목표 이름"
            placeholder="예: 이번 여름까지 -5kg!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="목표 몸무게 (kg)"
            placeholder="예: 55 (선택사항)"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
          />

          <CreateButton
            onClick={createRoom}
            bgColor="#10b981" // 에메랄드 색상
            isLoading={loading}
            className="mt-6"
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              다이어트 시작하기 <ArrowForwardIcon fontSize="small" />
            </span>
          </CreateButton>
        </StSection>
      </StWrapper>
    </StContainer>
  );
}
