import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWeekend,
  isWithinInterval,
  isSameDay,
  isBefore,
  startOfDay,
  endOfDay,
  areIntervalsOverlapping,
} from "date-fns";
import styled, { css } from "styled-components";
import { useMemo } from "react";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";

interface MonthGridProps {
  targetDate: Date;
  schedules: ServiceSchedule[];
  showWeekend: boolean;
  onDragStart: (e: React.DragEvent, serviceId: string, task: TaskPhase) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropDate: Date) => void;
}

export default function MonthGrid({
  targetDate,
  schedules,
  showWeekend,
  onDragStart,
  onDragOver,
  onDrop,
}: MonthGridProps) {
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const daysToShow = showWeekend
    ? allDays
    : allDays.filter((day) => !isWeekend(day));

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const cols = showWeekend ? 7 : 5;

  // ✨ 슬롯 계산 로직
  const { slotMap, maxSlotsPerDay } = useMemo(() => {
    const map = new Map<string, number>();
    const maxSlots = new Map<string, number>();

    const allTasks = schedules.flatMap((svc) =>
      svc.tasks.map((t) => ({
        ...t,
        svcId: svc.id,
        svcName: svc.serviceName,
        color: svc.color,
      })),
    );

    for (let i = 0; i < daysToShow.length; i += cols) {
      const rowDays = daysToShow.slice(i, i + cols);
      if (rowDays.length === 0) continue;

      const rowStart = startOfDay(rowDays[0]);
      const rowEnd = endOfDay(rowDays[rowDays.length - 1]);

      const tasksInRow = allTasks.filter((t) =>
        areIntervalsOverlapping(
          { start: startOfDay(t.startDate), end: endOfDay(t.endDate) },
          { start: rowStart, end: rowEnd },
        ),
      );

      // ✨ [핵심 수정] 정렬 순서 변경
      // 1순위: 같은 프로젝트(svcId)끼리 뭉치게 함 -> 그래야 같은 줄에 배정됨
      // 2순위: 시작일 순
      tasksInRow.sort((a, b) => {
        if (a.svcId !== b.svcId) {
          return a.svcId.localeCompare(b.svcId);
        }
        return a.startDate.getTime() - b.startDate.getTime();
      });

      const slots: boolean[][] = [];

      tasksInRow.forEach((task) => {
        const activeIndices = rowDays
          .map((day, idx) =>
            isWithinInterval(day, {
              start: startOfDay(task.startDate),
              end: endOfDay(task.endDate),
            })
              ? idx
              : -1,
          )
          .filter((idx) => idx !== -1);

        if (activeIndices.length === 0) return;

        let slotIndex = 0;
        while (true) {
          if (!slots[slotIndex]) slots[slotIndex] = [];
          const isClear = activeIndices.every((idx) => !slots[slotIndex][idx]);
          if (isClear) {
            activeIndices.forEach((idx) => {
              slots[slotIndex][idx] = true;
              const dateKey = format(rowDays[idx], "yyyy-MM-dd");
              map.set(`${dateKey}_${task.id}`, slotIndex);
              const currentMax = maxSlots.get(dateKey) || 0;
              maxSlots.set(dateKey, Math.max(currentMax, slotIndex));
            });
            break;
          }
          slotIndex++;
        }
      });
    }
    return { slotMap: map, maxSlotsPerDay: maxSlots };
  }, [schedules, daysToShow, cols]);

  return (
    <StGridContainer>
      <StGridHeader $cols={cols}>
        {weekDays.map((day, idx) => {
          if (!showWeekend && (idx === 0 || idx === 6)) return null;
          return <StDayHeader key={day}>{day}</StDayHeader>;
        })}
      </StGridHeader>

      <StGridBody $cols={cols}>
        {daysToShow.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const totalSlots = (maxSlotsPerDay.get(dateKey) ?? -1) + 1;

          const renderItems = [];
          for (let i = 0; i < totalSlots; i++) {
            const taskInSlot = schedules
              .flatMap((s) =>
                s.tasks.map((t) => ({
                  ...t,
                  svcId: s.id,
                  svcName: s.serviceName,
                  color: s.color,
                })),
              )
              .find((t) => slotMap.get(`${dateKey}_${t.id}`) === i);

            if (taskInSlot) {
              const isStart = isSameDay(day, taskInSlot.startDate);
              const isEnd = isSameDay(day, taskInSlot.endDate);
              const isSingleDay = isSameDay(
                taskInSlot.startDate,
                taskInSlot.endDate,
              );
              const isPast = isBefore(taskInSlot.endDate, today);

              renderItems.push(
                <StTaskBarWrapper
                  key={`${taskInSlot.svcId}-${taskInSlot.id}`}
                  draggable={!isPast}
                  onDragStart={(e) =>
                    !isPast && onDragStart(e, taskInSlot.svcId, taskInSlot)
                  }
                  title={`${taskInSlot.svcName} - ${taskInSlot.title}`}
                  $isPast={isPast}
                >
                  <StTaskContent
                    $color={taskInSlot.color}
                    $isStart={isStart}
                    $isEnd={isEnd}
                    $isSingleDay={isSingleDay}
                  >
                    {isStart && (
                      <span className="label">
                        <span className="svc-name">[{taskInSlot.svcName}]</span>
                        <span className="task-name">{taskInSlot.title}</span>
                      </span>
                    )}

                    {/* ✨ 디자인 복구: 단일 일정은 박스, 긴 일정은 점선 */}
                    {!isSingleDay && <div className="dash-line" />}
                    {!isSingleDay && isStart && (
                      <div className="marker start" />
                    )}
                    {!isSingleDay && isEnd && <div className="marker end" />}
                  </StTaskContent>
                </StTaskBarWrapper>,
              );
            } else {
              renderItems.push(
                <div key={`spacer-${i}`} style={{ height: "26px" }} />,
              );
            }
          }

          return (
            <StDateCell
              key={day.toISOString()}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, day)}
            >
              <StDateNumber
                $isCurrentMonth={format(day, "M") === format(targetDate, "M")}
              >
                {format(day, "d")}
              </StDateNumber>
              <StTaskContainer>{renderItems}</StTaskContainer>
            </StDateCell>
          );
        })}
      </StGridBody>
    </StGridContainer>
  );
}

// --- 스타일 정의 ---
// Grid 관련 스타일은 기존과 동일

const StGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
`;
const StGridHeader = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, 1fr);
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;
const StDayHeader = styled.div`
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
`;
const StGridBody = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, 1fr);
  & > div {
    border-right: 1px solid #f3f4f6;
    border-bottom: 1px solid #f3f4f6;
  }
  & > div:nth-child(${({ $cols }) => $cols}n) {
    border-right: none;
  }
`;
const StDateCell = styled.div`
  min-height: 120px;
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: white;
  transition: background-color 0.2s;
  position: relative;
  &:hover {
    background-color: #fcfcfc;
  }
`;
const StDateNumber = styled.div<{ $isCurrentMonth: boolean }>`
  padding: 6px 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $isCurrentMonth }) => ($isCurrentMonth ? "#374151" : "#d1d5db")};
`;
const StTaskContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-bottom: 4px;
`;

// TaskBarWrapper
const StTaskBarWrapper = styled.div<{ $isPast?: boolean }>`
  height: 26px;
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  z-index: 10;
  cursor: ${({ $isPast }) => ($isPast ? "default" : "grab")};
  opacity: ${({ $isPast }) => ($isPast ? 0.6 : 1)};
  filter: ${({ $isPast }) => ($isPast ? "grayscale(100%)" : "none")};
  &:active {
    cursor: ${({ $isPast }) => ($isPast ? "default" : "grabbing")};
  }
`;

// ✨ 디자인 복구: 점선 스타일 + 단일 박스
const StTaskContent = styled.div<{
  $color: string;
  $isStart: boolean;
  $isEnd: boolean;
  $isSingleDay: boolean;
}>`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;

  /* 라벨 (텍스트) */
  .label {
    position: relative;
    z-index: 2;
    font-size: 0.75rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 6px;
    max-width: 100%;
    color: ${({ $isSingleDay, $color }) => ($isSingleDay ? "white" : $color)};
    background-color: ${({ $isSingleDay }) =>
      $isSingleDay ? "transparent" : "rgba(255,255,255,0.9)"};
    border-radius: 4px;
    margin-left: ${({ $isSingleDay }) => ($isSingleDay ? "0" : "12px")};
    display: flex;
    align-items: center;
    gap: 4px;
    .svc-name {
      opacity: 0.85;
      font-weight: 800;
    }
  }

  /* 1. 단일 일정 (박스 형태) */
  ${({ $isSingleDay, $color }) =>
    $isSingleDay &&
    css`
      background-color: ${$color};
      border-radius: 6px;
      justify-content: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      .label .svc-name {
        opacity: 0.9;
        color: rgba(255, 255, 255, 0.9);
      }
    `}

  /* 2. 긴 일정 (점선 + 마커 형태) */
  ${({ $isSingleDay, $color }) =>
    !$isSingleDay &&
    css`
      /* 점선 */
      .dash-line {
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        background-image: linear-gradient(
          to right,
          ${$color} 50%,
          transparent 50%
        );
        background-size: 8px 100%;
        background-repeat: repeat-x;
        transform: translateY(-50%);
        z-index: 1;
      }
      /* 시작/끝 마커 */
      .marker {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
      }
      .marker.start {
        left: 0px;
        width: 0;
        height: 0;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-left: 11px solid ${$color};
      }
      .marker.end {
        right: 0;
        width: 3px;
        height: 16px;
        background-color: ${$color};
        border-radius: 1px;
      }
    `}
`;
