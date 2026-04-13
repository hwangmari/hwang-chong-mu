"use client";

import { Typography } from "@hwangchongmu/ui";
import CalendarGrid from "@/app/meeting/room/detail/CalendarGrid";
import DateControlButtons from "@/app/meeting/room/detail/DateControlButtons";
import NameInput from "@/app/meeting/room/detail/NameInput";
import ParticipantList from "@/app/meeting/room/detail/ParticipantList";
import VoteSubmitButtons from "@/app/meeting/room/detail/VoteSubmitButtons";
import { StFlexBox, StWrapper } from "@/components/styled/layout.styled";
import {
  StGuideButton,
  StGuideRow,
  StGuideTextWrapper,
  StHighlightText,
  StInputRow,
} from "../page.styles";

interface VotingSectionProps {
  isEditing: boolean;
  currentName: string;
  participants: any[];
  calendarGrid: (Date | null)[];
  currentUnavailable: Date[];
  step: string;
  finalDate: Date | null;
  includeWeekend: boolean;
  hoveredUserId: string | number | null;
  setHoveredUserId: (id: string | number | null) => void;
  setCurrentName: (name: string) => void;
  cancelEdit: () => void;
  onResetDates: () => void;
  onSelectAllDates: () => void;
  onToggleDate: (date: Date) => void;
  onSubmitVote: () => void;
  onSubmitAbsent: () => void;
  onEditUser: (userId: string | number) => void;
  onDeleteUser: (userId: string | number) => void;
  onShowGuide: () => void;
}

export default function VotingSection({
  isEditing,
  currentName,
  participants,
  calendarGrid,
  currentUnavailable,
  step,
  finalDate,
  includeWeekend,
  hoveredUserId,
  setHoveredUserId,
  setCurrentName,
  cancelEdit,
  onResetDates,
  onSelectAllDates,
  onToggleDate,
  onSubmitVote,
  onSubmitAbsent,
  onEditUser,
  onDeleteUser,
  onShowGuide,
}: VotingSectionProps) {
  return (
    <>
      <StWrapper>
        <StGuideTextWrapper>
          <StGuideRow>
            <Typography variant="body2" color="gray500" className="fw-700">
              {isEditing ? (
                `${currentName}님의 일정을 수정 중입니다 ✏️`
              ) : currentName ? (
                <>
                  {currentName}님,{" "}
                  <StHighlightText>참석 불가능한 날짜</StHighlightText>를
                  선택해주세요!
                </>
              ) : (
                <>
                  👇 이름을 입력하고{" "}
                  <StHighlightText>참석 불가능한 날짜</StHighlightText>를
                  선택하세요!
                </>
              )}
            </Typography>
            <StGuideButton onClick={onShowGuide} aria-label="가이드">
              ?
            </StGuideButton>
          </StGuideRow>
        </StGuideTextWrapper>
        <StInputRow>
          <NameInput
            currentName={currentName}
            isEditing={isEditing}
            onChangeName={setCurrentName}
            onCancelEdit={cancelEdit}
          />
          <DateControlButtons
            onReset={onResetDates}
            onSelectAll={onSelectAllDates}
          />
        </StInputRow>
      </StWrapper>
      <StFlexBox>
        <div className="flex-lft-box">
          <CalendarGrid
            dates={calendarGrid}
            participants={participants}
            currentUnavailable={currentUnavailable}
            step={step}
            currentName={currentName}
            finalDate={finalDate}
            includeWeekend={includeWeekend}
            onToggleDate={onToggleDate}
            hoveredUserId={hoveredUserId}
          />
          <VoteSubmitButtons
            isEditing={isEditing}
            onSubmitVote={onSubmitVote}
            onSubmitAbsent={onSubmitAbsent}
          />
        </div>
        <div className="flex-rgt-box">
          <ParticipantList
            participants={participants}
            onEdit={onEditUser}
            onDelete={onDeleteUser}
            hoveredUserId={hoveredUserId}
            setHoveredUserId={setHoveredUserId}
          />
        </div>
      </StFlexBox>
    </>
  );
}
