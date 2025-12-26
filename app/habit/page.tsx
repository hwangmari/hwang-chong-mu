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
import Input from "@/components/common/Input";

// 🎨 중복 없이 딱 떨어지는 8가지 핵심 컬러
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
        <StSection>
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
            습관 방 만들기 ➔
          </CreateButton>
        </StSection>

        {/* ✅ 습관 관리용 데이터 주입 */}
        <FooterGuide
          title="💡 습관 방, 이렇게 써보세요!"
          // story는 없으므로 생략 (자동으로 팁 리스트만 나옴)
          tips={[
            {
              icon: <TipIcon>👀</TipIcon>,
              title: "눈으로 보는 성취감",
              description:
                "머릿속 의지는 약하지만, 눈에 보이는 기록은 강력해요. 하루하루 채워지는 잔디를 보며 동기부여를 얻으세요.",
            },
            {
              icon: <TipIcon>🐣</TipIcon>,
              title: "작은 것부터 시작하기",
              description:
                "'매일 10km 뛰기'보다는 '밖에 나가기'부터! 아주 사소한 목표라도 꾸준히 체크하는 게 중요해요.",
            },
            {
              icon: <TipIcon>🎨</TipIcon>,
              title: "나만의 컬러로 물들이기",
              description:
                "내가 가장 좋아하는 색을 골라보세요. 달력이 그 색으로 가득 찰 때의 짜릿함을 느껴보세요!",
            },
            {
              icon: <TipIcon>🔖</TipIcon>,
              title: "출석부로 쓰기",
              description:
                "목표 이름에 '푸바오, 루이, 후이' 처럼 친구 이름을 적어보세요. 서로의 출석률을 체크하며 선의의 경쟁을 할 수 있어요!. 특히! 운동 메이트 참석률 체크 추천해요! ",
            },
            {
              icon: <TipIcon>✏️</TipIcon>, // 아이콘: 연필
              title: "기록은 기억을 이긴다",
              description:
                "그날의 컨디션, 날씨, 핑계거리 무엇이든 좋아요. 짧게라도 남겨두면 나중에 나를 분석하는 훌륭한 데이터가 됩니다.",
            },
          ]}
        />
      </StWrapper>
    </StContainer>
  );
}

// ✨ 스타일 정의

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
