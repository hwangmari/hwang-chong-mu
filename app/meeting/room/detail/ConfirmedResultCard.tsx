"use client";

import styled, { css, keyframes } from "styled-components";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import Typography from "@/components/common/Typography";
import { UserVote } from "@/types";

interface Props {
  roomName: string;
  finalDate: Date;
  participants: UserVote[];
  onReset: () => void;
  onRescueUser: (user: UserVote) => void;
}

export default function ConfirmedResultCard({
  roomName,
  finalDate,
  participants,
  onReset,
  onRescueUser,
}: Props) {
  const getUnavailablePeople = (d: Date) =>
    participants.filter(
      (p) => !p.isAbsent && p.unavailableDates.some((ud) => isSameDay(ud, d)),
    );

  const getAvailablePeople = (d: Date) =>
    participants.filter(
      (p) => !p.isAbsent && !p.unavailableDates.some((ud) => isSameDay(ud, d)),
    );

  const getAbsentPeople = () => participants.filter((p) => p.isAbsent);

  const unavailableList = [
    ...getUnavailablePeople(finalDate),
    ...getAbsentPeople(),
  ];

  return (
    <StResultCard>
      <StEmoji>🎉</StEmoji>

      <StTitle variant="h3" as="h3">
        약속 날짜 확정!
      </StTitle>

      <StDateBox>
        <StRoomName variant="caption" color="gray500">
          {roomName}
        </StRoomName>
        <StDateDisplay variant="h2">
          {format(finalDate, "M월 d일 (E)", { locale: ko })}
        </StDateDisplay>
      </StDateBox>

      {/* 결과 명단 리스트 */}
      <StResultGrid>
        {/* 1. 참석 가능자 */}
        <StResultColumn $type="available">
          <StSectionTitle variant="caption" color="gray400">
            참석 가능 🙆‍♂️
          </StSectionTitle>
          <StResultCell>
            {getAvailablePeople(finalDate).length > 0 ? (
              getAvailablePeople(finalDate).map((p, i) => (
                <StNameTag key={i}>{p.name}</StNameTag>
              ))
            ) : (
              <StEmptyText>없음</StEmptyText>
            )}
          </StResultCell>
        </StResultColumn>

        {/* 2. 불가능자 */}
        <StResultColumn $type="unavailable">
          <StUnavailableTitle variant="caption">
            불가능 / 불참 🙅‍♂️
          </StUnavailableTitle>
          <StResultCell>
            {unavailableList.length > 0 ? (
              unavailableList.map((p, i) => (
                <StRescueButton
                  key={i}
                  onClick={() => onRescueUser(p)}
                  $isAbsent={p.isAbsent}
                >
                  {p.name} ✎
                </StRescueButton>
              ))
            ) : (
              <StSuccessText>전원 참석!</StSuccessText>
            )}
          </StResultCell>
        </StResultColumn>
      </StResultGrid>

      <StRetryButton onClick={onReset}>일정 다시 조정하기</StRetryButton>
    </StResultCard>
  );
}

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StResultCard = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1.5rem;
  border-radius: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 4px solid ${({ theme }) => theme.colors.gray900};
  text-align: center;
  margin-bottom: 2rem;
  margin-top: 1rem;
  animation: ${fadeInUp} 0.5s ease-out;
`;

const StEmoji = styled.div`
  font-size: 2.25rem;
  line-height: 2.5rem;
  margin-bottom: 1rem;
`;

const StTitle = styled(Typography)`
  font-weight: 900;
  margin-bottom: 0.25rem;
`;

const StDateBox = styled.div`
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StRoomName = styled(Typography)`
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const StDateDisplay = styled(Typography)`
  font-weight: 900;
  text-align: center;
`;

const StResultGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  text-align: left;
  margin-bottom: 1.5rem;
`;

const StResultColumn = styled.div<{ $type: "available" | "unavailable" }>`
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid;

  ${({ $type, theme }) =>
    $type === "available"
      ? css`
          background-color: ${theme.colors.gray50};
          border-color: ${theme.colors.gray100};
        `
      : css`
          background-color: #fef2f2; /* red-50 */
          border-color: #fee2e2; /* red-100 */
        `}
`;

const StSectionTitle = styled(Typography)`
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StUnavailableTitle = styled(Typography)`
  color: #f87171;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StResultCell = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
`;

const StNameTag = styled.span`
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray800};
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  font-weight: 700;
`;

const StRescueButton = styled.button<{ $isAbsent: boolean }>`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid;
  font-weight: 700;
  transition: transform 0.2s;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
  }

  ${({ $isAbsent, theme }) =>
    $isAbsent
      ? css`
          background-color: ${theme.colors.gray200};
          color: ${theme.colors.gray500};
          border-color: ${theme.colors.gray300};
          text-decoration: line-through;
        `
      : css`
          background-color: ${theme.colors.white};
          color: #f87171;
          border-color: #fee2e2;
          &:hover {
            background-color: #fef2f2;
          }
        `}
`;

const StEmptyText = styled.span`
  color: ${({ theme }) => theme.colors.gray300};
`;

const StSuccessText = styled.span`
  color: ${({ theme }) => theme.colors.gray400};
`;

const StRetryButton = styled.button`
  color: ${({ theme }) => theme.colors.gray400};
  text-decoration: underline;
  font-size: 0.875rem;
  &:hover {
    color: ${({ theme }) => theme.colors.gray600};
  }
`;
