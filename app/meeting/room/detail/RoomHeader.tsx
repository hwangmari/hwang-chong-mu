"use client";

import ShareButton from "@/components/common/KakaoCalendarShare";
import PeriodEditor from "./PeriodEditor";
import styled from "styled-components";

interface RoomHeaderProps {
  title: string;
  startDate?: string;
  endDate?: string;
  onFinish?: () => void;
  onUpdatePeriod?: (start: string, end: string) => void;
}

export default function RoomHeader({
  title,
  startDate,
  endDate,
  onFinish,
  onUpdatePeriod,
}: RoomHeaderProps) {
  return (
    <StHeaderContainer>
      <StTitleCard>
        <StRow>
          <StRoomTitle>{title}</StRoomTitle>
          <ShareButton
            title={`[황총무] ${title}`}
            description={`${title} 약속 날짜를 정해보아요! 🐰`}
          />
        </StRow>
        {(startDate && endDate && onUpdatePeriod || onFinish) && (
          <StRow>
            {startDate && endDate && onUpdatePeriod && (
              <PeriodEditor
                startDate={startDate}
                endDate={endDate}
                onSave={onUpdatePeriod}
              />
            )}
            {onFinish && (
              <StFinishButton onClick={onFinish}>
                투표 마감하기
              </StFinishButton>
            )}
          </StRow>
        )}
      </StTitleCard>
    </StHeaderContainer>
  );
}

const StHeaderContainer = styled.header`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
`;

const StTitleCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  padding: 1rem 1.25rem;
  background-color: ${({ theme }) => theme.colors.white};
`;

const StRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StRoomTitle = styled.h1`
  font-size: 1.125rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  word-break: keep-all;
  line-height: 1.25;
`;

const StFinishButton = styled.button`
  height: 2.25rem;
  padding: 0 0.75rem;
  background-color: ${({ theme }) => theme.colors.gray800};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  font-size: 0.813rem;
  border-radius: 0.5rem;
  white-space: nowrap;
  margin-left: auto;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.black};
  }
  &:active {
    transform: scale(0.98);
  }
`;
