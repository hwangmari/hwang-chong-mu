"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";

interface Props {
  roomId: string;
  isHost: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomData: any; // 로컬 모드일 땐 undefined일 수 있음
  onEndGame: () => void;
}

const COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#C9CBCF",
  "#E7E9ED",
];

export default function WheelGame({
  roomId,
  isHost,
  participants,
  roomData,
  onEndGame,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || participants.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    const arc = (2 * Math.PI) / participants.length;
    const startAngleOffset = -Math.PI / 2; // 12시 방향 시작

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    participants.forEach((p, i) => {
      ctx.beginPath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        i * arc + startAngleOffset,
        (i + 1) * arc + startAngleOffset
      );
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(i * arc + arc / 2 + startAngleOffset);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.fillText(p.nickname, radius - 20, 5);
      ctx.restore();
    });
  }, [participants]);

  useEffect(() => {
    if (roomId === "local") return;

    if (roomData?.current_question) {
      const targetRotation = parseFloat(roomData.current_question);
      if (targetRotation !== rotation && targetRotation > 0) {
        spinWheel(targetRotation);
      }
    } else {
      setRotation(0);
      setWinner(null);
      setIsSpinning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData, roomId]); // roomId 추가

  const spinWheel = (deg: number) => {
    setWinner(null);
    setIsSpinning(true);
    setRotation(deg); // 여기서 회전 각도 상태 변경 -> CSS transition 작동

    setTimeout(() => {
      setIsSpinning(false);
      calculateWinner(deg);
    }, 4000);
  };

  const calculateWinner = (finalDegree: number) => {
    const count = participants.length;
    if (count === 0) return;

    const degreePerSlice = 360 / count;
    const winningIndex = Math.floor(
      ((360 - (finalDegree % 360)) % 360) / degreePerSlice
    );

    if (participants[winningIndex]) {
      setWinner(participants[winningIndex].nickname);
    }
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    const randomDeg = 1800 + Math.random() * 1800; // 5~10바퀴 랜덤

    if (roomId === "local") {
      spinWheel(randomDeg);
    } else {
      await supabase
        .from("game_rooms")
        .update({
          current_question: String(Math.floor(randomDeg)),
        })
        .eq("id", roomId);
    }
  };

  const handleReset = async () => {
    if (roomId === "local") {
      setRotation(0);
      setWinner(null);
      setIsSpinning(false);
    } else {
      await supabase
        .from("game_rooms")
        .update({ current_question: null })
        .eq("id", roomId);
    }
  };

  return (
    <StContainer>
      <StWrapper>
        <StHeader>
          <StTitle>🎡 복불복 돌림판</StTitle>
          <StSubTitle>오늘의 주인공은 누구?</StSubTitle>
        </StHeader>

        <StWheelWrapper>
          <StCanvas
            ref={canvasRef}
            width={320}
            height={320}
            $rotation={rotation}
          />
          <StPointer>
            <ArrowDropDownIcon />
          </StPointer>
        </StWheelWrapper>

        <StResultArea>
          {winner ? (
            <StWinnerBox>
              🎉 당첨: <StWinnerName>{winner}</StWinnerName> 🎉
            </StWinnerBox>
          ) : (
            <StStatus>
              {isSpinning ? "두구두구두구..." : "돌려돌려 돌림판!"}
            </StStatus>
          )}
        </StResultArea>

        {isHost && (
          <StFooter>
            <CreateButton onClick={handleSpin} disabled={isSpinning}>
              {isSpinning ? "돌아가는 중..." : "돌리기 (SPIN) 🎲"}
            </CreateButton>

            {/* 회전이 끝났거나(결과 나옴) or 회전값이 있을 때 리셋 버튼 노출 */}
            {!isSpinning && rotation > 0 && (
              <StSubButton onClick={handleReset}>다시 하기 (리셋)</StSubButton>
            )}

            <StSubButton onClick={onEndGame} style={{ marginTop: "0.5rem" }}>
              다른 게임 하기
            </StSubButton>
          </StFooter>
        )}
      </StWrapper>
    </StContainer>
  );
}

const StHeader = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;
const StTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 900;
  color: #333;
  margin-bottom: 0.2rem;
`;
const StSubTitle = styled.p`
  font-size: 0.9rem;
  color: #666;
`;

const StWheelWrapper = styled.div`
  position: relative;
  width: 320px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`;
const StCanvas = styled.canvas<{ $rotation: number }>`
  border-radius: 50%;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  transition: transform 4s cubic-bezier(0.25, 0.1, 0.25, 1);
  transform: ${({ $rotation }) => `rotate(${$rotation}deg)`};
`;

const StPointer = styled.div`
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  color: #333;
  z-index: 10;
  text-shadow: 0px 2px 5px rgba(255, 255, 255, 0.8);
  svg {
    font-size: 3rem;
  }
`;

const StResultArea = styled.div`
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const StWinnerBox = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  animation: pop 0.5s;
  background: #fff;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;
const StWinnerName = styled.span`
  color: #ff6384;
  font-size: 2rem;
  font-weight: 900;
`;
const StStatus = styled.p`
  color: #888;
  font-weight: bold;
  font-size: 1.2rem;
`;
const StFooter = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;
const StSubButton = styled.button`
  background: none;
  border: none;
  color: #888;
  padding: 0.5rem;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
`;
