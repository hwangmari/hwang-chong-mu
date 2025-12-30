"use client";

import { useParams } from "next/navigation";
import styled from "styled-components";
import { useRoom } from "@/hooks/useRoom";
import RoomHeader from "@/app/meeting/room/detail/RoomHeader";
import CalendarGrid from "@/app/meeting/room/detail/CalendarGrid";
import Modal from "@/components/common/Modal";
import AddToCalendar from "@/components/common/AddToCalendar";
import ShareButton from "@/components/common/KakaoCalendarShare";
import { GuideModal } from "@/components/common/GuideModal";
import Typography from "@/components/common/Typography";
import { format } from "date-fns";
import ConfirmedResultCard from "../detail/ConfirmedResultCard";
import DateControlButtons from "../detail/DateControlButtons";
import FloatingFinishButton from "../detail/FloatingFinishButton";
import NameInput from "../detail/NameInput";
import VoteSubmitButtons from "../detail/VoteSubmitButtons";
import ParticipantList from "../detail/ParticipantList";
import { StWrapper, StContainer } from "@/components/styled/layout.styled";
import { useState } from "react";

export default function RoomDetail() {
  const params = useParams();
  const roomId = params.id as string;
  const [showGuide, setShowGuide] = useState(false);

  // ✨ 수정됨: Hook은 반드시 조건부 return 이전에 선언되어야 합니다.
  const [hoveredUserId, setHoveredUserId] = useState<string | number | null>(
    null
  );

  const {
    loading,
    room,
    step,
    includeWeekend,
    participants,
    currentName,
    currentUnavailable,
    finalDate,
    modal,
    calendarGrid,
    isEditing,
    setCurrentName,
    handleToggleDate,
    handleSubmitVote,
    handleSubmitAbsent,
    handleResetDates,
    handleSelectAllDates,
    handleGoToConfirm,
    handleEditUser,
    handleDeleteUser,
    handleRescueUser,
    handleReset,
    cancelEdit,
    closeModal,
  } = useRoom(roomId);

  // ⚠️ Early Return (로딩 및 에러 처리)은 Hook 선언 이후에 위치해야 합니다.
  if (loading) return <StLoadingContainer>로딩중...🐰</StLoadingContainer>;
  if (!room) return <div className="text-center mt-20">방이 없어요 😢</div>;

  return (
    <StContainer>
      <StWrapper>
        {/* 헤더 및 가이드 버튼 */}
        <StHeaderWrapper>
          <RoomHeader title={room.name} />
          <StGuideButton onClick={() => setShowGuide(true)} aria-label="가이드">
            ?
          </StGuideButton>
        </StHeaderWrapper>
      </StWrapper>

      {/* 1️⃣ 투표 화면 (VOTING) */}
      {!finalDate && (
        <>
          <StWrapper>
            <StGuideTextWrapper>
              <Typography
                variant={step === "VOTING" ? "body2" : "h2"}
                color={step === "VOTING" ? "gray500" : "gray900"}
                className={step === "VOTING" ? "fw-700" : "fw-900"}
              >
                {step === "VOTING" ? (
                  isEditing ? (
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
                  )
                ) : (
                  "👑 최종 약속 날짜를 선택해주세요!"
                )}
              </Typography>
            </StGuideTextWrapper>

            {step === "VOTING" && (
              <>
                <NameInput
                  currentName={currentName}
                  isEditing={isEditing}
                  onChangeName={setCurrentName}
                  onCancelEdit={cancelEdit}
                />
                <DateControlButtons
                  onReset={handleResetDates}
                  onSelectAll={handleSelectAllDates}
                />
              </>
            )}
          </StWrapper>
          <StBox>
            <div className="lft">
              <CalendarGrid
                dates={calendarGrid}
                participants={participants}
                currentUnavailable={currentUnavailable}
                step={step}
                currentName={currentName}
                finalDate={finalDate}
                includeWeekend={includeWeekend}
                onToggleDate={handleToggleDate}
                hoveredUserId={hoveredUserId}
              />

              {step === "VOTING" && (
                <VoteSubmitButtons
                  isEditing={isEditing}
                  onSubmitVote={handleSubmitVote}
                  onSubmitAbsent={handleSubmitAbsent}
                />
              )}
            </div>
            <div className="rgt">
              <ParticipantList
                participants={participants}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                hoveredUserId={hoveredUserId}
                setHoveredUserId={setHoveredUserId}
              />
              {step === "VOTING" && (
                <FloatingFinishButton onFinish={handleGoToConfirm} />
              )}
            </div>
          </StBox>
        </>
      )}

      {/* 2️⃣ 확정 화면 (CONFIRM) */}
      {finalDate && (
        <StWrapper>
          <ConfirmedResultCard
            roomName={room.name}
            finalDate={finalDate}
            participants={participants}
            onReset={handleReset}
            onRescueUser={handleRescueUser}
          />
          <AddToCalendar
            title={room.name}
            finalDate={format(finalDate, "yyyy-MM-dd")}
          />
          <ShareButton />
        </StWrapper>
      )}

      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
      <Modal
        modal={modal}
        onClose={closeModal}
        onConfirm={() => {
          if (modal.onConfirm) modal.onConfirm();
          closeModal();
        }}
      />
    </StContainer>
  );
}

const StBox = styled.div`
  max-width: 540px;
  margin: 0 auto;
  @media ${({ theme }) => theme.media.desktop} {
    display: flex;
    max-width: 1024px;
    gap: 20px;
    & > div {
      flex: 1;
    }
    .rgt {
      padding-top: 20px;
    }
  }
`;
// ✨ 페이지 전용 스타일
const StLoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

const StHeaderWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 0.5rem;
`;

const StGuideButton = styled.button`
  position: absolute;
  top: 0;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 9999px;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  z-index: 10;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
    transform: scale(1.1);
  }
`;

const StGuideTextWrapper = styled.div`
  margin-bottom: 0.5rem;
  text-align: center;
  padding: 0 1rem;
  word-break: keep-all;
`;

const StHighlightText = styled.b`
  color: #ef4444;
  text-decoration: underline;
  text-decoration-color: #fecaca;
  text-decoration-thickness: 4px;
`;
