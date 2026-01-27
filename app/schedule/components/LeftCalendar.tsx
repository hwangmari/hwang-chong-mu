import {
  format,
  addMonths,
  subMonths,
  differenceInCalendarDays,
} from "date-fns";
import styled from "styled-components";
import { useState } from "react";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import MonthGrid from "./Calendar/MonthGrid";
import CalendarHeader from "./Calendar/CalendarHeader"; // ✨ 분리된 헤더 import

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

  // --- 드래그 핸들러 ---
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
      {/* ✨ 헤더 컴포넌트 사용 */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onChangeViewMode={setViewMode}
      />

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

// --- 스타일 정의 ---

const StContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
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
