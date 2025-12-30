"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { supabase } from "@/lib/supabase";
import CreateButton from "@/components/common/CreateButton";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";

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

// 난수 생성기
const Mulberry32 = (a: number) => {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export default function LadderGame({
  roomId,
  isHost,
  participants,
  roomData,
  onEndGame,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [results, setResults] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ladderData, setLadderData] = useState<any>(null);
  const [inputs, setInputs] = useState<string[]>([]);

  // ✨ 현재 선택된(하이라이트할) 유저 인덱스
  const [selectedUserIdx, setSelectedUserIdx] = useState<number | null>(null);

  // 초기 세팅
  useEffect(() => {
    if (participants.length > 0 && inputs.length === 0) {
      setInputs(
        Array(participants.length)
          .fill("")
          .map((_, i) => (i % 2 === 0 ? "통과" : "벌주"))
      );
    }
  }, [participants]);

  // DB 데이터 동기화
  useEffect(() => {
    if (roomData?.current_question) {
      try {
        const parsed = JSON.parse(roomData.current_question);
        setLadderData(parsed);
        setResults(parsed.results);
      } catch (e) {
        setLadderData(null);
      }
    } else {
      setLadderData(null);
      setSelectedUserIdx(null); // 리셋 시 선택 해제
    }
  }, [roomData]);

  // ✨ 사다리 구조 고정 (Memoization)
  const bridges = useMemo(() => {
    if (!ladderData || participants.length === 0) return [];

    const count = participants.length;
    const steps = 20;
    const rand = Mulberry32(ladderData.seed);
    const grid: boolean[][] = [];

    for (let s = 0; s < steps; s++) {
      grid[s] = [];
      for (let c = 0; c < count - 1; c++) {
        // 50% 확률로 다리 생성
        const hasBridge = rand() > 0.5;
        // 연속된 다리 방지
        if (hasBridge && (c === 0 || !grid[s][c - 1])) {
          grid[s][c] = true;
        } else {
          grid[s][c] = false;
        }
      }
    }
    return grid;
  }, [ladderData, participants.length]);

  // ✨ 화면 그리기 (데이터나 선택된 유저가 바뀔 때마다 실행)
  useEffect(() => {
    if (ladderData && canvasRef.current) {
      drawLadder();
    }
  }, [ladderData, bridges, selectedUserIdx]);

  // -------------------- 🎨 그리기 로직 --------------------

  const drawLadder = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ladderData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const count = participants.length;
    const colWidth = width / count;
    const steps = 20;
    const stepHeight = (height - 80) / steps; // 상하 여백 40씩

    // 1. 캔버스 초기화
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 2. 기본 사다리 (회색) 그리기
    // 세로선
    participants.forEach((_, i) => {
      const x = i * colWidth + colWidth / 2;
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, height - 40);
      ctx.strokeStyle = "#e0e0e0"; // 연한 회색
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // 가로선
    for (let s = 0; s < steps; s++) {
      for (let c = 0; c < count - 1; c++) {
        if (bridges[s][c]) {
          const x = c * colWidth + colWidth / 2;
          const y = 40 + s * stepHeight + stepHeight / 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + colWidth, y);
          ctx.strokeStyle = "#e0e0e0";
          ctx.lineWidth = 4;
          ctx.stroke();
        }
      }
    }

    // 3. ✨ 선택된 유저 경로 하이라이트 (색깔 선)
    if (selectedUserIdx !== null) {
      drawUserPath(ctx, selectedUserIdx, colWidth, stepHeight);
    }
  };

  const drawUserPath = (
    ctx: CanvasRenderingContext2D,
    userIdx: number,
    colWidth: number,
    stepHeight: number
  ) => {
    const color = COLORS[userIdx % COLORS.length];
    const steps = 20;
    const height = ctx.canvas.height;

    let currCol = userIdx;
    let currX = currCol * colWidth + colWidth / 2;
    let currY = 40;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 8; // 굵게!
    ctx.moveTo(currX, currY);

    // 경로 추적하며 선 긋기
    for (let s = 0; s < steps; s++) {
      const nextY = 40 + s * stepHeight + stepHeight / 2;

      // 세로 이동
      ctx.lineTo(currX, nextY);
      currY = nextY;

      // 가로 이동 체크
      if (currCol < participants.length - 1 && bridges[s][currCol]) {
        // 오른쪽으로 이동
        const nextX = currX + colWidth;
        ctx.lineTo(nextX, currY);
        currX = nextX;
        currCol++;
      } else if (currCol > 0 && bridges[s][currCol - 1]) {
        // 왼쪽으로 이동
        const nextX = currX - colWidth;
        ctx.lineTo(nextX, currY);
        currX = nextX;
        currCol--;
      }
    }

    // 마지막 바닥까지
    ctx.lineTo(currX, height - 40);
    ctx.stroke();

    // 도착 지점에 동그라미 표시
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(currX, height - 40, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  // -------------------- 핸들러 --------------------

  const handleUserClick = (idx: number) => {
    // 1. 경로 표시 (State 변경 -> useEffect에서 그리기 호출됨)
    setSelectedUserIdx(idx);

    // 2. 결과 계산 (로직은 그리기와 동일)
    let currCol = idx;
    const steps = 20;
    for (let s = 0; s < steps; s++) {
      if (currCol < participants.length - 1 && bridges[s][currCol]) {
        currCol++;
      } else if (currCol > 0 && bridges[s][currCol - 1]) {
        currCol--;
      }
    }

    // 3. 결과 알림 (살짝 딜레이 줘서 선이 그려진 뒤 뜨게 함)
    setTimeout(() => {
      // alert 대신 UI에 띄워도 좋지만, 일단 alert로 유지
      // alert(`[${participants[idx].nickname}]님 결과: ${results[currCol]}`);
    }, 100);
  };

  const handleGenerate = async () => {
    if (inputs.some((val) => !val.trim()))
      return alert("모든 결과 칸을 채워주세요!");
    const seed = Math.floor(Math.random() * 10000);
    const data = { seed, results: inputs };
    await supabase
      .from("game_rooms")
      .update({ current_question: JSON.stringify(data) })
      .eq("id", roomId);
  };

  const handleReset = async () => {
    await supabase
      .from("game_rooms")
      .update({ current_question: null })
      .eq("id", roomId);
  };

  const handleInputChange = (idx: number, val: string) => {
    const newInputs = [...inputs];
    newInputs[idx] = val;
    setInputs(newInputs);
  };

  const handleShuffle = () => {
    const newInputs = [...inputs];
    for (let i = newInputs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newInputs[i], newInputs[j]] = [newInputs[j], newInputs[i]];
    }
    setInputs(newInputs);
  };

  // 1. 설정 모드
  if (!ladderData) {
    return (
      <StContainer>
        <StWrapper>
          <StHeader>
            <StTitle>🪜 사다리 타기</StTitle>
            <StSubTitle>결과를 입력하고 생성하세요</StSubTitle>
          </StHeader>

          {isHost ? (
            <StSetupArea>
              <StGridHeader>
                <span>총 {participants.length}개의 결과가 필요합니다.</span>
                <StShuffleBtn onClick={handleShuffle}>
                  🔀 순서 섞기
                </StShuffleBtn>
              </StGridHeader>

              <StGrid>
                {inputs.map((val, i) => (
                  <StInputRow key={i}>
                    <StLabel>결과 {i + 1}</StLabel>
                    <StSmallInput
                      value={val}
                      onChange={(e) => handleInputChange(i, e.target.value)}
                      placeholder="예: 꽝, 1만원"
                    />
                  </StInputRow>
                ))}
              </StGrid>
              <CreateButton onClick={handleGenerate}>
                사다리 생성하기 ✨
              </CreateButton>
            </StSetupArea>
          ) : (
            <StWaiting>방장님이 사다리를 세팅 중입니다...</StWaiting>
          )}
        </StWrapper>
      </StContainer>
    );
  }

  // 2. 게임 모드
  return (
    <StContainer>
      <StWrapper>
        <StHeader>
          <StTitle>🪜 운명의 사다리</StTitle>
          <StSubTitle>이름을 누르면 길이 보입니다!</StSubTitle>
        </StHeader>

        <StGameArea>
          <StUserRow>
            {participants.map((p, i) => (
              <StUserBtn
                key={p.id}
                onClick={() => handleUserClick(i)}
                $color={COLORS[i % COLORS.length]}
                $isActive={selectedUserIdx === i}
              >
                {p.nickname}
              </StUserBtn>
            ))}
          </StUserRow>

          {/* 캔버스 영역 */}
          <canvas
            ref={canvasRef}
            width={340}
            height={400}
            style={{ width: "100%", maxWidth: "340px" }}
          />

          <StResultRow>
            {results.map((r, i) => (
              <StResultBox
                key={i}
                $isHighlight={
                  // 현재 선택된 유저의 도착지점인지 계산해서 하이라이트
                  selectedUserIdx !== null &&
                  (() => {
                    let c = selectedUserIdx;
                    for (let s = 0; s < 20; s++) {
                      if (c < participants.length - 1 && bridges[s][c]) c++;
                      else if (c > 0 && bridges[s][c - 1]) c--;
                    }
                    return c === i;
                  })()
                }
              >
                {r}
              </StResultBox>
            ))}
          </StResultRow>
        </StGameArea>

        {isHost && (
          <StFooter>
            <StSubButton onClick={handleReset}>다시 세팅하기</StSubButton>
            <StSubButton onClick={onEndGame}>게임 종료</StSubButton>
          </StFooter>
        )}
      </StWrapper>
    </StContainer>
  );
}

// ✨ 스타일
const StHeader = styled.div`
  text-align: center;
  margin-bottom: 0.5rem;
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

const StSetupArea = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const StGridHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;
const StShuffleBtn = styled.button`
  background: #eee;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  &:hover {
    background: #ddd;
  }
`;

const StGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
`;
const StInputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;
const StLabel = styled.span`
  font-size: 0.8rem;
  color: #888;
  font-weight: bold;
`;
const StSmallInput = styled.input`
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  font-size: 0.95rem;
  font-weight: bold;
`;

const StGameArea = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 16px;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const StUserRow = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 340px;
  margin-bottom: 0.5rem;
`;

const StUserBtn = styled.button<{ $color: string; $isActive: boolean }>`
  background: ${({ $color, $isActive }) => ($isActive ? $color : "white")};
  color: ${({ $color, $isActive }) => ($isActive ? "white" : $color)};
  border: 2px solid ${({ $color }) => $color};
  padding: 0.3rem 0.6rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  transform: ${({ $isActive }) => ($isActive ? "scale(1.1)" : "scale(1)")};
  white-space: nowrap;
  overflow: hidden;
  max-width: 60px;
  text-overflow: ellipsis;
`;

const StResultRow = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  max-width: 340px;
  margin-top: 0.5rem;
`;
const StResultBox = styled.div<{ $isHighlight?: boolean }>`
  font-size: 0.8rem;
  font-weight: bold;
  color: ${({ $isHighlight }) => ($isHighlight ? "white" : "#333")};
  background: ${({ $isHighlight }) => ($isHighlight ? "#333" : "#f8f9fa")};
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.3rem 0.2rem;
  border-radius: 6px;
  transition: all 0.2s;
  transform: ${({ $isHighlight }) =>
    $isHighlight ? "scale(1.1)" : "scale(1)"};
`;

const StFooter = styled.div`
  margin-top: auto;
  display: flex;
  gap: 1rem;
  justify-content: center;
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
const StWaiting = styled.div`
  text-align: center;
  color: #888;
  padding: 2rem;
  font-weight: bold;
`;
