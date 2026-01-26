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

  // ✨ [핵심 로직] 각 날짜별 업무의 "고정 줄 번호(Slot Index)" 계산
  const { slotMap, maxSlotsPerDay } = useMemo(() => {
    const map = new Map<string, number>(); // "YYYY-MM-DD_taskId" -> slotIndex
    const maxSlots = new Map<string, number>(); // "YYYY-MM-DD" -> maxSlotIndex

    // 1. 모든 업무 평탄화 (Flatten)
    const allTasks = schedules.flatMap((svc) =>
      svc.tasks.map((t) => ({
        ...t,
        svcId: svc.id,
        svcName: svc.serviceName,
        color: svc.color,
      })),
    );

    // 2. 주(Row) 단위로 처리
    // (달력은 주 단위로 줄바꿈 되므로, 같은 주 안에서는 충돌 체크를 해야 함)
    for (let i = 0; i < daysToShow.length; i += cols) {
      const rowDays = daysToShow.slice(i, i + cols);
      if (rowDays.length === 0) continue;

      const rowStart = startOfDay(rowDays[0]);
      const rowEnd = endOfDay(rowDays[rowDays.length - 1]);

      // 이 주(Week)에 포함되는 업무들 필터링
      const tasksInRow = allTasks.filter((t) =>
        areIntervalsOverlapping(
          { start: startOfDay(t.startDate), end: endOfDay(t.endDate) },
          { start: rowStart, end: rowEnd },
        ),
      );

      // 정렬: (1) 시작일 빠른 순 (2) 기간 긴 순 (그래야 빈 공간을 효율적으로 채움)
      tasksInRow.sort((a, b) => {
        const diffStart = a.startDate.getTime() - b.startDate.getTime();
        if (diffStart !== 0) return diffStart;
        return b.endDate.getTime() - a.endDate.getTime();
      });

      // 슬롯 할당 (Greedy Algorithm)
      // slots[slotIndex][dayIndex] = occupied? (boolean)
      const slots: boolean[][] = [];

      tasksInRow.forEach((task) => {
        // 이 업무가 현재 주(Row)에서 차지하는 요일 인덱스들 찾기 (0~6 or 0~4)
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

        // 빈 슬롯 찾기 (위에서부터 차례대로)
        let slotIndex = 0;
        while (true) {
          if (!slots[slotIndex]) slots[slotIndex] = [];

          // 해당 슬롯의 필요한 요일들이 모두 비어있는지 확인
          const isClear = activeIndices.every((idx) => !slots[slotIndex][idx]);

          if (isClear) {
            // 할당 성공!
            activeIndices.forEach((idx) => {
              slots[slotIndex][idx] = true;
              const dateKey = format(rowDays[idx], "yyyy-MM-dd");
              // 맵에 저장: "날짜_taskId" = 슬롯번호
              map.set(`${dateKey}_${task.id}`, slotIndex);

              // 해당 날짜의 최대 슬롯 높이 기록
              const currentMax = maxSlots.get(dateKey) || 0;
              maxSlots.set(dateKey, Math.max(currentMax, slotIndex));
            });
            break;
          }
          slotIndex++; // 다음 줄로 이동
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
          // 이 날짜에 렌더링해야 할 총 슬롯 개수 (0부터 시작하므로 +1)
          const totalSlots = (maxSlotsPerDay.get(dateKey) ?? -1) + 1;

          // 렌더링할 아이템 배열 만들기 (업무 + 빈칸Spacers)
          const renderItems = [];
          for (let i = 0; i < totalSlots; i++) {
            // 현재 슬롯(i)에 해당하는 업무 찾기
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
                    {!isSingleDay && <div className="dash-line" />}
                    {!isSingleDay && isStart && (
                      <div className="marker start" />
                    )}
                    {!isSingleDay && isEnd && <div className="marker end" />}
                  </StTaskContent>
                </StTaskBarWrapper>,
              );
            } else {
              // ✨ [중요] 업무가 없는 슬롯은 투명한 Spacer로 채워서 높이를 유지!
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

const StTaskBarWrapper = styled.div<{ $isPast?: boolean }>`
  height: 26px;
  display: flex;
  align-items: center;
  width: 100%;
  cursor: ${({ $isPast }) => ($isPast ? "default" : "grab")};
  opacity: ${({ $isPast }) => ($isPast ? 0.5 : 1)};
  filter: ${({ $isPast }) => ($isPast ? "grayscale(100%)" : "none")};

  &:active {
    cursor: ${({ $isPast }) => ($isPast ? "default" : "grabbing")};
  }
`;

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
      $isSingleDay ? "transparent" : "rgba(255,255,255,0.85)"};
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

  ${({ $isSingleDay, $color }) =>
    $isSingleDay &&
    css`
      background-color: ${$color};
      border-radius: 6px;
      margin: 0 4px;
      width: calc(100% - 8px);
      justify-content: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      .label .svc-name {
        opacity: 0.9;
        color: rgba(255, 255, 255, 0.9);
      }
    `}

  ${({ $isSingleDay, $color }) =>
    !$isSingleDay &&
    css`
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
      .marker {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
      }
      .marker.start {
        left: 2px;
        width: 0;
        height: 0;
        border-top: 5px solid transparent;
        border-bottom: 5px solid transparent;
        border-left: 8px solid ${$color};
      }
      .marker.end {
        right: 2px;
        width: 3px;
        height: 14px;
        background-color: ${$color};
        border-radius: 1px;
      }
    `}
`;
