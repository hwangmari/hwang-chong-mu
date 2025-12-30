"use client";
import styled from "styled-components";
import CreateButton from "@/components/common/CreateButton";
import Input from "@/components/common/Input";

interface Props {
  isJoined: boolean;
  isHost: boolean;
  joinName: string;
  setJoinName: (v: string) => void;
  joinPw: string;
  setJoinPw: (v: string) => void;
  joinMsg: string;
  setJoinMsg: (v: string) => void;
  onJoin: () => void;
  onStartGame: () => void;
  loading: boolean;
}

export default function JoinForm({
  isJoined,
  isHost,
  joinName,
  setJoinName,
  joinPw,
  setJoinPw,
  joinMsg,
  setJoinMsg,
  onJoin,
  onStartGame,
  loading,
}: Props) {
  return (
    <StFooterAction>
      {isJoined ? (
        isHost ? (
          <CreateButton onClick={onStartGame}>게임 시작하기 🚀</CreateButton>
        ) : (
          <StWaitingMsg>방장님이 시작하길 기다리는 중...</StWaitingMsg>
        )
      ) : (
        <StFormContainer>
          <StJoinTitle>✋ 참가 신청서</StJoinTitle>
          <StFormRow>
            <Input
              placeholder="닉네임"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
            />
            <Input
              placeholder="비번(4자리)"
              type="password"
              value={joinPw}
              onChange={(e) => setJoinPw(e.target.value)}
            />
          </StFormRow>
          <Input
            placeholder="한마디 (선택)"
            value={joinMsg}
            onChange={(e) => setJoinMsg(e.target.value)}
          />
          <CreateButton onClick={onJoin} isLoading={loading}>
            등록하기
          </CreateButton>
        </StFormContainer>
      )}
    </StFooterAction>
  );
}

const StFooterAction = styled.div`
  padding: 1.5rem;
  z-index: 10;
  background: white;
  border-top: 1px solid #eee;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
`;
const StWaitingMsg = styled.p`
  text-align: center;
  color: #888;
  font-weight: 500;
  animation: blink 2s infinite;
  @keyframes blink {
    50% {
      opacity: 0.5;
    }
  }
`;
const StFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;
const StJoinTitle = styled.h3`
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 0.2rem;
`;
const StFormRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;
