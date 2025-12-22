// components/habit/CalendarGrid.tsx
import styled from "styled-components";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWeekend,
} from "date-fns";

interface Props {
  currentDate: Date;
  selectedDate: Date;
  showWeekends: boolean;
  themeColor: string;
  monthlyLogs: { date: string; count: number }[];
  totalItemsCount: number;
  onSelectDate: (date: Date) => void;
}

// 🎨 농도 조절 헬퍼
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function CalendarGrid({
  currentDate,
  selectedDate,
  showWeekends,
  themeColor,
  monthlyLogs,
  totalItemsCount,
  onSelectDate,
}: Props) {
  const monthStart = startOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(monthStart)),
  });

  const filteredDays = showWeekends
    ? calendarDays
    : calendarDays.filter((day) => !isWeekend(day));
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const filteredWeekDays = showWeekends
    ? weekDays
    : weekDays.filter((_, i) => i !== 0 && i !== 6);
  const today = new Date();

  const getIntensityColor = (dateStr: string) => {
    const log = monthlyLogs.find((l) => l.date === dateStr);
    const count = log ? log.count : 0;
    const total = totalItemsCount || 1;
    const ratio = count / total;
    if (ratio === 0) return "#f3f4f6";
    if (ratio <= 0.3) return hexToRgba(themeColor, 0.3);
    if (ratio <= 0.6) return hexToRgba(themeColor, 0.6);
    if (ratio < 1) return hexToRgba(themeColor, 0.85);
    return themeColor;
  };

  return (
    <StCalendarGrid $columns={showWeekends ? 7 : 5}>
      {filteredWeekDays.map((day) => (
        <StWeekDay key={day}>{day}</StWeekDay>
      ))}
      {filteredDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const isToday = isSameDay(day, today);
        return (
          <StDateCell
            key={dateStr}
            $bgColor={getIntensityColor(dateStr)}
            $isCurrentMonth={isSameMonth(day, monthStart)}
            $isSelected={isSameDay(day, selectedDate)}
            $borderColor={themeColor}
            onClick={() => onSelectDate(day)}
          >
            <StDateText $isToday={isToday}>{format(day, "d")}</StDateText>
            {isToday && <StTodayDot $color={themeColor} />}
          </StDateCell>
        );
      })}
    </StCalendarGrid>
  );
}

// ✨ 스타일 정의
const StCalendarGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  gap: 8px;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
`;
const StWeekDay = styled.div`
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 0.5rem;
`;
const StDateCell = styled.div<{
  $bgColor: string;
  $isCurrentMonth: boolean;
  $isSelected: boolean;
  $borderColor: string;
}>`
  aspect-ratio: 1;
  background-color: ${({ $bgColor }) => $bgColor};
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: ${({ $isCurrentMonth }) => ($isCurrentMonth ? 1 : 0.3)};
  border: 2px solid
    ${({ $isSelected, $borderColor }) =>
      $isSelected ? $borderColor : "transparent"};
  transition: all 0.2s;
  &:hover {
    transform: scale(1.1);
  }
`;
const StDateText = styled.span<{ $isToday?: boolean }>`
  font-size: 0.85rem;
  font-weight: ${({ $isToday }) => ($isToday ? "900" : "600")};
  color: #374151;
`;
const StTodayDot = styled.div<{ $color: string }>`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  opacity: 0.8;
`;
