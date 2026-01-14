"use client";

import { useState } from "react";
import styled from "styled-components";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ko } from "date-fns/locale";

interface Log {
  date: string;
  weight_morning?: string;
  weight_lunch?: string;
  weight_dinner?: string;
}

interface Props {
  logs: Log[];
  currentDate: Date;
  viewMode: "weekly" | "monthly";
}

export default function WeightChart({ logs, currentDate, viewMode }: Props) {
  const [visibleLines, setVisibleLines] = useState({
    morning: true,
    lunch: true,
    dinner: true,
  });

  let start, end;
  if (viewMode === "weekly") {
    start = startOfWeek(currentDate, { weekStartsOn: 1 });
    end = endOfWeek(currentDate, { weekStartsOn: 1 });
  } else {
    start = startOfMonth(currentDate);
    end = endOfMonth(currentDate);
  }

  const days = eachDayOfInterval({ start, end });

  const parseWeight = (str?: string) => {
    if (!str) return null;
    const match = str.match(/[0-9]+(\.[0-9]+)?/);
    return match ? parseFloat(match[0]) : null;
  };

  const dataPoints = days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const log = logs.find((l) => l.date === dateStr);

    return {
      dayLabel: format(day, "d"),
      isToday: isSameDay(day, new Date()),
      morning: log ? parseWeight(log.weight_morning) : null,
      lunch: log ? parseWeight(log.weight_lunch) : null,
      dinner: log ? parseWeight(log.weight_dinner) : null,
    };
  });

  const allWeights = dataPoints
    .flatMap((d) => [
      visibleLines.morning ? d.morning : null,
      visibleLines.lunch ? d.lunch : null,
      visibleLines.dinner ? d.dinner : null,
    ])
    .filter((w): w is number => w !== null);

  const minWeight = allWeights.length > 0 ? Math.min(...allWeights) - 1 : 50;
  const maxWeight = allWeights.length > 0 ? Math.max(...allWeights) + 1 : 60;
  const range = maxWeight - minWeight || 10;

  const getX = (index: number) => (index / (days.length - 1)) * 100;
  const getY = (weight: number) => 100 - ((weight - minWeight) / range) * 100;

  const COLORS = {
    morning: "#10b981",
    lunch: "#f59e0b",
    dinner: "#3b82f6",
  };

  const toggleVisibility = (key: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ChartContainer>
      <Legend>
        <LegendItem
          $color={COLORS.morning}
          $isActive={visibleLines.morning}
          onClick={() => toggleVisibility("morning")}
        >
          <span className="dot">●</span> 아침
        </LegendItem>
        <LegendItem
          $color={COLORS.lunch}
          $isActive={visibleLines.lunch}
          onClick={() => toggleVisibility("lunch")}
        >
          <span className="dot">●</span> 점심
        </LegendItem>
        <LegendItem
          $color={COLORS.dinner}
          $isActive={visibleLines.dinner}
          onClick={() => toggleVisibility("dinner")}
        >
          <span className="dot">●</span> 저녁
        </LegendItem>
      </Legend>

      <GraphArea>
        <GridLine style={{ top: "0%" }} />
        <GridLine style={{ top: "50%" }} />
        <GridLine style={{ top: "100%" }} />

        {allWeights.length > 0 ? (
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {visibleLines.morning && (
              <polyline
                fill="none"
                stroke={COLORS.morning}
                strokeWidth="2"
                points={dataPoints
                  .map((d, i) =>
                    d.morning ? `${getX(i)},${getY(d.morning)}` : null
                  )
                  .filter(Boolean)
                  .join(" ")}
              />
            )}
            {visibleLines.lunch && (
              <polyline
                fill="none"
                stroke={COLORS.lunch}
                strokeWidth="2"
                strokeDasharray="4"
                points={dataPoints
                  .map((d, i) =>
                    d.lunch ? `${getX(i)},${getY(d.lunch)}` : null
                  )
                  .filter(Boolean)
                  .join(" ")}
              />
            )}
            {visibleLines.dinner && (
              <polyline
                fill="none"
                stroke={COLORS.dinner}
                strokeWidth="2"
                points={dataPoints
                  .map((d, i) =>
                    d.dinner ? `${getX(i)},${getY(d.dinner)}` : null
                  )
                  .filter(Boolean)
                  .join(" ")}
              />
            )}
          </svg>
        ) : (
          <EmptyState>데이터가 없어요 🥗</EmptyState>
        )}

        {dataPoints.map((d, i) => (
          <div key={i}>
            {visibleLines.morning && d.morning && (
              <PointWrapper
                style={{ left: `${getX(i)}%`, top: `${getY(d.morning)}%` }}
              >
                <Dot
                  $color={COLORS.morning}
                  $isToday={d.isToday}
                  $isSmall={viewMode === "monthly"}
                />
                {viewMode === "weekly" && (
                  <ValueLabel $color={COLORS.morning}>{d.morning}</ValueLabel>
                )}
              </PointWrapper>
            )}
            {visibleLines.lunch && d.lunch && (
              <PointWrapper
                style={{ left: `${getX(i)}%`, top: `${getY(d.lunch)}%` }}
              >
                <Dot
                  $color={COLORS.lunch}
                  $isToday={d.isToday}
                  $isSmall={viewMode === "monthly"}
                />
                {viewMode === "weekly" && (
                  <ValueLabel $color={COLORS.lunch} style={{ bottom: "12px" }}>
                    {d.lunch}
                  </ValueLabel>
                )}
              </PointWrapper>
            )}
            {visibleLines.dinner && d.dinner && (
              <PointWrapper
                style={{ left: `${getX(i)}%`, top: `${getY(d.dinner)}%` }}
              >
                <Dot
                  $color={COLORS.dinner}
                  $isToday={d.isToday}
                  $isSmall={viewMode === "monthly"}
                />
                {viewMode === "weekly" && (
                  <ValueLabel $color={COLORS.dinner}>{d.dinner}</ValueLabel>
                )}
              </PointWrapper>
            )}
          </div>
        ))}
      </GraphArea>

      <XAxis>
        {dataPoints.map((d, i) => {
          const showLabel =
            viewMode === "weekly"
              ? true
              : i === 0 || i === days.length - 1 || (i + 1) % 5 === 0;
          return (
            <DayLabel
              key={i}
              style={{
                left: `${getX(i)}%`,
                position: "absolute",
                transform: "translateX(-50%)",
                opacity: showLabel ? 1 : 0,
              }}
              $isToday={d.isToday}
            >
              {viewMode === "weekly"
                ? format(days[i], "EEE", { locale: ko })
                : d.dayLabel}
            </DayLabel>
          );
        })}
      </XAxis>
    </ChartContainer>
  );
}

// ✨ 스타일
const ChartContainer = styled.div`
  width: 100%;
  padding: 0.5rem 0.5rem 0;
`;
const Legend = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 10px;
`;
const LegendItem = styled.button<{ $color: string; $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${({ $isActive }) => ($isActive ? "#f8fafc" : "transparent")};
  border: 1px solid
    ${({ $isActive }) => ($isActive ? "#e2e8f0" : "transparent")};
  padding: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.4)};
  color: #334155;
  font-size: 0.75rem;
  font-weight: 600;
  .dot {
    color: ${({ $color }) => $color};
    font-size: 0.9rem;
  }
  &:hover {
    background: #f1f5f9;
  }
`;
const GraphArea = styled.div`
  position: relative;
  height: 160px;
  margin-bottom: 0.5rem;
`;
const GridLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed #e5e7eb;
`;
const EmptyState = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  color: #94a3b8;
  width: 100%;
  text-align: center;
`;
const PointWrapper = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
`;
const Dot = styled.div<{
  $color: string;
  $isToday: boolean;
  $isSmall: boolean;
}>`
  width: ${({ $isSmall }) => ($isSmall ? "6px" : "8px")};
  height: ${({ $isSmall }) => ($isSmall ? "6px" : "8px")};
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  border: 1px solid white;
  box-shadow: ${({ $isToday }) =>
    $isToday ? "0 0 0 2px rgba(239, 68, 68, 0.4)" : "none"};
  z-index: 2;
`;
const ValueLabel = styled.span<{ $color: string }>`
  font-size: 0.65rem;
  color: ${({ $color }) => $color};
  font-weight: 700;
  position: absolute;
  bottom: 6px;
  white-space: nowrap;
  text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff,
    -1px 1px 0 #fff;
`;
const XAxis = styled.div`
  position: relative;
  height: 20px;
  margin-top: 0.5rem;
`;
const DayLabel = styled.span<{ $isToday: boolean }>`
  font-size: 0.75rem;
  text-align: center;
  white-space: nowrap;
  color: ${({ $isToday }) => ($isToday ? "#ef4444" : "#9ca3af")};
  font-weight: ${({ $isToday }) => ($isToday ? "700" : "400")};
`;
