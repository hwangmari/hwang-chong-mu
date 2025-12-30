"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";

interface Props {
  roomId: string;
  isHost: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomData: any;
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

  // 1. 돌림판 그리기 (12시 시작 기준)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || participants.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    const arc = (2 * Math.PI) / participants.length;

    // ✨ [수정] 시작 각도를 -90도(12시 방향)로 설정
    const startAngleOffset = -Math.PI / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    participants.forEach((p, i) => {
      ctx.beginPath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.moveTo(centerX, centerY);

      // ✨ 12시부터 시계방향으로 그리기
      ctx.arc(
        centerX,
        centerY,
        radius,
        i * arc + startAngleOffset,
        (i + 1) * arc + startAngleOffset
      );
      ctx.fill();
      ctx.stroke();

      // 텍스트 그리기
      ctx.save();
      ctx.translate(centerX, centerY);
      // 텍스트도 조각의 중앙에 맞춰 회전
      ctx.rotate(i * arc + arc / 2 + startAngleOffset);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.fillText(p.nickname, radius - 20, 5);
      ctx.restore();
    });
  }, [participants]);

  // 2. 회전 신호 감지
  useEffect(() => {
    if (roomData?.current_question) {
      const targetRotation = parseFloat(roomData.current_question);
      if (targetRotation !== rotation && targetRotation > 0) {
        // eslint-disable-next-line react-hooks/immutability
        spinWheel(targetRotation);
      }
    } else {
      setRotation(0);
      setWinner(null);
      setIsSpinning(false);
    }
  }, [roomData]);

  const spinWheel = (deg: number) => {
    setWinner(null);
    setIsSpinning(true);
    setRotation(deg);

    // 4초 후 결과 계산
    setTimeout(() => {
      setIsSpinning(false);
      calculateWinner(deg);
    }, 4000);
  };

  // ✨ 3. 우승자 계산 로직 (12시 시작 기준)
  const calculateWinner = (finalDegree: number) => {
    const count = participants.length;
    const degreePerSlice = 360 / count;

    // 휠은 시계방향으로 돕니다.
    // 핀은 12시에 고정되어 있습니다.
    // 조각 0번도 12시부터 시작합니다.
    // 따라서 (360 - 회전각)을 하면 핀이 가리키는 조각의 위치가 나옵니다.
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
    await supabase
      .from("game_rooms")
      .update({
        current_question: String(Math.floor(randomDeg)),
      })
      .eq("id", roomId);
  };

  const handleReset = async () => {
    await supabase
      .from("game_rooms")
      .update({ current_question: null })
      .eq("id", roomId);
  };

  return (
    <StContainer>
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
        {/* 핀: 상단 중앙 */}
        <StPointer>▼</StPointer>
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
          {!isSpinning && rotation > 0 && (
            <StSubButton onClick={handleReset}>다시 하기 (리셋)</StSubButton>
          )}
          <StSubButton onClick={onEndGame} style={{ marginTop: "0.5rem" }}>
            다른 게임 하기
          </StSubButton>
        </StFooter>
      )}
    </StContainer>
  );
}

// ✨ 스타일
const StContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;
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
`;
const StCanvas = styled.canvas<{ $rotation: number }>`
  border-radius: 50%;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  transition: transform 4s cubic-bezier(0.25, 0.1, 0.25, 1);
  transform: ${({ $rotation }) => `rotate(${$rotation}deg)`};
`;

// 핀 스타일 (가운데 상단 고정)
const StPointer = styled.div`
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 3rem;
  color: #333;
  z-index: 10;
  text-shadow: 0px 2px 5px rgba(255, 255, 255, 0.8);
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
