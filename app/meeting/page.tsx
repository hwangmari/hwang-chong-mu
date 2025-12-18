"use client";

import styled from "styled-components";
import AdBanner from "@/components/common/AdBanner";
import FooterTips from "@/components/create-room/FooterTips";
import Header from "@/components/create-room/Header";
import RoomForm from "@/components/create-room/RoomForm";
import useCreateRoom from "@/hooks/useCreateRoom";

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

      <FooterTips />
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
