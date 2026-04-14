"use client";

import styled from "styled-components";
import { formatPace } from "../helpers";
import type { CalendarCell, TimeBucket } from "../helpers";

// =========================
// 공통 스타일
// =========================
const StWrap = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1.1rem;
  padding: 1rem 1.1rem;
`;

const StTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.1rem;
`;

const StSub = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  margin-bottom: 0.85rem;
`;

const StEmpty = styled.p`
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray400};
  padding: 1rem 0;
  text-align: center;
`;

// =========================
// 주간 막대 차트 (거리 / 볼륨 공용)
// =========================
type BarChartProps = {
  title: string;
  subtitle?: string;
  buckets: TimeBucket[];
  values: number[];
  unit: string;
  color: string;
  formatValue?: (v: number) => string;
  rightSlot?: React.ReactNode;
  totalLabel?: string;
};

const CHART_HEIGHT = 130;
const CHART_PADDING_TOP = 18;
const CHART_PADDING_BOTTOM = 24;
const CHART_INNER_HEIGHT = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

export function WorkoutWeeklyBarChart({
  title,
  subtitle,
  buckets,
  values,
  unit,
  color,
  formatValue = (v) => Math.round(v).toString(),
  rightSlot,
  totalLabel,
}: BarChartProps) {
  const max = Math.max(1, ...values);
  const total = values.reduce((s, v) => s + v, 0);
  const hasAny = total > 0;

  const width = 320;
  const barGap = 6;
  const barWidth = (width - barGap * (buckets.length - 1)) / buckets.length;

  return (
    <StWrap>
      <StHeaderRow>
        <div>
          <StTitle>{title}</StTitle>
          {subtitle ? <StSub>{subtitle}</StSub> : null}
        </div>
        {rightSlot}
      </StHeaderRow>
      {hasAny ? (
        <svg
          viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
          role="img"
          aria-label={title}
          style={{ width: "100%", height: "auto" }}
        >
          {/* baseline */}
          <line
            x1={0}
            y1={CHART_HEIGHT - CHART_PADDING_BOTTOM}
            x2={width}
            y2={CHART_HEIGHT - CHART_PADDING_BOTTOM}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          {values.map((value, i) => {
            const ratio = value / max;
            const h = Math.max(value > 0 ? 2 : 0, ratio * CHART_INNER_HEIGHT);
            const x = i * (barWidth + barGap);
            const y = CHART_HEIGHT - CHART_PADDING_BOTTOM - h;
            return (
              <g key={buckets[i].key}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={3}
                  fill={value > 0 ? color : "#f1f5f9"}
                />
                {value > 0 ? (
                  <text
                    x={x + barWidth / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize={8}
                    fontWeight={800}
                    fill={color}
                  >
                    {formatValue(value)}
                  </text>
                ) : null}
                <text
                  x={x + barWidth / 2}
                  y={CHART_HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#9aa3b2"
                  fontWeight={600}
                >
                  {buckets[i].label}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <StEmpty>기록이 쌓이면 차트가 나타나요.</StEmpty>
      )}
      <StTotal>
        {totalLabel ?? "합계"} <b>{formatValue(total)}</b> {unit}
      </StTotal>
    </StWrap>
  );
}

const StHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.2rem;
`;

const StTotal = styled.p`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray500};
  margin-top: 0.4rem;
  text-align: right;

  b {
    color: ${({ theme }) => theme.colors.gray900};
    font-weight: 900;
  }
`;

// =========================
// 잔디 (GitHub 스타일 1년 히트맵)
// =========================
type CalendarProps = {
  columns: CalendarCell[][];
};

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const MONTH_LABELS = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];
const CELL_SIZE = 11;
const CELL_GAP = 2;
const LEFT_GUTTER = 20;
const TOP_GUTTER = 14;

export function WorkoutCalendarHeatmap({ columns }: CalendarProps) {
  const colCount = columns.length;
  const workoutCount = columns.reduce(
    (sum, col) => sum + col.filter((c) => c.intensity > 0).length,
    0,
  );
  const width = LEFT_GUTTER + (CELL_SIZE + CELL_GAP) * colCount;
  const height = TOP_GUTTER + (CELL_SIZE + CELL_GAP) * 7;

  // 월이 바뀌는 컬럼에 라벨 표시
  const monthLabels: { x: number; label: string }[] = [];
  let prevMonth = -1;
  columns.forEach((col, cIdx) => {
    const firstCell = col[0];
    if (!firstCell) return;
    const m = firstCell.date.getMonth();
    if (m !== prevMonth) {
      monthLabels.push({
        x: LEFT_GUTTER + cIdx * (CELL_SIZE + CELL_GAP),
        label: MONTH_LABELS[m],
      });
      prevMonth = m;
    }
  });

  return (
    <StWrap>
      <StTitle>운동 잔디 🌱</StTitle>
      <StSub>최근 1년 · 짙을수록 더 많이 운동한 날</StSub>
      <StCalendarScroll>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="운동 캘린더"
          style={{
            minWidth: `${width * 1.4}px`,
            width: "100%",
            height: "auto",
          }}
        >
          {/* 월 라벨 */}
          {monthLabels.map((m, i) => (
            <text
              key={`${m.label}-${i}`}
              x={m.x}
              y={10}
              fontSize={8}
              fill="#9aa3b2"
              fontWeight={700}
            >
              {m.label}
            </text>
          ))}
          {/* 요일 라벨 (월/수/금만) */}
          {DAY_LABELS.map((label, i) => (
            <text
              key={label}
              x={0}
              y={TOP_GUTTER + (CELL_SIZE + CELL_GAP) * i + CELL_SIZE - 2}
              fontSize={8}
              fill="#9aa3b2"
              fontWeight={700}
            >
              {i % 2 === 0 ? label : ""}
            </text>
          ))}
          {/* 셀 */}
          {columns.map((col, cIdx) =>
            col.map((cell) => (
              <rect
                key={cell.iso}
                x={LEFT_GUTTER + cIdx * (CELL_SIZE + CELL_GAP)}
                y={TOP_GUTTER + cell.dayOfWeek * (CELL_SIZE + CELL_GAP)}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                fill={colorByIntensity(cell.intensity)}
              >
                <title>
                  {cell.iso}
                  {cell.intensity > 0 ? " · 운동 O" : ""}
                </title>
              </rect>
            )),
          )}
        </svg>
      </StCalendarScroll>
      <StLegendRow>
        <span>적게</span>
        {[0, 2, 3].map((lv) => (
          <StLegendDot key={lv} $color={colorByIntensity(lv as 0 | 2 | 3)} />
        ))}
        <span>많이</span>
        <StLegendSpacer />
        <StTotal as="span">
          <b>{workoutCount}</b>일 운동
        </StTotal>
      </StLegendRow>
    </StWrap>
  );
}

const StCalendarScroll = styled.div`
  overflow-x: auto;
  padding-bottom: 0.2rem;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray200};
    border-radius: 2px;
  }
`;

function colorByIntensity(level: CalendarCell["intensity"]): string {
  switch (level) {
    case 3:
      return "#1f8a54"; // 짙은 초록
    case 2:
      return "#4fb27a";
    case 1:
      return "#a2d9b9";
    default:
      return "#eef2f6";
  }
}

const StLegendRow = styled.div`
  margin-top: 0.55rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StLegendDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: ${({ $color }) => $color};
`;

const StLegendSpacer = styled.div`
  flex: 1;
`;

// =========================
// 러닝 페이스 추이 선그래프
// =========================
export type PaceTrendPoint = {
  date: string;
  paceSec: number;
  distanceKm: number;
};

type PaceTrendProps = {
  points: PaceTrendPoint[]; // oldest → newest
};

export function WorkoutPaceTrendChart({ points }: PaceTrendProps) {
  const viewW = 320;
  const viewH = 160;
  const padL = 34;
  const padR = 10;
  const padT = 18;
  const padB = 26;
  const innerW = viewW - padL - padR;
  const innerH = viewH - padT - padB;

  if (points.length === 0) {
    return (
      <StWrap>
        <StTitle>📈 러닝 페이스 추이</StTitle>
        <StSub>페이스가 포함된 러닝 기록이 쌓이면 선이 그려져요.</StSub>
        <StEmpty>아직 기록이 부족해요.</StEmpty>
      </StWrap>
    );
  }

  const paces = points.map((p) => p.paceSec);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const range = Math.max(1, maxPace - minPace);

  // 포인트가 1개면 중앙에 한 점
  const xFor = (i: number) =>
    points.length === 1
      ? padL + innerW / 2
      : padL + (i / (points.length - 1)) * innerW;

  // y 반전: 낮은 페이스(빠름) = 위쪽
  const yFor = (pace: number) => padT + ((pace - minPace) / range) * innerH;

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.paceSec).toFixed(1)}`)
    .join(" ");

  // 최빠/최느
  const fastestIdx = paces.indexOf(minPace);
  const slowestIdx = paces.indexOf(maxPace);

  // y축 눈금 (min/max 라벨만)
  const labelMin = formatPace(minPace).replace("/km", "");
  const labelMax = formatPace(maxPace).replace("/km", "");

  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.paceSec - first.paceSec; // 음수 = 빨라짐

  return (
    <StWrap>
      <StTitle>📈 러닝 페이스 추이</StTitle>
      <StSub>
        최근 {points.length}회 · 위로 갈수록 빠른 페이스
      </StSub>
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        role="img"
        aria-label="러닝 페이스 추이"
        style={{ width: "100%", height: "auto" }}
      >
        {/* 격자선 + y축 라벨 */}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + innerH}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        <line
          x1={padL}
          y1={padT + innerH}
          x2={padL + innerW}
          y2={padT + innerH}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        <text x={padL - 4} y={padT + 4} fontSize={9} fill="#9aa3b2" textAnchor="end" fontWeight={700}>
          {labelMin}
        </text>
        <text
          x={padL - 4}
          y={padT + innerH}
          fontSize={9}
          fill="#9aa3b2"
          textAnchor="end"
          fontWeight={700}
        >
          {labelMax}
        </text>

        {/* 추세선 */}
        <path d={pathD} fill="none" stroke="#607de0" strokeWidth={2} strokeLinejoin="round" />

        {/* 포인트 */}
        {points.map((p, i) => {
          const isFast = i === fastestIdx;
          const isSlow = i === slowestIdx;
          return (
            <g key={`${p.date}-${i}`}>
              <circle
                cx={xFor(i)}
                cy={yFor(p.paceSec)}
                r={isFast ? 4.5 : 3.2}
                fill={isFast ? "#1f8a54" : isSlow ? "#d04a73" : "#607de0"}
                stroke="#ffffff"
                strokeWidth={1.2}
              >
                <title>
                  {p.date} · {formatPace(p.paceSec)} · {p.distanceKm.toFixed(1)}km
                </title>
              </circle>
            </g>
          );
        })}

        {/* x축 라벨: 첫 · 마지막 */}
        <text x={padL} y={viewH - 8} fontSize={8} fill="#9aa3b2" fontWeight={700}>
          {first.date.slice(5)}
        </text>
        <text
          x={padL + innerW}
          y={viewH - 8}
          fontSize={8}
          fill="#9aa3b2"
          fontWeight={700}
          textAnchor="end"
        >
          {last.date.slice(5)}
        </text>
      </svg>
      <StTrendFooter>
        <span>
          최빠{" "}
          <b style={{ color: "#1f8a54" }}>
            {formatPace(minPace).replace("/km", "")}
          </b>
        </span>
        <span>
          최느{" "}
          <b style={{ color: "#d04a73" }}>
            {formatPace(maxPace).replace("/km", "")}
          </b>
        </span>
        {points.length > 1 ? (
          <StDeltaBadge $faster={delta < 0}>
            {delta < 0 ? "▼" : "▲"} 처음 대비 {Math.abs(delta)}초
          </StDeltaBadge>
        ) : null}
      </StTrendFooter>
    </StWrap>
  );
}

const StTrendFooter = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray500};
  flex-wrap: wrap;

  b {
    font-weight: 900;
  }
`;

const StDeltaBadge = styled.span<{ $faster: boolean }>`
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  border-radius: 0.45rem;
  background: ${({ $faster }) => ($faster ? "#e6f7ee" : "#fee")};
  color: ${({ $faster }) => ($faster ? "#1f8a54" : "#c0304f")};
  margin-left: auto;
`;
