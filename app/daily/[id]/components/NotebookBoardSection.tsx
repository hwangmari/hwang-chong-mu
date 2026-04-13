"use client";

import { Fragment } from "react";
import { DailyNotebookEntry, toDateLabel } from "../../storage";
import { THEME_COLOR, getScore } from "../helpers";
import {
  BoardBody,
  BoardHeader,
  CheckButton,
  ChecklistCell,
  ChecklistHeader,
  ChecklistLabel,
  DateLabel,
  DiaryCell,
  DiaryInput,
  GraphLabel,
  LeftHeader,
  MiddleHeader,
  MobileScoreText,
  NotebookBoard,
  TodayBadge,
  TrendCell,
  TrendGridLine,
  TrendHeader,
  TrendPath,
  TrendPoint,
  TrendPointLabel,
  TrendScaleLabel,
  TrendSvg,
} from "../page.styles";

interface TrendPointData {
  date: string;
  score: number;
  isToday: boolean;
  x: number;
  y: number;
}

interface TrendGraph {
  chartWidth: number;
  chartHeight: number;
  points: TrendPointData[];
}

interface NotebookBoardSectionProps {
  entries: DailyNotebookEntry[];
  monthChecklist: string[];
  todayDateKey: string;
  trendGraph: TrendGraph;
  onUpdateDiary: (entryDate: string, diary: string) => void;
  onSaveDiary: (entryDate: string) => void;
  onToggleCheck: (entryDate: string, checkIndex: number) => void;
}

export default function NotebookBoardSection({
  entries,
  monthChecklist,
  todayDateKey,
  trendGraph,
  onUpdateDiary,
  onSaveDiary,
  onToggleCheck,
}: NotebookBoardSectionProps) {
  return (
    <NotebookBoard>
      <BoardHeader>
        <LeftHeader>날짜 / 한 줄 일기</LeftHeader>
        <MiddleHeader>
          <ChecklistHeader $count={monthChecklist.length}>
            {monthChecklist.map((item, index) => (
              <ChecklistLabel key={`${item}-${index}`}>{item}</ChecklistLabel>
            ))}
          </ChecklistHeader>
        </MiddleHeader>
        <TrendHeader>
          <GraphLabel>달성률 추이</GraphLabel>
        </TrendHeader>
      </BoardHeader>

      <BoardBody $rows={entries.length}>
        {entries.map((entry, rowIndex) => {
          const score = getScore(entry.checks);
          const isLast = rowIndex === entries.length - 1;
          const isToday = entry.date === todayDateKey;
          return (
            <Fragment key={entry.date}>
              <DiaryCell $row={rowIndex + 1} $last={isLast} $isToday={isToday}>
                <DateLabel>
                  {toDateLabel(entry.date)}
                  {isToday && <TodayBadge $color={THEME_COLOR}>오늘</TodayBadge>}
                </DateLabel>
                <DiaryInput
                  value={entry.diary}
                  onChange={(event) => onUpdateDiary(entry.date, event.target.value)}
                  onBlur={() => onSaveDiary(entry.date)}
                  placeholder="오늘의 한 줄 기록을 남겨보세요."
                />
              </DiaryCell>

              <ChecklistCell
                $row={rowIndex + 1}
                $count={monthChecklist.length}
                $last={isLast}
                $isToday={isToday}
              >
                {entry.checks.map((checked, index) => (
                  <CheckButton
                    key={`${entry.date}-${index}`}
                    type="button"
                    $color={THEME_COLOR}
                    $checked={checked}
                    onClick={() => onToggleCheck(entry.date, index)}
                    aria-label={`${toDateLabel(entry.date)} ${monthChecklist[index]}`}
                  >
                    {checked ? "O" : "X"}
                  </CheckButton>
                ))}
                <MobileScoreText>{score}%</MobileScoreText>
              </ChecklistCell>
            </Fragment>
          );
        })}

        <TrendCell $rows={entries.length}>
          <TrendSvg
            viewBox={`0 0 ${trendGraph.chartWidth} ${trendGraph.chartHeight}`}
            role="img"
            aria-label="달성률 추이 그래프"
          >
            {[0, 25, 50, 75, 100].map((value) => {
              const x = 12 + (value / 100) * (trendGraph.chartWidth - 24);
              return (
                <g key={value}>
                  <TrendGridLine
                    x1={x}
                    y1="0"
                    x2={x}
                    y2={trendGraph.chartHeight}
                  />
                  <TrendScaleLabel x={x} y="12">
                    {value}
                  </TrendScaleLabel>
                </g>
              );
            })}

            {trendGraph.points.length > 1 && (
              <TrendPath
                $color={THEME_COLOR}
                points={trendGraph.points
                  .map((point) => `${point.x},${point.y}`)
                  .join(" ")}
              />
            )}

            {trendGraph.points.map((point) => (
              <g key={point.date}>
                <TrendPoint
                  $isToday={point.isToday}
                  cx={point.x}
                  cy={point.y}
                  r="4.5"
                />
                <TrendPointLabel
                  $color={THEME_COLOR}
                  $isToday={point.isToday}
                  x={point.score >= 90 ? point.x - 8 : point.x + 8}
                  y={point.y - 8}
                  textAnchor={point.score >= 90 ? "end" : "start"}
                >
                  {point.score}%
                </TrendPointLabel>
              </g>
            ))}
          </TrendSvg>
        </TrendCell>
      </BoardBody>
    </NotebookBoard>
  );
}
