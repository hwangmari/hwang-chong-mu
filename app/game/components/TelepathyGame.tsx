"use client";

import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const QUESTIONS = [
  { q: "평생 하나만 먹어야 한다면?", a: "물냉면", b: "비빔냉면" },
  { q: "더 참기 힘든 상황은?", a: "한여름에 히터", b: "한겨울에 에어컨" },
  { q: "탕수육 먹는 방법은?", a: "부먹", b: "찍먹" },
  { q: "다시 태어난다면?", a: "재벌 2세 원숭이", b: "빚 10억 연예인" },
  {
    q: "내 애인의 남사친/여사친?",
    a: "단둘이 술 마시기",
    b: "1박 2일 여행 가기",
  },
];

interface Props {
  roomId: string;
  isHost: boolean;
  myId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomData: any;
  onEndGame: () => void;
}

export default function TelepathyGame({
  roomId,
  isHost,
  myId,
  participants,
  roomData,
  onEndGame,
}: Props) {
  const [question, setQuestion] = useState<{
    q: string;
    a: string;
    b: string;
  } | null>(null);
  const [myChoice, setMyChoice] = useState<"A" | "B" | null>(null);

  useEffect(() => {
    if (roomData.current_question) {
      const [q, a, b] = roomData.current_question.split("|");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuestion({ q, a, b });
    }
    const me = participants.find((p) => p.id === myId);
    if (me?.selected_answer) setMyChoice(me.selected_answer as "A" | "B");
  }, [roomData, participants, myId]);

  const handleNextQuestion = async () => {
    const randomIdx = Math.floor(Math.random() * QUESTIONS.length);
    const qData = QUESTIONS[randomIdx];
    const qString = `${qData.q}|${qData.a}|${qData.b}`;

    await supabase
      .from("game_participants")
      .update({ selected_answer: null })
      .eq("room_id", roomId);
    await supabase
      .from("game_rooms")
      .update({ current_question: qString, is_result_open: false })
      .eq("id", roomId);
  };

  const handleShowResult = async () => {
    await supabase
      .from("game_rooms")
      .update({ is_result_open: true })
      .eq("id", roomId);
  };

  const handleSelect = async (choice: "A" | "B") => {
    if (roomData.is_result_open) return;
    setMyChoice(choice);
    await supabase
      .from("game_participants")
      .update({ selected_answer: choice })
      .eq("id", myId);
  };

  return (
    <StContainer>
      <StWrapper>
        {question ? (
          <>
            <StQuestionCard>
              <StBadge>Q.</StBadge>
              <StQuestionText>{question.q}</StQuestionText>
            </StQuestionCard>

            <StVersusContainer>
              <StOptionButton
                $color="blue"
                $selected={myChoice === "A"}
                $isResult={roomData.is_result_open}
                onClick={() => handleSelect("A")}
              >
                <StLabel>A</StLabel>
                <StText>{question.a}</StText>
                {roomData.is_result_open && (
                  <StVoters>
                    {participants
                      .filter((p) => p.selected_answer === "A")
                      .map((p) => (
                        <span key={p.id}>{p.nickname}</span>
                      ))}
                  </StVoters>
                )}
              </StOptionButton>

              <StVersusText>VS</StVersusText>

              <StOptionButton
                $color="red"
                $selected={myChoice === "B"}
                $isResult={roomData.is_result_open}
                onClick={() => handleSelect("B")}
              >
                <StLabel>B</StLabel>
                <StText>{question.b}</StText>
                {roomData.is_result_open && (
                  <StVoters>
                    {participants
                      .filter((p) => p.selected_answer === "B")
                      .map((p) => (
                        <span key={p.id}>{p.nickname}</span>
                      ))}
                  </StVoters>
                )}
              </StOptionButton>
            </StVersusContainer>
          </>
        ) : (
          <StWaiting>
            {isHost ? (
              <CreateButton onClick={handleNextQuestion}>
                첫 문제 출제하기 🎲
              </CreateButton>
            ) : (
              <p>문제를 기다리는 중...</p>
            )}
          </StWaiting>
        )}

        {isHost && (
          <StControls>
            {roomData.is_result_open ? (
              <CreateButton onClick={handleNextQuestion}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  다음 문제 <ArrowForwardIcon fontSize="small" />
                </span>
              </CreateButton>
            ) : (
              <CreateButton onClick={handleShowResult} disabled={!question}>
                결과 공개 👀
              </CreateButton>
            )}
            <StSubButton onClick={onEndGame}>게임 종료</StSubButton>
          </StControls>
        )}
      </StWrapper>
    </StContainer>
  );
}

const StQuestionCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 1.5rem;
  border-radius: 20px;
  text-align: center;
  margin-bottom: 1rem;
`;
const StBadge = styled.span`
  background: ${({ theme }) => theme.colors.gray800};
  color: ${({ theme }) => theme.colors.white};
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
`;
const StQuestionText = styled.h2`
  margin-top: 0.5rem;
  font-size: 1.3rem;
  font-weight: bold;
`;
const StVersusContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex: 1;
  position: relative;
`;
const StVersusText = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: ${({ theme }) => theme.colors.white};
  border: 3px solid ${({ theme }) => theme.colors.gray800};
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 10;
`;
const StOptionButton = styled.button<{
  $color: string;
  $selected: boolean;
  $isResult: boolean;
}>`
  flex: 1;
  border-radius: 15px;
  border: ${({ $selected, $color }) =>
    $selected ? `4px solid ${$color}` : "2px solid transparent"};
  background: ${({ $selected, $color, $isResult, theme }) => $isResult && !$selected ? theme.colors.gray200 : $selected ? $color : "#f8f9fa"};
  color: ${({ $selected }) => ($selected ? "white" : "black")};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
`;
const StLabel = styled.span`
  font-size: 1.5rem;
  font-weight: 900;
  opacity: 0.5;
`;
const StText = styled.span`
  font-size: 1.1rem;
  font-weight: bold;
`;
const StVoters = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem;
  border-radius: 10px;
  width: 80%;
`;
const StWaiting = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const StControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
`;
const StSubButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.gray500};
  padding: 0.5rem;
  text-decoration: underline;
  cursor: pointer;
`;
