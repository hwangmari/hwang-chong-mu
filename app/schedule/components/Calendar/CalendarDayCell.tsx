import React from "react";
import styled from "styled-components";
import { format, isToday } from "date-fns";
import { TaskPhase } from "@/types/work-schedule";
import CalendarTaskItem from "./CalendarTaskItem";
import { CalendarTask } from "@/hooks/useCalendarLayout";
import { HOLIDAYS } from "@/data/holidays";

interface Props {
  day: Date;
  targetDate: Date; // 현재 보고 있는 달(Dim 처리용)
  allTasks: CalendarTask[]; // 전체 태스크 목록
  slotMap: Map<string, number>; // 슬롯 매핑 정보
  maxSlots: Map<string, number>; // 최대 슬롯 높이 정보
  onDragStart: (e: React.DragEvent, phaseId: string, task: TaskPhase) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropDate: Date) => void;
  onDayClick?: (day: Date) => void;
  onDayPreview?: (day: Date) => void;
}

export default function CalendarDayCell({
  day,
  targetDate,
  allTasks,
  slotMap,
  maxSlots,
  onDragStart,
  onDragOver,
  onDrop,
  onDayClick,
  onDayPreview,
}: Props) {
  const dateKey = format(day, "yyyy-MM-dd");
  const totalSlots = (maxSlots.get(dateKey) ?? -1) + 1;

  const holidayName = HOLIDAYS[dateKey];
  const isSunday = day.getDay() === 0;
  const isRedDay = isSunday || !!holidayName;
  const isCurrentMonth = format(day, "M") === format(targetDate, "M");
  const isTodayDate = isToday(day);

  const renderItems = [];
  for (let i = 0; i < totalSlots; i++) {
    const taskInSlot = allTasks.find(
      (t) => slotMap.get(`${dateKey}_${t.id}`) === i,
    );

    if (taskInSlot) {
      renderItems.push(
        <CalendarTaskItem
          key={`${taskInSlot.phaseId}-${taskInSlot.id}`}
          task={taskInSlot}
          day={day}
          isRedDay={isRedDay}
          onDragStart={onDragStart}
        />,
      );
    } else {
      renderItems.push(<div key={`spacer-${i}`} style={{ height: "26px" }} />);
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("schedule-quick-add", { detail: day.toISOString() }),
    );
    onDayClick?.(day);
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[draggable]")) return;
    onDayPreview?.(day);
  };

  return (
    <StDateCell
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, day)}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      $isRedDay={isRedDay}
    >
      <StDateHeader>
        <StDateNumber $isCurrentMonth={isCurrentMonth} $isRedDay={isRedDay} $isToday={isTodayDate}>
          {format(day, "d")}
        </StDateNumber>
        {holidayName && <span className="holiday-name">{holidayName}</span>}
      </StDateHeader>

      <StTaskContainer>{renderItems}</StTaskContainer>
    </StDateCell>
  );
}

const StDateCell = styled.div<{ $isRedDay?: boolean }>`
  min-height: 120px;
  padding: 0;
  display: flex;
  flex-direction: column;
  transition: background-color 0.2s;
  position: relative;
  min-width: 0;
  overflow: hidden;
  background-color: ${({ $isRedDay }) => ($isRedDay ? "#fafafa" : "white")};
  &:hover {
    background-color: ${({ $isRedDay }) => ($isRedDay ? "#f3f4f6" : "#fcfcfc")};
  }
`;

const StDateHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 8px;
  .holiday-name {
    font-size: 0.7rem;
    color: #ef4444;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const StDateNumber = styled.div<{
  $isCurrentMonth: boolean;
  $isRedDay?: boolean;
  $isToday?: boolean;
}>`
  font-size: 0.85rem;
  font-weight: ${({ $isToday }) => ($isToday ? 800 : 600)};
  color: ${({ $isCurrentMonth, $isRedDay, $isToday }) =>
    $isToday ? "white" : $isRedDay ? "#ef4444" : $isCurrentMonth ? "#374151" : "#d1d5db"};
  opacity: ${({ $isCurrentMonth }) => ($isCurrentMonth ? 1 : 0.5)};
  ${({ $isToday }) =>
    $isToday &&
    `
    background-color: #111827;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;
  `}
`;

const StTaskContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-bottom: 4px;
`;
