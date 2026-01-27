import React from "react";
import styled, { css } from "styled-components";
import { isSameDay, isBefore, startOfDay } from "date-fns";
import { TaskPhase } from "@/types/work-schedule";
import { CalendarTask } from "@/hooks/useCalendarLayout";

interface Props {
  task: CalendarTask;
  day: Date;
  isRedDay: boolean; // 공휴일 여부 (점선 숨김용)
  onDragStart: (e: React.DragEvent, serviceId: string, task: TaskPhase) => void;
}

export default function CalendarTaskItem({
  task,
  day,
  isRedDay,
  onDragStart,
}: Props) {
  const today = startOfDay(new Date());

  const isStart = isSameDay(day, task.startDate);
  const isEnd = isSameDay(day, task.endDate);
  const isSingleDay = isSameDay(task.startDate, task.endDate);
  const isPast = isBefore(task.endDate, today);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent("scroll-to-service", { detail: task.svcId });
    window.dispatchEvent(event);
  };

  // DragStart에 넘겨줄 원래 TaskPhase 형태 복원
  const originalTaskPhase: TaskPhase = {
    id: task.id,
    title: task.title,
    startDate: task.startDate,
    endDate: task.endDate,
    // memo 등은 필요하다면 CalendarTask 타입 확장 필요
  };

  return (
    <StTaskBarWrapper
      draggable={!isPast}
      onDragStart={(e) =>
        !isPast && onDragStart(e, task.svcId, originalTaskPhase)
      }
      onClick={handleClick}
      title={`${task.svcName} - ${task.title}`}
      $isPast={isPast}
    >
      <StTaskContent
        $color={task.color}
        $isStart={isStart}
        $isEnd={isEnd}
        $isSingleDay={isSingleDay}
        $isRedDay={isRedDay}
      >
        {isStart && (
          <span className="label">
            <span className="svc-name">[{task.svcName}]</span>
            <span className="task-name">{task.title}</span>
          </span>
        )}

        {!isSingleDay && <div className="dash-line" />}
        {!isSingleDay && isStart && <div className="marker start" />}
        {!isSingleDay && isEnd && <div className="marker end" />}
      </StTaskContent>
    </StTaskBarWrapper>
  );
}

// --- Styles ---
const StTaskBarWrapper = styled.div<{ $isPast?: boolean }>`
  height: 26px;
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
  z-index: 10;
  cursor: ${({ $isPast }) => ($isPast ? "pointer" : "grab")};
  opacity: ${({ $isPast }) => ($isPast ? 0.6 : 1)};
  filter: ${({ $isPast }) => ($isPast ? "grayscale(100%)" : "none")};
  max-width: 100%;

  &:hover {
    filter: ${({ $isPast }) =>
      $isPast ? "grayscale(100%) brightness(0.95)" : "brightness(0.95)"};
  }
  &:active {
    cursor: ${({ $isPast }) => ($isPast ? "default" : "grabbing")};
  }
`;

const StTaskContent = styled.div<{
  $color: string;
  $isStart: boolean;
  $isEnd: boolean;
  $isSingleDay: boolean;
  $isRedDay?: boolean;
}>`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;

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
      $isSingleDay ? "transparent" : "#fff"};
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
      justify-content: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      .label .svc-name {
        opacity: 0.9;
        color: rgba(255, 255, 255, 0.9);
      }
    `}

  ${({ $isSingleDay, $color, $isRedDay }) =>
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
        display: ${$isRedDay ? "none" : "block"}; /* 공휴일 라인 제거 */
      }
      .marker {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1;
      }
      .marker.start {
        left: 0;
        width: 0;
        height: 0;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-left: 10px solid ${$color};
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
