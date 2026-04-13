"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import RoomHeader from "@/app/meeting/room/detail/RoomHeader";
import Modal from "@/components/common/Modal";
import { GuideModal } from "@/components/common/GuideModal";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";
import { toSlug } from "@/lib/slug";
import ConfirmVotingSection from "./components/ConfirmVotingSection";
import FinalConfirmedSection from "./components/FinalConfirmedSection";
import VotingSection from "./components/VotingSection";
import { StLoadingContainer } from "./page.styles";
import { useRoomActions } from "./useRoomActions";

export default function RoomDetail() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const [showGuide, setShowGuide] = useState(false);
  const [hoveredUserId, setHoveredUserId] = useState<string | number | null>(
    null,
  );
  const [confirmSelectedDates, setConfirmSelectedDates] = useState<string[]>(
    [],
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
    handleReopenVoting,
  } = useRoom(roomId);

  const {
    isCreatingSettlement,
    isCreatingDinner,
    handleCreateSettlement,
    handleCreateDinnerRoom,
  } = useRoomActions(room);

  useEffect(() => {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (room && isUuid.test(roomId) && room.short_code) {
      const slug = room.slug || toSlug(room.name);
      router.replace(`/meeting/room/${slug}-${room.short_code}`);
    }
  }, [room, roomId, router]);

  if (loading) return <StLoadingContainer>로딩중...🐰</StLoadingContainer>;
  if (!room) return <div className="text-center mt-20">방이 없어요 😢</div>;

  return (
    <StContainer>
      <StWrapper>
        <RoomHeader
          title={room.name}
          startDate={
            !finalDate && step === "VOTING" ? room.start_date : undefined
          }
          endDate={!finalDate && step === "VOTING" ? room.end_date : undefined}
          onFinish={
            !finalDate && step === "VOTING" ? handleGoToConfirm : undefined
          }
          onUpdatePeriod={
            !finalDate && step === "VOTING" ? handleUpdatePeriod : undefined
          }
        />
      </StWrapper>

      {!finalDate && step === "VOTING" && (
        <VotingSection
          isEditing={isEditing}
          currentName={currentName}
          participants={participants}
          calendarGrid={calendarGrid}
          currentUnavailable={currentUnavailable}
          step={step}
          finalDate={finalDate}
          includeWeekend={includeWeekend}
          hoveredUserId={hoveredUserId}
          setHoveredUserId={setHoveredUserId}
          setCurrentName={setCurrentName}
          cancelEdit={cancelEdit}
          onResetDates={handleResetDates}
          onSelectAllDates={handleSelectAllDates}
          onToggleDate={handleToggleDate}
          onSubmitVote={handleSubmitVote}
          onSubmitAbsent={handleSubmitAbsent}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onShowGuide={() => setShowGuide(true)}
        />
      )}

      {!finalDate && step === "CONFIRM" && (
        <ConfirmVotingSection
          participants={participants}
          calendarGrid={calendarGrid}
          currentUnavailable={currentUnavailable}
          step={step}
          finalDate={finalDate}
          includeWeekend={includeWeekend}
          hoveredUserId={hoveredUserId}
          setHoveredUserId={setHoveredUserId}
          confirmVotes={confirmVotes}
          confirmVoterName={confirmVoterName}
          setConfirmVoterName={setConfirmVoterName}
          confirmSelectedDates={confirmSelectedDates}
          setConfirmSelectedDates={setConfirmSelectedDates}
          onToggleDate={handleToggleDate}
          onSubmitConfirmVote={submitConfirmVote}
          onReopenVoting={handleReopenVoting}
        />
      )}

      {finalDate && (
        <FinalConfirmedSection
          roomName={room.name}
          finalDate={finalDate}
          participants={participants}
          calcRoomId={room.calc_room_id}
          dinnerRoomId={room.dinner_room_id}
          isCreatingSettlement={isCreatingSettlement}
          isCreatingDinner={isCreatingDinner}
          onReset={handleReset}
          onRescueUser={handleRescueUser}
          onCreateSettlement={handleCreateSettlement}
          onCreateDinnerRoom={handleCreateDinnerRoom}
        />
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
