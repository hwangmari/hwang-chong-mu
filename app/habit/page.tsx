"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import FooterGuide from "@/components/common/FooterGuide";
import {
  StContainer,
  StSection,
  StWrapper,
} from "@/components/styled/layout.styled";
import PageIntro, { StHighlight } from "@/components/common/PageIntro";
import CreateButton from "@/components/common/CreateButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Input from "@/components/common/Input";
import { HABIT_GUIDE_DATA } from "@/data/footerGuides";

const COLORS = [
  { name: "Slate", value: "#5e606d", label: "슬레이트" },
  { name: "Red", value: "#ed3654", label: "로즈" },
  { name: "Orange", value: "#FB923C", label: "오렌지" },
  { name: "Yellow", value: "#efb520", label: "엠버" },
  { name: "Green", value: "#14b8a6", label: "에메랄드" },
  { name: "Blue", value: "#3378e7", label: "스카이" },
  { name: "Indigo", value: "#6366F1", label: "인디고" },
];

export default function CreateHabitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🥕");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [loading, setLoading] = useState(false);

  const createGoal = async () => {
    if (!title.trim()) return alert("목표를 입력해주세요!");
    setLoading(true);

    const { data, error } = await supabase
      .from("goals")
      .insert({ title, emoji, color: selectedColor })
      .select()
      .single();

    if (error) {
      alert("방 생성에 실패했습니다.");
    } else {
      router.push(`/habit/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <StContainer>
      <StWrapper>
        <PageIntro
          icon={
            <IconWrapper
              onClick={() =>
                setEmoji(
                  ["🥕", "🐰", "🔥", "💪", "📚", "🧘", "✨"][
                    Math.floor(Math.random() * 7)
                  ]
                )
              }
            >
              {emoji}
            </IconWrapper>
          }
          title="황총무의 꾸준한 습관"
          description={
            <>
              매번 실패하는 <StHighlight $color="red">작심삼일</StHighlight>은
              이제 안녕! 👋
              <br />
              황총무와 함께 <StHighlight $color="blue">
                매일매일
              </StHighlight>{" "}
              빈틈없이 채워가요 &apos;ㅅ&apos;/
            </>
          }
        />

        <StSection>
          <Input
            placeholder="예: 매일 30분 운동하기"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createGoal()}
          />

          <ColorSection>
            <Label>테마 컬러</Label>
            <ColorGrid>
              {COLORS.map((color) => (
                <ColorItem key={color.name}>
                  <ColorCircle
                    $color={color.value}
                    $isSelected={selectedColor === color.value}
                    onClick={() => setSelectedColor(color.value)}
                  />
                </ColorItem>
              ))}
            </ColorGrid>
          </ColorSection>

          <CreateButton
            onClick={createGoal}
            bgColor={selectedColor}
            isLoading={loading}
            className="mt-4"
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
              습관 방 만들기 <ArrowForwardIcon fontSize="small" />
            </span>
          </CreateButton>
        </StSection>

        {/* ✅ 습관 관리용 데이터 주입 */}
        <FooterGuide
          title={HABIT_GUIDE_DATA.title}
          tips={HABIT_GUIDE_DATA.tips}
        />
      </StWrapper>
    </StContainer>
  );
}


const IconWrapper = styled.div`
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: inline-block;
  &:hover {
    transform: scale(1.2) rotate(10deg);
  }
`;

const ColorSection = styled.div`
  margin: 1.5rem 0;
  text-align: left;
`;

const Label = styled.p`
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 1rem;
  margin-left: 0.5rem;
`;

const ColorGrid = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.2rem;
  padding: 0 0.5rem;
`;

const ColorItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ColorCircle = styled.button<{ $color: string; $isSelected: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  border: 3px solid white;
  box-shadow: ${({ $isSelected, $color }) =>
    $isSelected
      ? `0 0 0 3px ${$color}, 0 4px 10px rgba(0,0,0,0.1)`
      : "0 2px 5px rgba(0,0,0,0.05)"};
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    transform: scale(1.15);
  }
`;

const TipIcon = styled.span`
  font-size: 1.2rem;
  background: white;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0; /* 아이콘 크기 고정 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;
