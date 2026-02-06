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
import Typography from "@/components/common/Typography";
import { format } from "date-fns";
import ConfirmedResultCard from "../detail/ConfirmedResultCard";
import DateControlButtons from "../detail/DateControlButtons";
import FloatingFinishButton from "../detail/FloatingFinishButton";
import NameInput from "../detail/NameInput";
import VoteSubmitButtons from "../detail/VoteSubmitButtons";
import ParticipantList from "../detail/ParticipantList";
import {
  StWrapper,
  StContainer,
  StFlexBox,
} from "@/components/styled/layout.styled";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toSlug } from "@/lib/slug";

export default function RoomDetail() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [showGuide, setShowGuide] = useState(false);
  const [isCreatingSettlement, setIsCreatingSettlement] = useState(false);

  const [hoveredUserId, setHoveredUserId] = useState<string | number | null>(
    null,
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

  useEffect(() => {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (room && isUuid.test(roomId) && room.short_code) {
      const slug = room.slug || toSlug(room.name);
      router.replace(`/meeting/room/${slug}-${room.short_code}`);
    }
  }, [room, roomId, router]);

  const handleCreateSettlement = async (
    memberNames: string[],
    date: Date,
  ) => {
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

      const { error: rpcError } = await supabase.rpc(
        "calc_replace_room_data",
        {
          p_room_id: String(newRoom.id),
          p_members: Array.from(new Set(memberNames)),
          p_expenses: [],
        },
      );
      if (rpcError) throw rpcError;

      router.push(`/calc/${newRoom.id}`);
    } catch (error) {
      console.error("정산 방 생성 실패:", error);
      alert("정산 방 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCreatingSettlement(false);
    }
  };

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

              {step === "VOTING" && (
                <VoteSubmitButtons
                  isEditing={isEditing}
                  onSubmitVote={handleSubmitVote}
                  onSubmitAbsent={handleSubmitAbsent}
                />
              )}
            </div>
            <div className="flex-rgt-box">
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
