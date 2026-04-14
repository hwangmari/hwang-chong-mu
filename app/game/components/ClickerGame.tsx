"use client";

import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";

interface Props {
  roomId: string;
  isHost: boolean;
  myId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[];
  onEndGame: () => void;
}

const GOAL_SCORE = 50; // 목표 점수

export default function ClickerGame({
  roomId,
  isHost,
  myId,
  participants,
  onEndGame,
}: Props) {
  const [myScore, setMyScore] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const me = participants.find((p) => p.id === myId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me) setMyScore(me.score || 0);
  }, [participants, myId]);

  useEffect(() => {
    const topScorer = participants.find((p) => (p.score || 0) >= GOAL_SCORE);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (topScorer) setWinner(topScorer.nickname);
  }, [participants]);

  const handleClick = async () => {
    if (winner) return; // 게임 끝났으면 클릭 불가

    const newScore = myScore + 1;
    setMyScore(newScore); // UI 즉시 반영

    await supabase
      .from("game_participants")
      .update({ score: newScore })
      .eq("id", myId);
  };

  return (
    <StContainer>
      <StWrapper>
        <StHeader>
          <StTitle>🔥 광클 대전 🔥</StTitle>
          <StSubTitle>먼저 {GOAL_SCORE}번 누르는 사람이 승리!</StSubTitle>
        </StHeader>

        <StScoreBoard>
          {participants
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((p, idx) => (
              <StUserRow key={p.id} $isMe={p.id === myId} $rank={idx + 1}>
                <StRank>{idx + 1}위</StRank>
                <StName>{p.nickname}</StName>
                <StBarContainer>
                  <StBar
                    style={{
                      width: `${Math.min(
                        ((p.score || 0) / GOAL_SCORE) * 100,
                        100
                      )}%`,
                    }}
                  />
                </StBarContainer>
                <StScore>{p.score || 0}</StScore>
              </StUserRow>
            ))}
        </StScoreBoard>

        <StGameArea>
          {winner ? (
            <StWinnerBox>🎉 우승: {winner} 🎉</StWinnerBox>
          ) : (
            <StBigButton onClick={handleClick}>PUSH!!</StBigButton>
          )}
        </StGameArea>

        {isHost && (
          <StFooter>
            <CreateButton onClick={onEndGame}>게임 종료</CreateButton>
          </StFooter>
        )}
      </StWrapper>
    </StContainer>
  );
}

const StHeader = styled.div`
  text-align: center;
`;
const StTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.rose500};
  margin-bottom: 0.2rem;
`;
const StSubTitle = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray600};
`;
const StScoreBoard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 1rem;
  border-radius: 15px;
  max-height: 200px;
  overflow-y: auto;
`;
const StUserRow = styled.div<{ $isMe: boolean; $rank: number }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
  color: ${({ $isMe }) => ($isMe ? "#2f3542" : "#a4b0be")};
`;
const StRank = styled.span`
  width: 30px;
  font-size: 0.8rem;
`;
const StName = styled.span`
  width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const StBarContainer = styled.div`
  flex: 1;
  height: 10px;
  background: ${({ theme }) => theme.colors.gray200};
  border-radius: 5px;
  overflow: hidden;
`;
const StBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ff6b81, ${({ theme }) => theme.colors.rose500});
  transition: width 0.2s;
`;
const StScore = styled.span`
  width: 30px;
  text-align: right;
  font-size: 0.9rem;
`;
const StGameArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
`;
const StBigButton = styled.button`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.rose500};
  color: ${({ theme }) => theme.colors.white};
  font-size: 2.5rem;
  font-weight: 900;
  box-shadow: 0 10px 0 #c0392b;
  cursor: pointer;
  &:active {
    transform: translateY(10px);
    box-shadow: none;
  }
  transition: all 0.1s;
  animation: pulse 1s infinite;
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;
const StWinnerBox = styled.div`
  font-size: 2rem;
  font-weight: 900;
  color: #2ed573;
  text-align: center;
  animation: pop 0.5s;
`;
const StFooter = styled.div`
  margin-top: auto;
`;
