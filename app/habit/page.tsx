"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import ServiceLayout from "@/components/common/ServiceLayout";
import {
  StSection,
  StFieldGrid,
  StField,
} from "@/components/styled/layout.styled";
import { StHighlight } from "@/components/common/PageIntro";
import CreateButton from "@/components/common/CreateButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Input } from "@hwangchongmu/ui";
import { HABIT_GUIDE_DATA } from "@/data/footerGuides";
import ColorPickerPanel from "@/components/common/ColorPickerPanel";
import { useModal } from "@/components/common/ModalProvider";

// 기본 선택은 파랑(첫 번째). 회색은 맨 뒤로 — 새로 만드는 방에만 적용되고 기존 방 색은 그대로다
const COLORS = [
  "#3378e7",
  "#6366F1",
  "#14b8a6",
  "#efb520",
  "#FB923C",
  "#ed3654",
  "#5e606d",
];

export default function CreateHabitPage() {
  const router = useRouter();
  const { openAlert } = useModal();
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("🥕");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const createGoal = async () => {
    if (!title.trim()) {
      await openAlert("목표를 입력해주세요!");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase
      .from("goals")
      .insert({ title, emoji, color: selectedColor })
      .select()
      .single();

    if (error) {
      await openAlert("방 생성에 실패했습니다.");
    } else {
      router.push(`/habit/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <ServiceLayout
      width="narrow"
      intro={{
        icon: (
          <IconWrapper
            onClick={() =>
              setEmoji(
                ["🥕", "🐰", "🔥", "💪", "📚", "🧘", "✨"][
                  Math.floor(Math.random() * 7)
                ],
              )
            }
          >
            {emoji}
          </IconWrapper>
        ),
        title: "황총무의 꾸준한 습관",
        description: (
          <>
            매번 실패하는 <StHighlight $color="red">작심삼일</StHighlight>은
            이제 안녕! 👋
            <br />
            황총무와 함께 <StHighlight $color="blue">매일매일</StHighlight>{" "}
            빈틈없이 채워가요 &apos;ㅅ&apos;/
          </>
        ),
      }}
      /* ✅ 습관 관리용 데이터 주입 */
      guide={{
        title: HABIT_GUIDE_DATA.title,
        tips: HABIT_GUIDE_DATA.tips,
        blogGuideId: "habit-tracking-that-sticks",
      }}
    >
      <StSection>
        <StFieldGrid>
          <StField>
            <Input
              label="습관 이름"
              placeholder="예: 매일 30분 운동하기"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createGoal()}
            />
          </StField>

          <StField>
            <ColorSection>
              <Label>테마 컬러</Label>
              <ColorPickerPanel
                selectedColor={selectedColor}
                onSelect={setSelectedColor}
                colors={COLORS}
              />
            </ColorSection>
          </StField>

          <StField $span="full">
            <CreateButton
              onClick={createGoal}
              bgColor={selectedColor}
              isLoading={loading}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                습관 방 만들기 <ArrowForwardIcon fontSize="small" />
              </span>
            </CreateButton>
          </StField>
        </StFieldGrid>
      </StSection>
    </ServiceLayout>
  );
}

const IconWrapper = styled.div`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
`;

const ColorSection = styled.div`
  text-align: left;
`;

const Label = styled.p`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.semantic.subText};
  margin-bottom: 0.5rem;
`;
