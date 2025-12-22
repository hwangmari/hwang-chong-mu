"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";

// 🎨 중복 없이 딱 떨어지는 8가지 핵심 컬러
const COLORS = [
  { name: "Green", value: "#22c55e", label: "초록" },
  { name: "Blue", value: "#3b82f6", label: "파랑" },
  { name: "Purple", value: "#a855f7", label: "보라" },
  { name: "Pink", value: "#ec4899", label: "핑크" },
  { name: "Orange", value: "#f97316", label: "주황" },
  { name: "Yellow", value: "#eab308", label: "노랑" },
  { name: "Teal", value: "#14b8a6", label: "청록" },
  { name: "Slate", value: "#475569", label: "다크" },
];

export default function CreateHabitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🐰");
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
    <Container>
      <ContentWrapper>
        <Card>
          <IconWrapper
            onClick={() =>
              setEmoji(
                ["🐰", "🔥", "💪", "📚", "🧘"][Math.floor(Math.random() * 5)]
              )
            }
          >
            {emoji}
          </IconWrapper>

          <Title>어떤 습관을 만드실 건가요?</Title>

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

          <Button
            onClick={createGoal}
            disabled={loading}
            $bgColor={selectedColor}
          >
            {loading ? "생성 중..." : "습관 방 만들기 ➔"}
          </Button>
        </Card>

        {/* 👇 새로 추가된 가이드 섹션 */}
        <FooterTips>
          <TipTitle>💡 습관 방, 이렇게 써보세요!</TipTitle>
          <TipList>
            <TipItem>
              <TipIcon>👀</TipIcon>
              <div>
                <strong>눈으로 보는 성취감</strong>
                <p>
                  머릿속 의지는 약하지만, 눈에 보이는 기록은 강력해요. 하루하루
                  채워지는 잔디를 보며 동기부여를 얻으세요.
                </p>
              </div>
            </TipItem>
            <TipItem>
              <TipIcon>🐣</TipIcon>
              <div>
                <strong>작은 것부터 시작하기</strong>
                <p>
                  &apos;매일 10km 뛰기&apos;보다는 &apos;운동화 신기&apos;부터!
                  아주 사소한 목표라도 꾸준히 체크하는 게 중요해요.
                </p>
              </div>
            </TipItem>
            <TipItem>
              <TipIcon>🎨</TipIcon>
              <div>
                <strong>나만의 컬러로 물들이기</strong>
                <p>
                  내가 가장 좋아하는 색을 골라보세요. 달력이 그 색으로 가득 찰
                  때의 짜릿함을 느껴보세요!
                </p>
              </div>
            </TipItem>
          </TipList>
        </FooterTips>
      </ContentWrapper>
    </Container>
  );
}

// ✨ 스타일 정의
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background-color: #f8fafc;
  padding: 2rem 1rem;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 2rem; /* 카드와 팁 사이 간격 */
`;

const Card = styled.div`
  background: white;
  padding: 2.5rem 2rem;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
  text-align: center;
  border: 1px solid #f1f5f9;
`;

// ... (기존 IconWrapper, Title, Input, ColorSection 등 스타일 유지) ...
const IconWrapper = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: inline-block;
  &:hover {
    transform: scale(1.2) rotate(10deg);
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 2rem;
  word-break: keep-all;
  line-height: 1.3;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1.2rem;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  font-size: 1rem;
  margin-bottom: 2rem;
  outline: none;
  transition: all 0.2s;
  &:focus {
    border-color: #94a3b8;
    box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.1);
  }
`;

const ColorSection = styled.div`
  margin-bottom: 2.5rem;
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

const Button = styled.button<{ $bgColor: string }>`
  width: 100%;
  padding: 1.1rem;
  background: ${({ $bgColor }) => $bgColor};
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px ${({ $bgColor }) => $bgColor}40;
  &:hover {
    filter: brightness(1.05);
    transform: translateY(-2px);
  }
  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// 👇 FooterTips 스타일 정의
const FooterTips = styled.div`
  padding: 1.5rem;
  background: #f1f5f9; /* 은은한 회색 배경 */
  border-radius: 20px;
  color: #475569;
`;

const TipTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TipList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TipItem = styled.li`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 0.9rem;
  line-height: 1.5;

  strong {
    display: block;
    color: #1e293b;
    margin-bottom: 2px;
  }

  p {
    color: #64748b;
    font-size: 0.85rem;
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
