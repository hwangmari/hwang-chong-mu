"use client";

import { useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { UserVote } from "@/types";
import PersonIcon from "@/components/icons/PersonIcon";

interface ConfirmDate {
  date: Date;
  availableCount: number;
  totalActive: number;
}

interface Props {
  candidateDates: ConfirmDate[];
  confirmVotes: { name: string; voted_date: string }[];
  confirmVoterName: string;
  onChangeVoterName: (name: string) => void;
  onSubmitVote: (name: string, dates: string[]) => void;
  onFinalize: (date: Date) => void;
  participants: UserVote[];
}

export default function ConfirmVoteSection({
  candidateDates,
  confirmVotes,
  confirmVoterName,
  onChangeVoterName,
  onSubmitVote,
  onFinalize,
  participants,
}: Props) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isVoting, setIsVoting] = useState(false);

  // 날짜별 투표 수 집계
  const voteCountMap = confirmVotes.reduce(
    (acc, v) => {
      acc[v.voted_date] = (acc[v.voted_date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // 날짜별 투표자 이름
  const voteNamesMap = confirmVotes.reduce(
    (acc, v) => {
      if (!acc[v.voted_date]) acc[v.voted_date] = [];
      acc[v.voted_date].push(v.name);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  const uniqueVoters = [...new Set(confirmVotes.map((v) => v.name))];

  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr],
    );
  };

  const handleStartVoting = () => {
    // 기존 투표가 있으면 불러오기
    const existing = confirmVotes
      .filter((v) => v.name === confirmVoterName)
      .map((v) => v.voted_date);
    setSelectedDates(existing);
    setIsVoting(true);
  };

  const handleSubmit = () => {
    if (!confirmVoterName.trim()) return;
    onSubmitVote(confirmVoterName, selectedDates);
    setIsVoting(false);
    setSelectedDates([]);
  };

  const handleCancel = () => {
    setIsVoting(false);
    setSelectedDates([]);
    onChangeVoterName("");
  };

  const maxVotes = Math.max(0, ...Object.values(voteCountMap));

  return (
    <StContainer>
      <StSectionTitle>어떤 날이 좋으세요?</StSectionTitle>
      <StSubtitle>선호하는 날짜에 투표해주세요</StSubtitle>

      {/* 이름 입력 + 투표 시작 */}
      {!isVoting && (
        <StInputRow>
          <StNameInputBox>
            <StIconBadge>
              <PersonIcon className="w-5 h-5" />
            </StIconBadge>
            <StNameInput
              type="text"
              placeholder="이름 입력"
              value={confirmVoterName}
              onChange={(e) => onChangeVoterName(e.target.value)}
            />
          </StNameInputBox>
          <StVoteStartButton
            onClick={handleStartVoting}
            disabled={!confirmVoterName.trim()}
          >
            투표하기
          </StVoteStartButton>
        </StInputRow>
      )}

      {/* 투표 중 안내 */}
      {isVoting && (
        <StVotingHeader>
          <StVotingName>{confirmVoterName}님, 선호 날짜를 선택하세요!</StVotingName>
          <StVotingActions>
            <StCancelBtn onClick={handleCancel}>취소</StCancelBtn>
            <StSubmitBtn onClick={handleSubmit}>
              {selectedDates.length > 0
                ? `${selectedDates.length}개 선택 완료`
                : "선택 완료"}
            </StSubmitBtn>
          </StVotingActions>
        </StVotingHeader>
      )}

      {/* 날짜 카드 목록 */}
      <StDateCardList>
        {candidateDates.map(({ date, availableCount, totalActive }) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const voteCount = voteCountMap[dateStr] || 0;
          const voters = voteNamesMap[dateStr] || [];
          const isSelected = selectedDates.includes(dateStr);
          const isTop = voteCount > 0 && voteCount === maxVotes;

          return (
            <StDateCard
              key={dateStr}
              $isSelected={isSelected}
              $isVoting={isVoting}
              $isTop={isTop}
              onClick={() => isVoting && toggleDate(dateStr)}
            >
              <StDateCardLeft>
                <StDateDay>
                  {format(date, "M월 d일 (E)", { locale: ko })}
                </StDateDay>
                <StAvailableInfo>
                  {availableCount}/{totalActive}명 참석 가능
                </StAvailableInfo>
              </StDateCardLeft>
              <StDateCardRight>
                {voteCount > 0 && (
                  <StVoteCount $isTop={isTop}>
                    {voteCount}표
                  </StVoteCount>
                )}
                {isVoting && (
                  <StCheckbox $checked={isSelected}>
                    {isSelected ? "✓" : ""}
                  </StCheckbox>
                )}
              </StDateCardRight>
              {voters.length > 0 && !isVoting && (
                <StVoterList>
                  {voters.map((name) => (
                    <StVoterChip key={name}>{name}</StVoterChip>
                  ))}
                </StVoterList>
              )}
            </StDateCard>
          );
        })}
      </StDateCardList>

      {/* 투표 현황 요약 */}
      {uniqueVoters.length > 0 && !isVoting && (
        <StSummary>
          <StSummaryTitle>투표 참여 ({uniqueVoters.length}명)</StSummaryTitle>
          <StVoterChipList>
            {uniqueVoters.map((name) => (
              <StVoterChip key={name}>{name}</StVoterChip>
            ))}
          </StVoterChipList>
        </StSummary>
      )}

      {/* 최종 확정 버튼 영역 */}
      {!isVoting && maxVotes > 0 && (
        <StFinalizeSection>
          <StFinalizeHint>
            가장 인기 있는 날짜로 확정할 수 있어요
          </StFinalizeHint>
          {candidateDates
            .filter(
              ({ date }) =>
                (voteCountMap[format(date, "yyyy-MM-dd")] || 0) === maxVotes,
            )
            .map(({ date }) => (
              <StFinalizeButton
                key={format(date, "yyyy-MM-dd")}
                onClick={() => onFinalize(date)}
              >
                {format(date, "M월 d일 (E)", { locale: ko })}로 확정하기 👑
              </StFinalizeButton>
            ))}
        </StFinalizeSection>
      )}
    </StContainer>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const StContainer = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`;

const StSectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.25rem;
`;

const StSubtitle = styled.p`
  font-size: 0.813rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 600;
  margin-bottom: 1rem;
`;

const StInputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StNameInputBox = styled.div`
  flex: 1;
  height: 44px;
  padding: 0 0.75rem;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background-color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.gray400};
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.2);
  }
`;

const StIconBadge = styled.span`
  width: 30px;
  height: 30px;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StNameInput = styled.input`
  flex: 1;
  background: transparent;
  outline: none;
  border: none;
  font-weight: 700;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray900};

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray300};
  }
`;

const StVoteStartButton = styled.button`
  height: 44px;
  padding: 0 1.25rem;
  border-radius: 9999px;
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 800;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.02);
  }
  &:active {
    transform: scale(0.95);
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }
`;

const StVotingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StVotingName = styled.span`
  font-size: 0.875rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StVotingActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StCancelBtn = styled.button`
  height: 36px;
  padding: 0 0.75rem;
  border-radius: 9999px;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 700;
  font-size: 0.8rem;
  transition: all 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray200};
  }
`;

const StSubmitBtn = styled.button`
  height: 36px;
  padding: 0 1rem;
  border-radius: 9999px;
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  font-size: 0.8rem;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.02);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const StDateCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
`;

const StDateCard = styled.div<{
  $isSelected: boolean;
  $isVoting: boolean;
  $isTop: boolean;
}>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-radius: 1rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 2px solid transparent;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  ${({ $isVoting }) =>
    $isVoting &&
    css`
      cursor: pointer;
      &:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
    `}

  ${({ $isSelected, theme }) =>
    $isSelected &&
    css`
      border-color: ${theme.colors.gray900};
      background-color: ${theme.colors.gray50};
    `}

  ${({ $isTop, $isVoting }) =>
    $isTop &&
    !$isVoting &&
    css`
      box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.4);
    `}
`;

const StDateCardLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const StDateDay = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StAvailableInfo = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StDateCardRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StVoteCount = styled.span<{ $isTop: boolean }>`
  font-size: 0.85rem;
  font-weight: 800;
  color: ${({ $isTop }) => ($isTop ? "#f59e0b" : "#9ca3af")};
`;

const StCheckbox = styled.div<{ $checked: boolean }>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid
    ${({ $checked, theme }) =>
      $checked ? theme.colors.gray900 : theme.colors.gray300};
  background-color: ${({ $checked, theme }) =>
    $checked ? theme.colors.gray900 : "transparent"};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  transition: all 0.15s;
`;

const StVoterList = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
`;

const StVoterChip = styled.span`
  font-size: 0.65rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  background-color: ${({ theme }) => theme.colors.gray100};
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
`;

const StSummary = styled.div`
  padding: 0.75rem 1rem;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 1.25rem;
`;

const StSummaryTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray600};
  margin-bottom: 0.5rem;
`;

const StVoterChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

const StFinalizeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StFinalizeHint = styled.p`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: center;
`;

const StFinalizeButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 800;
  font-size: 1rem;
  border-radius: 1rem;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  &:active {
    transform: scale(0.95);
  }
`;
