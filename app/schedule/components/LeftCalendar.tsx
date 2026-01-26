import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWeekend,
  isWithinInterval,
  differenceInCalendarDays,
  isSameDay,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import styled, { css } from "styled-components";
import { useState } from "react";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";

interface Props {
  currentDate: Date;
  schedules: ServiceSchedule[];
  showWeekend: boolean;
  onMonthChange: (date: Date) => void;
  onTaskMove: (serviceId: string, taskId: string, dayDiff: number) => void;
}

export default function LeftCalendar({
  currentDate,
  schedules,
  showWeekend,
  onMonthChange,
  onTaskMove,
}: Props) {
  // ✨ [NEW] 뷰 모드 상태 (single: 1개월, double: 2개월)
  const [viewMode, setViewMode] = useState<"single" | "double">("single");

  const handlePrevMonth = () => onMonthChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentDate, 1));

  // 드래그 앤 드롭 핸들러들
  const handleDragStart = (
    e: React.DragEvent,
    serviceId: string,
    task: TaskPhase,
  ) => {
    const data = {
      serviceId,
      taskId: task.id,
      originalStart: task.startDate.toISOString(),
    };
    e.dataTransfer.setData("application/json", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e: React.DragEvent, dropDate: Date) => {
    e.preventDefault();
    const jsonString = e.dataTransfer.getData("application/json");
    if (!jsonString) return;
    const { serviceId, taskId, originalStart } = JSON.parse(jsonString);
    const diff = differenceInCalendarDays(dropDate, new Date(originalStart));
    if (diff !== 0) onTaskMove(serviceId, taskId, diff);
  };

  return (
    <StContainer>
      <StCalendarHeader>
        <div className="nav-group">
          <button className="nav-btn" onClick={handlePrevMonth}>
            ◀
          </button>
          <span className="month-title">
            {format(currentDate, "yyyy년 M월")}
            {viewMode === "double" &&
              ` - ${format(addMonths(currentDate, 1), "M월")}`}
          </span>
          <button className="nav-btn" onClick={handleNextMonth}>
            ▶
          </button>
        </div>

        {/* ✨ [NEW] 뷰 모드 토글 */}
        <StViewToggle>
          <button
            className={viewMode === "single" ? "active" : ""}
            onClick={() => setViewMode("single")}
          >
            1개월
          </button>
          <button
            className={viewMode === "double" ? "active" : ""}
            onClick={() => setViewMode("double")}
          >
            2개월
          </button>
        </StViewToggle>
      </StCalendarHeader>

      <StScrollArea>
        {/* 첫 번째 달 */}
        <MonthGrid
          targetDate={currentDate}
          schedules={schedules}
          showWeekend={showWeekend}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />

        {/* ✨ [NEW] 두 번째 달 (double 모드일 때만) */}
        {viewMode === "double" && (
          <div style={{ marginTop: "2rem" }}>
            <div
              style={{
                padding: "0 0 1rem 0.5rem",
                fontWeight: "800",
                fontSize: "1.1rem",
                color: "#374151",
              }}
            >
              {format(addMonths(currentDate, 1), "yyyy년 M월")}
            </div>
            <MonthGrid
              targetDate={addMonths(currentDate, 1)}
              schedules={schedules}
              showWeekend={showWeekend}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          </div>
        )}
      </StScrollArea>
    </StContainer>
  );
}

// =========================================================
// ✨ [Sub Component] 개별 월 그리드 (재사용을 위해 분리)
// =========================================================
function MonthGrid({
  targetDate,
  schedules,
  showWeekend,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  targetDate: Date;
  schedules: ServiceSchedule[];
  showWeekend: boolean;
  onDragStart: (e: React.DragEvent, sId: string, t: TaskPhase) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, d: Date) => void;
}) {
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

  return (
    <StGridContainer>
      <StGridHeader $cols={showWeekend ? 7 : 5}>
        {weekDays.map((day, idx) => {
          if (!showWeekend && (idx === 0 || idx === 6)) return null;
          return <StDayHeader key={day}>{day}</StDayHeader>;
        })}
      </StGridHeader>

      <StGridBody $cols={showWeekend ? 7 : 5}>
        {daysToShow.map((day) => (
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

            <StTaskContainer>
              {schedules.map((service) =>
                service.tasks.map((task) => {
                  const isTaskVisibleOnDay = isWithinInterval(day, {
                    start: startOfDay(task.startDate),
                    end: endOfDay(task.endDate),
                  });

                  if (isTaskVisibleOnDay) {
                    const isStart = isSameDay(day, task.startDate);
                    const isEnd = isSameDay(day, task.endDate);
                    const isSingleDay = isSameDay(task.startDate, task.endDate);
                    const isPast = isBefore(task.endDate, today);

                    return (
                      <StTaskBarWrapper
                        key={`${service.id}-${task.id}`}
                        draggable={!isPast}
                        onDragStart={(e) =>
                          !isPast && onDragStart(e, service.id, task)
                        }
                        title={`${service.serviceName} - ${task.title}`}
                        $isPast={isPast}
                      >
                        <StTaskContent
                          $color={service.color}
                          $isStart={isStart}
                          $isEnd={isEnd}
                          $isSingleDay={isSingleDay}
                        >
                          {isStart && (
                            <span className="label">
                              <span className="svc-name">
                                [{service.serviceName}]
                              </span>
                              <span className="task-name">{task.title}</span>
                            </span>
                          )}
                          {!isSingleDay && <div className="dash-line" />}
                          {!isSingleDay && isStart && (
                            <div className="marker start" />
                          )}
                          {!isSingleDay && isEnd && (
                            <div className="marker end" />
                          )}
                        </StTaskContent>
                      </StTaskBarWrapper>
                    );
                  }
                  return null;
                }),
              )}
            </StTaskContainer>
          </StDateCell>
        ))}
      </StGridBody>
    </StGridContainer>
  );
}

// --- 스타일 정의 ---

const StContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
`;

const StCalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;

  .nav-group {
    display: flex;
    align-items: center;
    gap: 1rem;
    .month-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #111827;
      min-width: 140px;
      text-align: center;
    }
    .nav-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid #e5e7eb;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      &:hover {
        background-color: #f3f4f6;
        color: #111827;
      }
    }
  }
`;

const StViewToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
  gap: 4px;
  button {
    padding: 6px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #6b7280;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
    &.active {
      background-color: white;
      color: #111827;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    &:hover:not(.active) {
      color: #374151;
    }
  }
`;

const StScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  /* 스크롤바 커스텀 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`;

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

  /* ✨ [수정] 줄바꿈으로 블록 분리 */
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

  /* ✨ [수정] 줄바꿈으로 블록 분리 */
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
