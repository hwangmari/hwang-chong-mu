"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";

interface Props {
  participants: { id: string; nickname: string }[];
  isHost: boolean;
  roomId: string;
  onEndGame: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roomData?: any;
}

const COLORS = [
  "#FF6B6B",
  "#34bab1",
  "#364FC7",
  "#4db083",
  "#f2cf42",
  "#cf6767",
  "#9B59B6",
  "#3498DB",
];

const COLUMN_WIDTH = 80;

const mulberry32 = (a: number) => {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export default function LadderGame({ participants }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [results, setResults] = useState<string[]>([]);
  const [seed, setSeed] = useState<number>(1);
  const [selectedUserIdx, setSelectedUserIdx] = useState<number | null>(null);

  const [finalDestinations, setFinalDestinations] = useState<
    ({ name: string; originalIdx: number } | null)[]
  >([]);

  const gameWidth = useMemo(() => {
    return Math.max(340, participants.length * COLUMN_WIDTH);
  }, [participants.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults((prev) => {
      const targetLen = participants.length;
      if (targetLen === 0) return [];
      if (prev.length === targetLen) return prev;
      return Array(targetLen)
        .fill("")
        .map((_, i) => prev[i] || "");
    });
    setSelectedUserIdx(null);
    setFinalDestinations([]);
  }, [participants.length]);

  const bridges = useMemo(() => {
    if (participants.length < 2) return [];
    const count = participants.length;
    const steps = 12;
    const rand = mulberry32(seed);
    const grid: boolean[][] = [];

    for (let s = 0; s < steps; s++) {
      grid[s] = [];
      for (let c = 0; c < count - 1; c++) {
        const hasBridge = rand() > 0.5;
        if (hasBridge && (c === 0 || !grid[s][c - 1])) {
          grid[s][c] = true;
        } else {
          grid[s][c] = false;
        }
      }
    }
    return grid;
  }, [participants.length, seed]);

  const boomCount = results.filter((r) => r === "꽝").length;

  const handleBoomControl = (increment: number) => {
    setResults((prev) => {
      const next = [...prev];
      if (increment > 0) {
        const emptyIdx = next.indexOf("");
        if (emptyIdx !== -1) {
          next[emptyIdx] = "꽝";
        } else {
          const passIdx = next.findIndex((r) => r !== "꽝");
          if (passIdx !== -1) next[passIdx] = "꽝";
        }
      } else {
        const boomIdx = next.lastIndexOf("꽝");
        if (boomIdx !== -1) next[boomIdx] = "";
      }
      return next;
    });
  };

  const handleFillPass = () => {
    setResults((prev) => prev.map((r) => (r === "" ? "통과" : r)));
  };

  const handleShuffle = () => {
    setSeed(Math.floor(Math.random() * 100000));
    setSelectedUserIdx(null);
    setFinalDestinations([]); // 섞으면 결과 숨기기
  };

  const getDestinationIndex = (startIdx: number) => {
    let c = startIdx;
    const steps = 12;
    for (let s = 0; s < steps; s++) {
      if (c < participants.length - 1 && bridges[s][c]) c++;
      else if (c > 0 && bridges[s][c - 1]) c--;
    }
    return c;
  };

  const handleShowAllResults = () => {
    setSelectedUserIdx(null); // 애니메이션 중단

    const destinations = new Array(participants.length).fill(null);
    participants.forEach((p, startIdx) => {
      const endIdx = getDestinationIndex(startIdx);
      destinations[endIdx] = {
        name: p.nickname,
        originalIdx: startIdx,
      };
    });
    setFinalDestinations(destinations);
  };

  const handleResultChange = (idx: number, val: string) => {
    const newResults = [...results];
    newResults[idx] = val;
    setResults(newResults);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = gameWidth;
    canvas.height = 400;

    const width = gameWidth;
    const height = canvas.height;
    const count = participants.length;

    const colWidth = width / count;
    const steps = 12;
    const stepHeight = (height - 60) / steps;

    const getLocalDestinationIndex = (startIdx: number) => {
      let c = startIdx;
      for (let s = 0; s < steps; s++) {
        if (c < count - 1 && bridges[s][c]) c++;
        else if (c > 0 && bridges[s][c - 1]) c--;
      }
      return c;
    };

    const getPathPoints = (startIdx: number) => {
      const points: { x: number; y: number }[] = [];
      let currCol = startIdx;
      let currX = currCol * colWidth + colWidth / 2;
      let currY = 30;

      points.push({ x: currX, y: currY });

      for (let s = 0; s < steps; s++) {
        const nextY = 30 + s * stepHeight + stepHeight / 2;
        points.push({ x: currX, y: nextY });
        currY = nextY;

        if (currCol < participants.length - 1 && bridges[s][currCol]) {
          const nextX = currX + colWidth;
          points.push({ x: nextX, y: currY });
          currX = nextX;
          currCol++;
        } else if (currCol > 0 && bridges[s][currCol - 1]) {
          const nextX = currX - colWidth;
          points.push({ x: nextX, y: currY });
          currX = nextX;
          currCol--;
        }
      }
      points.push({ x: currX, y: height - 30 });
      return points;
    };

    const drawBaseLadder = () => {
      ctx.clearRect(0, 0, width, height);
      if (count < 2) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < count; i++) {
        const x = i * colWidth + colWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, height - 30);
        ctx.strokeStyle = "#e9ecef";
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      for (let s = 0; s < steps; s++) {
        for (let c = 0; c < count - 1; c++) {
          if (bridges[s][c]) {
            const x = c * colWidth + colWidth / 2;
            const y = 30 + s * stepHeight + stepHeight / 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + colWidth, y);
            ctx.strokeStyle = "#e9ecef";
            ctx.lineWidth = 4;
            ctx.stroke();
          }
        }
      }
    };

    drawBaseLadder();

    if (finalDestinations.length > 0 && selectedUserIdx === null) {
      participants.forEach((_, startIdx) => {
        const endIdx = getLocalDestinationIndex(startIdx);

        const resultVal = results[endIdx];

        if (resultVal === "꽝") {
          const path = getPathPoints(startIdx);
          const color = COLORS[startIdx % COLORS.length];

          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 5;
          ctx.lineCap = "round";

          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
          }
          ctx.stroke();

          const last = path[path.length - 1];
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      return;
    }

    if (selectedUserIdx === null) return;

    const pathPoints = getPathPoints(selectedUserIdx);
    let animationFrameId: number;
    let progress = 0;
    const speed = 0.5;
    const color = COLORS[selectedUserIdx % COLORS.length];

    const animate = () => {
      drawBaseLadder();

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);

      const maxIndex = Math.floor(progress);
      for (let i = 0; i < maxIndex; i++) {
        ctx.lineTo(pathPoints[i + 1].x, pathPoints[i + 1].y);
      }

      if (maxIndex < pathPoints.length - 1) {
        const p1 = pathPoints[maxIndex];
        const p2 = pathPoints[maxIndex + 1];
        const t = progress - maxIndex;
        const curX = p1.x + (p2.x - p1.x) * t;
        const curY = p1.y + (p2.y - p1.y) * t;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();

      if (progress >= pathPoints.length - 1) {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(
          pathPoints[pathPoints.length - 1].x,
          pathPoints[pathPoints.length - 1].y,
          8,
          0,
          Math.PI * 2
        );
        ctx.fill();
        return;
      }

      progress += speed;
      if (progress > pathPoints.length - 1) progress = pathPoints.length - 1;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    participants,
    bridges,
    selectedUserIdx,
    gameWidth,
    finalDestinations,
    results,
  ]);

  return (
    <StContainer>
      <StWrapper>
        <StHeader>
          <StTitle>🪜 사다리 타기</StTitle>
          <p style={{ color: "#999", fontSize: "0.85rem" }}>
            멤버를 클릭하면 사다리를 타고 내려갑니다.
          </p>
        </StHeader>

        <StToolbar>
          <div className="group">
            <span>💣 꽝 개수</span>
            <button
              onClick={() => handleBoomControl(-1)}
              disabled={boomCount <= 0}
            >
              -
            </button>
            <span className="count">{boomCount}</span>
            <button
              onClick={() => handleBoomControl(1)}
              disabled={boomCount >= participants.length}
            >
              +
            </button>
          </div>
          <button className="text-btn" onClick={handleFillPass}>
            나머지 통과로 채우기
          </button>
        </StToolbar>

        <StScrollContainer>
          <StGameBoard $width={gameWidth}>
            <StRow>
              {participants.map((p, i) => (
                <StUserItem key={p.id}>
                  <StUserButton
                    $color={COLORS[i % COLORS.length]}
                    $isActive={selectedUserIdx === i}
                    onClick={() => {
                      setFinalDestinations([]); // 개별 클릭 시 전체 결과 모드 해제
                      setSelectedUserIdx(i);
                    }}
                  >
                    {p.nickname}
                  </StUserButton>
                </StUserItem>
              ))}
            </StRow>

            <canvas ref={canvasRef} />

            <StRow>
              {results.map((res, i) => {
                const destInfo = finalDestinations[i];
                const isTarget =
                  selectedUserIdx !== null &&
                  getDestinationIndex(selectedUserIdx) === i;

                return (
                  <StResultItem key={i}>
                    <StResultInput
                      value={res}
                      onChange={(e) => handleResultChange(i, e.target.value)}
                      $isTarget={isTarget}
                      $color={
                        selectedUserIdx !== null
                          ? COLORS[selectedUserIdx % COLORS.length]
                          : "#333"
                      }
                      placeholder="결과"
                    />

                    <StMatchedName
                      $isVisible={!!destInfo}
                      $color={
                        destInfo
                          ? COLORS[destInfo.originalIdx % COLORS.length]
                          : "transparent"
                      }
                    >
                      {destInfo ? destInfo.name : "-"}
                    </StMatchedName>
                  </StResultItem>
                );
              })}
            </StRow>
          </StGameBoard>
        </StScrollContainer>

        <StControls>
          <button onClick={handleShuffle} className="secondary">
            🔄 사다리 섞기
          </button>
          <button onClick={handleShowAllResults} className="primary">
            👀 전체 결과 보기
          </button>
        </StControls>
      </StWrapper>
    </StContainer>
  );
}

const StHeader = styled.div`
  text-align: center;
  margin-bottom: 10px;
`;
const StTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: #333;
  margin-bottom: 5px;
`;

const StToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 10px 15px;
  border-radius: 12px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;

  .group {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
    color: #333;
    font-size: 0.9rem;
    button {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      font-weight: bold;
      &:active {
        background: #eee;
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    .count {
      min-width: 20px;
      text-align: center;
      color: #ff6b6b;
      font-size: 1.1rem;
    }
  }
  .text-btn {
    background: none;
    border: none;
    font-size: 0.8rem;
    color: #666;
    text-decoration: underline;
    cursor: pointer;
    &:hover {
      color: #333;
    }
  }
`;

const StScrollContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  padding: 20px 0;
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
`;

const StGameBoard = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 auto;
  padding: 0 20px;
`;

const StRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;
const StUserItem = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const StUserButton = styled.button<{ $color: string; $isActive: boolean }>`
  background-color: ${({ $isActive, $color }) =>
    $isActive ? $color : "white"};
  color: ${({ $isActive, $color }) => ($isActive ? "white" : $color)};
  border: 2px solid ${({ $color }) => $color};
  border-radius: 50px;
  padding: 6px 12px;
  font-weight: bold;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: ${({ $isActive, $color }) =>
    $isActive ? `0 4px 10px ${$color}40` : "none"};
  &:hover {
    transform: translateY(-2px);
  }
`;
const StResultItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 5px;
  min-height: 80px;
`;

const StResultInput = styled.input<{ $isTarget: boolean; $color: string }>`
  width: 100%;
  padding: 8px 0;
  text-align: center;
  border: none;
  border-bottom: 2px solid
    ${({ $isTarget, $color }) => ($isTarget ? $color : "#eee")};
  background: ${({ $isTarget, $color }) =>
    $isTarget ? `${$color}20` : "transparent"};
  color: #333;
  font-weight: bold;
  font-size: 0.9rem;
  border-radius: 4px 4px 0 0;
  transition: all 0.2s;
  &:focus {
    outline: none;
    border-bottom-color: #333;
    background: #f8f9fa;
  }
  &::placeholder {
    color: #ddd;
    font-weight: normal;
  }
`;

const StMatchedName = styled.div<{ $isVisible: boolean; $color: string }>`
  margin-top: 8px;
  font-size: 0.85rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
  opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
  transform: ${({ $isVisible }) =>
    $isVisible ? "translateY(0)" : "translateY(-5px)"};
  transition: all 0.3s ease;
  white-space: nowrap;
`;

const StControls = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
  padding-bottom: 20px;

  button {
    padding: 12px 20px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    font-weight: bold;
    font-size: 1rem;
    transition: transform 0.1s;
    &:active {
      transform: scale(0.95);
    }
  }
  .secondary {
    background: #f1f3f5;
    color: #333;
  }
  .primary {
    background: #333;
    color: white;
  }
`;
