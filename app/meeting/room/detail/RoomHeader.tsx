"use client";

import ShareButton from "@/components/common/KakaoCalendarShare";
import styled from "styled-components";

interface RoomHeaderProps {
  title: string;
}

export default function RoomHeader({ title }: RoomHeaderProps) {
  return (
    <StHeaderContainer>
      <StServiceTitle>🐰 황총무의 약속 잡기</StServiceTitle>

      {/* 타이틀 및 공유 버튼 영역 */}
      <StTitleCard>
        <StRoomTitle>{title}</StRoomTitle>
        <ShareButton
          title={`[황총무] ${title}`}
          description={`${title} 약속 날짜를 정해보아요! 🐰`}
        />
      </StTitleCard>
    </StHeaderContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스)

const StHeaderContainer = styled.header`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem; /* gap-4 */
  margin-bottom: 1.5rem; /* mb-6 */
`;

const StServiceTitle = styled.h1`
  font-size: 1.25rem; /* text-xl */
  font-weight: 800; /* font-extrabold */
  color: ${({ theme }) => theme.colors.gray800};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const StTitleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
  padding: 0.5rem 1rem; /* px-4 py-2 */
  background-color: ${({ theme }) => theme.colors.white};
`;

const StRoomTitle = styled.h1`
  font-size: 1.5rem; /* text-2xl */
  font-weight: 900; /* font-black */
  color: ${({ theme }) => theme.colors.gray900};
  word-break: keep-all; /* break-keep */
  line-height: 1.25; /* leading-tight */
`;
