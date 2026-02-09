"use client";

import ShareButton from "@/components/common/KakaoCalendarShare";
import styled from "styled-components";

interface RoomHeaderProps {
  title: string;
}

export default function RoomHeader({ title }: RoomHeaderProps) {
  return (
    <StHeaderContainer>
      <StTitleCard>
        <StRoomTitle>{title}</StRoomTitle>
        <StActions>
          <ShareButton
            title={`[황총무] ${title}`}
            description={`${title} 약속 날짜를 정해보아요! 🐰`}
          />
        </StActions>
      </StTitleCard>
    </StHeaderContainer>
  );
}

const StHeaderContainer = styled.header`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem; /* mb-6 */
`;

const StTitleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 0.5rem;
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

const StActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
