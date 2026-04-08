"use client";

import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { useRoom } from "@/hooks/useRoom";
import RoomHeader from "@/app/meeting/room/detail/RoomHeader";
import CalendarGrid from "@/app/meeting/room/detail/CalendarGrid";
import Modal from "@/components/common/Modal";
import AddToCalendar from "@/components/common/AddToCalendar";
import ShareButton from "@/components/common/KakaoCalendarShare";
import { GuideModal } from "@/components/common/GuideModal";
import { Typography } from "@hwangchongmu/ui";
import { format } from "date-fns";
import ConfirmedResultCard from "../detail/ConfirmedResultCard";
import DateControlButtons from "../detail/DateControlButtons";
import NameInput from "../detail/NameInput";
import VoteSubmitButtons from "../detail/VoteSubmitButtons";
import ParticipantList from "../detail/ParticipantList";
import ConfirmVoteSection from "../detail/ConfirmVoteSection";
import {
  StWrapper,
  StContainer,
  StFlexBox,
} from "@/components/styled/layout.styled";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toSlug, createShortCode } from "@/lib/slug";

export default function RoomDetail() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [showGuide, setShowGuide] = useState(false);
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);
  const [isCreatingDinner, setIsCreatingDinner] = useState(false);

  const [hoveredUserId, setHoveredUserId] = useState<string | number | null>(
    null,
  );
  const [confirmSelectedDates, setConfirmSelectedDates] = useState<string[]>([]);

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
    handleUpdatePeriod,
    handleEditUser,
    handleDeleteUser,
    handleRescueUser,
    handleReset,
    cancelEdit,
    closeModal,
    confirmVotes,
    confirmVoterName,
    setConfirmVoterName,
    submitConfirmVote,
    setStep,
    handleReopenVoting,
  } = useRoom(roomId);

  useEffect(() => {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (room && isUuid.test(roomId) && room.short_code) {
      const slug = room.slug || toSlug(room.name);
      router.replace(`/meeting/room/${slug}-${room.short_code}`);
    }
  }, [room, roomId, router]);

  const handleCreateSettlement = async (memberNames: string[], date: Date) => {
    if (isCreatingSettlement) return;
    if (!room) return;
    if (room.calc_room_id) {
      try {
        const { error: rpcError } = await supabase.rpc(
          "calc_replace_room_data",
          {
            p_room_id: String(room.calc_room_id),
            p_members: Array.from(new Set(memberNames)),
            p_expenses: [],
          },
        );
        if (rpcError) throw rpcError;
        router.push(`/calc/${room.calc_room_id}`);
      } catch (error) {
        console.error("정산 방 업데이트 실패:", error);
        alert("정산 방 업데이트에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
      return;
    }
    if (memberNames.length === 0) {
      alert("정산할 참석자가 없습니다.");
      return;
    }
    setIsCreatingSettlement(true);
    try {
      const roomName = `${room.name} ${format(date, "yyyy-MM-dd")}`;
      const { data: newRoom, error: roomError } = await supabase
        .from("calc_rooms")
        .insert([{ room_name: roomName }])
        .select()
        .single();
      if (roomError) throw roomError;

      const { error: updateError } = await supabase
        .from("rooms")
        .update({ calc_room_id: newRoom.id })
        .eq("id", room.id);
      if (updateError) throw updateError;

      const { error: rpcError } = await supabase.rpc("calc_replace_room_data", {
        p_room_id: String(newRoom.id),
        p_members: Array.from(new Set(memberNames)),
        p_expenses: [],
      });
      if (rpcError) throw rpcError;

      router.push(`/calc/${newRoom.id}`);
    } catch (error) {
      console.error("정산 방 생성 실패:", error);
      alert("정산 방 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCreatingSettlement(false);
    }
  };

  const handleCreateDinnerRoom = async () => {
    if (isCreatingDinner) return;
    if (!room) return;

    // 이미 연결된 dinner room이 있으면 존재 확인 후 이동
    if (room.dinner_room_id) {
      const { data: existing } = await supabase
        .from("dinner_rooms")
        .select("id, slug, short_code")
        .eq("id", room.dinner_room_id)
        .single();
      if (existing) {
        const slug = existing.slug || toSlug(room.name);
        const code = existing.short_code;
        router.push(slug && code ? `/place/${slug}-${code}` : `/place/${room.dinner_room_id}`);
        return;
      }
      // 삭제된 경우 연결 해제 후 새로 생성
      await supabase
        .from("rooms")
        .update({ dinner_room_id: null })
        .eq("id", room.id);
    }

    setIsCreatingDinner(true);
    try {
      const dinnerSlug = toSlug(room.name);
      const dinnerShortCode = createShortCode();
      const { data: newDinnerRoom, error: dinnerError } = await supabase
        .from("dinner_rooms")
        .insert([{
          title: room.name,
          area: "",
          meeting_room_id: room.id,
          slug: dinnerSlug,
          short_code: dinnerShortCode,
        }])
        .select()
        .single();
      if (dinnerError) throw dinnerError;

      const { error: updateError } = await supabase
        .from("rooms")
        .update({ dinner_room_id: newDinnerRoom.id })
        .eq("id", room.id);
      if (updateError) throw updateError;

      router.push(`/place/${dinnerSlug}-${dinnerShortCode}`);
    } catch (error) {
      console.error("장소투표 방 생성 실패:", error);
      alert("장소투표 방 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCreatingDinner(false);
    }
  };

  const possibleDates = useMemo(() => {
    const dates = calendarGrid.filter((d): d is Date => d !== null);
    const activeParticipants = participants.filter((p) => !p.isAbsent);
    const totalActive = activeParticipants.length;

    const items = dates.map((date) => {
      const unavailableCount = activeParticipants.filter((p) =>
        p.unavailableDates.some(
          (ud) => format(ud, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"),
        ),
      ).length;
      const availableCount = Math.max(totalActive - unavailableCount, 0);
      return { date, availableCount, totalActive };
    });

    const sorted = items.sort((a, b) => {
      if (b.availableCount !== a.availableCount) {
        return b.availableCount - a.availableCount;
      }
      return a.date.getTime() - b.date.getTime();
    });
    const maxAvailable = sorted.length > 0 ? sorted[0].availableCount : 0;
    return sorted.filter((item) => item.availableCount === maxAvailable);
  }, [calendarGrid, participants]);

  // CONFIRM 투표용: 과반수 이상 참석 가능한 날짜 후보
  const candidateDates = useMemo(() => {
    const dates = calendarGrid.filter((d): d is Date => d !== null);
    const activeParticipants = participants.filter((p) => !p.isAbsent);
    const totalActive = activeParticipants.length;
    const threshold = Math.ceil(totalActive / 2);

    const items = dates.map((date) => {
      const unavailableCount = activeParticipants.filter((p) =>
        p.unavailableDates.some(
          (ud) => format(ud, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"),
        ),
      ).length;
      const availableCount = Math.max(totalActive - unavailableCount, 0);
      return { date, availableCount, totalActive };
    });

    return items
      .filter((item) => item.availableCount >= threshold)
      .sort((a, b) => {
        if (b.availableCount !== a.availableCount)
          return b.availableCount - a.availableCount;
        return a.date.getTime() - b.date.getTime();
      });
  }, [calendarGrid, participants]);

  if (loading) return <StLoadingContainer>로딩중...🐰</StLoadingContainer>;
  if (!room) return <div className="text-center mt-20">방이 없어요 😢</div>;

  return (
    <StContainer>
      <StWrapper>
        {/* 헤더 및 가이드 버튼 */}
        <RoomHeader
          title={room.name}
          startDate={!finalDate && step === "VOTING" ? room.start_date : undefined}
          endDate={!finalDate && step === "VOTING" ? room.end_date : undefined}
          onFinish={!finalDate && step === "VOTING" ? handleGoToConfirm : undefined}
          onUpdatePeriod={!finalDate && step === "VOTING" ? handleUpdatePeriod : undefined}
        />
      </StWrapper>

      {/* 1️⃣ 투표 화면 (VOTING) */}
      {!finalDate && step === "VOTING" && (
        <>
          <StWrapper>
            <StGuideTextWrapper>
              <StGuideRow>
                <Typography
                  variant="body2"
                  color="gray500"
                  className="fw-700"
                >
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
                <StGuideButton
                  onClick={() => setShowGuide(true)}
                  aria-label="가이드"
                >
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
                onReset={handleResetDates}
                onSelectAll={handleSelectAllDates}
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
                onToggleDate={handleToggleDate}
                hoveredUserId={hoveredUserId}
              />

              <VoteSubmitButtons
                isEditing={isEditing}
                onSubmitVote={handleSubmitVote}
                onSubmitAbsent={handleSubmitAbsent}
              />
            </div>
            <div className="flex-rgt-box">
              <ParticipantList
                participants={participants}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                hoveredUserId={hoveredUserId}
                setHoveredUserId={setHoveredUserId}
              />

            </div>
          </StFlexBox>
        </>
      )}

      {/* 1.5️⃣ 확정 투표 화면 (CONFIRM + 아직 최종 확정 전) */}
      {!finalDate && step === "CONFIRM" && (
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
              {participants.filter((p) => !p.isAbsent).map((p) => {
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
                        // 기존 투표 불러오기
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
                    submitConfirmVote(confirmVoterName, confirmSelectedDates);
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
                    handleToggleDate(date);
                  }
                }}
                hoveredUserId={hoveredUserId}
                confirmVotes={confirmVotes}
                confirmSelectedDates={confirmSelectedDates}
              />
              <StBackToVotingButton onClick={handleReopenVoting}>
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
            onCreateSettlement={handleCreateSettlement}
            isCreatingSettlement={isCreatingSettlement}
            calcRoomId={room.calc_room_id}
            onCreateDinnerRoom={handleCreateDinnerRoom}
            isCreatingDinner={isCreatingDinner}
            dinnerRoomId={room.dinner_room_id}
          />
          <AddToCalendar
            title={room.name}
            finalDate={format(finalDate, "yyyy-MM-dd")}
          />
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

const StLoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.gray50};
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

const StGuideTextWrapper = styled.div`
  margin-bottom: 0.5rem;
  word-break: keep-all;
`;

const StHighlightText = styled.b`
  color: #ef4444;
  text-decoration: underline;
  text-decoration-color: #fecaca;
  text-decoration-thickness: 4px;
`;

const StGuideRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const StGuideButton = styled.button`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const StInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: nowrap;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const StPossibleDates = styled.div`
  margin-bottom: 1.25rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 6px 10px -6px rgba(0, 0, 0, 0.12);
`;

const StPossibleHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
  margin-bottom: 0.75rem;

  span {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.gray500};
    font-weight: 600;
  }
`;

const StPossibleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 240px;
  overflow-y: auto;
`;

const StPossibleItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};

  .date {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray800};
  }

  .count {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.gray600};
    font-weight: 600;
  }
`;

const StEmptyPossible = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StNameChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const StNameChip = styled.button<{ $isActive: boolean; $hasVoted: boolean }>`
  height: 36px;
  padding: 0 0.875rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 800;
  border: 2px solid transparent;
  transition: all 0.2s;

  ${({ $isActive, $hasVoted, theme }) =>
    $isActive
      ? `
        background-color: ${theme.colors.gray900};
        color: ${theme.colors.white};
        border-color: ${theme.colors.gray900};
      `
      : $hasVoted
        ? `
        background-color: ${theme.colors.white};
        color: #f59e0b;
        border-color: #fde68a;
      `
        : `
        background-color: ${theme.colors.white};
        color: ${theme.colors.gray600};
        border-color: ${theme.colors.gray200};
      `}

  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  &:active {
    transform: scale(0.95);
  }
`;

const StConfirmVoteRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const StConfirmGuide = styled.span`
  font-size: 0.813rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StConfirmVoteBtn = styled.button`
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
`;

const StBackToVotingButton = styled.button`
  width: 100%;
  padding: 0.75rem 0;
  margin-top: 1rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
  font-size: 0.813rem;
  text-align: center;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray600};
  }
`;
