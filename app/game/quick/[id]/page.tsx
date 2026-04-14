"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import {
  StContainer,
  StWaitingBox,
  StWrapper,
} from "@/components/styled/layout.styled";
import { Input } from "@hwangchongmu/ui";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LadderGame from "../../components/LadderGame";
import WheelGame from "../../components/WheelGame";
import FooterGuide from "@/components/common/FooterGuide";

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


  const [participants, setParticipants] = useState<
    { id: string; nickname: string; is_host: boolean }[]
  >([]);
  const [nameInput, setNameInput] = useState("");

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      addParticipant();
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  return (
    <StContainer>
      <StWrapper>
        {/* 헤더 */}
        <StHeader>
          <StBackButton
            onClick={() => router.push("/game")}
            aria-label="뒤로 가기"
          >
            <ArrowBackIcon fontSize="medium" />
          </StBackButton>
          <StTitle>함께 할 멤버를 추가해주세요</StTitle>
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
        <StWaitingBox>최소 2명 이상의 참가자가 필요합니다.</StWaitingBox>
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
      <StWrapper>
        <FooterGuide
          title="이용 가이드"
          tips={[
            {
              icon: "⌨️",
              title: "빠른 멤버 추가",
              description:
                "이름을 입력하고 엔터(Enter)를 치면 마우스 클릭 없이 빠르게 추가됩니다.",
            },
            {
              icon: "🎮",
              title: "게임 자동 생성",
              description:
                "최소 2명의 멤버가 등록되면 게임 화면이 아래에 자동으로 나타납니다.",
            },
            {
              icon: "✨",
              title: "손쉬운 명단 수정",
              description:
                "오타가 났나요? 이름표 옆의 (×) 버튼을 누르면 즉시 목록에서 제외됩니다.",
            },
            ...(gameId === "ladder"
              ? [
                  {
                    icon: "📝",
                    title: "결과 직접 수정",
                    description:
                      "멤버 추가는 물론, 사다리 아래쪽의 결과 텍스트를 클릭해 원하는 내용으로 변경할 수 있습니다.",
                  },
                ]
              : []),
          ]}
        />
      </StWrapper>
    </StContainer>
  );
}


const StHeader = styled.div`
  position: relative;
  margin-bottom: 20px;
  margin-bottom: 20px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const StBackButton = styled.button`
  position: absolute;
  top: 0;
  left: 0;
  background: transparent;
  border: none;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%; // 원형 클릭 효과
  color: ${({ theme }) => theme.colors.gray800}; // 기본 아이콘 색상 (필요시 변경)
  transition: all 0.2s ease-in-out; // 부드러운 전환 효과

  &:hover {
    background-color: rgba(0, 0, 0, 0.05); // 호버 시 연한 회색 배경
    transform: translateX(-3px); // 왼쪽으로 살짝 이동하는 애니메이션
    color: ${({ theme }) => theme.colors.black}; // 호버 시 색상 진하게
  }

  &:active {
    transform: scale(0.95) translateX(-3px); // 클릭 시 살짝 눌리는 느낌
  }
`;
const StTitle = styled.h1`
  font-size: 1.3rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StControlPanel = styled.div`
  background: ${({ theme }) => theme.colors.white};
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
  background-color: ${({ theme }) => theme.colors.gray800};
  color: ${({ theme }) => theme.colors.white};
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
  background-color: ${({ theme }) => theme.colors.gray100};
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray800};
  font-weight: 500;

  button {
    background: ${({ theme }) => theme.colors.gray400};
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.white};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;

    &:hover {
      background: ${({ theme }) => theme.colors.rose500};
    }
  }
`;

const StEmptyMsg = styled.span`
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.9rem;
  padding: 5px;
`;
