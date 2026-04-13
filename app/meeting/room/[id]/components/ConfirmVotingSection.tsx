"use client";

import { Typography } from "@hwangchongmu/ui";
import { format } from "date-fns";
import CalendarGrid from "@/app/meeting/room/detail/CalendarGrid";
import ParticipantList from "@/app/meeting/room/detail/ParticipantList";
import { StFlexBox, StWrapper } from "@/components/styled/layout.styled";
import {
  StBackToVotingButton,
  StConfirmGuide,
  StConfirmVoteBtn,
  StConfirmVoteRow,
  StGuideRow,
  StGuideTextWrapper,
  StNameChip,
  StNameChipList,
} from "../page.styles";

interface ConfirmVote {
  name: string;
  voted_date: string;
}

interface ConfirmVotingSectionProps {
  participants: any[];
  calendarGrid: (Date | null)[];
  currentUnavailable: Date[];
  step: string;
  finalDate: Date | null;
  includeWeekend: boolean;
  hoveredUserId: string | number | null;
  setHoveredUserId: (id: string | number | null) => void;
  confirmVotes: ConfirmVote[];
  confirmVoterName: string;
  setConfirmVoterName: (name: string) => void;
  confirmSelectedDates: string[];
  setConfirmSelectedDates: (
    dates: string[] | ((prev: string[]) => string[]),
  ) => void;
  onToggleDate: (date: Date) => void;
  onSubmitConfirmVote: (name: string, dates: string[]) => void;
  onReopenVoting: () => void;
}

export default function ConfirmVotingSection({
  participants,
  calendarGrid,
  currentUnavailable,
  step,
  finalDate,
  includeWeekend,
  hoveredUserId,
  setHoveredUserId,
  confirmVotes,
  confirmVoterName,
  setConfirmVoterName,
  confirmSelectedDates,
  setConfirmSelectedDates,
  onToggleDate,
  onSubmitConfirmVote,
  onReopenVoting,
}: ConfirmVotingSectionProps) {
  return (
    <>
      <StWrapper>
        <StGuideTextWrapper>
          <StGuideRow>
            <Typography variant="h2" color="gray900" className="fw-900">
              👑 선호하는 날짜에 투표해주세요!
            </Typography>
          </StGuideRow>
        </StGuideTextWrapper>
        <StNameChipList>
          {participants
            .filter((p) => !p.isAbsent)
            .map((p) => {
              const isActive = confirmVoterName === p.name;
              const hasVoted = confirmVotes.some((v) => v.name === p.name);
              return (
                <StNameChip
                  key={p.id}
                  $isActive={isActive}
                  $hasVoted={hasVoted}
                  onClick={() => {
                    if (isActive) {
                      setConfirmVoterName("");
                      setConfirmSelectedDates([]);
                    } else {
                      setConfirmVoterName(p.name);
                      const existing = confirmVotes
                        .filter((v) => v.name === p.name)
                        .map((v) => v.voted_date);
                      setConfirmSelectedDates(existing);
                    }
                  }}
                >
                  {p.name}
                  {hasVoted && !isActive && " ✓"}
                </StNameChip>
              );
            })}
        </StNameChipList>
        {confirmVoterName && (
          <StConfirmVoteRow>
            <StConfirmGuide>
              {confirmVoterName}님, 선호 날짜를 선택하세요!
            </StConfirmGuide>
            <StConfirmVoteBtn
              onClick={() => {
                onSubmitConfirmVote(confirmVoterName, confirmSelectedDates);
                setConfirmSelectedDates([]);
              }}
            >
              {confirmSelectedDates.length > 0
                ? `${confirmSelectedDates.length}개 투표 저장 💾`
                : "투표 저장 💾"}
            </StConfirmVoteBtn>
          </StConfirmVoteRow>
        )}
      </StWrapper>
      <StFlexBox>
        <div className="flex-lft-box">
          <CalendarGrid
            dates={calendarGrid}
            participants={participants}
            currentUnavailable={currentUnavailable}
            step={step}
            currentName={confirmVoterName}
            finalDate={finalDate}
            includeWeekend={includeWeekend}
            onToggleDate={(date) => {
              if (confirmVoterName.trim()) {
                const dateStr = format(date, "yyyy-MM-dd");
                setConfirmSelectedDates((prev) =>
                  prev.includes(dateStr)
                    ? prev.filter((d) => d !== dateStr)
                    : [...prev, dateStr],
                );
              } else {
                onToggleDate(date);
              }
            }}
            hoveredUserId={hoveredUserId}
            confirmVotes={confirmVotes}
            confirmSelectedDates={confirmSelectedDates}
          />
          <StBackToVotingButton onClick={onReopenVoting}>
            ← 투표 화면으로 돌아가기
          </StBackToVotingButton>
        </div>
        <div className="flex-rgt-box">
          <ParticipantList
            participants={participants}
            hoveredUserId={hoveredUserId}
            setHoveredUserId={setHoveredUserId}
          />
        </div>
      </StFlexBox>
    </>
  );
}
