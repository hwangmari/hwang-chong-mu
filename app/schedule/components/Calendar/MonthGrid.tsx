import styled from "styled-components";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWeekend,
  EachDayOfIntervalResult,
} from "date-fns";
import { ServiceSchedule, TaskPhase } from "@/types/work-schedule";
import CalendarDayCell from "./CalendarDayCell";
import { useCalendarLayout } from "@/hooks/useCalendarLayout";

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
  // 날짜 계산
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

  // 커스텀 훅으로 로직 위임
  const { slotMap, maxSlotsPerDay, allTasks } = useCalendarLayout(
    schedules,
    daysToShow,
    cols,
  );

  return (
    <StGridContainer>
      {/* 헤더 (요일) */}
      <StGridHeader $cols={cols}>
        {weekDays.map((day, idx) => {
          if (!showWeekend && (idx === 0 || idx === 6)) return null;
          return <StDayHeader key={day}>{day}</StDayHeader>;
        })}
      </StGridHeader>

      {/* 바디 (날짜들) */}
      <StGridBody $cols={cols}>
        {daysToShow.map((day) => (
          <CalendarDayCell
            key={day.toISOString()}
            day={day}
            targetDate={targetDate}
            allTasks={allTasks}
            slotMap={slotMap}
            maxSlots={maxSlotsPerDay}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
          />
        ))}
      </StGridBody>
    </StGridContainer>
  );
}

// --- Layout Styles (그리드 틀만 남김) ---
const StGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
  width: 100%;
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
  width: 100%;
  & > div {
    border-right: 1px solid #f3f4f6;
    border-bottom: 1px solid #f3f4f6;
  }
  & > div:nth-child(${({ $cols }) => $cols}n) {
    border-right: none;
  }
`;
