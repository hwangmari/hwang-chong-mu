"use client";

// ✅ useState 필수!
import { useState } from "react";
import { useParams } from "next/navigation";
import styled, { keyframes, css } from "styled-components";
import { useRoom } from "@/hooks/useRoom";
import RoomHeader from "@/components/room/RoomHeader";
import CalendarGrid from "@/components/room/CalendarGrid";
import Modal from "@/components/common/Modal";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import PersonIcon from "@/components/icons/PersonIcon";
import PeopleIcon from "@/components/icons/PeopleIcon";
import AddToCalendar from "@/components/common/AddToCalendar";
import ShareButton from "@/components/common/KakaoCalendarShare";
import { GuideModal } from "@/components/common/GuideModal";
import AdBanner from "@/components/common/AdBanner";
import Typography from "@/components/common/Typography";

// --- [메인 페이지] ---
export default function RoomDetail() {
  const params = useParams();
  const roomId = params.id as string;

  // 가이드 모달 상태
  const [showGuide, setShowGuide] = useState(false);

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

  if (loading) return <StLoadingContainer>로딩중...🐰</StLoadingContainer>;

  if (!room) return <div className="text-center mt-20">방이 없어요 😢</div>;

  const getUnavailablePeople = (d: Date) =>
    participants.filter(
      (p) => !p.isAbsent && p.unavailableDates.some((ud) => isSameDay(ud, d))
    );

  const getAvailablePeople = (d: Date) =>
    participants.filter(
      (p) => !p.isAbsent && !p.unavailableDates.some((ud) => isSameDay(ud, d))
    );

  const getAbsentPeople = () => participants.filter((p) => p.isAbsent);

  return (
    <StPageContainer>
      <StMainWrapper>
        {/* 헤더 및 가이드 버튼 */}
        <StHeaderWrapper>
          <RoomHeader title={room.name} />
          <StGuideButton
            onClick={() => setShowGuide(true)}
            aria-label="이용 가이드 보기"
          >
            ?
          </StGuideButton>
        </StHeaderWrapper>

        {!finalDate && (
          <>
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
              <StInputWrapper className="animate-fade-in">
                <StNameInputBox $isEditing={isEditing}>
                  <StIconBadge>
                    <PersonIcon className="w-5 h-5" />
                  </StIconBadge>
                  <StNameInput
                    type="text"
                    placeholder="이름 입력"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    readOnly={isEditing}
                    disabled={isEditing}
                  />
                  {(isEditing || currentName.length > 0) && (
                    <StResetButton onClick={cancelEdit}>✕</StResetButton>
                  )}
                </StNameInputBox>
              </StInputWrapper>
            )}

            {step === "VOTING" && (
              <StActionButtonsWrapper className="animate-fade-in">
                <StActionButton $variant="blue" onClick={handleResetDates}>
                  <span className="emoji">🙆‍♂️</span> 다 돼요 (초기화)
                </StActionButton>
                <StActionButton $variant="red" onClick={handleSelectAllDates}>
                  <span className="emoji">🙅‍♂️</span> 다 안돼요 (전체선택)
                </StActionButton>
              </StActionButtonsWrapper>
            )}

            <CalendarGrid
              dates={calendarGrid}
              participants={participants}
              currentUnavailable={currentUnavailable}
              step={step}
              currentName={currentName}
              finalDate={finalDate}
              includeWeekend={includeWeekend}
              onToggleDate={handleToggleDate}
            />

            {step === "VOTING" && (
              <StSubmitSection className="animate-fade-in">
                <StSubmitButton onClick={handleSubmitVote}>
                  <span>{isEditing ? "수정 완료" : "일정 저장하기"}</span>
                  <span className="text-xl">💾</span>
                </StSubmitButton>

                <StAbsentButton onClick={handleSubmitAbsent}>
                  혹시 이번 모임은 어려우신가요?
                  <span className="underline">불참 알리기 🥲</span>
                </StAbsentButton>
              </StSubmitSection>
            )}

            <StParticipantSection>
              <StSectionTitle>
                <PeopleIcon className="w-5 h-5 mr-1" /> 참여 현황 (
                {participants.length}명)
              </StSectionTitle>

              {participants.length === 0 ? (
                <StEmptyState>등록된 일정 없음</StEmptyState>
              ) : (
                participants.map((user, idx) => (
                  <StUserCard
                    key={idx}
                    $isAbsent={user.isAbsent}
                    onClick={() => handleEditUser(user)}
                    className="group"
                  >
                    <StUserInfo>
                      <StAvatar $isAbsent={user.isAbsent}>
                        {user.name.slice(0, 1)}
                      </StAvatar>
                      <StUserName $isAbsent={user.isAbsent}>
                        {user.name}
                      </StUserName>
                    </StUserInfo>

                    <div className="flex items-center gap-2">
                      <StEditLabel className="edit-label">수정</StEditLabel>

                      {user.isAbsent ? (
                        <StStatusBadge $status="absent">불참 🥲</StStatusBadge>
                      ) : (
                        <StStatusBadge $status="unavailable">
                          {user.unavailableDates.length}일 불가
                        </StStatusBadge>
                      )}
                    </div>

                    <StDeleteButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user);
                      }}
                      className="delete-btn"
                    >
                      ✕
                    </StDeleteButton>
                  </StUserCard>
                ))
              )}
            </StParticipantSection>

            {/* 투표 마감 플로팅 버튼 */}
            {step === "VOTING" && (
              <StFloatingContainer>
                <StFloatingGradient />
                <StFinishButton onClick={handleGoToConfirm} className="group">
                  <span>투표 마감하기</span>
                  <span className="icon">🐰</span>
                </StFinishButton>
              </StFloatingContainer>
            )}
          </>
        )}

        {/* 2. 🔥 확정 화면 */}
        {finalDate && (
          <>
            <StResultCard className="animate-fade-in-up">
              <div className="text-4xl mb-4">🎉</div>
              <Typography variant="h2" as="h2" className="fw-900 mb-1">
                약속 날짜 확정!
              </Typography>

              <StDateBox>
                <Typography
                  variant="caption"
                  color="gray500"
                  className="fw-700 mb-1"
                >
                  {room.name}
                </Typography>
                <Typography variant="h1" as="div" className="fw-900">
                  {format(finalDate, "M월 d일 (E)", { locale: ko })}
                </Typography>
              </StDateBox>

              {/* 결과 명단 리스트 */}
              <StResultGrid>
                {/* 1. 참석 가능자 */}
                <StResultColumn $type="available">
                  <Typography
                    variant="caption"
                    color="gray400"
                    className="fw-700 mb-2"
                  >
                    참석 가능 🙆‍♂️
                  </Typography>
                  <div className="flex flex-wrap gap-1">
                    {getAvailablePeople(finalDate).length > 0 ? (
                      getAvailablePeople(finalDate).map((p, i) => (
                        <StNameTag key={i}>{p.name}</StNameTag>
                      ))
                    ) : (
                      <span className="text-gray-300 text-xs">없음</span>
                    )}
                  </div>
                </StResultColumn>

                {/* 2. 불가능자 */}
                <StResultColumn $type="unavailable">
                  <Typography
                    variant="caption"
                    className="text-red-400 fw-700 mb-2"
                  >
                    불가능 / 불참 🙅‍♂️
                  </Typography>
                  <div className="flex flex-wrap gap-1">
                    {[...getUnavailablePeople(finalDate), ...getAbsentPeople()]
                      .length > 0 ? (
                      [
                        ...getUnavailablePeople(finalDate),
                        ...getAbsentPeople(),
                      ].map((p, i) => (
                        <StRescueButton
                          key={i}
                          onClick={() => handleRescueUser(p)}
                          $isAbsent={p.isAbsent}
                        >
                          {p.name} ✎
                        </StRescueButton>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">전원 참석!</span>
                    )}
                  </div>
                </StResultColumn>
              </StResultGrid>

              <StRetryButton onClick={handleReset}>
                일정 다시 조정하기
              </StRetryButton>
            </StResultCard>

            <AddToCalendar
              title={room.name}
              finalDate={format(finalDate, "yyyy-MM-dd")}
            />
            <ShareButton />
          </>
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

        <AdBanner />
      </StMainWrapper>
    </StPageContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스)

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StLoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

const StPageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray50}; /* #F3F4F6 */
  display: flex;
  justify-content: center;
  overflow-x: hidden;
`;

const StMainWrapper = styled.main`
  width: 100%;
  min-width: 320px;
  max-width: 540px;
  background-color: ${({ theme }) => theme.colors.gray50};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem 10rem 1rem; /* py-8 px-4 pb-40 */
  font-family: ui-sans-serif, system-ui, sans-serif;
  color: ${({ theme }) => theme.colors.gray900};
  position: relative;
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
  color: #ef4444; /* red-500 */
  text-decoration: underline;
  text-decoration-color: #fecaca; /* red-200 */
  text-decoration-thickness: 4px;
`;

// === Input Section ===

const StInputWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  position: relative;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StNameInputBox = styled.div<{ $isEditing: boolean }>`
  flex: 1;
  padding: 0.5rem;
  border-radius: 1.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: background-color 0.2s;

  ${({ $isEditing, theme }) =>
    $isEditing
      ? css`
          background-color: ${theme.colors.gray100};
          border-color: ${theme.colors.gray300};
        `
      : css`
          background-color: ${theme.colors.white};
          border-color: ${theme.colors.gray200};
        `}
`;

const StIconBadge = styled.span`
  padding: 0.5rem;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StNameInput = styled.input`
  flex: 1;
  background-color: transparent;
  outline: none;
  border: none;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  min-width: 0;
  font-size: 0.875rem;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray300};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.gray500};
  }

  @media ${({ theme }) => theme.media.desktop} {
    font-size: 1rem;
  }
`;

const StResetButton = styled.button`
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
  padding: 0 0.5rem;

  &:hover {
    color: ${({ theme }) => theme.colors.gray600};
  }
`;

// === Action Buttons ===

const StActionButtonsWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StActionButton = styled.button<{ $variant: "blue" | "red" }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 1rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:active {
    transform: scale(0.95);
  }

  .emoji {
    font-size: 1.125rem;
  }

  ${({ $variant, theme }) =>
    $variant === "blue"
      ? css`
          border-color: ${theme.colors.blue100};
          color: ${theme.colors.blue600};
          &:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            background-color: ${theme.colors.blue50};
          }
        `
      : css`
          border-color: #fee2e2; /* red-100 */
          color: #ff6b6b;
          &:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            background-color: #fef2f2; /* red-50 */
          }
        `}
`;

// === Submit Section ===

const StSubmitSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StSubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #656565;
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StAbsentButton = styled.button`
  width: 100%;
  padding: 0.75rem 0;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 500;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray600};
  }

  .underline {
    text-decoration: underline;
    text-decoration-color: ${({ theme }) => theme.colors.gray300};
    text-underline-offset: 4px;
  }
`;

// === Participant Section ===

const StParticipantSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
`;

const StSectionTitle = styled.h3`
  display: flex;
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 700;
  font-size: 0.875rem;
  align-items: center;
`;

const StEmptyState = styled.div`
  text-align: center;
  padding: 1.5rem;
  color: ${({ theme }) => theme.colors.gray400};
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 1rem;
  font-size: 0.875rem;
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
`;

const StUserCard = styled.div<{ $isAbsent: boolean }>`
  position: relative;
  background-color: ${({ theme }) => theme.colors.white};
  padding: 0.75rem;
  padding-right: 2rem;
  border-radius: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  ${({ $isAbsent, theme }) =>
    $isAbsent
      ? css`
          border-color: ${theme.colors.gray100};
          opacity: 0.6;
        `
      : css`
          border-color: ${theme.colors.gray100};
          &:hover {
            border-color: ${theme.colors.gray400};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
        `}

  /* Group Hover 효과를 위해 자식 요소에서 .edit-label 등을 참조 */
  &:hover .edit-label,
  &:hover .delete-btn {
    opacity: 1;
  }
`;

const StUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  flex: 1;
`;

const StAvatar = styled.div<{ $isAbsent: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;

  ${({ $isAbsent, theme }) =>
    $isAbsent
      ? css`
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray400};
        `
      : css`
          background-color: ${theme.colors.blue50};
          color: ${theme.colors.blue600};
        `}
`;

const StUserName = styled.span<{ $isAbsent: boolean }>`
  font-weight: 700;
  font-size: 0.875rem;
  ${({ $isAbsent, theme }) =>
    $isAbsent
      ? css`
          color: ${theme.colors.gray400};
          text-decoration: line-through;
        `
      : css`
          color: ${theme.colors.gray700};
        `}
`;

const StEditLabel = styled.button`
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1; /* indigo-500 */
  opacity: 0;
  transition: opacity 0.2s;
  padding: 0 0.5rem;
`;

const StStatusBadge = styled.span<{ $status: "absent" | "unavailable" }>`
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;

  ${({ $status, theme }) =>
    $status === "absent"
      ? css`
          color: ${theme.colors.gray400};
          background-color: ${theme.colors.gray50};
          border: 1px solid ${theme.colors.gray100};
        `
      : css`
          color: ${theme.colors.gray500};
          background-color: ${theme.colors.gray100};
        `}
`;

const StDeleteButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: ${({ theme }) => theme.colors.gray300};
  opacity: 0;
  transition: all 0.2s;
  padding: 0.25rem;

  &:hover {
    color: #ef4444; /* red-500 */
  }
`;

// === Floating Button ===

const StFloatingContainer = styled.div`
  position: fixed;
  bottom: 1.25rem;
  padding: 0 1.5rem;
  display: flex;
  justify-content: center;
  pointer-events: none;
  width: 100%;
  max-width: 540px; /* 메인 컨테이너와 동일하게 제한 */
`;

const StFloatingGradient = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 5rem;
  background: linear-gradient(to top, #f3f4f6, #f3f4f6, transparent);
  z-index: -1;
`;

const StFinishButton = styled.button`
  pointer-events: auto;
  width: 100%;
  max-width: 500px;
  padding: 1rem 1.5rem;
  background-color: #454545;
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  font-size: 1.125rem;
  border-radius: 9999px;
  box-shadow: 0 20px 25px -5px rgba(209, 213, 219, 0.5); /* shadow-gray-300/50 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.black};
    transform: scale(1.02);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  &:active {
    transform: scale(0.95);
  }

  .icon {
    transition: transform 0.2s;
  }

  &:hover .icon {
    transform: translateY(-4px);
  }
`;

// === Result Card (확정 화면) ===

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

const StDateBox = styled.div`
  background-color: ${({ theme }) => theme.colors.gray50};
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
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
          color: #f87171; /* red-400 */
          border-color: #fee2e2; /* red-100 */
          &:hover {
            background-color: #fef2f2;
          }
        `}
`;

const StRetryButton = styled.button`
  color: ${({ theme }) => theme.colors.gray400};
  text-decoration: underline;
  font-size: 0.875rem;

  &:hover {
    color: ${({ theme }) => theme.colors.gray600};
  }
`;
