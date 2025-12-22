"use client";

import styled from "styled-components";
import AdBanner from "@/components/common/AdBanner";
import Header from "@/components/create-room/Header";
import RoomForm from "@/components/create-room/RoomForm";
import useCreateRoom from "@/hooks/useCreateRoom";
import FooterGuide from "@/components/common/FooterGuide"; // ✅ 공통 컴포넌트

// 아이콘 불러오기
import CreditCardIcon from "@mui/icons-material/CreditCard";
import GroupOffIcon from "@mui/icons-material/GroupOff";

export default function CreateRoomPage() {
  const {
    formData,
    loading,
    handleChange,
    createRoom,
    isCustomPeriod,
    setIsCustomPeriod,
  } = useCreateRoom();

  return (
    <StPageContainer>
      <StFormCard>
        <Header />
        <RoomForm
          formData={formData}
          loading={loading}
          onChange={handleChange}
          onSubmit={createRoom}
          isCustomPeriod={isCustomPeriod}
          setIsCustomPeriod={setIsCustomPeriod}
        />
      </StFormCard>

      {/* ✅ 공통 가이드 컴포넌트 사용 */}
      <FooterGuide
        title="🍯 약속 잡기 꿀팁"
        story={{
          title: "🤔 왜 만들었냐구요?",
          content: (
            <p>
              <b>&quot;이 날 어때?&quot;</b> 하면 철수가 안 되고,
              <br />
              <b>&quot;그럼 이 날은?&quot;</b> 하면 영희가 안 되고...🤦‍♂️
              <br />이 무한 루프가 답답해서 직접 만들었어요!
            </p>
          ),
          solution: {
            title: "💡 황총무의 솔루션",
            content: (
              <p>
                다들 바빠서 &apos;되는 날&apos; 찾기가 너무 힘들죠?
                <br />
                <b>역발상이 필요합니다!</b>
                <br />
                &quot;다들 들어와서{" "}
                <span style={{ color: "#ef4444", textDecoration: "underline" }}>
                  안 되는 날(❌)
                </span>
                만 찍어줘! 남는 날이 우리가 만날 날이야!&quot;
              </p>
            ),
          },
        }}
        tips={[
          {
            icon: <CreditCardIcon sx={{ color: "#f59e0b" }} />,
            title: "이럴 때 유용해요!",
            description: (
              <>
                &quot;이번 달 안에 법카 써야 해! 💳&quot;
                <br />
                기간 내 데드라인이 있는 약속 잡기 딱 좋아요.
              </>
            ),
          },
          {
            icon: <GroupOffIcon sx={{ color: "#ef4444" }} />,
            title: "전원 참석이 힘든가요?",
            description:
              "'불참자 최소' 날짜를 골라보세요. 완벽한 날보단 함께하는 날이 중요하니까요!",
          },
        ]}
      />

      <AdBanner />
    </StPageContainer>
  );
}
// ✨ 스타일 정의 (St 프리픽스 적용)

const StPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 1rem;
`;

const StFormCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  padding: 2rem; /* p-8 */
  border-radius: 1rem; /* rounded-2xl (약 1rem ~ 1.5rem) */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04); /* shadow-xl */
  width: 100%;
  max-width: 28rem; /* max-w-md */
  border: 1px solid ${({ theme }) => theme.colors.gray100};

  /* 하단 요소들과의 간격을 위해 마진 추가 가능 */
  margin-bottom: 2rem;
`;
