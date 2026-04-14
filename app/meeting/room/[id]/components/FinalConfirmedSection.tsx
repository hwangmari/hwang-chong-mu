"use client";

import { format } from "date-fns";
import type { UserVote } from "@/types";
import AddToCalendar from "@/components/common/AddToCalendar";
import ConfirmedResultCard from "@/app/meeting/room/detail/ConfirmedResultCard";
import { StWrapper } from "@/components/styled/layout.styled";

interface FinalConfirmedSectionProps {
  roomName: string;
  finalDate: Date;
  participants: any[];
  calcRoomId?: string | null;
  dinnerRoomId?: string | null;
  isCreatingSettlement: boolean;
  isCreatingDinner: boolean;
  onReset: () => void;
  onRescueUser: (user: UserVote) => void;
  onCreateSettlement: (memberNames: string[], date: Date) => void;
  onCreateDinnerRoom: () => void;
}

export default function FinalConfirmedSection({
  roomName,
  finalDate,
  participants,
  calcRoomId,
  dinnerRoomId,
  isCreatingSettlement,
  isCreatingDinner,
  onReset,
  onRescueUser,
  onCreateSettlement,
  onCreateDinnerRoom,
}: FinalConfirmedSectionProps) {
  return (
    <StWrapper>
      <ConfirmedResultCard
        roomName={roomName}
        finalDate={finalDate}
        participants={participants}
        onReset={onReset}
        onRescueUser={onRescueUser}
        onCreateSettlement={onCreateSettlement}
        isCreatingSettlement={isCreatingSettlement}
        calcRoomId={calcRoomId}
        onCreateDinnerRoom={onCreateDinnerRoom}
        isCreatingDinner={isCreatingDinner}
        dinnerRoomId={dinnerRoomId}
      />
      <AddToCalendar
        title={roomName}
        finalDate={format(finalDate, "yyyy-MM-dd")}
      />
    </StWrapper>
  );
}
