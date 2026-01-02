"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";
import Input from "@/components/common/Input";

// ✨ 게임 컴포넌트 import (경로 확인 필요)
import LadderGame from "../../components/LadderGame";
import WheelGame from "../../components/WheelGame";
// import ClickerGame from "../../components/ClickerGame";
// import TelepathyGame from "../../components/TelepathyGame";

const GAME_INFO: Record<string, string> = {
  ladder: "사다리 타기",
  wheel: "돌림판",
  clicker: "광클 대전",
  telepathy: "텔레파시",
};

export default function QuickGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string;
  const gameName = GAME_INFO[gameId] || "게임";

  // ✨ 상태: status("SETUP") 제거됨.
  // 항상 게임 화면과 멤버 관리 화면이 공존합니다.

  // 참가자 상태 관리
  const [participants, setParticipants] = useState<
    { id: string; nickname: string; is_host: boolean }[]
  >([]);
  const [nameInput, setNameInput] = useState("");

  // 참가자 추가
  const addParticipant = () => {
    if (!nameInput.trim()) return;

    const newPlayer = {
      id: Date.now().toString(),
      nickname: nameInput.trim(),
      is_host: participants.length === 0,
    };

    setParticipants([...participants, newPlayer]);
    setNameInput("");
  };

  // 엔터키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      addParticipant();
    }
  };

  // 참가자 삭제
  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  return (
    <StContainer>
      <StWrapper>
        {/* 헤더 */}
        <StHeader>
          <StBackButton onClick={() => router.back()}>← 나가기</StBackButton>
          <StTitle>{gameName}</StTitle>
        </StHeader>

        {/* ✨ 멤버 관리 패널 (항상 상단에 노출) */}
        <StControlPanel>
          <StInputRow>
            <Input
              placeholder="이름 추가 (엔터)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <StAddBtn onClick={addParticipant}>추가</StAddBtn>
          </StInputRow>

          <StPlayerList>
            {participants.map((p) => (
              <StPlayerChip key={p.id}>
                {p.nickname}
                <button onClick={() => removeParticipant(p.id)}>×</button>
              </StPlayerChip>
            ))}
            {participants.length === 0 && (
              <StEmptyMsg>참가자를 입력하면 게임이 자동 생성됩니다.</StEmptyMsg>
            )}
          </StPlayerList>
        </StControlPanel>
      </StWrapper>
      {/* ✨ 게임 영역 */}

      {participants.length < 2 ? (
        <StWrapper>
          <StWaitingBox>
            <p>최소 2명 이상의 참가자가 필요합니다.</p>
          </StWaitingBox>
        </StWrapper>
      ) : (
        <>
          {/* 사다리 게임: 참가자 데이터가 실시간으로 전달됨 */}
          {gameId === "ladder" && (
            <LadderGame
              participants={participants}
              isHost={true}
              roomId="local"
              onEndGame={() => {}} // 로컬 게임이라 특별한 종료 로직 없음
              roomData={undefined}
            />
          )}
          {/* 돌림판 게임 */}
          {gameId === "wheel" && (
            <WheelGame
              participants={participants}
              isHost={true}
              roomId="local"
              onEndGame={() => {}}
              roomData={undefined}
            />
          )}
        </>
      )}
    </StContainer>
  );
}

// --- ✨ 스타일 컴포넌트 ---

const StHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const StBackButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  padding: 0;
  &:hover {
    color: #333;
  }
`;

const StTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
`;

// 새로 추가된 컨트롤 패널 (입력창 + 리스트)
const StControlPanel = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StInputRow = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
`;

const StAddBtn = styled.button`
  background-color: #333;
  color: white;
  border: none;
  border-radius: 8px;
  width: 70px;
  flex-shrink: 0;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
  &:active {
    transform: scale(0.96);
  }
  &:hover {
    opacity: 0.9;
  }
`;

const StPlayerList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const StPlayerChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #f1f3f5;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;

  button {
    background: #adb5bd;
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 10px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
      background: #ff6b6b;
    }
  }
`;

const StEmptyMsg = styled.span`
  color: #aaa;
  font-size: 0.9rem;
  padding: 5px;
`;

const StWaitingBox = styled.div`
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 12px;
  color: #aaa;
  border: 2px dashed #e9ecef;
`;
