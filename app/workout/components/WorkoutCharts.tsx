"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  formatDuration,
  formatDurationMin,
  formatPace,
  gymRecordVolumeKg,
} from "../helpers";
import type { CalendarCell, TimeBucket } from "../helpers";
import {
  GYM_BODY_PART_LABEL,
  RUNNING_TYPE_LABEL,
  type ActivityRecord,
  type GymRecord,
  type RunningRecord,
} from "../types";

// =========================
// 공통 스타일
// =========================
const StWrap = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1rem;
  padding: 0.95rem 1.05rem 0.85rem;
`;

const StTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  letter-spacing: -0.01em;
`;

const StSub = styled.p`
  font-size: 0.68rem;
  color: ${({ theme }) => theme.colors.gray400};
  margin-top: 0.1rem;
  margin-bottom: 0.55rem;
`;

const StEmpty = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray400};
  padding: 1.25rem 0;
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

const CHART_HEIGHT = 120;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_BOTTOM = 22;
const CHART_INNER_HEIGHT = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
const CHART_SIDE_PADDING = 6;

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

  // 고정 폭 얇은 막대 + 넓은 간격으로 깔끔하게
  const barWidth = 7;
  const minPitch = 22;
  const contentWidth = Math.max(
    minPitch * buckets.length,
    (barWidth + 16) * buckets.length,
  );
  const width = contentWidth + CHART_SIDE_PADDING * 2;
  const pitch = contentWidth / buckets.length;
  const baselineY = CHART_HEIGHT - CHART_PADDING_BOTTOM;

  // 값 라벨은 가장 높은 3개까지만 노출해서 군더더기 줄이기
  const topThreshold = [...values]
    .filter((v) => v > 0)
    .sort((a, b) => b - a)
    .slice(0, 3)
    .at(-1);

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
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {/* baseline + 희미한 중간선 */}
          <line
            x1={CHART_SIDE_PADDING}
            y1={CHART_PADDING_TOP + CHART_INNER_HEIGHT / 2}
            x2={width - CHART_SIDE_PADDING}
            y2={CHART_PADDING_TOP + CHART_INNER_HEIGHT / 2}
            stroke="#f1f5f9"
            strokeWidth={0.6}
            strokeDasharray="2 3"
          />
          <line
            x1={CHART_SIDE_PADDING}
            y1={baselineY}
            x2={width - CHART_SIDE_PADDING}
            y2={baselineY}
            stroke="#e5e7eb"
            strokeWidth={0.8}
          />
          {values.map((value, i) => {
            const ratio = value / max;
            const h = value > 0 ? Math.max(3, ratio * CHART_INNER_HEIGHT) : 0;
            const cx = CHART_SIDE_PADDING + pitch * (i + 0.5);
            const x = cx - barWidth / 2;
            const y = baselineY - h;
            const isEmpty = value <= 0;
            const showLabel =
              !isEmpty && topThreshold !== undefined && value >= topThreshold;
            return (
              <g key={buckets[i].key}>
                {/* 빈 주는 얇은 점선으로만 존재감 표시 */}
                {isEmpty ? (
                  <circle cx={cx} cy={baselineY - 1.5} r={0.9} fill="#d6dce4" />
                ) : (
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={h}
                    rx={barWidth / 2}
                    fill={color}
                  />
                )}
                {showLabel ? (
                  <text
                    x={cx}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize={7.2}
                    fontWeight={800}
                    fill={color}
                  >
                    {formatValue(value)}
                  </text>
                ) : null}
                <text
                  x={cx}
                  y={CHART_HEIGHT - 7}
                  textAnchor="middle"
                  fontSize={7}
                  fill="#b1b8c4"
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
`;

const StTotal = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  margin-top: 0.25rem;
  text-align: right;
  letter-spacing: -0.01em;

  b {
    color: ${({ theme }) => theme.colors.gray800};
    font-weight: 800;
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

// =========================
// 월별 달력 (러닝·헬스 기록 마커)
// =========================
type MonthlyCalendarProps = {
  runs: RunningRecord[];
  gyms: GymRecord[];
  activities: ActivityRecord[];
};

const DAY_HEADERS = ["월", "화", "수", "목", "금", "토", "일"];

function isoFromDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function WorkoutMonthlyCalendar({
  runs,
  gyms,
  activities,
}: MonthlyCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [pinnedIso, setPinnedIso] = useState<string | null>(null);

  const todayISO = isoFromDate(today);

  const runByDate = useMemo(() => {
    const m = new Map<string, RunningRecord[]>();
    runs.forEach((r) => {
      const arr = m.get(r.date) ?? [];
      arr.push(r);
      m.set(r.date, arr);
    });
    return m;
  }, [runs]);

  const gymByDate = useMemo(() => {
    const m = new Map<string, GymRecord[]>();
    gyms.forEach((g) => {
      const arr = m.get(g.date) ?? [];
      arr.push(g);
      m.set(g.date, arr);
    });
    return m;
  }, [gyms]);

  const activityByDate = useMemo(() => {
    const m = new Map<string, ActivityRecord[]>();
    activities.forEach((a) => {
      const arr = m.get(a.date) ?? [];
      arr.push(a);
      m.set(a.date, arr);
    });
    return m;
  }, [activities]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const firstDay = (firstOfMonth.getDay() + 6) % 7; // 월=0
    const rows: Array<
      Array<{
        date: Date;
        iso: string;
        inMonth: boolean;
        runSummary: string | null;
        gymSummary: string | null;
        activitySummary: string | null;
        runRecords: RunningRecord[];
        gymRecords: GymRecord[];
        activityRecords: ActivityRecord[];
      }>
    > = [];
    const start = new Date(firstOfMonth);
    start.setDate(start.getDate() - firstDay);
    const totalDays = firstDay + lastOfMonth.getDate();
    const rowCount = Math.ceil(totalDays / 7);
    for (let r = 0; r < rowCount; r += 1) {
      const row: (typeof rows)[number] = [];
      for (let c = 0; c < 7; c += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + r * 7 + c);
        const iso = isoFromDate(date);
        const runRecords = runByDate.get(iso) ?? [];
        const gymRecords = gymByDate.get(iso) ?? [];
        const activityRecords = activityByDate.get(iso) ?? [];
        const runKm = runRecords.reduce((s, r) => s + (r.distanceKm || 0), 0);
        const bodyParts = Array.from(
          new Set(
            gymRecords
              .map((g) => (g.bodyPart ? GYM_BODY_PART_LABEL[g.bodyPart] : null))
              .filter((label): label is string => Boolean(label)),
          ),
        );
        const activityNames = Array.from(
          new Set(activityRecords.map((a) => a.activityName).filter(Boolean)),
        );
        row.push({
          date,
          iso,
          inMonth: date.getMonth() === month,
          runRecords,
          gymRecords,
          activityRecords,
          runSummary:
            runRecords.length > 0
              ? `${runKm.toFixed(runKm >= 10 ? 0 : 1)}km`
              : null,
          gymSummary:
            gymRecords.length > 0
              ? bodyParts.length > 0
                ? bodyParts.join("·")
                : "헬스"
              : null,
          activitySummary:
            activityRecords.length > 0 ? activityNames.join("·") : null,
        });
      }
      rows.push(row);
    }
    return rows;
  }, [cursor, runByDate, gymByDate, activityByDate]);

  const monthLabel = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;
  const workoutDays = grid
    .flat()
    .filter(
      (c) =>
        c.inMonth &&
        (c.runRecords.length > 0 ||
          c.gymRecords.length > 0 ||
          c.activityRecords.length > 0),
    ).length;

  function goPrev() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }
  function goNext() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }
  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <StWrap>
      <StCalHeader>
        <StCalNav>
          <StCalNavBtn type="button" onClick={goPrev} aria-label="이전 달">
            ‹
          </StCalNavBtn>
          <StCalMonth>{monthLabel}</StCalMonth>
          <StCalNavBtn type="button" onClick={goNext} aria-label="다음 달">
            ›
          </StCalNavBtn>
        </StCalNav>
        <StCalTodayBtn type="button" onClick={goToday}>
          오늘
        </StCalTodayBtn>
      </StCalHeader>

      <StCalDayHeaderRow>
        {DAY_HEADERS.map((label, i) => (
          <StCalDayHeader key={label} $weekend={i >= 5}>
            {label}
          </StCalDayHeader>
        ))}
      </StCalDayHeaderRow>

      <StCalGrid>
        {grid.flat().map((cell) => {
          const isToday = cell.iso === todayISO;
          const hasAny = Boolean(
            cell.runSummary || cell.gymSummary || cell.activitySummary,
          );
          const isPinned = pinnedIso === cell.iso;
          return (
            <StCalCell
              key={cell.iso}
              $inMonth={cell.inMonth}
              $today={isToday}
              $active={hasAny}
              $pinned={isPinned}
              onClick={() => {
                if (!hasAny) return;
                setPinnedIso(isPinned ? null : cell.iso);
              }}
            >
              <StCalDayNum $today={isToday}>{cell.date.getDate()}</StCalDayNum>
              <StCalTags>
                {cell.runSummary ? (
                  <StCalTag $kind="run">{cell.runSummary}</StCalTag>
                ) : null}
                {cell.gymSummary ? (
                  <StCalTag $kind="gym">{cell.gymSummary}</StCalTag>
                ) : null}
                {cell.activitySummary ? (
                  <StCalTag $kind="activity">{cell.activitySummary}</StCalTag>
                ) : null}
              </StCalTags>
              {hasAny ? (
                <StCalPopover $pinned={isPinned}>
                  <StPopoverDate>{cell.iso}</StPopoverDate>
                  {cell.runRecords.map((r) => (
                    <StPopoverLine key={`r-${r.id}`} $kind="run">
                      <b>🏃‍♀️ {RUNNING_TYPE_LABEL[r.runType]}</b>
                      <span>
                        {r.distanceKm.toFixed(1)}km ·{" "}
                        {formatDuration(r.durationSec)}
                        {r.avgPaceSec ? ` · ${formatPace(r.avgPaceSec)}` : ""}
                      </span>
                    </StPopoverLine>
                  ))}
                  {cell.gymRecords.map((g) => {
                    const topNames = g.exercises
                      .slice(0, 3)
                      .map((ex) => ex.name)
                      .filter(Boolean)
                      .join(", ");
                    const more =
                      g.exercises.length > 3
                        ? ` 외 ${g.exercises.length - 3}개`
                        : "";
                    return (
                      <StPopoverLine key={`g-${g.id}`} $kind="gym">
                        <b>
                          🏋️‍♂️{" "}
                          {g.bodyPart ? GYM_BODY_PART_LABEL[g.bodyPart] : "헬스"}
                          {g.durationMin
                            ? ` · ${formatDurationMin(g.durationMin)}`
                            : ""}
                        </b>
                        <span>
                          {topNames}
                          {more} ·{" "}
                          {Math.round(gymRecordVolumeKg(g)).toLocaleString()}kg
                        </span>
                      </StPopoverLine>
                    );
                  })}
                  {cell.activityRecords.map((a) => (
                    <StPopoverLine key={`a-${a.id}`} $kind="activity">
                      <b>🎾 {a.activityName}</b>
                      <span>
                        {[
                          a.durationMin ? formatDurationMin(a.durationMin) : null,
                          a.calories ? `${a.calories}kcal` : null,
                          a.avgHeartRate ? `${a.avgHeartRate}bpm` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "기록됨"}
                      </span>
                    </StPopoverLine>
                  ))}
                </StCalPopover>
              ) : null}
            </StCalCell>
          );
        })}
      </StCalGrid>

      <StCalFooter>
        <StCalLegend>
          <StCalLegendItem>
            <StCalDot $color="#3aa675" />
            러닝
          </StCalLegendItem>
          <StCalLegendItem>
            <StCalDot $color="#e07a3a" />
            헬스
          </StCalLegendItem>
          <StCalLegendItem>
            <StCalDot $color="#7c6ae0" />
            활동
          </StCalLegendItem>
        </StCalLegend>
        <StCalCount>
          이번 달 <b>{workoutDays}</b>일 운동
        </StCalCount>
      </StCalFooter>
    </StWrap>
  );
}

const StCalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
`;

const StCalNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const StCalNavBtn = styled.button`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }
`;

const StCalMonth = styled.span`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  letter-spacing: -0.01em;
  padding: 0 0.3rem;
`;

const StCalTodayBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }
`;

const StCalDayHeaderRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const StCalDayHeader = styled.div<{ $weekend: boolean }>`
  font-size: 0.68rem;
  font-weight: 800;
  text-align: center;
  padding: 0.35rem 0;
  color: ${({ $weekend, theme }) =>
    $weekend ? theme.colors.gray400 : theme.colors.gray500};
`;

const StCalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const StCalCell = styled.div<{
  $inMonth: boolean;
  $today: boolean;
  $active: boolean;
  $pinned: boolean;
}>`
  position: relative;
  min-height: 62px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 3px;
  padding: 0.32rem 0.18rem 0.3rem;
  border-radius: 0.55rem;
  background: ${({ $today, $active, $pinned, theme }) =>
    $pinned
      ? theme.colors.blue100
      : $today
        ? theme.colors.blue50
        : $active
          ? theme.colors.gray50
          : "transparent"};
  border: 1px solid
    ${({ $today, $pinned, theme }) =>
      $pinned
        ? theme.colors.blue500
        : $today
          ? theme.colors.blue200
          : "transparent"};
  opacity: ${({ $inMonth }) => ($inMonth ? 1 : 0.35)};
  cursor: ${({ $active }) => ($active ? "pointer" : "default")};
  transition: background 0.1s, border-color 0.1s;
`;

const StCalDayNum = styled.span<{ $today: boolean }>`
  font-size: 0.72rem;
  font-weight: ${({ $today }) => ($today ? 900 : 700)};
  color: ${({ $today, theme }) =>
    $today ? theme.colors.blue600 : theme.colors.gray700};
  line-height: 1;
`;

const StCalTags = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
`;

const StCalTag = styled.span<{ $kind: "run" | "gym" | "activity" }>`
  display: block;
  max-width: 100%;
  font-size: 0.58rem;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1.35;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ $kind }) =>
    $kind === "run" ? "#1f7a55" : $kind === "gym" ? "#b05a23" : "#4e3dc4"};
  background: ${({ $kind }) =>
    $kind === "run" ? "#e6f4ed" : $kind === "gym" ? "#fce9d8" : "#e9e6fb"};

  @media (max-width: 420px) {
    font-size: 0.52rem;
    padding: 1px 2px;
  }
`;

const StCalDot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: inline-block;
`;

const StCalPopover = styled.div<{ $pinned: boolean }>`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%)
    translateY(${({ $pinned }) => ($pinned ? "0" : "4px")});
  min-width: 180px;
  max-width: 240px;
  padding: 0.6rem 0.75rem;
  background: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  border-radius: 0.65rem;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.28);
  opacity: ${({ $pinned }) => ($pinned ? 1 : 0)};
  pointer-events: ${({ $pinned }) => ($pinned ? "auto" : "none")};
  transition: all 0.15s;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.gray900};
  }
`;

const StPopoverDate = styled.span`
  font-size: 0.68rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray400};
  letter-spacing: 0.02em;
`;

const StPopoverLine = styled.div<{ $kind: "run" | "gym" | "activity" }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-left: 0.5rem;
  border-left: 2px solid
    ${({ $kind }) =>
      $kind === "run" ? "#3aa675" : $kind === "gym" ? "#e07a3a" : "#7c6ae0"};

  b {
    font-size: 0.72rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.white};
    letter-spacing: -0.01em;
  }

  span {
    font-size: 0.68rem;
    color: ${({ theme }) => theme.colors.gray300};
    line-height: 1.4;
    word-break: keep-all;
  }
`;

const StCalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.65rem;
  padding-top: 0.6rem;
  border-top: 1px dashed ${({ theme }) => theme.colors.gray100};
`;

const StCalLegend = styled.div`
  display: flex;
  gap: 0.8rem;
`;

const StCalLegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 700;
`;

const StCalCount = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;

  b {
    color: ${({ theme }) => theme.colors.gray800};
    font-weight: 900;
    font-size: 0.82rem;
  }
`;
