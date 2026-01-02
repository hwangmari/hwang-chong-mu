"use client";

import { useParams } from "next/navigation";
import styled from "styled-components";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";
import useGameRoom from "@/hooks/useGameRoom";
import ClickerGame from "../components/ClickerGame";
import LadderGame from "../components/LadderGame";
import TelepathyGame from "../components/TelepathyGame";
import WheelGame from "../components/WheelGame";
import GameSelector from "./GameSelector";
import JoinForm from "./JoinForm";
import ParticipantList from "./ParticipantList";
import RoomHeader from "./RoomHeader";

const GAME_TYPES = [
  { id: "telepathy", name: "텔레파시" },
  { id: "clicker", name: "광클 대전" },
  { id: "wheel", name: "복불복 돌림판" },
  { id: "ladder", name: "사다리 타기" },
];

export default function GameRoomPage() {
  const params = useParams();
  const roomId = params?.id as string;

  // ✨ 로직 훅 사용 (한 줄로 모든 기능 가져옴)
  const logic = useGameRoom(roomId);

  // 1. 게임 진행 중 화면
  if (logic.status === "playing") {
    return (
      <StContainer>
        <StWrapper>
          {logic.selectedGame === "telepathy" && (
            <TelepathyGame
              roomId={roomId}
              isHost={logic.isHost}
              myId={logic.myId}
              participants={logic.participants}
              roomData={logic.roomData}
              onEndGame={() => logic.handleEndGame(true)}
            />
          )}
          {logic.selectedGame === "clicker" && (
            <ClickerGame
              roomId={roomId}
              isHost={logic.isHost}
              myId={logic.myId}
              participants={logic.participants}
              onEndGame={() => logic.handleEndGame(true)}
            />
          )}
          {logic.selectedGame === "wheel" && (
            <WheelGame
              roomId={roomId}
              isHost={logic.isHost}
              participants={logic.participants}
              roomData={logic.roomData}
              onEndGame={() => logic.handleEndGame(true)}
            />
          )}
          {logic.selectedGame === "ladder" && (
            <LadderGame
              roomId={roomId}
              isHost={logic.isHost}
              participants={logic.participants}
              roomData={logic.roomData}
              onEndGame={() => logic.handleEndGame(true)}
            />
          )}
        </StWrapper>
      </StContainer>
    );
  }

  // 2. 대기실 화면
  return (
    <StContainer>
      <StWrapper>
        <RoomHeader title={logic.roomData?.title} />

        <GameSelector
          isHost={logic.isHost}
          selectedGame={logic.selectedGame}
          onSelectGame={logic.handleSelectGame}
        />

        <ParticipantList
          participants={logic.participants}
          myId={logic.myId}
          isHost={logic.isHost}
          guestName={logic.guestName}
          setGuestName={logic.setGuestName}
          onAddGuest={logic.handleAddGuest}
          onKick={logic.handleKickParticipant}
        />

        <JoinForm
          isJoined={logic.isJoined}
          isHost={logic.isHost}
          joinName={logic.joinName}
          setJoinName={logic.setJoinName}
          joinPw={logic.joinPw}
          setJoinPw={logic.setJoinPw}
          joinMsg={logic.joinMsg}
          setJoinMsg={logic.setJoinMsg}
          onJoin={logic.handleJoin}
          onStartGame={logic.handleStartGame}
          loading={logic.loading}
        />

        {/* {logic.status === "countdown" && (
          <StDimOverlay>
            <StCountNumber>
              {logic.count === 0 ? "GO!" : logic.count}
            </StCountNumber>
            <StCountText>
              {GAME_TYPES.find((g) => g.id === logic.selectedGame)?.name} 시작!
            </StCountText>
          </StDimOverlay>
        )} */}
      </StWrapper>
    </StContainer>
  );
}

// 스타일링
const StDimOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;
const StCountNumber = styled.div`
  font-size: 6rem;
  font-weight: 900;
  color: #ffd700;
`;
const StCountText = styled.p`
  font-size: 1.5rem;
  margin-top: 1rem;
  color: #fff;
  font-weight: 600;
`;
