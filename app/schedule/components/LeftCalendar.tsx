import {
  format,
  addMonths,
  subMonths,
  differenceInCalendarDays,
} from "date-fns";
import styled from "styled-components";
import { useState } from "react";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
// ✨ 분리된 컴포넌트 import
import MonthGrid from "./MonthGrid";

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
  // 뷰 모드 상태 (single: 1개월, double: 2개월)
  const [viewMode, setViewMode] = useState<"single" | "double">("single");

  const handlePrevMonth = () => onMonthChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onMonthChange(addMonths(currentDate, 1));

  // --- 드래그 핸들러 (MonthGrid로 전달됨) ---
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
    const originDate = new Date(originalStart);
    const diff = differenceInCalendarDays(dropDate, originDate);

    if (diff !== 0) {
      onTaskMove(serviceId, taskId, diff);
    }
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

        {/* 두 번째 달 (double 모드일 때만) */}
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

// --- 스타일 정의 (레이아웃 관련) ---

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
  padding: 1.5rem 1.5rem 0;
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
  padding: 0 1.5rem 1.5rem;

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
